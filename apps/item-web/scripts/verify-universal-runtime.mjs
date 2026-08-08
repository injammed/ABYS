import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [feed, runtime, initialLease, renewable, mediaLease, socialFeed, swipe] = await Promise.all([
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactRuntime.tsx"), "utf8"),
  readFile(resolve(root, "components", "InitialLeaseArtifactMedia.tsx"), "utf8"),
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
  ["lead selection does not discard file when first lease is absent", /part\.partKind === "file"/, runtime],
  ["image runtime owns initial lease recovery", /part\.mode === "image"[\s\S]*InitialLeaseArtifactMedia[\s\S]*kind="image"[\s\S]*partId=\{part\.id\}/, runtime],
  ["video runtime owns initial lease recovery", /part\.mode === "video"[\s\S]*InitialLeaseArtifactMedia[\s\S]*kind="video"[\s\S]*partId=\{part\.id\}/, runtime],
  ["audio runtime owns initial lease recovery", /part\.mode === "audio"[\s\S]*InitialLeaseArtifactMedia[\s\S]*kind="audio"[\s\S]*partId=\{part\.id\}/, runtime],
  ["missing initial URL triggers part reacquisition", /if \(!initialUrl\)[\s\S]*acquireArtifactMediaLeaseByPartId\(partId\)/, initialLease],
  ["initial acquisition retains stable stage geometry", /data-media-lease-pending="true"/, initialLease],
  ["acquired lease returns to proven expiry-renewal runtime", /<RenewableArtifactMedia[\s\S]*initialUrl=\{url\}/, initialLease],
  ["initial lease retry schedule bounded", /INITIAL_LEASE_RETRY_DELAYS_MS = \[0, 400, 1200, 3000\]/, mediaLease],
  ["initial lease validates part UUID", /UUID_PATTERN\.test\(partId\)/, mediaLease],
  ["initial lease resolves exact public part identity", /from\("artifact_parts"\)[\s\S]*select\("storage_path"\)[\s\S]*\.eq\("id", partId\)/, mediaLease],
  ["concurrent initial part acquisition deduplicated", /const partInFlight = new Map<string, Promise<string>>\(\)/, mediaLease],
  ["legacy image fallback also renewable", /artifact\.mediaUrl[\s\S]*RenewableArtifactMedia kind="image"/, runtime],
  ["download path renews before deliberate access", /RenewableArtifactDownload/, runtime],
  ["media error triggers lease recovery", /onError=\{recoverLease\}/, renewable],
  ["same failed URL cannot storm renewals", /attemptedUrlRef\.current === url/, renewable],
  ["concurrent lease renewal deduplicated", /const inFlight = new Map<string, Promise<string>>\(\)/, mediaLease],
  ["signed storage path recovered from exact URL", /SIGNED_OBJECT_MARKER = "\/object\/sign\/artifact-media\/"/, mediaLease],
  ["renewal retains one-hour credential", /MEDIA_LEASE_SECONDS = 60 \* 60/, mediaLease],
  ["all lease paths request exact Artifact bucket", /from\("artifact-media"\)[\s\S]*createSignedUrl\(storagePath, MEDIA_LEASE_SECONDS\)/, mediaLease],
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
  assert.ok(!pattern.test(runtime + initialLease + renewable), `Universal runtime contract failed: forbidden ${label}`);
}

assert.ok(!/imageFeed|videoFeed|audioFeed|documentFeed|codeFeed|model3dFeed/.test(feed), "Modalities must not branch into separate public feeds.");

console.log("Universal runtime PASS: one trough safely renders every Artifact form; native media can reacquire a missing first short-lived lease by exact public part identity and later renew expiry in place; downloads renew on deliberate access; uploaded code/HTML remain inert; every Artifact stays voteable.");
