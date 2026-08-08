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
  /@media \(hover: none\) and \(pointer: coarse\)/.test(lexiconStyles),
  "Touch devices must get a dedicated actionable-text stability rule.",
);
for (const control of ["button", "a", "summary", "label"]) {
  assert.ok(
    new RegExp(`:global\\(${control.replace("[", "\\[").replace("]", "\\]")}\\) \\.original`).test(lexiconStyles),
    `${control} controls must expose stable source text on touch.`,
  );
}
assert.ok(
  /:global\(button\) \.mutated[\s\S]*visibility:\s*hidden/.test(lexiconStyles),
  "Touch action labels must hide the mutating paint layer.",
);

console.log("Arrival surface PASS: one ambient 500 ms language sandbag remains; duplicate clicks are gone; active mode is inert; touch actions stay human-readable.");
