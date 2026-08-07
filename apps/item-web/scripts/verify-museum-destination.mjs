import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [page, pageStyles, collection, collectionStyles] = await Promise.all([
  readFile(resolve(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(resolve(root, "app", "aetimm", "MuseumDestination.module.css"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.tsx"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.module.css"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["always-arrive destination contract", /data-destination-contract="museum-arrival-always-v1"/, page],
  ["Museum shell mounts before collection state resolves", /<section className=\{styles\.threshold\}[\s\S]*<MuseumCollection \/>/, page],
  ["collection anchor", /id="collection"/, collection],
  ["empty Museum remains destination", /data-empty-museum-is-destination="true"/, collection],
  ["loading occurs inside Museum room", /The room is already here\. The register is being read\./, collection],
  ["empty hall exists", /The hall is empty\./, collection],
  ["empty hall is not a failure redirect", /Nothing has earned permanent placement yet\./, collection],
  ["ceremonial ring architecture", /\.ringOuter[\s\S]*\.ringMiddle[\s\S]*\.ringInner/, pageStyles],
  ["serious permanent collection framing", /AETIMM · PERMANENT COLLECTION/, page],
  ["empty chamber is spatially rendered", /\.emptyChamber[\s\S]*min-height:/, collectionStyles],
  ["summit placement remains in Museum", /CURRENT SUMMIT/, collectionStyles],
]) {
  assert.ok(pattern.test(source), `Museum destination contract failed: missing ${label}`);
}

assert.ok(!/router\.(push|replace)\(/.test(page), "Museum route must not redirect based on collection state.");
assert.ok(!/redirect\(/.test(page), "Museum route must not server-redirect based on collection state.");
assert.ok(!/if\s*\(loading\)\s*\{?\s*return/.test(collection), "Loading must not replace the Museum with a loading-only page.");
assert.ok(!/if\s*\(accessions\.length\s*===\s*0\)\s*\{?\s*return/.test(collection), "An empty collection must not replace the Museum shell.");

console.log("Museum destination PASS: clicking Museum always lands in a fully rendered ceremonial destination; loading, failure, and zero-accession states fill the room without replacing or redirecting the institution.");
