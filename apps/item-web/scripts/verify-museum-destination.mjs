import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const [page, pageStyles, collection, collectionStyles, summit] = await Promise.all([
  readFile(resolve(root, "app", "aetimm", "page.tsx"), "utf8"),
  readFile(resolve(root, "app", "aetimm", "MuseumDestination.module.css"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.tsx"), "utf8"),
  readFile(resolve(root, "components", "MuseumCollection.module.css"), "utf8"),
  readFile(resolve(root, "components", "MuseumSummit.tsx"), "utf8"),
]);

for (const [label, pattern, source] of [
  ["always-arrive destination contract", /data-destination-contract="museum-arrival-always-v1"/, page],
  ["Museum shell mounts before collection state resolves", /<section className=\{styles\.threshold\}[\s\S]*<MuseumCollection \/>/, page],
  ["live Summit mounts before permanent collection", /<MuseumSummit \/>[\s\S]*<MuseumCollection \/>/, page],
  ["collection anchor", /id="collection"/, collection],
  ["empty Museum remains destination", /data-empty-museum-is-destination="true"/, collection],
  ["loading occurs inside Museum room", /The room is already here\. The register is being read\./, collection],
  ["empty permanent hall exists", /The hall is empty\./, collection],
  ["empty permanent hall is not a failure redirect", /No Artifact has crossed the permanent accession threshold yet\./, collection],
  ["ceremonial ring architecture", /\.ringOuter[\s\S]*\.ringMiddle[\s\S]*\.ringInner/, pageStyles],
  ["serious Museum framing", /AETIMM · MACHINE MUSEUM/, page],
  ["four-verb human navigation", /data-human-flow="upload-scroll-vote-shop-v1"[\s\S]*UPLOAD[\s\S]*SCROLL[\s\S]*VOTE[\s\S]*SHOP/, page],
  ["literature shelf contract", /data-library-contract="literature-shelf-v1"[\s\S]*AETIMM LITERATURE/, page],
  ["first sellable literature ITEM", /data-aetimm-item="0001"[\s\S]*data-commerce-state="orderable"[\s\S]*THE DIAMOND TESSERACT/, page],
  ["real visible price", /\$10 USD/, page],
  ["live checkout action", /BUY COPY →/, page],
  ["literature legal boundary", /INDEPENDENT CONCEPT · NOT LEGAL TENDER · NO GOVERNMENT ENDORSEMENT/, page],
  ["300-item shelf horizon", /ITEM 0002 → ITEM 0300\+/, page],
  ["sports-car North Star remains non-orderable", /data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1"[\s\S]*IMPOSSIBLE AMBITION · NOT ORDERABLE[\s\S]*CHECKOUT · OFF/, page],
  ["light mode remains surgical", /html\[data-aetimm-theme="light"\]/, pageStyles],
  ["empty chamber is spatially rendered", /\.emptyChamber[\s\S]*min-height:/, collectionStyles],
  ["Summit has vacant state inside destination", /THE PEAK IS UNCLAIMED/, summit],
]) {
  assert.ok(pattern.test(source), `Museum destination contract failed: missing ${label}`);
}

assert.ok(!/router\.(push|replace)\(/.test(page), "Museum route must not redirect based on collection state.");
assert.ok(!/redirect\(/.test(page), "Museum route must not server-redirect based on collection state.");
assert.ok(!/if\s*\(loading\)\s*\{?\s*return/.test(collection), "Loading must not replace the Museum with a loading-only page.");
assert.ok(!/if\s*\(accessions\.length\s*===\s*0\)\s*\{?\s*return/.test(collection), "An empty collection must not replace the Museum shell.");

console.log("Museum destination PASS: Museum remains intact; SHOP now exposes a truthful, orderable literature shelf while the vehicle North Star remains explicitly non-orderable.");
