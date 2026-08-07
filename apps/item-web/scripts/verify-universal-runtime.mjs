import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [feed, runtime, socialFeed, swipe] = await Promise.all([
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactRuntime.tsx"), "utf8"),
  readFile(resolve(root, "lib", "social-feed.ts"), "utf8"),
  readFile(resolve(root, "components", "BinarySwipeVoting.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["single feed runtime host", /<ArtifactRuntime artifact=\{artifact\} \/>/, feed],
  ["runtime contract marker", /data-runtime-contract="artifact-runtime-v1"/, runtime],
  ["ordered Artifact part hydration", /from\("artifact_parts"\)[\s\S]*\.order\("position"/, socialFeed],
  ["batch signed material URLs", /createSignedUrls\(storagePaths, 60 \* 60\)/, socialFeed],
  ["image runtime", /part\.mode === "image"[\s\S]*<img/, runtime],
  ["video runtime", /part\.mode === "video"[\s\S]*<video/, runtime],
  ["audio runtime", /part\.mode === "audio"[\s\S]*<audio/, runtime],
  ["text runtime", /part\.partKind === "text"[\s\S]*<pre>/, runtime],
  ["reference is user initiated", /target="_blank" rel="noopener noreferrer"/, runtime],
  ["unsupported material fallback", /Stored as inert Artifact material|This material is preserved as part of the Artifact/, runtime],
  ["no-preview fallback remains visible", /The Artifact remains present and voteable/, runtime],
  ["native media protected from swipe", /summary, video, audio, \[role='button'\]/, swipe],
]) {
  assert.ok(pattern.test(source), `Universal runtime contract failed: missing ${label}`);
}

for (const [label, pattern] of [
  ["iframe execution", /<iframe\b/i],
  ["embedded object execution", /<object\b/i],
  ["embedded document execution", /<embed\b/i],
  ["script injection", /<script\b/i],
  ["dangerous HTML injection", /dangerouslySetInnerHTML/],
  ["eval execution", /\beval\s*\(/],
  ["Function constructor execution", /new\s+Function\s*\(/],
  ["automatic external reference fetch", /\bfetch\s*\(/],
]) {
  assert.ok(!pattern.test(runtime), `Universal runtime contract failed: forbidden ${label}`);
}

assert.ok(!/imageFeed|videoFeed|audioFeed|documentFeed|codeFeed|model3dFeed/.test(feed), "Modalities must not branch into separate public feeds.");

console.log("Universal runtime PASS: one trough hydrates ordered Artifact materials, safely renders native image/video/audio/text experiences, exposes references only by user action, preserves unsupported materials as inert evidence, keeps every Artifact voteable, and never executes uploaded code or HTML.");
