import type { ArtifactPart } from "@/lib/feed";
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
  parts: ArtifactPart[];
};

type ArtifactPartJoin = {
  id: string;
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

type ArtifactJoin = {
  id: string;
  title: string;
  summary: string;
  artifact_modes?: string[] | null;
  media_path: string | null;
  artifact_parts?: ArtifactPartJoin[] | null;
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

function safeReferenceUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

export async function loadMuseumCollection(limit = 120): Promise<MuseumAccession[]> {
  const client = requireSupabaseBrowserClient();
  const boundedLimit = Math.max(1, Math.min(240, Math.floor(limit)));

  const { data, error } = await client
    .from("museum_accessions")
    .select("accession_number,artifact_id,admitted_at,withdrawn_at,artifacts!museum_accessions_artifact_id_fkey(id,title,summary,artifact_modes,media_path,artifact_parts(id,position,part_kind,mode,label,storage_path,original_filename,mime_type,byte_size,text_content,reference_url),profiles!artifacts_creator_id_fkey(display_name))")
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

  const storagePaths = Array.from(new Set(activeRows.flatMap(({ artifact }) => [
    ...(artifact.artifact_parts ?? []).flatMap((part) => part.storage_path ? [part.storage_path] : []),
    ...(artifact.media_path ? [artifact.media_path] : []),
  ])));
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

  const entries = activeRows.map(({ row, artifact }) => {
    const parts: ArtifactPart[] = (artifact.artifact_parts ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((part) => ({
        id: part.id,
        position: part.position,
        partKind: part.part_kind,
        mode: part.mode,
        label: part.label || undefined,
        filename: part.original_filename || undefined,
        mimeType: part.mime_type || undefined,
        byteSize: part.byte_size == null ? undefined : Number(part.byte_size),
        text: part.text_content || undefined,
        referenceUrl: safeReferenceUrl(part.reference_url),
        signedUrl: part.storage_path ? signedByPath.get(part.storage_path) : undefined,
      }));

    const imagePart = parts.find((part) => part.mode === "image" && part.signedUrl);

    return {
      accessionNumber: Number(row.accession_number),
      artifactId: row.artifact_id,
      admittedAt: row.admitted_at,
      title: artifact.title,
      summary: artifact.summary,
      creator: creatorName(artifact),
      modes: artifact.artifact_modes?.length ? artifact.artifact_modes : ["image"],
      museumVotes: museumVotesByArtifact.get(row.artifact_id) ?? 0,
      mediaUrl: imagePart?.signedUrl ?? (artifact.media_path ? signedByPath.get(artifact.media_path) : undefined),
      parts,
    } satisfies MuseumAccession;
  });

  // No trending window and no recency boost. Current all-time Museum judgment
  // controls spatial prominence only; accession identity and permanence remain
  // unchanged. Accession number is the stable tie-breaker.
  return entries.sort((a, b) =>
    b.museumVotes - a.museumVotes || a.accessionNumber - b.accessionNumber
  );
}
