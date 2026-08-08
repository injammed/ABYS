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
assert.ok(/const TICK_MS = 125;/.test(lexicon), "The rapid shared lexicon clock must remain enabled.");
assert.ok(/const SCRIPT_EPOCH_TICKS = 4;/.test(lexicon), "The 500 ms language/script cadence must remain deliberate.");
assert.ok(
  /data-oscillation-contract="all-visible-interface-words-v2-hover-source"/.test(lexicon),
  "Every visible interface word must participate in universal oscillation with the final hover-source exception.",
);
assert.ok(
  /data-hover-translation-contract="pointer-hover-exact-source-final-v1"/.test(lexicon),
  "The final pointer-hover translation law must be explicit and versioned.",
);
assert.ok(
  /Every visible non-whitespace character participates on every clock tick/.test(lexicon),
  "Every visible non-whitespace character must mutate continuously outside hover.",
);
assert.ok(
  /onPointerEnter=\{\(event\) => setPointerTranslated\(event\.pointerType !== "touch" && event\.buttons === 0\)\}/.test(lexicon),
  "Only the active non-touch pointer may reveal exact source text.",
);
assert.ok(
  /onPointerDown=\{\(event\) => \{[\s\S]*event\.pointerType === "touch"[\s\S]*setPointerTranslated\(false\)/.test(lexicon),
  "Touch interaction must explicitly clear any translated state.",
);
assert.ok(
  /\.pointerTranslated \.original[\s\S]*visibility:\s*visible/.test(lexiconStyles),
  "Pointer-authorized translation must reveal the exact source without reflow.",
);
assert.ok(
  /\.pointerTranslated \.mutated[\s\S]*visibility:\s*hidden/.test(lexiconStyles),
  "Pointer-authorized translation must hide the oscillating paint layer.",
);
assert.ok(!/@media \(hover: hover\) and \(pointer: fine\)/.test(lexiconStyles), "Device capability queries must not decide which input translated the text.");
assert.ok(!/\.lexicon:focus-within \.original/.test(lexiconStyles), "Focus alone must not disable oscillation.");
assert.ok(!/@media \(hover: none\) and \(pointer: coarse\)/.test(lexiconStyles), "Touch controls must not receive a stable visible-language exemption.");
assert.ok(
  /prefers-reduced-motion:[\s\S]*\.original[\s\S]*visibility:\s*visible/.test(lexiconStyles),
  "Explicit reduced-motion preference remains the always-visible accessibility opt-out.",
);

console.log("Arrival surface PASS: duplicate clicks stay removed, one ambient language sandbag remains, interface words oscillate by default, and exact-source translation is authorized by the actual non-touch pointer rather than device capability. FINAL FROZEN CONTRACT.");
