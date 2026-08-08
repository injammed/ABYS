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

  // Hydration race law: a background own-vote read may refresh every other
  // card, but cannot replace the optimistic choice for an Artifact whose write
  // is still unresolved. Completion invalidates any hydration that started
  // during that write before releasing the protection.
  ["in-flight vote protection set", /savingVoteIdsRef = useRef\(new Set<string>\(\)\)/, feed],
  ["vote protected before optimistic state", /savingVoteIdsRef\.current\.add\(id\);[\s\S]*setJudgments/, feed],
  ["hydration merges around protected votes", /mergeHydratedVotes\(current, votes, savingVoteIdsRef\.current\)/, feed],
  ["merge helper preserves protected optimistic value", /for \(const artifactId of protectedArtifactIds\)[\s\S]*next\[artifactId\] = optimistic/, voteState],
  ["successful write invalidates in-flight hydration", /voteHydrationVersionRef\.current \+= 1;[\s\S]*savingVoteIdsRef\.current\.delete\(id\);[\s\S]*state: "saved"/, feed],
  ["failed write invalidates hydration before rollback", /catch \(error\)[\s\S]*voteHydrationVersionRef\.current \+= 1;[\s\S]*savingVoteIdsRef\.current\.delete\(id\);[\s\S]*setJudgments/, feed],
  ["account switch clears vote protection", /savingVoteIdsRef\.current\.clear\(\)/, feed],

  ["post-commit public aggregate read", /loadPublicVoteAggregate\(id\)/, feed],
  ["post-commit vote event", /aetimm:vote-committed/, feed],
  ["Museum aggregate reconciliation", /museumVotes: aggregate\.museumVotes/, feed],
  ["Slop aggregate reconciliation", /slopVotes: aggregate\.slopVotes/, feed],
  ["aggregate failure cannot undo committed vote", /The vote is already committed\./, feed],
  ["bounded public binary aggregate RPC", /get_artifact_binary_judgments/, publicAggregate],
  ["public Slop rank RPC", /get_artifact_slop_ranks/, publicAggregate],
  ["aggregate requires exact artifact row", /PUBLIC_VOTE_AGGREGATE_MISSING/, publicAggregate],

  ["one account one artifact database key", /primary key \(artifact_id, voter_id\)/, schema],
  ["legacy non-binary rows fail closed", /LEGACY_NON_BINARY_VOTES_REQUIRE_REVIEW/, binaryMigration],
  ["binary database constraint", /check \(judgment in \('preserve', 'slop'\)\)/, binaryMigration],
]) {
  assert.ok(pattern.test(source), `Binary voting contract failed: missing ${label}`);
}

assert.ok(!/button[^>]*judge refine/.test(feed), "Refine must not exist in the public ballot component.");
assert.ok(!/MutationObserver/.test(swipe), "Binary voting must not depend on DOM mutation normalization.");
assert.ok(!/👍|👎/.test(feed), "The public ballot must not fall back to generic thumbs-up/thumbs-down icons.");

console.log("Binary swipe voting PASS: one account has one active Artifact judgment; click and swipe share one self-confirming persistence path; background hydration cannot visually undo an unresolved optimistic choice; committed votes reconcile public Museum/Slop totals; vertical scrolling remains primary.");
