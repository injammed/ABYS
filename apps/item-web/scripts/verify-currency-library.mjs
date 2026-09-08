import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const source = await readFile('lib/currency-library.ts','utf8');
const js = stripTypeScriptTypes(source);
const {items,years,plates,sources,cropFor,imageFor,frameAspect} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
assert.equal(new Set(items.map(x=>x.id)).size,items.length,'Each ITEM must have a unique addressable identity');
assert.deepEqual(years.map(x=>x[0]),Array.from({length:14},(_,i)=>2027+i),'Every year 2027–2040 must have all three scenario paths');
for(const year of years) assert.ok(year.length===5&&year.every(x=>String(x).length>0));
for(const item of items) assert.ok(item.gate&&item.materials&&item.country&&item.denomination,'Every exhibit must expose its manufacturing gate and provenance fields');
for(const plate of plates) assert.ok((await stat(`public/currency/${plate}.jpg`)).size>0);
assert.equal(sources.length,3);
assert.equal(items.length,40,'Forty selected studies must remain available');
for(const item of items) {
 const [x,y,w,h]=cropFor(item);
 assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1&&y+h<=1,'Exhibit crops stay within the original image');
 assert.ok(frameAspect(item)>0);
 assert.ok((await stat(`public/currency/${imageFor(item)}.jpg`)).size>0);
}

const [root,shop,museum,ui,walk,brief]=await Promise.all(['app/page.tsx','app/shop/page.tsx','app/aetimm/page.tsx','components/CurrencyMuseum.tsx','components/CurrencyWalk.tsx','public/currency/evaluation-brief.txt'].map(x=>readFile(x,'utf8')));
assert.doesNotMatch(root,/CurrencyMuseum/,'Currency library belongs to SHOP; root remains the live Trough');
assert.match(root,/<ArtifactFeed\s*\/>/);
assert.match(shop,/<CurrencyMuseum\s*\/>/);
assert.match(shop,/data-commerce-state="orderable"/,'Existing digital edition must remain available');
assert.match(museum,/<CurrencyMuseum\s*\/>/);
assert.doesNotMatch(museum,/<MuseumSummit|<MuseumCollection/,'Museum exhibition is exclusively currency');
assert.match(ui,/not an issued value or selling price/);
assert.match(ui,/Stalled \/ no adoption/);
assert.match(ui,/No adoption probabilities are assigned without evidence/);
assert.match(walk,/renderer\.dispose\(\)/);
assert.match(walk,/cancelAnimationFrame/);
assert.match(walk,/3D is unavailable on this device/);
assert.match(brief,/has not been sent/);
console.log('Currency library PASS: 14 complete scenario years, unique records, available provenance plates, research boundaries, Shop placement and preserved root/checkout.');
