import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { FeedLane, OriginClass } from "@/lib/feed";

export type ProfileRole = "creator" | "curator" | "admin";
export type ArtifactStatus = "quarantine" | "needs_revision" | "approved" | "rejected" | "removed";
export type ArtifactEventType =
  | "submitted"
  | "request_revision"
  | "resubmitted"
  | "approve"
  | "reject"
  | "remove"
  | "restore";

export type ArtifactEvent = {
  id: number;
  artifact_id: string;
  actor_id: string | null;
  event_type: ArtifactEventType;
  lane: FeedLane | null;
  note: string;
  created_at: string;
};

export type CreatorArtifact = {
  id: string;
  creator_id: string;
  title: string;
  summary: string;
  origin_class: OriginClass;
  generator: string;
  human_role: string;
  provenance_note: string;
  status: ArtifactStatus;
  lane: FeedLane | null;
  created_at: string;
  published_at: string | null;
  events: ArtifactEvent[];
};

export type CuratorArtifact = CreatorArtifact & {
  creatorName: string;
  media_path: string;
  mediaUrl?: string;
  ai_origin_attested: boolean;
  safety_attested: boolean;
  rights_attested: boolean;
};

export type CreatorRevision = Pick<
  CreatorArtifact,
  "title" | "summary" | "origin_class" | "generator" | "human_role" | "provenance_note"
>;

function isLifecycleMigrationMissing(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42703" ||
    error?.code === "42P01" ||
    message.includes("artifact_events") ||
    message.includes("column profiles.role") ||
    message.includes("could not find the 'role' column")
  );
}

function groupEvents(rows: ArtifactEvent[]): Map<string, ArtifactEvent[]> {
  const grouped = new Map<string, ArtifactEvent[]>();
  for (const event of rows) {
    const current = grouped.get(event.artifact_id) ?? [];
    current.push(event);
    grouped.set(event.artifact_id, current);
  }
  return grouped;
}

export async function loadCurrentRole(userId: string): Promise<ProfileRole> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isLifecycleMigrationMissing(error)) return "creator";
    throw error;
  }

  const role = data?.role;
  return role === "curator" || role === "admin" ? role : "creator";
}

export async function loadCreatorArtifacts(userId: string): Promise<CreatorArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from("artifacts")
    .select(
      "id,creator_id,title,summary,origin_class,generator,human_role,provenance_note,status,lane,created_at,published_at"
    )
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const artifacts = (data ?? []) as Omit<CreatorArtifact, "events">[];
  const ids = artifacts.map((artifact) => artifact.id);
  let eventsByArtifact = new Map<string, ArtifactEvent[]>();

  if (ids.length > 0) {
    const { data: eventData, error: eventError } = await client
      .from("artifact_events")
      .select("id,artifact_id,actor_id,event_type,lane,note,created_at")
      .in("artifact_id", ids)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (eventError && !isLifecycleMigrationMissing(eventError)) throw eventError;
    if (!eventError) eventsByArtifact = groupEvents((eventData ?? []) as ArtifactEvent[]);
  }

  return artifacts.map((artifact) => ({
    ...artifact,
    events: eventsByArtifact.get(artifact.id) ?? [],
  }));
}

export async function saveCreatorRevision(
  artifactId: string,
  userId: string,
  revision: CreatorRevision,
): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client
    .from("artifacts")
    .update(revision)
    .eq("id", artifactId)
    .eq("creator_id", userId)
    .in("status", ["quarantine", "needs_revision"]);

  if (error) throw error;
}

export async function resubmitArtifact(artifactId: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc("resubmit_artifact", {
    p_artifact_id: artifactId,
  });

  if (error) throw error;
}

export async function loadCuratorQueue(): Promise<CuratorArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from("artifacts")
    .select(
      "id,creator_id,title,summary,origin_class,generator,human_role,provenance_note,status,lane,created_at,published_at,media_path,ai_origin_attested,safety_attested,rights_attested,profiles!artifacts_creator_id_fkey(display_name)"
    )
    .eq("status", "quarantine")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) throw error;

  type QueueRow = Omit<CuratorArtifact, "events" | "creatorName" | "mediaUrl"> & {
    profiles?: { display_name?: string } | Array<{ display_name?: string }> | null;
  };

  const rows = (data ?? []) as unknown as QueueRow[];
  const ids = rows.map((artifact) => artifact.id);
  let eventsByArtifact = new Map<string, ArtifactEvent[]>();

  if (ids.length > 0) {
    const { data: eventData, error: eventError } = await client
      .from("artifact_events")
      .select("id,artifact_id,actor_id,event_type,lane,note,created_at")
      .in("artifact_id", ids)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (eventError) throw eventError;
    eventsByArtifact = groupEvents((eventData ?? []) as ArtifactEvent[]);
  }

  return Promise.all(
    rows.map(async (row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const { data: signed, error: signedError } = await client.storage
        .from("artifact-media")
        .createSignedUrl(row.media_path, 60 * 30);

      return {
        ...row,
        creatorName: profile?.display_name || "Anonymous creator",
        events: eventsByArtifact.get(row.id) ?? [],
        mediaUrl: signedError ? undefined : signed?.signedUrl,
      };
    }),
  );
}

export async function reviewArtifact(input: {
  artifactId: string;
  decision: "approve" | "request_revision" | "reject";
  lane: FeedLane | null;
  note: string;
}): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc("review_artifact", {
    p_artifact_id: input.artifactId,
    p_decision: input.decision,
    p_lane: input.lane,
    p_note: input.note,
  });

  if (error) throw error;
}
