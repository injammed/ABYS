import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [swipe, feed, feedStyles, socialFeed, schema, binaryMigration] = await Promise.all([
  readFile(resolve(root, "components", "BinarySwipeVoting.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.module.css"), "utf8"),
  readFile(resolve(root, "lib", "social-feed.ts"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "001_social_beta.sql"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "014_independent_binary_judgments.sql"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["native Museum glyph button", /data-binary-vote="museum"[\s\S]*<MuseumGlyph \/>/, feed],
  ["native Slop glyph button", /data-binary-vote="slop"[\s\S]*<SlopGlyph \/>/, feed],
  ["Slop accessible name", /aria-label="Vote Slop"/, feed],
  ["Museum accessible name", /aria-label="Vote Museum"/, feed],
  ["symbolic binary ballot contract marker", /binary-slop-museum-v3-glyph/, feed],
  ["abstract viscous Slop glyph", /function SlopGlyph\(\)[\s\S]*<path d="M10 17/, feed],
  ["abstract rising triple-ring Museum glyph", /function MuseumGlyph\(\)[\s\S]*<ellipse[\s\S]*<ellipse[\s\S]*<ellipse[\s\S]*<path d="M32 48V15"/, feed],
  ["glyphs are primary visible ballot", /\.srOnly[\s\S]*clip: rect\(0, 0, 0, 0\)/, feedStyles],
  ["left swipe casts Slop", /deltaX <= -SWIPE_THRESHOLD[\s\S]*data-binary-vote='slop'/, swipe],
  ["right swipe casts Museum", /deltaX >= SWIPE_THRESHOLD[\s\S]*data-binary-vote='museum'/, swipe],
  ["swipe engine targets glyph ballot contract", /binary-slop-museum-v3-glyph/, swipe],
  ["vertical scroll preserved", /touch-action: pan-y/, swipe],
  ["horizontal intent guard", /Math\.abs\(deltaX\) > Math\.abs\(deltaY\) \* AXIS_DOMINANCE/, swipe],
  ["existing saveVote path retained", /saveVote\(id, voterId, judgment\)/, feed],
  ["client Judgment type is binary", /export type Judgment = "preserve" \| "slop";/, socialFeed],

  // Write receipt law: one click is optimistic at the surface but persistence
  // is only declared failed after bounded idempotent retries and private
  // reconciliation prove the requested row did not commit.
  ["bounded vote retry schedule", /VOTE_WRITE_RETRY_DELAYS_MS = \[0, 180, 550, 1400\]/, socialFeed],
  ["idempotent vote upsert key", /onConflict: "artifact_id,voter_id"/, socialFeed],
  ["vote write asks for committed receipt", /\.select\("artifact_id,judgment"\)[\s\S]*\.single\(\)/, socialFeed],
  ["vote receipt verifies artifact identity", /receipt\?\.artifact_id === artifactId/, socialFeed],
  ["vote receipt verifies judgment", /receipt\.judgment === judgment/, socialFeed],
  ["private own-vote reconciliation helper", /async function ownVoteMatches[\s\S]*loadOwnVotes\(voterId, \[artifactId\]\)/, socialFeed],
  ["lost acknowledgement can resolve by private read", /if \(await ownVoteMatches\(artifactId, voterId, judgment\)\) return;/, socialFeed],
  ["final reconciliation before failure", /One final private read[\s\S]*ownVoteMatches\(artifactId, voterId, judgment\)[\s\S]*throw lastError/, socialFeed],

  ["one account one artifact database key", /primary key \(artifact_id, voter_id\)/, schema],
  ["legacy non-binary rows fail closed", /LEGACY_NON_BINARY_VOTES_REQUIRE_REVIEW/, binaryMigration],
  ["binary database constraint", /check \(judgment in \('preserve', 'slop'\)\)/, binaryMigration],
]) {
  assert.ok(pattern.test(source), `Binary voting contract failed: missing ${label}`);
}

assert.ok(!/button[^>]*judge refine/.test(feed), "Refine must not exist in the public ballot component.");
assert.ok(!/MutationObserver/.test(swipe), "Binary voting must not depend on DOM mutation normalization.");
assert.ok(!/👍|👎/.test(feed), "The public ballot must not fall back to generic thumbs-up/thumbs-down icons.");

console.log("Binary swipe voting PASS: one account has one active Artifact judgment; click and swipe share one persistence path; vote writes are idempotent, self-confirming, and resolve lost acknowledgements through private own-vote reconciliation before reporting failure; vertical scrolling remains primary.");
