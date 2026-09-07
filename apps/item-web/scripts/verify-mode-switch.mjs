import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [navigation, header, vote, root, museum, shop, about, css, constitution] = await Promise.all([
  "components/PrimaryNavigation.tsx", "components/SiteHeader.tsx", "components/VoteShortcut.tsx",
  "app/page.tsx", "app/aetimm/page.tsx", "app/shop/page.tsx", "app/about/page.tsx", "app/gallery.css", "INTERFACE.md",
].map(file => readFile(file, "utf8")));

assert.match(navigation, /data-navigation-contract="upload-scroll-vote-shop-v2"/);
assert.match(navigation, /<SlopDrop\s*\/>[\s\S]*SCROLL[\s\S]*<VoteShortcut[\s\S]*SHOP/);
assert.match(navigation, /href="\/#field"/);
assert.match(navigation, /href="\/shop\/"/);
assert.match(vote, /href="\/#vote"/);
assert.match(vote, /\.focus\(\{ preventScroll: true \}\)/);
assert.doesNotMatch(vote, /saveVote|\.click\(/, "The shortcut focuses a ballot; it must never cast a vote.");
assert.match(header, /className="primary-mode-switch"/);
assert.match(header, /href="\/#field"/);
assert.match(header, /href="\/aetimm\/#museum"/);
assert.match(header, /<AccountGate\s*\/>/);
assert.match(header, /<ThemeSettings\s*\/>/);
assert.match(header, /href="\/about\/"/);
assert.match(css, /\.primary-action-rail\s*\{[^}]*repeat\(4, minmax\(0, 1fr\)\)/);
assert.match(css, /\.primary-mode-switch\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
for (const [source, mode] of [[root, "feed"], [museum, "museum"], [shop, "shop"]]) assert.ok(source.includes(`<PrimaryNavigation mode="${mode}" />`));
assert.match(about, /<SiteHeader\s*\/>[\s\S]*<PrimaryNavigation\s*\/>/);
assert.match(constitution, /## September 2026: Explicit User-Directed Gallery Revision/);
console.log("Navigation PASS: four working actions, equal Trough/Museum choices, accounts and appearance preserved; Vote never submits a judgment.");
