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
  ["plain-language foundry", /data-legibility-contract="four-human-verbs-v1"[\s\S]*AI art becomes a physical thing\./, page],
  ["honest product availability", /No fake inventory\.[\s\S]*successfully fabricated/, page],
  ["sports-car North Star remains an honest concept", /data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1"[\s\S]*CONCEPT · NOT YET ORDERABLE/, page],
  ["two-goal product constitution", /data-product-constitution="four-verbs-to-one-of-one-machine-v1"[\s\S]*UPLOAD · SCROLL · VOTE · SHOP[\s\S]*ONE-OF-ONE MACHINE-MADE SPORTS CARS PURCHASABLE ON AETIMM/, page],
  ["material-abundance horizon", /WE ARE DESIGNING THE MATERIAL ABUNDANCE OF THE FUTURE\./, page],
  ["four verbs converge on one physical machine", /UPLOAD[\s\S]*SCROLL[\s\S]*VOTE[\s\S]*SHOP[\s\S]*ONE MACHINE/, page],
  ["vehicle manufacture chain", /DESIGN SYNTHESIS[\s\S]*DIGITAL TWIN[\s\S]*SAFETY \+ LEGAL[\s\S]*MACHINE FABRICATION[\s\S]*DELIVERY \+ PROVENANCE/, page],
  ["certified human accountability remains explicit", /Road legality and safety remain accountable to humans and certified authorities\./, page],
  ["surgical light and expressive dark modes", /html:not\(\[data-aetimm-theme="light"\]\)[\s\S]*html\[data-aetimm-theme="light"\]/, pageStyles],
  ["demand-born Library contract", /data-library-contract="demand-born-object-v1"/, page],
  ["physical survival ambition", /data-library-ambition="machine-creations-survive-reality-v1"[\s\S]*Machine creators learning to witness their creations survive in reality\./, page],
  ["one-of-one North Star", /NORTH STAR · FROM THE FIRST PRINT TO ONE-OF-ONE MACHINES/, page],
  ["creator-customer symbiosis", /Human–AI symbiote creators invent in the abstract[\s\S]*Customers choose what deserves to become real[\s\S]*return a share of their value to the creators/, page],
  ["Artifact-to-product sequence", /SLOP[\s\S]*CONFIGURATION[\s\S]*QUOTE[\s\S]*PURCHASE[\s\S]*FABRICATION[\s\S]*NEEDLE[\s\S]*PRODUCT/, page],
  ["empty chamber is spatially rendered", /\.emptyChamber[\s\S]*min-height:/, collectionStyles],
  ["Summit has vacant state inside destination", /THE PEAK IS UNCLAIMED/, summit],
]) {
  assert.ok(pattern.test(source), `Museum destination contract failed: missing ${label}`);
}

assert.ok(!/router\.(push|replace)\(/.test(page), "Museum route must not redirect based on collection state.");
assert.ok(!/redirect\(/.test(page), "Museum route must not server-redirect based on collection state.");
assert.ok(!/if\s*\(loading\)\s*\{?\s*return/.test(collection), "Loading must not replace the Museum with a loading-only page.");
assert.ok(!/if\s*\(accessions\.length\s*===\s*0\)\s*\{?\s*return/.test(collection), "An empty collection must not replace the Museum shell.");

console.log("Museum destination PASS: clicking Museum always lands in the ceremonial institution; the live Summit and permanent collection coexist, and loading, failure, zero-vote, and zero-accession states fill the destination without replacing or redirecting it.");
