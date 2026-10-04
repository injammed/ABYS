import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const [home, feed, constitution, arrival, layout, submission, library, game] = await Promise.all([
  'app/page.tsx', 'app/slop-trough/page.tsx', 'INTERFACE.md', 'components/LibraryArrival.tsx', 'app/layout.tsx', 'components/SubmissionLandingBridge.tsx', 'app/library/page.tsx', 'components/SurvivalGame.tsx',
].map(p => readFile(p, 'utf8')));
assert.match(home, /data-interface-contract="aetimm-survival-root-v1"/);
assert.match(home, /<SurvivalGame\s*\/>/);
assert.doesNotMatch(home, /<SiteHeader|<PrimaryNavigation/);
assert.match(library, /<SiteHeader mode="library"/);
assert.match(library, /<PrimaryNavigation\s*\/>/);
assert.doesNotMatch(home, /<ArtifactFeed|<DonationWelcome/);
assert.match(home, /<LibraryArrival\s*\/>/);
assert.match(library, /CONCEPT ARTWORK/);
assert.match(constitution, /16 September 2026: Owner-directed Library of Things revision/);
for (const route of ['/shop/', '/slop-trough/', '/aetimm/', '/apyoc/', '/literature/item-0001/']) {
  assert.ok(library.includes(route), `Library must retain ${route}`);
  await access(`app${route}page.tsx`);
}
assert.match(feed, /<section id="field"[\s\S]*<BinarySwipeVoting\s*\/>[\s\S]*<ArtifactFeed\s*\/>/);
assert.match(feed, /<PrimaryNavigation mode="feed"/);
assert.doesNotMatch(feed, /<DonationWelcome|<footer|<aside/);
assert.match(arrival, /"#field", "#vote"/);
assert.match(arrival, /target.search = old.search/);
assert.match(arrival, /target.hash = old.hash/);
assert.match(layout, /<SubmissionLandingBridge\s*\/>/);
assert.match(submission, /\/slop-trough\//);
assert.match(submission, /target.searchParams.set\("published", artifactId\)/);
assert.match(submission, /target.hash = "field"/);
console.log('Library root PASS: real destinations, dedicated uninterrupted Trough, legacy bookmarks and publication routing preserved.');

for(const route of ["/library/","/slop-trough/#field","/slop-trough/#vote","/aetimm/","/shop/","/apyoc/","/scouts/","/literature/item-0001/","/simulator/","/about/"])assert.ok(game.includes(route),`Terminal must retain ${route}`);
await import("./verify-survival.mjs");
