import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const [home, feed, museum, navigation, header] = await Promise.all([
  'app/page.tsx', 'app/slop-trough/page.tsx', 'app/aetimm/page.tsx', 'components/PrimaryNavigation.tsx', 'components/SiteHeader.tsx',
].map(p => readFile(p, 'utf8')));
assert.doesNotMatch(home, /<ArtifactFeed/);
assert.match(feed, /<ArtifactFeed\s*\/>/);
assert.match(feed, /<PrimaryNavigation mode="feed"/);
assert.match(museum, /data-interface-contract="museum-spatial-mode-v1"/);
assert.match(museum, /<PrimaryNavigation mode="museum"/);
assert.doesNotMatch(museum, /ArtifactFeed|GenerationWitness/);
assert.match(navigation, /href="\/slop-trough\/#field"/);
assert.match(header, /href="\/aetimm\/#museum"/);
assert.match(header, />Library<\/Link>/);
assert.match(header, />Trough<\/Link>/);
console.log('Library rooms PASS: library entrance, Trough feed and spatial Museum remain separate and connected.');
