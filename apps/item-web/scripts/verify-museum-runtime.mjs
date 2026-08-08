import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [museum, collection, runtime, renewable, mediaLease] = await Promise.all([
  readFile(resolve(root, "lib", "museum.ts"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.tsx"), "utf8"),
  readFile(resolve(root, "components", "MuseumArtifactRuntime.tsx"), "utf8"),
  readFile(resolve(root, "components", "RenewableArtifactMedia.tsx"), "utf8"),
  readFile(resolve(root, "lib", "media-lease.ts"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["Museum hydrates Artifact parts", /artifact_parts\(id,position,part_kind,mode,label,storage_path,original_filename,mime_type,byte_size,text_content,reference_url\)/, museum],
  ["Museum signs materials in a short-lived batch", /createSignedUrls\(storagePaths, 60 \* 60\)/, museum],
  ["Museum collection uses one Artifact runtime", /<MuseumArtifactRuntime artifact=\{accession\} \/>/, collection],
  ["Museum runtime contract", /data-museum-runtime-contract="museum-artifact-runtime-v1"/, runtime],
  ["Museum renewable image presentation", /part\.mode === "image"[\s\S]*RenewableArtifactMedia kind="image"/, runtime],
  ["Museum renewable video presentation", /part\.mode === "video"[\s\S]*RenewableArtifactMedia kind="video"/, runtime],
  ["Museum renewable audio presentation", /part\.mode === "audio"[\s\S]*RenewableArtifactMedia kind="audio"/, runtime],
  ["Museum legacy image fallback renewable", /artifact\.mediaUrl[\s\S]*RenewableArtifactMedia kind="image"/, runtime],
  ["Museum retrieval lease renewal", /RenewableArtifactDownload/, runtime],
  ["runtime media error self-recovers", /onError=\{recoverLease\}/, renewable],
  ["one-hour credential remains bounded", /MEDIA_LEASE_SECONDS = 60 \* 60/, mediaLease],
  ["Museum text presentation", /part\.partKind === "text"[\s\S]*<pre>/, runtime],
  ["Museum sealed unsupported form", /SEALED MATERIAL/, runtime],
  ["Museum material register", /ARTIFACT MATERIALS/, runtime],
  ["Museum fallback preserves Artifact existence", /The Artifact exists even when this browser has no native presentation for its form/, runtime],
]) {
  assert.ok(pattern.test(source), `Museum runtime contract failed: missing ${label}`);
}

for (const [label, pattern] of [
  ["iframe execution", /<iframe\b/i],
  ["object execution", /<object\b/i],
  ["embed execution", /<embed\b/i],
  ["dangerous HTML injection", /dangerouslySetInnerHTML/],
  ["eval execution", /\beval\s*\(/],
  ["Function constructor execution", /new\s+Function\s*\(/],
  ["automatic external fetch", /\bfetch\s*\(/],
  ["Museum vote controls", /data-binary-vote|saveVote\(/],
]) {
  assert.ok(!pattern.test(runtime + renewable), `Museum runtime contract failed: forbidden ${label}`);
}

console.log("Museum runtime PASS: Summit and permanent accessions retain short-lived storage credentials but renew them in place on expiry; native-safe forms remain experienceable, downloads renew on deliberate access, unsupported executable forms stay sealed, and Museum never becomes another voting surface.");
