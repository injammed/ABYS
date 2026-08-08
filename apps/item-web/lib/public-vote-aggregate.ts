import { requireSupabaseBrowserClient } from "@/lib/supabase-browser";

const MAX_PUBLIC_AGGREGATE_IDS = 100;

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

export async function loadPublicVoteAggregates(artifactIds: string[]): Promise<Map<string, PublicVoteAggregate>> {
  const uniqueIds = Array.from(new Set(artifactIds)).slice(0, MAX_PUBLIC_AGGREGATE_IDS);
  const aggregates = new Map<string, PublicVoteAggregate>();
  if (uniqueIds.length === 0) return aggregates;

  const client = requireSupabaseBrowserClient();
  const [judgmentResult, rankResult] = await Promise.all([
    client.rpc("get_artifact_binary_judgments", { p_artifact_ids: uniqueIds }),
    client.rpc("get_artifact_slop_ranks", { p_artifact_ids: uniqueIds }),
  ]);

  if (judgmentResult.error) throw judgmentResult.error;

  const rankByArtifact = new Map<string, number>();
  if (!rankResult.error) {
    for (const rank of (rankResult.data ?? []) as SlopRankRow[]) {
      rankByArtifact.set(rank.artifact_id, Number(rank.slop_rank));
    }
  }

  for (const judgment of (judgmentResult.data ?? []) as BinaryJudgmentRow[]) {
    aggregates.set(judgment.artifact_id, {
      museumVotes: Number(judgment.museum_count),
      slopVotes: Number(judgment.slop_count),
      totalBinaryVotes: Number(judgment.total_binary_votes),
      slopRank: rankByArtifact.get(judgment.artifact_id),
    });
  }

  return aggregates;
}

export async function loadPublicVoteAggregate(artifactId: string): Promise<PublicVoteAggregate> {
  const aggregates = await loadPublicVoteAggregates([artifactId]);
  const aggregate = aggregates.get(artifactId);
  if (!aggregate) throw new Error("PUBLIC_VOTE_AGGREGATE_MISSING");
  return aggregate;
}
