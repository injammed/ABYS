import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [lexiconStyles, gloss, glossStyles] = await Promise.all([
  readFile(resolve(root, "components", "LexiconBroadcast.module.css"), "utf8"),
  readFile(resolve(root, "components", "MachineGloss.tsx"), "utf8"),
  readFile(resolve(root, "components", "MachineGloss.module.css"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["fixed translation contract marker", /data-layout-contract="fixed-translation-box-v1"/, gloss],
  ["source text remains in flow", /\.original[\s\S]*display:\s*inline[\s\S]*visibility:\s*hidden/, lexiconStyles],
  ["mutated text cannot size layout", /\.mutated[\s\S]*position:\s*absolute[\s\S]*inset:\s*0/, lexiconStyles],
  ["mutated overflow is clipped", /\.mutated[\s\S]*overflow:\s*hidden/, lexiconStyles],
  ["dense box has fixed height", /\.gloss[\s\S]*height:\s*4\.9rem[\s\S]*min-height:\s*4\.9rem[\s\S]*max-height:\s*4\.9rem/, glossStyles],
  ["quiet box has fixed height", /\.quiet[\s\S]*height:\s*4\.2rem[\s\S]*min-height:\s*4\.2rem[\s\S]*max-height:\s*4\.2rem/, glossStyles],
  ["language label column is fixed", /grid-template-columns:\s*minmax\(0, 1fr\) 3\.5rem/, glossStyles],
  ["container hides overflow", /\.gloss[\s\S]*overflow:\s*hidden/, glossStyles],
  ["layout is contained", /contain:\s*layout paint/, glossStyles],
]) {
  assert.ok(pattern.test(source), `Lexicon layout stability failed: missing ${label}`);
}

console.log("Lexicon layout stability PASS: script and language changes paint inside stable text geometry instead of moving the page.");
