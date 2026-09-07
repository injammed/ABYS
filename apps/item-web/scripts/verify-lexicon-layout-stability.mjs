import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [lexicon, lexiconStyles, gloss, css] = await Promise.all([
  "components/LexiconBroadcast.tsx", "components/LexiconBroadcast.module.css", "components/MachineGloss.tsx", "app/gallery.css",
].map(file => readFile(file, "utf8")));
assert.match(lexicon, /data-lexicon-readable="true"/);
assert.match(gloss, /data-layout-contract="readable-content-flow-v2"/);
assert.match(css, /\.readable-gloss\s*\{[^}]*height: auto/);
assert.match(css, /\.machine-signature\s*\{[^}]*overflow: hidden/);
assert.match(lexiconStyles, /\.original[\s\S]*display:\s*inline/);
assert.match(lexiconStyles, /\.mutated[\s\S]*position:\s*absolute[\s\S]*inset:\s*0/);
assert.match(lexiconStyles, /prefers-reduced-motion:[\s\S]*\.original[\s\S]*visibility:\s*visible/);
console.log("Text layout PASS: instructions grow with text size; decorative mutation stays inside fixed geometry.");
