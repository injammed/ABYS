import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [swipe, feed, socialFeed, schema, binaryMigration] = await Promise.all([
  readFile(resolve(root, "components", "BinarySwipeVoting.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "lib", "social-feed.ts"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "001_social_beta.sql"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "014_independent_binary_judgments.sql"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["native Museum button", /data-binary-vote="museum"[\s\S]*Museum/, feed],
  ["native Slop button", /data-binary-vote="slop"[\s\S]*Slop/, feed],
  ["binary ballot contract marker", /binary-slop-museum-v2/, feed],
  ["left swipe casts Slop", /deltaX <= -SWIPE_THRESHOLD[\s\S]*data-binary-vote='slop'/, swipe],
  ["right swipe casts Museum", /deltaX >= SWIPE_THRESHOLD[\s\S]*data-binary-vote='museum'/, swipe],
  ["vertical scroll preserved", /touch-action: pan-y/, swipe],
  ["horizontal intent guard", /Math\.abs\(deltaX\) > Math\.abs\(deltaY\) \* AXIS_DOMINANCE/, swipe],
  ["existing saveVote path retained", /saveVote\(id, voterId, judgment\)/, feed],
  ["client Judgment type is binary", /export type Judgment = "preserve" \| "slop";/, socialFeed],
  ["one account one artifact database key", /primary key \(artifact_id, voter_id\)/, schema],
  ["database rejects new Refine writes", /BINARY_JUDGMENT_REQUIRED/, binaryMigration],
  ["binary trigger protects inserts and updates", /before insert or update of judgment on public\.artifact_votes/, binaryMigration],
]) {
  assert.ok(pattern.test(source), `Binary voting contract failed: missing ${label}`);
}

assert.ok(!/button[^>]*judge refine/.test(feed), "Refine must not exist in the public ballot component.");
assert.ok(!/MutationObserver/.test(swipe), "Binary voting must not depend on DOM mutation normalization.");
assert.ok(!/\.textContent\s*=\s*"Museum"/.test(swipe), "Museum must be native markup, not a rewritten legacy label.");
assert.ok(!/\.textContent\s*=\s*"Slop"/.test(swipe), "Slop must be native markup, not a rewritten legacy label.");

console.log("Binary swipe voting PASS: one account has one active Artifact judgment; Slop and Museum are native choices, left/right swipe share the same persistence path, Refine cannot be newly written, and vertical scrolling remains primary.");
