import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

export type MuseumAccession = {
  accessionNumber: number;
  artifactId: string;
  admittedAt: string;
  title: string;
  summary: string;
  creator: string;
  modes: string[];
  museumVotes: number;
  mediaUrl?: string;
};

type ArtifactJoin = {
  id: string;
  title: string;
  summary: string;
  artifact_modes?: string[] | null;
  media_path: string | null;
  profiles?: { display_name?: string } | Array<{ display_name?: string }> | null;
};

type AccessionRow = {
  accession_number: number | string;
  artifact_id: string;
  admitted_at: string;
  withdrawn_at: string | null;
  artifacts?: ArtifactJoin | ArtifactJoin[] | null;
};

type BinaryJudgmentRow = {
  artifact_id: string;
  museum_count: number | string;
  slop_count: number | string;
  total_binary_votes: number | string;
};

function firstArtifact(value: AccessionRow["artifacts"]): ArtifactJoin | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function creatorName(artifact: ArtifactJoin): string {
  const profile = Array.isArray(artifact.profiles) ? artifact.profiles[0] : artifact.profiles;
  return profile?.display_name || "Anonymous machine witness";
}

export async function loadMuseumCollection(limit = 120): Promise<MuseumAccession[]> {
  const client = requireSupabaseBrowserClient();
  const boundedLimit = Math.max(1, Math.min(240, Math.floor(limit)));

  const { data, error } = await client
    .from("museum_accessions")
    .select("accession_number,artifact_id,admitted_at,withdrawn_at,artifacts!museum_accessions_artifact_id_fkey(id,title,summary,artifact_modes,media_path,profiles!artifacts_creator_id_fkey(display_name))")
    .is("withdrawn_at", null)
    .order("accession_number", { ascending: true })
    .limit(boundedLimit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as AccessionRow[];
  const activeRows = rows
    .map((row) => ({ row, artifact: firstArtifact(row.artifacts) }))
    .filter((entry): entry is { row: AccessionRow; artifact: ArtifactJoin } => Boolean(entry.artifact));

  const ids = activeRows.map(({ row }) => row.artifact_id);
  const museumVotesByArtifact = new Map<string, number>();

  if (ids.length > 0) {
    const judgmentResult = await client.rpc("get_artifact_binary_judgments", { p_artifact_ids: ids });
    if (!judgmentResult.error) {
      for (const judgment of (judgmentResult.data ?? []) as BinaryJudgmentRow[]) {
        museumVotesByArtifact.set(judgment.artifact_id, Number(judgment.museum_count));
      }
    }
  }

  const signedEntries = await Promise.all(activeRows.map(async ({ row, artifact }) => {
    let mediaUrl: string | undefined;
    if (artifact.media_path) {
      const signed = await client.storage.from("artifact-media").createSignedUrl(artifact.media_path, 60 * 60);
      if (!signed.error) mediaUrl = signed.data?.signedUrl;
    }

    return {
      accessionNumber: Number(row.accession_number),
      artifactId: row.artifact_id,
      admittedAt: row.admitted_at,
      title: artifact.title,
      summary: artifact.summary,
      creator: creatorName(artifact),
      modes: artifact.artifact_modes?.length ? artifact.artifact_modes : ["image"],
      museumVotes: museumVotesByArtifact.get(row.artifact_id) ?? 0,
      mediaUrl,
    } satisfies MuseumAccession;
  }));

  // No trending window and no recency boost. Current all-time Museum judgment
  // controls spatial prominence only; accession identity and permanence remain
  // unchanged. Accession number is the stable tie-breaker.
  return signedEntries.sort((a, b) =>
    b.museumVotes - a.museumVotes || a.accessionNumber - b.accessionNumber
  );
}
