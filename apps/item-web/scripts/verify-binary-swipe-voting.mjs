import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [bridge, feed, schema] = await Promise.all([
  readFile(resolve(root, "components", "BinarySwipeVoting.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "..", "..", "supabase", "migrations", "001_social_beta.sql"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["Museum public label", /preserve\.textContent = "Museum"/, bridge],
  ["Slop public label", /slop\.textContent = "Slop"/, bridge],
  ["Refine removed from public ballot", /refine\.hidden = true/, bridge],
  ["binary ballot contract marker", /binary-slop-museum-v1/, bridge],
  ["left swipe casts Slop", /deltaX <= -SWIPE_THRESHOLD[\s\S]*button\.judge\.slop/, bridge],
  ["right swipe casts Museum through preserve storage bridge", /deltaX >= SWIPE_THRESHOLD[\s\S]*button\.judge\.preserve/, bridge],
  ["vertical scroll preserved", /touch-action: pan-y/, bridge],
  ["horizontal intent guard", /Math\.abs\(deltaX\) > Math\.abs\(deltaY\) \* AXIS_DOMINANCE/, bridge],
  ["private preview voting blocked", /private-preview-card/, bridge],
  ["existing saveVote path retained", /saveVote\(id, voterId, judgment\)/, feed],
  ["one account one artifact database key", /primary key \(artifact_id, voter_id\)/, schema],
]) {
  assert.ok(pattern.test(source), `Binary voting contract failed: missing ${label}`);
}

assert.ok(!/preserve\.hidden = true/.test(bridge), "Museum must remain a visible public choice.");
assert.ok(!/slop\.hidden = true/.test(bridge), "Slop must remain a visible public choice.");

console.log("Binary swipe voting PASS: one account has one active artifact vote; left is Slop, right is Museum, buttons and swipe share the same persistence path, and vertical feed scrolling remains primary.");
