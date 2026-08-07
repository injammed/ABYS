import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { FeedLane, OriginClass } from "@/lib/feed";

export type ProfileRole = "creator" | "curator" | "admin";
export type ArtifactStatus = "quarantine" | "needs_revision" | "approved" | "rejected" | "removed";
export type ArtifactEventType = "submitted" | "request_revision" | "resubmitted" | "approve" | "reject" | "remove" | "restore";

export type ArtifactEvent = {
  id: number;
  artifact_id: string;
  actor_id: string | null;
  event_type: ArtifactEventType;
  lane: FeedLane | null;
  note: string;
  created_at: string;
};

export type ArtifactPart = {
  id: string;
  artifact_id: string;
  position: number;
  part_kind: "file" | "text" | "reference";
  mode: string;
  label: string;
  storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  byte_size: number | null;
  text_content: string | null;
  reference_url: string | null;
  mediaUrl?: string;
};

export type CreatorArtifact = {
  id: string;
  creator_id: string;
  title: string;
  summary: string;
  artifact_description?: string;
  artifact_modes?: string[];
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
  media_path: string | null;
  mediaUrl?: string;
  parts: ArtifactPart[];
  ai_origin_attested: boolean;
  safety_attested: boolean;
  rights_attested: boolean;
};

export type CreatorRevision = Pick<CreatorArtifact, "title" | "summary" | "origin_class" | "generator" | "human_role" | "provenance_note">;

function isLifecycleMigrationMissing(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || error?.code === "42P01" || message.includes("artifact_events") || message.includes("column profiles.role") || message.includes("could not find the 'role' column");
}

function isUniversalArtifactMigrationMissing(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || error?.code === "42P01" || message.includes("artifact_parts") || message.includes("artifact_description");
}

function groupEvents(rows: ArtifactEvent[]): Map<string, ArtifactEvent[]> {
  const grouped = new Map<string, ArtifactEvent[]>();
  for (const event of rows) grouped.set(event.artifact_id, [...(grouped.get(event.artifact_id) ?? []), event]);
  return grouped;
}

function groupParts(rows: ArtifactPart[]): Map<string, ArtifactPart[]> {
  const grouped = new Map<string, ArtifactPart[]>();
  for (const part of rows) grouped.set(part.artifact_id, [...(grouped.get(part.artifact_id) ?? []), part]);
  for (const parts of grouped.values()) parts.sort((a, b) => a.position - b.position);
  return grouped;
}

export async function loadCurrentRole(userId: string): Promise<ProfileRole> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) {
    if (isLifecycleMigrationMissing(error)) return "creator";
    throw error;
  }
  return data?.role === "curator" || data?.role === "admin" ? data.role : "creator";
}

export async function loadCreatorArtifacts(userId: string): Promise<CreatorArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const primary = await client
    .from("artifacts")
    .select("id,creator_id,title,summary,artifact_description,artifact_modes,origin_class,generator,human_role,provenance_note,status,lane,created_at,published_at")
    .eq("creator_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  let rawData: unknown[] | null = primary.data as unknown[] | null;
  let loadError = primary.error;

  if (loadError && isUniversalArtifactMigrationMissing(loadError)) {
    const fallback = await client
      .from("artifacts")
      .select("id,creator_id,title,summary,origin_class,generator,human_role,provenance_note,status,lane,created_at,published_at")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    rawData = fallback.data as unknown[] | null;
    loadError = fallback.error;
  }
  if (loadError) throw loadError;

  const artifacts = (rawData ?? []) as Omit<CreatorArtifact, "events">[];
  const ids = artifacts.map((artifact) => artifact.id);
  let eventsByArtifact = new Map<string, ArtifactEvent[]>();

  if (ids.length > 0) {
    const { data, error } = await client.from("artifact_events").select("id,artifact_id,actor_id,event_type,lane,note,created_at").in("artifact_id", ids).order("created_at", { ascending: false }).order("id", { ascending: false });
    if (error && !isLifecycleMigrationMissing(error)) throw error;
    if (!error) eventsByArtifact = groupEvents((data ?? []) as ArtifactEvent[]);
  }

  return artifacts.map((artifact) => ({
    ...artifact,
    artifact_description: artifact.artifact_description ?? artifact.summary,
    artifact_modes: artifact.artifact_modes ?? ["image"],
    events: eventsByArtifact.get(artifact.id) ?? [],
  }));
}

export async function saveCreatorRevision(artifactId: string, userId: string, revision: CreatorRevision): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.from("artifacts").update(revision).eq("id", artifactId).eq("creator_id", userId).in("status", ["quarantine", "needs_revision"]);
  if (error) throw error;
}

export async function resubmitArtifact(artifactId: string): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc("resubmit_artifact", { p_artifact_id: artifactId });
  if (error) throw error;
}

export async function loadCuratorQueue(): Promise<CuratorArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const primary = await client
    .from("artifacts")
    .select("id,creator_id,title,summary,artifact_description,artifact_modes,origin_class,generator,human_role,provenance_note,status,lane,created_at,published_at,media_path,ai_origin_attested,safety_attested,rights_attested,profiles!artifacts_creator_id_fkey(display_name)")
    .eq("status", "quarantine")
    .order("created_at", { ascending: true })
    .limit(100);

  let rawData: unknown[] | null = primary.data as unknown[] | null;
  let loadError = primary.error;

  if (loadError && isUniversalArtifactMigrationMissing(loadError)) {
    const fallback = await client
      .from("artifacts")
      .select("id,creator_id,title,summary,origin_class,generator,human_role,provenance_note,status,lane,created_at,published_at,media_path,ai_origin_attested,safety_attested,rights_attested,profiles!artifacts_creator_id_fkey(display_name)")
      .eq("status", "quarantine")
      .order("created_at", { ascending: true })
      .limit(100);
    rawData = fallback.data as unknown[] | null;
    loadError = fallback.error;
  }
  if (loadError) throw loadError;

  type QueueRow = Omit<CuratorArtifact, "events" | "creatorName" | "mediaUrl" | "parts"> & {
    profiles?: { display_name?: string } | Array<{ display_name?: string }> | null;
  };

  const rows = (rawData ?? []) as QueueRow[];
  const ids = rows.map((artifact) => artifact.id);
  let eventsByArtifact = new Map<string, ArtifactEvent[]>();
  let partsByArtifact = new Map<string, ArtifactPart[]>();

  if (ids.length > 0) {
    const eventResult = await client.from("artifact_events").select("id,artifact_id,actor_id,event_type,lane,note,created_at").in("artifact_id", ids).order("created_at", { ascending: false }).order("id", { ascending: false });
    if (eventResult.error) throw eventResult.error;
    eventsByArtifact = groupEvents((eventResult.data ?? []) as ArtifactEvent[]);

    const partResult = await client.from("artifact_parts").select("id,artifact_id,position,part_kind,mode,label,storage_path,original_filename,mime_type,byte_size,text_content,reference_url").in("artifact_id", ids).order("position", { ascending: true });
    if (partResult.error && !isUniversalArtifactMigrationMissing(partResult.error)) throw partResult.error;
    if (!partResult.error) partsByArtifact = groupParts((partResult.data ?? []) as ArtifactPart[]);
  }

  return Promise.all(rows.map(async (row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const parts = partsByArtifact.get(row.id) ?? [];
    const signedParts = await Promise.all(parts.map(async (part) => {
      if (part.part_kind !== "file" || !part.storage_path) return part;
      const signed = await client.storage.from("artifact-media").createSignedUrl(part.storage_path, 60 * 30);
      return { ...part, mediaUrl: signed.error ? undefined : signed.data?.signedUrl };
    }));

    let mediaUrl: string | undefined;
    if (row.media_path) {
      const signed = await client.storage.from("artifact-media").createSignedUrl(row.media_path, 60 * 30);
      mediaUrl = signed.error ? undefined : signed.data?.signedUrl;
    }

    return {
      ...row,
      artifact_description: row.artifact_description ?? row.summary,
      artifact_modes: row.artifact_modes ?? ["image"],
      creatorName: profile?.display_name || "Anonymous creator",
      events: eventsByArtifact.get(row.id) ?? [],
      parts: signedParts,
      mediaUrl,
    };
  }));
}

export async function reviewArtifact(input: { artifactId: string; decision: "approve" | "request_revision" | "reject"; lane: FeedLane | null; note: string }): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc("review_artifact", { p_artifact_id: input.artifactId, p_decision: input.decision, p_lane: input.lane, p_note: input.note });
  if (error) throw error;
}
