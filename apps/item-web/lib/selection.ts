import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

export type SelectionStatus = "nominated" | "candidate" | "refinement";
export type SelectionDecision = "candidate" | "refinement" | "archive" | "reject" | "museum_admit";

export type SelectionReview = {
  selection_id: number;
  artifact_id: string;
  title: string;
  creator_name: string;
  media_path: string;
  mediaUrl?: string;
  cohort_rank: number;
  cohort_size: number;
  selection_score: number;
  preserve_count: number;
  refine_count: number;
  slop_count: number;
  total_judgments: number;
  selection_status: SelectionStatus;
  selection_note: string;
  algorithm_version: string;
  selected_at: string;
};

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function loadSelectionReviewQueue(): Promise<SelectionReview[]> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc("get_selection_review_queue");
  if (error) throw error;

  const rows = (data ?? []) as Record<string, unknown>[];

  return Promise.all(
    rows.map(async (row) => {
      const mediaPath = String(row.media_path ?? "");
      const { data: signed, error: signedError } = mediaPath
        ? await client.storage.from("artifact-media").createSignedUrl(mediaPath, 60 * 30)
        : { data: null, error: null };

      return {
        selection_id: asNumber(row.selection_id),
        artifact_id: String(row.artifact_id ?? ""),
        title: String(row.title ?? "Untitled artifact"),
        creator_name: String(row.creator_name ?? "Anonymous creator"),
        media_path: mediaPath,
        mediaUrl: signedError ? undefined : signed?.signedUrl,
        cohort_rank: asNumber(row.cohort_rank),
        cohort_size: asNumber(row.cohort_size),
        selection_score: asNumber(row.selection_score),
        preserve_count: asNumber(row.preserve_count),
        refine_count: asNumber(row.refine_count),
        slop_count: asNumber(row.slop_count),
        total_judgments: asNumber(row.total_judgments),
        selection_status: String(row.selection_status ?? "nominated") as SelectionStatus,
        selection_note: String(row.selection_note ?? ""),
        algorithm_version: String(row.algorithm_version ?? "caechat-top-decile-v0"),
        selected_at: String(row.selected_at ?? ""),
      };
    }),
  );
}

export async function nominateTopDecile(minJudgments: number): Promise<string> {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client.rpc("nominate_top_decile", {
    p_min_judgments: minJudgments,
  });
  if (error) throw error;
  return String(data ?? "");
}

export async function reviewSelectionCandidate(input: {
  selectionId: number;
  decision: SelectionDecision;
  note: string;
}): Promise<void> {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc("review_selection_candidate", {
    p_selection_id: input.selectionId,
    p_decision: input.decision,
    p_note: input.note,
  });
  if (error) throw error;
}
