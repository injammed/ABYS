import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

export type PublicVoteAggregate = {
  museumVotes: number;
  slopVotes: number;
  totalBinaryVotes: number;
  slopRank?: number;
};

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

export async function loadPublicVoteAggregate(artifactId: string): Promise<PublicVoteAggregate> {
  const client = requireSupabaseBrowserClient();
  const [judgmentResult, rankResult] = await Promise.all([
    client.rpc("get_artifact_binary_judgments", { p_artifact_ids: [artifactId] }),
    client.rpc("get_artifact_slop_ranks", { p_artifact_ids: [artifactId] }),
  ]);

  if (judgmentResult.error) throw judgmentResult.error;
  const judgment = ((judgmentResult.data ?? []) as BinaryJudgmentRow[]).find((row) => row.artifact_id === artifactId);
  if (!judgment) throw new Error("PUBLIC_VOTE_AGGREGATE_MISSING");

  const rank = rankResult.error
    ? undefined
    : ((rankResult.data ?? []) as SlopRankRow[]).find((row) => row.artifact_id === artifactId);

  return {
    museumVotes: Number(judgment.museum_count),
    slopVotes: Number(judgment.slop_count),
    totalBinaryVotes: Number(judgment.total_binary_votes),
    slopRank: rank ? Number(rank.slop_rank) : undefined,
  };
}
