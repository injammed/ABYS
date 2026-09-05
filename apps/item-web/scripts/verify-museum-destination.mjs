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
  ["made-to-order SHOP contract", /data-shop-contract="made-to-order-v1"[\s\S]*Choose it\. Quote it\. Make it\./, page],
  ["real-price rule", /Real price only after manufacturability and supplier cost are known\./, page],
  ["sports-car North Star remains an honest concept", /data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1"[\s\S]*CONCEPT · NOT ORDERABLE/, page],
  ["truthful commerce state", /data-commerce-state="concept"[\s\S]*data-product-state-contract="truthful-commerce-state-v1"[\s\S]*PRICE · —[\s\S]*CHECKOUT · OFF/, page],
  ["product only after QC", /PRODUCT[\s\S]*ONLY AFTER QC/, page],
  ["no payment before manufacturability", /This concept cannot accept payment yet\./, page],
  ["surgical light and expressive dark modes", /html:not\(\[data-aetimm-theme="light"\]\)[\s\S]*html\[data-aetimm-theme="light"\]/, pageStyles],
  ["demand-born Library contract", /data-library-contract="demand-born-object-v1"/, page],
  ["empty chamber is spatially rendered", /\.emptyChamber[\s\S]*min-height:/, collectionStyles],
  ["Summit has vacant state inside destination", /THE PEAK IS UNCLAIMED/, summit],
]) {
  assert.ok(pattern.test(source), `Museum destination contract failed: missing ${label}`);
}

assert.ok(!/router\.(push|replace)\(/.test(page), "Museum route must not redirect based on collection state.");
assert.ok(!/redirect\(/.test(page), "Museum route must not server-redirect based on collection state.");
assert.ok(!/if\s*\(loading\)\s*\{?\s*return/.test(collection), "Loading must not replace the Museum with a loading-only page.");
assert.ok(!/if\s*\(accessions\.length\s*===\s*0\)\s*\{?\s*return/.test(collection), "An empty collection must not replace the Museum shell.");

console.log("Museum destination PASS: Museum remains intact and SHOP exposes truthful made-to-order states without pretending a concept is already orderable or fabricated.");
