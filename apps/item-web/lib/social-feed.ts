import { ArtifactPart, FeedArtifact, FeedLane, OriginClass } from "@/lib/feed";
import { cursorForRow, decodeFeedCursor, feedCursorFilter } from "@/lib/feed-cursor";
import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

export type Judgment = "preserve" | "slop";

const PAGE_SIZE = 8;
const VOTE_WRITE_RETRY_DELAYS_MS = [0, 180, 550, 1400] as const;

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

type ArtifactPartRow = {
  id: string;
  artifact_id: string;
  position: number;
  part_kind: "file" | "text" | "reference";
  mode: ArtifactPart["mode"];
  label: string | null;
  storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  byte_size: number | string | null;
  text_content: string | null;
  reference_url: string | null;
};

type RawVoteRow = { artifact_id: string; judgment: string };
type VoteWriteReceipt = { artifact_id: string; judgment: string };

type BinaryJudgmentRow = {
  artifact_id: string;
  museum_count: number | string;
  slop_count: number | string;
  total_binary_votes: number | string;
};

type SlopRankRow = {
  artifact_id: string;
  slop_rank: number | string;
  slop_count: number | string;
};

function creatorName(row: ArtifactRow | PrivateArtifactRow): string {
  if (Array.isArray(row.profiles)) return row.profiles[0]?.display_name || "Anonymous machine witness";
  return row.profiles?.display_name || "Anonymous machine witness";
}

function isUniversalArtifactMigrationMissing(error: { message?: string; code?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "42703" || error?.code === "42P01" || message.includes("artifact_description") || message.includes("artifact_modes") || message.includes("artifact_parts");
}

function modeLead(row: ArtifactRow | PrivateArtifactRow): string {
  const modes = row.artifact_modes?.length ? row.artifact_modes : ["image"];
  return modes.map((mode) => mode === "model3d" ? "3D" : mode).join(" · ");
}

function safeReferenceUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function signedImageUrl(path: string | null): Promise<string | undefined> {
  if (!path) return undefined;
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.storage.from("artifact-media").createSignedUrl(path, 60 * 60);
  return error ? undefined : data?.signedUrl;
}

async function loadArtifactParts(artifactIds: string[]): Promise<Map<string, ArtifactPart[]>> {
  const byArtifact = new Map<string, ArtifactPart[]>();
  if (artifactIds.length === 0) return byArtifact;

  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from("artifact_parts")
    .select("id,artifact_id,position,part_kind,mode,label,storage_path,original_filename,mime_type,byte_size,text_content,reference_url")
    .in("artifact_id", artifactIds)
    .order("position", { ascending: true });

  if (error) {
    if (isUniversalArtifactMigrationMissing(error)) return byArtifact;
    throw error;
  }

  const rows = (data ?? []) as ArtifactPartRow[];
  const storagePaths = Array.from(new Set(rows.flatMap((row) => row.storage_path ? [row.storage_path] : [])));
  const signedByPath = new Map<string, string>();

  if (storagePaths.length > 0) {
    const signed = await client.storage.from("artifact-media").createSignedUrls(storagePaths, 60 * 60);
    if (!signed.error) {
      (signed.data ?? []).forEach((entry, index) => {
        const path = storagePaths[index];
        if (path && entry.signedUrl) signedByPath.set(path, entry.signedUrl);
      });
    }
  }

  for (const row of rows) {
    const referenceUrl = safeReferenceUrl(row.reference_url);
    const part: ArtifactPart = {
      id: row.id,
      position: row.position,
      partKind: row.part_kind,
      mode: row.mode,
      label: row.label || undefined,
      filename: row.original_filename || undefined,
      mimeType: row.mime_type || undefined,
      byteSize: row.byte_size == null ? undefined : Number(row.byte_size),
      text: row.text_content || undefined,
      referenceUrl,
      signedUrl: row.storage_path ? signedByPath.get(row.storage_path) : undefined,
    };

    const current = byArtifact.get(row.artifact_id) ?? [];
    current.push(part);
    byArtifact.set(row.artifact_id, current);
  }

  return byArtifact;
}

function firstImageUrl(parts: ArtifactPart[] | undefined): string | undefined {
  return parts?.find((part) => part.mode === "image" && part.signedUrl)?.signedUrl;
}

export async function loadPublicFeedPage(options: {
  cursor?: string | null;
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

  const judgmentsByArtifact = new Map<string, BinaryJudgmentRow>();
  const slopRanksByArtifact = new Map<string, SlopRankRow>();

  const [partsByArtifact, judgmentResult, rankResult] = await Promise.all([
    loadArtifactParts(ids),
    ids.length > 0 ? client.rpc("get_artifact_binary_judgments", { p_artifact_ids: ids }) : Promise.resolve({ data: [], error: null }),
    ids.length > 0 ? client.rpc("get_artifact_slop_ranks", { p_artifact_ids: ids }) : Promise.resolve({ data: [], error: null }),
  ]);

  if (judgmentResult.error) throw judgmentResult.error;
  for (const judgment of (judgmentResult.data ?? []) as BinaryJudgmentRow[]) {
    judgmentsByArtifact.set(judgment.artifact_id, judgment);
  }

  // Rank is additive display metadata. If ranking temporarily fails, the
  // infinite feed remains available rather than disappearing.
  if (!rankResult.error) {
    for (const rank of (rankResult.data ?? []) as SlopRankRow[]) {
      slopRanksByArtifact.set(rank.artifact_id, rank);
    }
  }

  // Legacy pre-manifest artifacts still get their historical image preview.
  const legacyMediaEntries = await Promise.all(rows.map(async (row) => {
    const parts = partsByArtifact.get(row.id);
    if (firstImageUrl(parts)) return [row.id, firstImageUrl(parts)] as const;
    return [row.id, await signedImageUrl(row.media_path)] as const;
  }));
  const mediaByArtifact = new Map(legacyMediaEntries);

  const artifacts: FeedArtifact[] = rows.map((row) => {
    const judgments = judgmentsByArtifact.get(row.id);
    const slopRank = slopRanksByArtifact.get(row.id);

    return {
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
        confidence: "declared",
      },
      gradient: laneGradients[row.lane],
      mediaUrl: mediaByArtifact.get(row.id),
      parts: partsByArtifact.get(row.id) ?? [],
      museumVotes: judgments ? Number(judgments.museum_count) : 0,
      slopVotes: judgments ? Number(judgments.slop_count) : 0,
      slopRank: slopRank ? Number(slopRank.slop_rank) : undefined,
      publishedAt: row.published_at,
      visibility: "public",
    };
  });

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
  const ids = rows.map((row) => row.id);
  const partsByArtifact = await loadArtifactParts(ids);
  const legacyMediaEntries = await Promise.all(rows.map(async (row) => {
    const parts = partsByArtifact.get(row.id);
    if (firstImageUrl(parts)) return [row.id, firstImageUrl(parts)] as const;
    return [row.id, await signedImageUrl(row.media_path)] as const;
  }));
  const mediaByArtifact = new Map(legacyMediaEntries);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    creator: creatorName(row),
    lane: "unjudged",
    summary: row.summary,
    modalLead: row.status === "needs_revision" ? `Private revision · ${modeLead(row)}` : `Private hold · ${modeLead(row)}`,
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
    parts: partsByArtifact.get(row.id) ?? [],
    museumVotes: 0,
    slopVotes: 0,
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

  const activeVotes = ((data ?? []) as RawVoteRow[]).filter(
    (vote): vote is { artifact_id: string; judgment: Judgment } => vote.judgment === "preserve" || vote.judgment === "slop",
  );
  return Object.fromEntries(activeVotes.map((vote) => [vote.artifact_id, vote.judgment]));
}

async function ownVoteMatches(artifactId: string, voterId: string, judgment: Judgment): Promise<boolean> {
  try {
    const ownVotes = await loadOwnVotes(voterId, [artifactId]);
    return ownVotes[artifactId] === judgment;
  } catch {
    return false;
  }
}

export async function saveVote(artifactId: string, voterId: string, judgment: Judgment): Promise<void> {
  const client = requireSupabaseBrowserClient();
  let lastError: unknown = new Error("VOTE_WRITE_CONFIRMATION_FAILED");

  for (const waitMs of VOTE_WRITE_RETRY_DELAYS_MS) {
    if (waitMs > 0) await delay(waitMs);

    const { data, error } = await client
      .from("artifact_votes")
      .upsert(
        { artifact_id: artifactId, voter_id: voterId, judgment },
        { onConflict: "artifact_id,voter_id" },
      )
      .select("artifact_id,judgment")
      .single();

    const receipt = data as VoteWriteReceipt | null;
    if (
      !error
      && receipt?.artifact_id === artifactId
      && receipt.judgment === judgment
    ) {
      return;
    }

    lastError = error ?? new Error("VOTE_WRITE_RECEIPT_MISMATCH");

    // A network failure can happen after Postgres committed but before the
    // response reached the browser. Resolve that ambiguity by reading only the
    // caller's own private vote before retrying the idempotent upsert.
    if (await ownVoteMatches(artifactId, voterId, judgment)) return;
  }

  // One final private read prevents a lost acknowledgement on the last retry
  // from being reported as a failed vote when the row actually committed.
  if (await ownVoteMatches(artifactId, voterId, judgment)) return;
  throw lastError;
}
