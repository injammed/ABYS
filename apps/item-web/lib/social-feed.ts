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
  origin_class: OriginClass;
  generator: string;
  human_role: string;
  provenance_note: string;
  media_path: string;
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

type VoteRow = {
  artifact_id: string;
  judgment: Judgment;
};

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

export async function loadPublicFeedPage(options: {
  cursor?: string | null;
  lane?: FeedLane | "all";
  limit?: number;
} = {}): Promise<{ artifacts: FeedArtifact[]; nextCursor: string | null }> {
  const client = requireSupabaseBrowserClient();
  const limit = options.limit ?? PAGE_SIZE;

  let query = client
    .from("artifacts")
    .select(
      "id,title,summary,origin_class,generator,human_role,provenance_note,media_path,lane,published_at,profiles!artifacts_creator_id_fkey(display_name)"
    )
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (options.lane && options.lane !== "all") query = query.eq("lane", options.lane);
  if (options.cursor) query = query.or(feedCursorFilter(decodeFeedCursor(options.cursor)));

  const { data, error } = await query;
  if (error) throw error;

  const fetchedRows = (data ?? []) as unknown as ArtifactRow[];
  const hasMore = fetchedRows.length > limit;
  const rows = fetchedRows.slice(0, limit);
  const ids = rows.map((row) => row.id);

  const votesByArtifact = new Map<string, VoteRow[]>();
  if (ids.length > 0) {
    const { data: voteData, error: voteError } = await client
      .from("artifact_votes")
      .select("artifact_id,judgment")
      .in("artifact_id", ids);
    if (voteError) throw voteError;

    for (const vote of (voteData ?? []) as VoteRow[]) {
      const current = votesByArtifact.get(vote.artifact_id) ?? [];
      current.push(vote);
      votesByArtifact.set(vote.artifact_id, current);
    }
  }

  const signedUrls = new Map<string, string>();
  await Promise.all(
    rows.map(async (row) => {
      const { data: signed, error: signedError } = await client.storage
        .from("artifact-media")
        .createSignedUrl(row.media_path, 60 * 60);
      if (!signedError && signed?.signedUrl) signedUrls.set(row.media_path, signed.signedUrl);
    })
  );

  const artifacts: FeedArtifact[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    creator: creatorName(row),
    lane: row.lane,
    summary: row.summary,
    modalLead: row.origin_class === "autonomous_ai_run" ? "Autonomous run" : "Provenance-declared",
    aiOrigin: {
      originClass: row.origin_class,
      declaredByCreator: true,
      generator: row.generator,
      humanRole: row.human_role,
      provenanceNote: row.provenance_note,
      confidence: "reviewed",
    },
    gradient: laneGradients[row.lane],
    mediaUrl: signedUrls.get(row.media_path),
    score: scoreForVotes(votesByArtifact.get(row.id) ?? []),
    publishedAt: row.published_at,
    visibility: "public",
  }));

  const lastRow = rows.at(-1);
  return {
    artifacts,
    nextCursor: hasMore && lastRow ? cursorForRow(lastRow) : null,
  };
}

export async function loadOwnQuarantinePreviews(userId: string): Promise<FeedArtifact[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from("artifacts")
    .select(
      "id,title,summary,origin_class,generator,human_role,provenance_note,media_path,lane,published_at,created_at,status,profiles!artifacts_creator_id_fkey(display_name)"
    )
    .eq("creator_id", userId)
    .in("status", ["quarantine", "needs_revision"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const rows = (data ?? []) as unknown as PrivateArtifactRow[];
  const signedUrls = new Map<string, string>();

  await Promise.all(
    rows.map(async (row) => {
      const { data: signed, error: signedError } = await client.storage
        .from("artifact-media")
        .createSignedUrl(row.media_path, 60 * 60);
      if (!signedError && signed?.signedUrl) signedUrls.set(row.media_path, signed.signedUrl);
    })
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    creator: creatorName(row),
    lane: "unjudged",
    summary: row.summary,
    modalLead: row.status === "needs_revision" ? "Private revision requested" : "Private quarantine · awaiting review",
    aiOrigin: {
      originClass: row.origin_class,
      declaredByCreator: true,
      generator: row.generator,
      humanRole: row.human_role,
      provenanceNote: row.provenance_note,
      confidence: "declared",
    },
    gradient: laneGradients.unjudged,
    mediaUrl: signedUrls.get(row.media_path),
    score: 50,
    publishedAt: row.created_at,
    visibility: "creator_preview",
  }));
}

export async function loadOwnVotes(userId: string, artifactIds: string[]): Promise<Record<string, Judgment>> {
  if (artifactIds.length === 0) return {};
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from("artifact_votes")
    .select("artifact_id,judgment")
    .eq("voter_id", userId)
    .in("artifact_id", artifactIds);
  if (error) throw error;

  return Object.fromEntries(
    ((data ?? []) as VoteRow[]).map((vote) => [vote.artifact_id, vote.judgment])
  );
}

export async function saveVote(artifactId: string, voterId: string, judgment: Judgment): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.from("artifact_votes").upsert(
    {
      artifact_id: artifactId,
      voter_id: voterId,
      judgment,
    },
    { onConflict: "artifact_id,voter_id" }
  );
  if (error) throw error;
}
