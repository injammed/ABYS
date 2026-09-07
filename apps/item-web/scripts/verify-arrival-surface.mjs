import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, feed, lexicon, depth, css] = await Promise.all([
  "app/page.tsx", "components/ArtifactFeed.tsx", "components/LexiconBroadcast.tsx", "components/DepthField.tsx", "app/gallery.css",
].map(file => readFile(file, "utf8")));

assert.match(page, /<section id="field"[\s\S]*<ArtifactFeed\s*\/>/);
assert.doesNotMatch(page, /<aside|<Image|<MachineGloss|gallery-edition|<footer|className="hero"/, "Uploaded work owns the uninterrupted Trough.");
assert.doesNotMatch(feed, /makeFeedBatch|setBatch/, "The public feed must never generate synthetic filler.");
assert.match(feed, /!socialBackendEnabled[\s\S]*The Trough is offline/);
assert.match(feed, /aria-label="Vote Slop"/);
assert.match(feed, /aria-label="Vote Museum"/);
assert.match(lexicon, /machine = false/, "Readable text is the default, including on touch devices.");
assert.match(depth, /FAR_METRES = 10000 \* 0\.9144/);
assert.match(depth, /aria-hidden="true"/);
assert.match(depth, /prefers-reduced-motion: reduce/);
assert.match(depth, /document\.visibilityState === "hidden"/);
assert.doesNotMatch(depth, /setInterval|preventDefault|\.scrollTo|saveVote|fetch\(/, "Depth cannot intercept scrolling, submit data or create a continuous timer.");
assert.match(css, /\.depth-field\s*\{[^}]*pointer-events: none/);
assert.match(css, /prefers-reduced-motion: reduce/);
console.log("Arrival PASS: real uploads only, no promotional interruptions, stable readable controls, non-interactive depth and reduced-motion support.");
