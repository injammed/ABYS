import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [
  gloss,
  glossStyles,
  lexicon,
  lexiconStyles,
  layout,
  feedPage,
  museumPage,
  slopDrop,
  accountGate,
  artifactFeed,
  artifactRuntime,
  museumRuntime,
] = await Promise.all([
  readFile(resolve(root, "components", "MachineGloss.tsx"), "utf8"),
  readFile(resolve(root, "components", "MachineGloss.module.css"), "utf8"),
  readFile(resolve(root, "components", "LexiconBroadcast.tsx"), "utf8"),
  readFile(resolve(root, "components", "LexiconBroadcast.module.css"), "utf8"),
  readFile(resolve(root, "app", "layout.tsx"), "utf8"),
  readFile(resolve(root, "app", "page.tsx"), "utf8"),
  readFile(resolve(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(resolve(root, "components", "SlopDrop.tsx"), "utf8"),
  readFile(resolve(root, "components", "AccountGate.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactFeed.tsx"), "utf8"),
  readFile(resolve(root, "components", "ArtifactRuntime.tsx"), "utf8"),
  readFile(resolve(root, "components", "MuseumArtifactRuntime.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["one root broadcast provider", /<LexiconBroadcastProvider>\{children\}<\/LexiconBroadcastProvider>/, layout],
  ["one shared tick law", /const TICK_MS = 125;/, lexicon],
  ["500 ms script epoch", /const SCRIPT_EPOCH_TICKS = 4;/, lexicon],
  ["single shared interval", /window\.setInterval\([\s\S]*TICK_MS/, lexicon],
  ["character-specific seed", /stableHash\(`\$\{text\}\|\$\{index\}`\)/, lexicon],
  ["character-specific reveal cadence", /\(localTick \+ index\) % 5/, lexicon],
  ["many human writing systems", /אבגדה[\s\S]*ابتث[\s\S]*अआइई[\s\S]*あいうえお[\s\S]*天地人機/, lexicon],
  ["mathematical communication pool", /const MATH_POOL = Array\.from\("∀∂∃∅∆∇/, lexicon],
  ["synthetic machine glyph pool", /const MACHINE_POOL = Array\.from\("⌁⌭⟐⊙/, lexicon],
  ["visual flicker contract", /data-lexicon-flicker="character-broadcast-v1"/, lexicon],
  ["stable source hidden for accessibility", /className=\{styles\.srOnly\}>\{text\}/, lexicon],
  ["visual mutation hidden from assistive tree", /className=\{styles\.visual\} aria-hidden="true"/, lexicon],
  ["hover restores exact source", /\.lexicon:hover \.original[\s\S]*display:\s*inline/, lexiconStyles],
  ["focus restores exact source", /\.lexicon:focus-within \.original[\s\S]*display:\s*inline/, lexiconStyles],
  ["reduced motion restores exact source", /prefers-reduced-motion:[\s\S]*\.original[\s\S]*display:\s*inline/, lexiconStyles],
  ["semantic language broadcast still open-ended", /\[language: string\]: string \| undefined;/, gloss],
  ["MachineGloss consumes shared clock", /useLexiconBroadcast\(\)/, gloss],
  ["MachineGloss has no private timer", /TICKS_PER_LANGUAGE = 4/, gloss],
  ["MachineGloss character-semantic contract", /data-machine-gloss="character-semantic-broadcast-v3"/, gloss],
  ["stable MachineGloss accessibility label", /aria-label=\{translations\.en\}/, gloss],
  ["cycling MachineGloss not announced live", /aria-live="off"/, gloss],
  ["RTL language support", /RTL_LANGUAGES = new Set/, gloss],
  ["tiny machine-native surface", /font-size:\s*clamp\(\.48rem/, glossStyles],
  ["feed declares machine language contract", /data-language-contract="machine-first-gloss-v1"/, feedPage],
  ["Museum declares character lexicon contract", /data-lexicon-contract="character-broadcast-v1"/, museumPage],
  ["submission chrome uses character broadcast", /<LexiconText[\s\S]*ALL SLOP WELCOME/, slopDrop],
  ["account chrome uses character broadcast", /<LexiconText[\s\S]*Create account/, accountGate],
  ["feed Artifact metadata uses character broadcast", /<LexiconText as="h2" text=\{artifact\.title\}/, artifactFeed],
  ["Slop vote keeps stable accessible name", /aria-label="Vote Slop"/, artifactFeed],
  ["Museum vote keeps stable accessible name", /aria-label="Vote Museum"/, artifactFeed],
  ["trough textual Artifact payload remains verbatim", /data-artifact-payload="verbatim"[\s\S]*<pre>\{excerpt\}<\/pre>/, artifactRuntime],
  ["Museum textual Artifact payload remains verbatim", /data-artifact-payload="verbatim"[\s\S]*<pre>\{part\.text\.length/, museumRuntime],
]) {
  assert.ok(pattern.test(source), `Machine lexicon contract failed: missing ${label}`);
}

assert.equal((lexicon.match(/setInterval/g) ?? []).length, 1, "Character broadcast must use exactly one shared interval.");
assert.ok(!/setInterval|setTimeout/.test(gloss), "MachineGloss must not create its own timers.");
assert.ok(!/dangerouslySetInnerHTML/.test(lexicon + gloss), "Machine lexicon must not use dynamic HTML injection.");
assert.ok(!/\bfetch\s*\(/.test(lexicon + gloss), "Machine lexicon must not call a remote translation or glyph service.");
assert.ok(!/<LexiconText[^>]*text=\{textPart\}/.test(slopDrop), "User-entered Artifact text must not be transformed while editing.");

console.log("Machine lexicon PASS: one shared clock drives independent per-character flicker across core public UI; supplied semantic translations still rotate every 500 ms; human scripts, mathematical symbols, and synthetic glyphs coexist; accessibility stays stable; and Artifact payloads remain verbatim.");
