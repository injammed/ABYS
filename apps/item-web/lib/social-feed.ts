import { FeedArtifact, FeedLane, OriginClass } from "@/lib/feed";
import { cursorForRow, decodeFeedCursor, feedCursorFilter } from "@/lib/feed-cursor";
import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

export type Judgment = "preserve" | "refine" | "slop";

const PAGE_SIZE = 8;

const laneGradients: Record<FeedLane, string> = {
  aetimm: "radial-gradient(circle at 50% 42%, #fff1a8 0 2%, #9e741e 4%, #241805 22%, #050505 62%)",
  slatra: "repeating-linear-gradient(135deg, #050505 0 12px, #2a2415 13px 15px, #0c0c0b 16px 28px)",
  unjudged: "radial-gradient(circle at 50% 50%, #2c2c27 0 4%, #111 28%, #050505 70%)",
};

type ArtifactRow = {
  id: string;
  title: string;
  summary: string;
  artifact_description?: string;
  artifact_modes?: string[];
  origin_class: OriginClass;
  generator: string;
  human_role: string;
  provenance_note: string;
  media_path: string | null;
  lane: FeedLane;
  published_at: string;
  profiles?: { display_name?: string } | Array<{ display_name?: string }> | null;
};

type PrivateArtifactRow = Omit<ArtifactRow, "lane" | "published_at"> & {
  lane: FeedLane | null;
  published_at: string | null;
  created_at: string;
  status: "quarantine" | "needs_revision";
};

type VoteRow = { artifact_id: string; judgment: Judgment };

function creatorName(row: ArtifactRow | PrivateArtifactRow): string {
  if (Array.isArray(row.profiles)) return row.profiles[0]?.display_name || "Anonymous machine witness";
  return row.profiles?.display_name || "Anonymous machine witness";
}

function scoreForVotes(votes: VoteRow[]): number {
  let score = 50;
  for (const vote of votes) {
    if (vote.judgment === "preserve") score += 4;
    if (vote.judgment === "refine") score += 1;
    if (vote.judgment === "slop") score -= 4;
  }
  return Math.max(0, Math.min(100, score));
}

function isUniversalArtifactMigrationMissing(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || message.includes("artifact_description") || message.includes("artifact_modes");
}

function modeLead(row: ArtifactRow | PrivateArtifactRow): string {
  const modes = row.artifact_modes?.length ? row.artifact_modes : ["image"];
  return modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ");
}

async function signedImageUrl(path: string | null): Promise<string | undefined> {
  if (!path) return undefined;
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.storage.from("artifact-media").createSignedUrl(path, 60 * 60);
  return error ? undefined : data?.signedUrl;
}

export async function loadPublicFeedPage(options: {
  cursor?: string | null;
  lane?: FeedLane | "all";
  limit?: number;
} = {}): Promise<{ artifacts: FeedArtifact[]; nextCursor: string | null }> {
  const client = requireSupabaseBrowserClient();
  const limit = options.limit ?? PAGE_SIZE;

  let primary = client
    .from("artifacts")
    .select("id,title,summary,artifact_description,artifact_modes,origin_class,generator,human_role,provenance_note,media_path,lane,published_at,profiles!artifacts_creator_id_fkey(display_name)")
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (options.lane && options.lane !== "all") primary = primary.eq("lane", options.lane);
  if (options.cursor) primary = primary.or(feedCursorFilter(decodeFeedCursor(options.cursor)));

  const primaryResult = await primary;
  let rawData: unknown[] | null = primaryResult.data as unknown[] | null;
  let loadError = primaryResult.error;

  if (loadError && isUniversalArtifactMigrationMissing(loadError)) {
    let fallback = client
      .from("artifacts")
      .select("id,title,summary,origin_class,generator,human_role,provenance_note,media_path,lane,published_at,profiles!artifacts_creator_id_fkey(display_name)")
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);
    if (options.lane && options.lane !== "all") fallback = fallback.eq("lane", options.lane);
    if (options.cursor) fallback = fallback.or(feedCursorFilter(decodeFeedCursor(options.cursor)));
    const fallbackResult = await fallback;
    rawData = fallbackResult.data as unknown[] | null;
    loadError = fallbackResult.error;
  }

  if (loadError) throw loadError;

  const fetchedRows = (rawData ?? []) as ArtifactRow[];
  const hasMore = fetchedRows.length > limit;
  const rows = fetchedRows.slice(0, limit);
  const ids = rows.map((row) => row.id);

  const votesByArtifact = new Map<string, VoteRow[]>();
  if (ids.length > 0) {
    const { data: voteData, error: voteError } = await client.from("artifact_votes").select("artifact_id,judgment").in("artifact_id", ids);
    if (voteError) throw voteError;
    for (const vote of (voteData ?? []) as VoteRow[]) {
      votesByArtifact.set(vote.artifact_id, [...(votesByArtifact.get(vote.artifact_id) ?? []), vote]);
    }
  }

  const mediaEntries = await Promise.all(rows.map(async (row) => [row.id, await signedImageUrl(row.media_path)] as const));
  const mediaByArtifact = new Map(mediaEntries);

  const artifacts: FeedArtifact[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    creator: creatorName(row),
    lane: row.lane,
    summary: row.summary,
    modalLead: modeLead(row),
    aiOrigin: {
      originClass: row.origin_class,
      declaredByCreator: true,
      generator: row.generator,
      humanRole: row.human_role,
      provenanceNote: row.provenance_note,
      confidence: "reviewed",
    },
    gradient: laneGradients[row.lane],
    mediaUrl: mediaByArtifact.get(row.id),
    score: scoreForVotes(votesByArtifact.get(row.id) ?? []),
    publishedAt: row.published_at,
    visibility: "public",
  }));

  const lastRow = rows.at(-1);
  return { artifacts, nextCursor: hasMore && lastRow ? cursorForRow(lastRow) : null };
}

export async function loadOwnQuarantinePreviews(userId: string): Promise<FeedArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const primary = await client
    .from("artifacts")
    .select("id,title,summary,artifact_description,artifact_modes,origin_class,generator,human_role,provenance_note,media_path,lane,published_at,created_at,status,profiles!artifacts_creator_id_fkey(display_name)")
    .eq("creator_id", userId)
    .in("status", ["quarantine", "needs_revision"])
    .order("created_at", { ascending: false })
    .limit(20);

  let rawData: unknown[] | null = primary.data as unknown[] | null;
  let loadError = primary.error;

  if (loadError && isUniversalArtifactMigrationMissing(loadError)) {
    const fallback = await client
      .from("artifacts")
      .select("id,title,summary,origin_class,generator,human_role,provenance_note,media_path,lane,published_at,created_at,status,profiles!artifacts_creator_id_fkey(display_name)")
      .eq("creator_id", userId)
      .in("status", ["quarantine", "needs_revision"])
      .order("created_at", { ascending: false })
      .limit(20);
    rawData = fallback.data as unknown[] | null;
    loadError = fallback.error;
  }

  if (loadError) throw loadError;

  const rows = (rawData ?? []) as PrivateArtifactRow[];
  const mediaEntries = await Promise.all(rows.map(async (row) => [row.id, await signedImageUrl(row.media_path)] as const));
  const mediaByArtifact = new Map(mediaEntries);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    creator: creatorName(row),
    lane: "unjudged",
    summary: row.summary,
    modalLead: row.status === "needs_revision" ? `Private revision · ${modeLead(row)}` : `Private quarantine · ${modeLead(row)}`,
    aiOrigin: {
      originClass: row.origin_class,
      declaredByCreator: true,
      generator: row.generator,
      humanRole: row.human_role,
      provenanceNote: row.provenance_note,
      confidence: "declared",
    },
    gradient: laneGradients.unjudged,
    mediaUrl: mediaByArtifact.get(row.id),
    score: 50,
    publishedAt: row.created_at,
    visibility: "creator_preview",
  }));
}

export async function loadOwnVotes(userId: string, artifactIds: string[]): Promise<Record<string, Judgment>> {
  if (artifactIds.length === 0) return {};
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.from("artifact_votes").select("artifact_id,judgment").eq("voter_id", userId).in("artifact_id", artifactIds);
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as VoteRow[]).map((vote) => [vote.artifact_id, vote.judgment]));
}

export async function saveVote(artifactId: string, voterId: string, judgment: Judgment): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.from("artifact_votes").upsert({ artifact_id: artifactId, voter_id: voterId, judgment }, { onConflict: "artifact_id,voter_id" });
  if (error) throw error;
}
