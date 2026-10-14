import assert from 'node:assert/strict';
import {MatterRange} from '../lib/matter-range.ts';
import {MATERIALS,ATTUM_LEVELS} from '../lib/matter-materials.ts';
const records=[];
for(const size of ATTUM_LEVELS){
 const r=new MatterRange(size),s=r.physics;
 assert.equal(r.targets.length,8);assert.ok(s.count<=s.capacity);assert.ok(r.actualSize>=size);assert.equal(s.diameter,r.actualSize);
 assert.ok(r.targets.every(t=>t.end>t.start));assert.equal(r.targets.at(-1).end,s.count);
 const composite=r.targets.find(t=>t.kind==='composite'),ids=r.particleMaterial.slice(composite.start,composite.end);
 assert.ok(ids.includes('bone')&&ids.includes('flesh'));
 assert.ok(s.bonds.filter(b=>r.targets[r.owner[b.a]].kind==='brick').some(b=>b.toughness<MATERIALS.brick.toughness));
 const snapshot=Array.from(s.position.slice(0,s.count*3));r.step();assert.deepEqual(Array.from(s.position.slice(0,s.count*3)),snapshot);
 for(const t of r.targets)r.impact(t.start,{x:.2,y:.05,z:-1});
 let elapsed=0;for(let n=0;n<40;n++){const start=performance.now();r.step();elapsed+=performance.now()-start;}
 assert.ok(s.position.slice(0,s.count*3).every(Number.isFinite));assert.equal(s.count,r.targets.at(-1).end);
 assert.ok(s.broken>0);r.reset();assert.equal(s.broken,0);assert.deepEqual(Array.from(s.position.slice(0,s.count*3)),snapshot);
 records.push({requested:size,actual:r.actualSize,particles:s.count,meanStepMs:elapsed/40});
}
// Identical local impacts accumulate damage; fictional alloy resists more than glass.
const r=new MatterRange(),alloy=r.targets.find(t=>t.kind==='alloy'),glass=r.targets.find(t=>t.kind==='glass');
r.impact(alloy.start,{x:0,y:0,z:-1});assert.equal(r.physics.bonds.filter(b=>r.owner[b.a]===r.targets.indexOf(alloy)&&!b.active).length,0);
for(let n=0;n<8;n++)r.impact(alloy.start,{x:0,y:0,z:-1});assert.ok(r.physics.bonds.some(b=>r.owner[b.a]===r.targets.indexOf(alloy)&&!b.active));
r.impact(glass.start,{x:0,y:0,z:-1});assert.ok(r.physics.bonds.some(b=>r.owner[b.a]===r.targets.indexOf(glass)&&!b.active));
assert.throws(()=>new MatterRange(.001));
console.log('PASS materials: complete assemblies, supported sizes, budget fallback, flesh/bone composite, weak mortar, deterministic reset, persistent finite debris, accumulated alloy damage.');
console.log(JSON.stringify({environment:'Node CPU only, not browser/GPU',samples:records}));
