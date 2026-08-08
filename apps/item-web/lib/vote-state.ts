export type VoteOwnerId = string | null;

export function didVoteOwnerChange(previousOwnerId: VoteOwnerId, nextOwnerId: VoteOwnerId): boolean {
  return previousOwnerId !== nextOwnerId;
}

export function shouldApplyVoteHydration(options: {
  requestOwnerId: string;
  currentOwnerId: VoteOwnerId;
  requestVersion: number;
  currentVersion: number;
}): boolean {
  return (
    options.requestOwnerId === options.currentOwnerId &&
    options.requestVersion === options.currentVersion
  );
}

export function mergeHydratedVotes<T extends string>(
  current: Record<string, T>,
  hydrated: Record<string, T>,
  protectedArtifactIds: Iterable<string>,
): Record<string, T> {
  const next = { ...hydrated };
  for (const artifactId of protectedArtifactIds) {
    const optimistic = current[artifactId];
    if (optimistic) next[artifactId] = optimistic;
  }
  return next;
}
