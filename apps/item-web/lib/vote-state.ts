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

export function replaceHydratedVotes<T extends string>(votes: Record<string, T>): Record<string, T> {
  return { ...votes };
}

export function mergeHydratedVotesPreservingPending<T extends string>(
  current: Record<string, T>,
  hydrated: Record<string, T>,
  pendingArtifactIds: ReadonlySet<string>,
): Record<string, T> {
  const next = { ...hydrated };
  for (const artifactId of pendingArtifactIds) {
    const pending = current[artifactId];
    if (pending) next[artifactId] = pending;
  }
  return next;
}
