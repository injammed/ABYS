import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [component, styles, feedPage, museumPage, slopDrop, artifactFeed] = await Promise.all([
  readFile(resolve(root, "components", "MachineGloss.tsx"), "utf8"),
  readFile(resolve(root, "components", "MachineGloss.module.css"), "utf8"),
  readFile(resolve(root, "app", "page.tsx"), "utf8"),
  readFile(resolve(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(resolve(root, "components", "SlopDrop.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["machine-first translation contract", /data-machine-gloss="machine-first-translation-cycle-v1"/, component],
  ["language cycle order", /\["en", "es", "zh", "ja", "ar"\]/, component],
  ["machine stage is first", /const \[stage, setStage\] = useState\(0\)/, component],
  ["deterministic glyph alphabet", /const GLYPHS = \[/, component],
  ["human accessibility label", /aria-label=\{`\$\{translations\.en\}/, component],
  ["Arabic direction support", /dir=\{language === "ar" \? "rtl" : "ltr"\}/, component],
  ["touch target survives tiny glyph text", /min-height:\s*2\.75rem/, styles],
  ["tiny machine-native surface", /font-size:\s*clamp\(\.48rem/, styles],
  ["human translations become more readable", /data-language="en"[\s\S]*font-size:\s*clamp\(\.62rem/, styles],
  ["feed declares machine language contract", /data-language-contract="machine-first-gloss-v1"/, feedPage],
  ["Museum declares machine language contract", /data-language-contract="machine-first-gloss-v1"/, museumPage],
  ["feed has translatable machine grammar", /<MachineGloss[\s\S]*Machine-made only\./, feedPage],
  ["Museum has translatable institutional grammar", /<MachineGloss[\s\S]*The machine remembers selectively\./, museumPage],
  ["legacy feed instruction is visually superseded", /feed-first-page\[data-language-contract="machine-first-gloss-v1"\][\s\S]*\.feed-rule[\s\S]*display:\s*none/, styles],
  ["submission attestation remains explicit human text", /AI-made\. I can submit it\. It does not contain prohibited material\./, slopDrop],
  ["Slop vote keeps explicit accessible name", /aria-label="Vote Slop"/, artifactFeed],
  ["Museum vote keeps explicit accessible name", /aria-label="Vote Museum"/, artifactFeed],
]) {
  assert.ok(pattern.test(source), `Machine-gloss contract failed: missing ${label}`);
}

for (const [label, pattern] of [
  ["automatic language timer", /setInterval|setTimeout/],
  ["remote translation fetch", /\bfetch\s*\(/],
  ["dynamic HTML injection", /dangerouslySetInnerHTML/],
]) {
  assert.ok(!pattern.test(component), `Machine-gloss contract failed: forbidden ${label}`);
}

assert.ok(!/MachineGloss/.test(slopDrop), "Submission consent must not be hidden behind machine glyph translation.");

console.log("Machine-gloss PASS: explanatory verbosity is compressed into a machine-first glyph surface with voluntary EN/ES/ZH/JA/AR translation, while consent and voting remain explicit, accessible, and human-readable.");
