import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, collection, summit, shop, compatibility] = await Promise.all([
  "app/aetimm/page.tsx", "components/MuseumCollection.tsx", "components/MuseumSummit.tsx", "app/shop/page.tsx", "components/LegacyShopLink.tsx",
].map(file => readFile(file, "utf8")));
assert.match(page, /data-destination-contract="museum-arrival-always-v1"/);
assert.match(page, /<MuseumSummit \/>[\s\S]*<MuseumCollection \/>/);
assert.match(page, /href="#collection"/);
assert.match(collection, /id="collection"/);
assert.match(collection, /data-empty-museum-is-destination="true"/);
assert.match(collection, /The room is already here\. The register is being read\./);
assert.match(collection, /The hall is empty\./);
assert.match(collection, /No Artifact has crossed the permanent accession threshold yet\./);
assert.match(summit, /THE PEAK IS UNCLAIMED/);
assert.doesNotMatch(page, /ArtifactFeed|buy\.stripe\.com/);
assert.match(page, /href="\/shop\/"/);
assert.match(shop, /data-library-contract="literature-shelf-v1"/);
assert.match(shop, /data-aetimm-item="0001"[\s\S]*data-commerce-state="orderable"/);
assert.match(shop, /https:\/\/buy\.stripe\.com\/14A3cw8LrcB8abjb1v2Ry00/);
assert.match(shop, /\$10 <small>USD<\/small>/);
assert.match(shop, /Buy digital copy/);
assert.match(shop, /Independent concept\. Not legal tender\. No government endorsement\./);
assert.match(shop, /AI CONCEPT ARTWORK · DIGITAL PAPER SOLD BELOW/);
assert.match(shop, /data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1"[\s\S]*data-commerce-state="concept"[\s\S]*Not available to order/);
assert.match(compatibility, /window\.location\.hash === "#shop"\) router\.replace\("\/shop\/"\)/);
assert.doesNotMatch(page, /router\.(push|replace)\(|redirect\(/);
assert.doesNotMatch(collection, /if\s*\(loading\)\s*\{?\s*return|if\s*\(accessions\.length\s*===\s*0\)\s*\{?\s*return/);
console.log("Destination PASS: Museum survives empty/loading states; dedicated Shop preserves the existing paper, price, checkout and concept boundaries; legacy links continue to work.");
