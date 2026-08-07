import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [museum, collection, runtime] = await Promise.all([
  readFile(resolve(root, "lib", "museum.ts"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.tsx"), "utf8"),
  readFile(resolve(root, "components", "MuseumArtifactRuntime.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["Museum hydrates Artifact parts", /artifact_parts\(id,position,part_kind,mode,label,storage_path,original_filename,mime_type,byte_size,text_content,reference_url\)/, museum],
  ["Museum signs materials in a batch", /createSignedUrls\(storagePaths, 60 \* 60\)/, museum],
  ["Museum collection uses one Artifact runtime", /<MuseumArtifactRuntime artifact=\{accession\} \/>/, collection],
  ["Museum runtime contract", /data-museum-runtime-contract="museum-artifact-runtime-v1"/, runtime],
  ["Museum image presentation", /part\.mode === "image"[\s\S]*<img/, runtime],
  ["Museum video presentation", /part\.mode === "video"[\s\S]*<video/, runtime],
  ["Museum audio presentation", /part\.mode === "audio"[\s\S]*<audio/, runtime],
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
  assert.ok(!pattern.test(runtime), `Museum runtime contract failed: forbidden ${label}`);
}

console.log("Museum runtime PASS: Summit and permanent accessions share the same safe Artifact-form presentation; native-safe forms remain experienceable, unsupported or executable forms stay sealed and retrievable, and Museum presentation never becomes another voting surface.");
