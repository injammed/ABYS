import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [lexicon, gloss, layout, shop, museum, feed, runtime, museumRuntime] = await Promise.all([
  "components/LexiconBroadcast.tsx", "components/MachineGloss.tsx", "app/layout.tsx", "app/shop/page.tsx", "app/aetimm/page.tsx",
  "components/ArtifactFeed.tsx", "components/ArtifactRuntime.tsx", "components/MuseumArtifactRuntime.tsx",
].map(file => readFile(file, "utf8")));

assert.match(layout, /<LexiconBroadcastProvider>\{children\}<\/LexiconBroadcastProvider>/);
assert.match(lexicon, /machine = false/);
assert.match(lexicon, /if \(machine\) return <BroadcastLexiconText/);
assert.match(lexicon, /data-lexicon-readable="true"[\s\S]*>\{text\}<\/Component>/);
assert.match(lexicon, /!document\.body\.classList\.contains\("aetimm-gallery"\)/, "The gallery must not run the former semantic-language timer.");
assert.match(lexicon, /document\.visibilityState === "hidden"/);
assert.match(lexicon, /new IntersectionObserver/);
assert.match(lexicon, /prefers-reduced-motion: reduce/);
assert.match(gloss, />\{translations\.en\}<\/span>/);
assert.match(shop, /aria-hidden="true"><LexiconText machine/);
assert.match(museum, /aria-hidden="true"><LexiconText machine/);
assert.doesNotMatch(lexicon + gloss, /dangerouslySetInnerHTML|\bfetch\s*\(/);
assert.doesNotMatch(gloss, /setInterval|setTimeout|requestAnimationFrame/);
assert.match(feed, /aria-label="Vote Slop"/);
assert.match(feed, /aria-label="Vote Museum"/);
assert.match(runtime, /data-artifact-payload="verbatim"[\s\S]*<pre>\{excerpt\}<\/pre>/);
assert.match(museumRuntime, /data-artifact-payload="verbatim"[\s\S]*<pre>\{part\.text\.length/);
console.log("Machine language PASS: decoration is opt-in; source text, ballots, instructions and uploaded payloads remain readable and unchanged.");
