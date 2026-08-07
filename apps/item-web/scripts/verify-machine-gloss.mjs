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
  ["ambient translation broadcast contract", /data-machine-gloss="ambient-translation-broadcast-v2"/, component],
  ["half-second cycle law", /const CYCLE_MS = 500;/, component],
  ["continuous language interval", /setInterval\([\s\S]*CYCLE_MS\)/, component],
  ["independent deterministic phase", /stableHash\(`\$\{translations\.en\}\|phase`\) % CYCLE_MS/, component],
  ["open-ended translation pack", /\[language: string\]: string \| undefined;/, component],
  ["deterministic glyph alphabet", /const GLYPHS = \[/, component],
  ["stable human accessibility label", /aria-label=\{translations\.en\}/, component],
  ["cycling text is not announced live", /aria-live="off"/, component],
  ["visible cycling layer hidden from assistive tree", /aria-hidden="true"/, component],
  ["RTL language support", /RTL_LANGUAGES = new Set/, component],
  ["explicit reduced-motion preference", /matchMedia\("\(prefers-reduced-motion: reduce\)"\)/, component],
  ["tiny machine-native surface", /font-size:\s*clamp\(\.48rem/, styles],
  ["human translations become more readable", /not\(\[data-language="machine"\]\)[\s\S]*font-size:\s*clamp\(\.62rem/, styles],
  ["feed declares machine language contract", /data-language-contract="machine-first-gloss-v1"/, feedPage],
  ["Museum declares machine language contract", /data-language-contract="machine-first-gloss-v1"/, museumPage],
  ["feed has machine grammar", /<MachineGloss[\s\S]*Machine-made only\./, feedPage],
  ["Museum has institutional machine grammar", /<MachineGloss[\s\S]*The machine remembers selectively\./, museumPage],
  ["legacy feed instruction is visually superseded", /feed-first-page\[data-language-contract="machine-first-gloss-v1"\][\s\S]*\.feed-rule[\s\S]*display:\s*none/, styles],
  ["submission attestation remains explicit human text", /AI-made\. I can submit it\. It does not contain prohibited material\./, slopDrop],
  ["Slop vote keeps explicit accessible name", /aria-label="Vote Slop"/, artifactFeed],
  ["Museum vote keeps explicit accessible name", /aria-label="Vote Museum"/, artifactFeed],
]) {
  assert.ok(pattern.test(source), `Machine-gloss contract failed: missing ${label}`);
}

for (const [label, pattern] of [
  ["click-to-translate interaction", /onClick=/],
  ["button masquerading as ambient text", /<button\b/],
  ["remote translation fetch", /\bfetch\s*\(/],
  ["dynamic HTML injection", /dangerouslySetInnerHTML/],
]) {
  assert.ok(!pattern.test(component), `Machine-gloss contract failed: forbidden ${label}`);
}

assert.ok(!/MachineGloss/.test(slopDrop), "Submission consent must not be hidden behind machine glyph translation.");

console.log("Machine-gloss PASS: explanatory language broadcasts independently through machine glyphs and supplied human-language translations every 500 ms without clicks; assistive meaning remains stable, consequential consent/voting remain explicit, and reduced-motion preference freezes the visual broadcast.");
