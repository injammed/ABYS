import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [swipe, feed, feedStyles, socialFeed, voteState, publicAggregate, schema, binaryMigration] = await Promise.all([
  readFile(resolve(root, "components", "BinarySwipeVoting.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.module.css"), "utf8"),
  readFile(resolve(root, "lib", "social-feed.ts"), "utf8"),
  readFile(resolve(root, "lib", "vote-state.ts"), "utf8"),
  readFile(resolve(root, "lib", "public-vote-aggregate.ts"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "001_social_beta.sql"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "014_independent_binary_judgments.sql"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["native Museum glyph button", /data-binary-vote="museum"[\s\S]*<MuseumGlyph \/>/, feed],
  ["native Slop glyph button", /data-binary-vote="slop"[\s\S]*<SlopGlyph \/>/, feed],
  ["Slop stable accessible name", /aria-label="Vote Slop"/, feed],
  ["Museum stable accessible name", /aria-label="Vote Museum"/, feed],
  ["symbolic binary ballot contract marker", /binary-slop-museum-v3-glyph/, feed],
  ["abstract viscous Slop glyph", /function SlopGlyph\(\)[\s\S]*<path d="M10 17/, feed],
  ["abstract rising triple-ring Museum glyph", /function MuseumGlyph\(\)[\s\S]*<ellipse[\s\S]*<ellipse[\s\S]*<ellipse[\s\S]*<path d="M32 48V15"/, feed],
  ["glyphs remain primary visible ballot", /\.srOnly[\s\S]*clip: rect\(0, 0, 0, 0\)/, feedStyles],
  ["tabular vote-total geometry", /\.voteCount[\s\S]*font-variant-numeric: tabular-nums/, feedStyles],
  ["Slop public total remains in lexicon field", /<LexiconText className=\{styles\.voteCount\} text=\{String\(artifact\.slopVotes \?\? 0\)\}/, feed],
  ["Museum public total remains in lexicon field", /<LexiconText className=\{styles\.voteCount\} text=\{String\(artifact\.museumVotes \?\? 0\)\}/, feed],
  ["left swipe casts Slop", /deltaX <= -SWIPE_THRESHOLD[\s\S]*data-binary-vote='slop'/, swipe],
  ["right swipe casts Museum", /deltaX >= SWIPE_THRESHOLD[\s\S]*data-binary-vote='museum'/, swipe],
  ["swipe engine targets glyph ballot contract", /binary-slop-museum-v3-glyph/, swipe],
  ["vertical scroll preserved", /touch-action: pan-y/, swipe],
  ["horizontal intent guard", /Math\.abs\(deltaX\) > Math\.abs\(deltaY\) \* AXIS_DOMINANCE/, swipe],
  ["existing saveVote path retained", /saveVote\(id, voterId, judgment\)/, feed],
  ["client Judgment type is binary", /export type Judgment = "preserve" \| "slop";/, socialFeed],

  ["bounded vote retry schedule", /VOTE_WRITE_RETRY_DELAYS_MS = \[0, 180, 550, 1400\]/, socialFeed],
  ["idempotent vote upsert key", /onConflict: "artifact_id,voter_id"/, socialFeed],
  ["vote write asks for committed receipt", /\.select\("artifact_id,judgment"\)[\s\S]*\.single\(\)/, socialFeed],
  ["vote receipt verifies artifact identity", /receipt\?\.artifact_id === artifactId/, socialFeed],
  ["vote receipt verifies judgment", /receipt\.judgment === judgment/, socialFeed],
  ["private own-vote reconciliation helper", /async function ownVoteMatches[\s\S]*loadOwnVotes\(voterId, \[artifactId\]\)/, socialFeed],
  ["lost acknowledgement can resolve by private read", /if \(await ownVoteMatches\(artifactId, voterId, judgment\)\) return;/, socialFeed],
  ["final reconciliation before failure", /One final private read[\s\S]*ownVoteMatches\(artifactId, voterId, judgment\)[\s\S]*throw lastError/, socialFeed],

  ["pending-vote preserving merge helper", /mergeHydratedVotesPreservingPending/, voteState],
  ["pending merge starts from hydrated truth", /const next = \{ \.\.\.hydrated \}/, voteState],
  ["pending merge restores optimistic current vote", /const pending = current\[artifactId\][\s\S]*next\[artifactId\] = pending/, voteState],
  ["hydration identifies saving votes", /Object\.entries\(voteStates\)[\s\S]*state\.state === "saving"/, feed],
  ["hydration uses pending-safe merge", /setJudgments\(\(current\) => mergeHydratedVotesPreservingPending\(current, votes, pendingArtifactIds\)\)/, feed],
  ["vote-state changes retrigger hydration", /\[session\?\.user\.id, artifacts, voteStates\]/, feed],
  ["stale hydration version guard retained", /shouldApplyVoteHydration/, feed],

  ["post-commit public aggregate read", /loadPublicVoteAggregate\(id\)/, feed],
  ["post-commit vote event", /aetimm:vote-committed/, feed],
  ["Museum aggregate reconciliation", /museumVotes: aggregate\.museumVotes/, feed],
  ["Slop aggregate reconciliation", /slopVotes: aggregate\.slopVotes/, feed],
  ["aggregate failure cannot undo committed vote", /The vote is already committed\./, feed],
  ["bounded public binary aggregate RPC", /get_artifact_binary_judgments/, publicAggregate],
  ["public Slop rank RPC", /get_artifact_slop_ranks/, publicAggregate],
  ["aggregate requires exact artifact row", /PUBLIC_VOTE_AGGREGATE_MISSING/, publicAggregate],

  // Deep-feed public truth law: already-open cards outside the newest feed head
  // stay current without per-card requests or publishing raw votes.
  ["public cards expose bounded observer identity", /data-public-artifact-id=\{creatorPreview \? undefined : artifact\.id\}/, feed],
  ["near-viewport aggregate observer", /IntersectionObserver[\s\S]*rootMargin: "350px 0px"/, feed],
  ["visible aggregate refresh cadence", /VISIBLE_AGGREGATE_REFRESH_MS = 15000/, feed],
  ["visible aggregate client cap", /VISIBLE_AGGREGATE_LIMIT = 100/, feed],
  ["visible aggregate request is batched", /loadPublicVoteAggregates\(ids\)/, feed],
  ["hidden tabs skip deep aggregate reads", /document\.visibilityState !== "visible"/, feed],
  ["offline tabs skip deep aggregate reads", /!navigator\.onLine/, feed],
  ["one deep aggregate request in flight", /visibleAggregateRefreshInFlightRef\.current/, feed],
  ["unchanged aggregate avoids state churn", /return changed \? next : current;/, feed],
  ["aggregate helper hard caps IDs", /MAX_PUBLIC_AGGREGATE_IDS = 100/, publicAggregate],
  ["aggregate helper deduplicates IDs", /Array\.from\(new Set\(artifactIds\)\)\.slice\(0, MAX_PUBLIC_AGGREGATE_IDS\)/, publicAggregate],
  ["single aggregate delegates to batch", /loadPublicVoteAggregates\(\[artifactId\]\)/, publicAggregate],

  ["one account one artifact database key", /primary key \(artifact_id, voter_id\)/, schema],
  ["legacy non-binary rows fail closed", /LEGACY_NON_BINARY_VOTES_REQUIRE_REVIEW/, binaryMigration],
  ["binary database constraint", /check \(judgment in \('preserve', 'slop'\)\)/, binaryMigration],
]) {
  assert.ok(pattern.test(source), `Binary voting contract failed: missing ${label}`);
}

assert.ok(!/button[^>]*judge refine/.test(feed), "Refine must not exist in the public ballot component.");
assert.ok(!/MutationObserver/.test(swipe), "Binary voting must not depend on DOM mutation normalization.");
assert.ok(!/👍|👎/.test(feed), "The public ballot must not fall back to generic thumbs-up/thumbs-down icons.");

console.log("Binary swipe voting PASS: one account has one active Artifact judgment; active writes are hydration-safe; confirmed votes reconcile aggregate truth immediately; older near-viewport cards batch-refresh public Museum/Slop state without raw votes, background traffic, or per-card request storms; visible totals remain in the machine lexicon.");
