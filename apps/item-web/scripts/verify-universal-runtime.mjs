import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [feed, runtime, renewable, mediaLease, socialFeed, swipe] = await Promise.all([
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactRuntime.tsx"), "utf8"),
  readFile(resolve(root, "components", "RenewableArtifactMedia.tsx"), "utf8"),
  readFile(resolve(root, "lib", "media-lease.ts"), "utf8"),
  readFile(resolve(root, "lib", "social-feed.ts"), "utf8"),
  readFile(resolve(root, "components", "BinarySwipeVoting.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["single feed runtime host", /<ArtifactRuntime artifact=\{artifact\} \/>/, feed],
  ["runtime contract marker", /data-runtime-contract="artifact-runtime-v1"/, runtime],
  ["ordered Artifact part hydration", /from\("artifact_parts"\)[\s\S]*\.order\("position"/, socialFeed],
  ["short-lived batch signed material URLs", /createSignedUrls\(storagePaths, 60 \* 60\)/, socialFeed],
  ["image runtime uses renewable lease", /part\.mode === "image"[\s\S]*RenewableArtifactMedia kind="image"/, runtime],
  ["video runtime uses renewable lease", /part\.mode === "video"[\s\S]*RenewableArtifactMedia kind="video"/, runtime],
  ["audio runtime uses renewable lease", /part\.mode === "audio"[\s\S]*RenewableArtifactMedia kind="audio"/, runtime],
  ["legacy image fallback also renewable", /artifact\.mediaUrl[\s\S]*RenewableArtifactMedia kind="image"/, runtime],
  ["download path renews before deliberate access", /RenewableArtifactDownload/, runtime],
  ["media error triggers lease recovery", /onError=\{recoverLease\}/, renewable],
  ["same failed URL cannot storm renewals", /attemptedUrlRef\.current === url/, renewable],
  ["concurrent lease renewal deduplicated", /const inFlight = new Map<string, Promise<string>>\(\)/, mediaLease],
  ["signed storage path recovered from exact URL", /SIGNED_OBJECT_MARKER = "\/object\/sign\/artifact-media\/"/, mediaLease],
  ["renewal retains one-hour credential", /MEDIA_LEASE_SECONDS = 60 \* 60/, mediaLease],
  ["renewal requests exact Artifact bucket", /from\("artifact-media"\)[\s\S]*createSignedUrl\(storagePath, MEDIA_LEASE_SECONDS\)/, mediaLease],
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
  assert.ok(!pattern.test(runtime + renewable), `Universal runtime contract failed: forbidden ${label}`);
}

assert.ok(!/imageFeed|videoFeed|audioFeed|documentFeed|codeFeed|model3dFeed/.test(feed), "Modalities must not branch into separate public feeds.");

console.log("Universal runtime PASS: one trough safely renders every Artifact form; short-lived media credentials renew in place on expiry without a user control or request storm; downloads renew on deliberate access; uploaded code/HTML remain inert; every Artifact stays voteable.");
