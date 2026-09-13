import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, collection, summit, shop, compatibility, home, donation] = await Promise.all([
  "app/aetimm/page.tsx", "components/MuseumCollection.tsx", "components/MuseumSummit.tsx", "app/shop/page.tsx", "components/LegacyShopLink.tsx", "app/page.tsx", "components/DonationWelcome.tsx",
].map(file => readFile(file, "utf8")));
assert.match(page, /data-destination-contract="museum-arrival-always-v1"/);
assert.match(page, /<CurrencyMuseum \/>/);
assert.match(page, /data-currency-contract="global-forecast-library-v1"/);
assert.match(collection, /id="collection"/);
assert.match(collection, /data-empty-museum-is-destination="true"/);
assert.match(collection, /The room is already here\. The register is being read\./);
assert.match(collection, /The hall is empty\./);
assert.match(collection, /No Artifact has crossed the permanent accession threshold yet\./);
assert.match(summit, /THE PEAK IS UNCLAIMED/);
assert.doesNotMatch(page, /ArtifactFeed|buy\.stripe\.com/);
assert.match(page, /<PrimaryNavigation mode="museum" \/>/);
assert.match(shop, /data-library-contract="literature-shelf-v2"/);
assert.match(shop, /data-aetimm-item="0001"[\s\S]*data-commerce-state="public"/);
assert.match(shop, /FREE <small>READ<\/small>/);
assert.match(shop, /Read final draft/);
assert.match(shop, /https:\/\/donate\.stripe\.com\/9B600k6Djbx45V37Pj2Ry01/);
assert.match(shop, /Donate any amount/);
assert.doesNotMatch(shop, /Buy digital copy|\$10 <small>USD<\/small>|14A3cw8LrcB8abjb1v2Ry00/);
assert.match(shop, /Independent concept\. Not legal tender\. No government endorsement\./);
assert.match(shop, /AI CONCEPT ARTWORK · FINAL PAPER PUBLISHED BELOW/);
assert.match(shop, /data-north-star-product="one-of-one-hydrogen-electric-sports-car-v1"[\s\S]*data-commerce-state="concept"[\s\S]*Not available to order/);
assert.match(home, /<DonationWelcome \/>/);
assert.match(donation, /DONATE ANY AMOUNT/);
assert.match(donation, /Enter AETIMM without donating/);
assert.match(compatibility, /window\.location\.hash === "#shop"\) router\.replace\("\/shop\/"\)/);
assert.doesNotMatch(page, /router\.(push|replace)\(|redirect\(/);
assert.doesNotMatch(collection, /if\s*\(loading\)\s*\{?\s*return|if\s*\(accessions\.length\s*===\s*0\)\s*\{?\s*return/);
console.log("Destination PASS: Museum remains intact; ITEM 0001 is public; donation is independent of access and appears first on root arrival.");
