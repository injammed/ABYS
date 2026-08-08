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
  ["cheap semantic clock", /const TICK_MS = 125;/, lexicon],
  ["500 ms semantic envelope", /const SCRIPT_EPOCH_TICKS = 4;/, lexicon],
  ["single semantic interval", /window\.setInterval\([\s\S]*TICK_MS/, lexicon],
  ["c-signature carrier", /const C_SIGNATURE = 299_792_458;/, lexicon],
  ["safe integer carrier scale", /const VIRTUAL_CARRIER_SCALE = 16_777_216;/, lexicon],
  ["virtual carrier rate", /const VIRTUAL_CARRIER_STATES_PER_SECOND = C_SIGNATURE \* VIRTUAL_CARRIER_SCALE;/, lexicon],
  ["stroboscopic sample ceiling", /const MAX_VISIBLE_SAMPLE_FPS = 24;/, lexicon],
  ["slow apparent alias drift", /const ALIAS_DRIFT_HZ = 0\.075;/, lexicon],
  ["single shared frame engine", /window\.requestAnimationFrame\(runEngineFrame\)/, lexicon],
  ["background-tab heat guard", /document\.visibilityState === "hidden"/, lexicon],
  ["viewport heat guard", /new IntersectionObserver[\s\S]*observation\.isIntersecting/, lexicon],
  ["bounded visible sample gate", /nowMs - engineLastPaintMs < MIN_VISIBLE_SAMPLE_MS/, lexicon],
  ["half-rate echo sampling", /engineSampleNumber % 2 === 0/, lexicon],
  ["carrier wraps inside safe integer window", /const CARRIER_WRAP_MS = 1000;[\s\S]*withinSecond \* VIRTUAL_CARRIER_STATES_PER_SECOND/, lexicon],
  ["character-specific seed", /stableHash\(`\$\{text\}\|\$\{index\}`\)/, lexicon],
  ["phase-banded deterministic mutation", /const PHASE_BANDS = 16;[\s\S]*const band = \(index \+ \(seed % PHASE_BANDS\)\)/, lexicon],
  ["near-light-speed carrier explanation", /roughly five quadrillion deterministic language states per second/, lexicon],
  ["wagon-wheel alias explanation", /producing a wagon-wheel alias/, lexicon],
  ["many human writing systems", /אבגדה[\s\S]*ابتث[\s\S]*अआइई[\s\S]*あいうえお[\s\S]*天地人機/, lexicon],
  ["mathematical communication pool", /const MATH_POOL = Array\.from\("∀∂∃∅∆∇/, lexicon],
  ["synthetic machine glyph pool", /const MACHINE_POOL = Array\.from\("⌁⌭⟐⊙/, lexicon],
  ["phase-aliased visual contract", /data-lexicon-flicker="phase-aliased-character-broadcast-v2"/, lexicon],
  ["light-speed oscillation contract", /data-oscillation-contract="all-visible-interface-words-v3-light-speed-alias"/, lexicon],
  ["carrier contract", /data-carrier-contract="virtual-c-scale-frame-bounded-v1"/, lexicon],
  ["carrier rate exposed as metadata", /data-virtual-carrier-states-per-second=\{String\(VIRTUAL_CARRIER_STATES_PER_SECOND\)\}/, lexicon],
  ["sample ceiling exposed as metadata", /data-visible-sample-fps=\{String\(MAX_VISIBLE_SAMPLE_FPS\)\}/, lexicon],
  ["final hover translation contract", /data-hover-translation-contract="pointer-hover-exact-source-final-v1"/, lexicon],
  ["stable source hidden for accessibility", /className=\{styles\.srOnly\}>\{text\}/, lexicon],
  ["visual mutation hidden from assistive tree", /className=\{styles\.visual\}[\s\S]*aria-hidden="true"/, lexicon],
  ["source string owns layout geometry", /\.original[\s\S]*visibility:\s*hidden/, lexiconStyles],
  ["mutated string is paint-only overlay", /\.mutated,[\s\S]*\.echo[\s\S]*position:\s*absolute[\s\S]*inset:\s*0/, lexiconStyles],
  ["phase echo remains optical only", /\.echo[\s\S]*opacity:\s*\.13[\s\S]*translate3d/, lexiconStyles],
  ["fine-pointer hover reveals exact source", /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*\.lexicon:hover \.original[\s\S]*visibility:\s*visible/, lexiconStyles],
  ["fine-pointer hover hides both sampled layers", /\.lexicon:hover \.mutated,[\s\S]*\.lexicon:hover \.echo[\s\S]*visibility:\s*hidden/, lexiconStyles],
  ["reduced motion restores exact source without reflow", /prefers-reduced-motion:[\s\S]*\.original[\s\S]*visibility:\s*visible/, lexiconStyles],
  ["semantic language broadcast still open-ended", /\[language: string\]: string \| undefined;/, gloss],
  ["MachineGloss consumes shared clock", /useLexiconBroadcast\(\)/, gloss],
  ["MachineGloss has no private timer", /TICKS_PER_LANGUAGE = 4/, gloss],
  ["MachineGloss character-semantic contract", /data-machine-gloss="character-semantic-broadcast-v3"/, gloss],
  ["fixed translation geometry contract", /data-layout-contract="fixed-translation-box-v1"/, gloss],
  ["stable MachineGloss accessibility label", /aria-label=\{translations\.en\}/, gloss],
  ["cycling MachineGloss not announced live", /aria-live="off"/, gloss],
  ["RTL language support", /RTL_LANGUAGES = new Set/, gloss],
  ["fixed dense translation height", /\.gloss[\s\S]*height:\s*4\.9rem[\s\S]*max-height:\s*4\.9rem/, glossStyles],
  ["fixed quiet translation height", /\.quiet[\s\S]*height:\s*4\.2rem[\s\S]*max-height:\s*4\.2rem/, glossStyles],
  ["translation overflow stays inside box", /\.gloss[\s\S]*overflow:\s*hidden/, glossStyles],
  ["language label column cannot change wrap width", /grid-template-columns:\s*minmax\(0, 1fr\) 3\.5rem/, glossStyles],
  ["layout paint containment", /contain:\s*layout paint/, glossStyles],
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

assert.equal((lexicon.match(/setInterval/g) ?? []).length, 1, "Only the cheap semantic envelope may use setInterval.");
assert.ok(!/setTimeout/.test(lexicon), "The carrier must not create timeout storms.");
assert.ok(!/setInterval|setTimeout|requestAnimationFrame/.test(gloss), "MachineGloss must not create private clocks.");
assert.ok(!/@keyframes/.test(lexiconStyles), "Per-node CSS animation loops are forbidden; the shared sampler owns motion.");
assert.ok(!/dangerouslySetInnerHTML/.test(lexicon + gloss), "Machine lexicon must not use dynamic HTML injection.");
assert.ok(!/\bfetch\s*\(/.test(lexicon + gloss), "Machine lexicon must not call a remote translation or glyph service.");
assert.ok(!/<LexiconText[^>]*text=\{textPart\}/.test(slopDrop), "User-entered Artifact text must not be transformed while editing.");
assert.ok(!/\.lexicon:focus-within \.original/.test(lexiconStyles), "Focus alone must not stop visible oscillation.");
assert.ok(!/@media \(hover: none\) and \(pointer: coarse\)/.test(lexiconStyles), "Touch controls must participate in the same visible oscillation field.");

console.log("Machine lexicon PASS: a c-signature virtual carrier traverses roughly five quadrillion deterministic states per second while one viewport-bounded 24 Hz sampler exposes a slow wagon-wheel alias; hover translates exact source in-place, geometry stays fixed, background/offscreen work is suppressed, and Artifact payloads remain verbatim. FINAL MOTION CONTRACT.");
