import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [page, navigation, lexicon, lexiconStyles] = await Promise.all([
  readFile(resolve(root, "app", "page.tsx"), "utf8"),
  readFile(resolve(root, "components", "PrimaryNavigation.tsx"), "utf8"),
  readFile(resolve(root, "components", "LexiconBroadcast.tsx"), "utf8"),
  readFile(resolve(root, "components", "LexiconBroadcast.module.css"), "utf8"),
]);

assert.equal(
  (page.match(/<MachineGloss\b/g) ?? []).length,
  1,
  "Root must carry exactly one ambient language sandbag, not stacked translation blocks.",
);
assert.ok(!/What is this\?/.test(page), "Root must not duplicate About with a second explanatory button.");
assert.ok(
  /data-arrival-contract="active-mode-is-not-a-button-v1"/.test(navigation),
  "Primary navigation must declare the inert-active-mode contract.",
);
assert.ok(
  /mode === "feed"[\s\S]*?<div[\s\S]*?primary-mode-feed active/.test(navigation),
  "The already-active Trough half must render as inert presentation, not a link.",
);
assert.ok(
  /mode === "museum"[\s\S]*?<div[\s\S]*?primary-mode-museum active/.test(navigation),
  "The already-active Museum half must render as inert presentation, not a link.",
);
assert.ok(/const C_SIGNATURE = 299_792_458;/.test(lexicon), "The carrier must preserve the deliberate c-signature.");
assert.ok(/const VIRTUAL_CARRIER_SCALE = 16_777_216;/.test(lexicon), "The carrier must use the bounded 2^24 scale.");
assert.ok(/const MAX_VISIBLE_SAMPLE_FPS = 24;/.test(lexicon), "Visible glyph painting must stay capped at the stroboscopic 24 Hz sampler.");
assert.ok(/const ALIAS_DRIFT_HZ = 0\.075;/.test(lexicon), "The apparent field must retain the slow phase drift.");
assert.ok(
  /data-oscillation-contract="all-visible-interface-words-v3-light-speed-alias"/.test(lexicon),
  "Every visible interface word must participate in the light-speed alias field.",
);
assert.ok(
  /data-carrier-contract="virtual-c-scale-frame-bounded-v1"/.test(lexicon),
  "The virtual-carrier / bounded-paint separation must stay explicit.",
);
assert.ok(
  /window\.requestAnimationFrame\(runEngineFrame\)/.test(lexicon),
  "One shared browser-frame sampler must own visible carrier sampling.",
);
assert.ok(
  /new IntersectionObserver[\s\S]*observation\.isIntersecting/.test(lexicon),
  "Offscreen lexicon surfaces must be excluded from active painting.",
);
assert.ok(
  /document\.visibilityState === "hidden"/.test(lexicon),
  "Hidden tabs must not burn cycles on the language field.",
);
assert.ok(
  /data-hover-translation-contract="pointer-hover-exact-source-final-v1"/.test(lexicon),
  "Pointer-hover translation must remain exact and versioned.",
);
assert.ok(
  /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*\.lexicon:hover \.original[\s\S]*visibility:\s*visible/.test(lexiconStyles),
  "Fine-pointer hover must reveal the exact source text without reflow.",
);
assert.ok(
  /\.lexicon:hover \.mutated,[\s\S]*\.lexicon:hover \.echo[\s\S]*visibility:\s*hidden/.test(lexiconStyles),
  "Fine-pointer hover must hide both sampled machine layers while translating.",
);
assert.ok(!/\.lexicon:focus-within \.original/.test(lexiconStyles), "Focus alone must not disable oscillation.");
assert.ok(!/@media \(hover: none\) and \(pointer: coarse\)/.test(lexiconStyles), "Touch controls must not receive a stable visible-language exemption.");
assert.ok(
  /prefers-reduced-motion:[\s\S]*\.original[\s\S]*visibility:\s*visible/.test(lexiconStyles),
  "Explicit reduced-motion preference remains the always-visible accessibility opt-out.",
);

console.log("Arrival surface PASS: duplicate clicks stay removed; every interface word samples a roughly five-quadrillion-state-per-second virtual carrier through a bounded 24 Hz wagon-wheel alias; fine-pointer hover translates exact source in-place. FINAL MOTION CONTRACT.");
