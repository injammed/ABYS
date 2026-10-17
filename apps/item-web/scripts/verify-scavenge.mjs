import assert from 'node:assert/strict';
import {freshScavenge,takeGear,useGear,dropGear,restoreScavenge,LOOT,canEquip} from '../lib/scavenge.ts';
import {CHARACTERS} from '../lib/character-profile.ts';
import {signatureFor,restoreSignatureLevels,upgradeSignature,upgradeCost} from '../lib/signature-weapons.ts';
const at={x:3,y:.18,z:20},s=freshScavenge();assert.equal(s.hands[0],null);
assert.ok(takeGear(s,0,'ak',0,'knight',at));for(let i=0;i<7;i++)assert.ok(useGear(s,0));
assert.ok(takeGear(s,1,'sword',0,'knight',at));assert.equal(s.drops[0].uses,53);assert.equal(s.drops[0].kind,'ak');
const dropped=s.drops[0];assert.ok(takeGear(s,dropped.id,'ak',0,'knight',at));assert.equal(s.hands[0].uses,53);assert.equal(s.drops.length,1);assert.equal(s.drops[0].kind,'sword');assert.equal(takeGear(s,dropped.id,'ak',0,'knight',at),false);
assert.ok(dropGear(s,0,at));assert.equal(s.hands[0],null);assert.equal(takeGear(s,0,'ak',0,'knight',at),false);assert.deepEqual(restoreScavenge(JSON.parse(JSON.stringify(s))),s);
for(const c of CHARACTERS){const fresh=freshScavenge(),before=JSON.stringify(fresh);assert.equal(canEquip('staff',c.classId),c.classId==='witch');assert.equal(takeGear(fresh,200,'staff',0,c.classId,at),c.classId==='witch');if(c.classId!=='witch')assert.equal(JSON.stringify(fresh),before);}
const worn=freshScavenge();takeGear(worn,3,'armor',0,'knight',at);worn.armor[0]=37;takeGear(worn,10,'armor',0,'knight',at);assert.equal(worn.drops[0].uses,37);assert.equal(worn.armor[0],100);
const empty=freshScavenge();takeGear(empty,0,'pistol',0,'knight',at);for(let i=0;i<24;i++)useGear(empty,0);assert.equal(useGear(empty,0),false);dropGear(empty,0,at);takeGear(empty,empty.drops[0].id,'pistol',0,'knight',at);assert.equal(useGear(empty,0),false);
assert.equal(LOOT.filter(i=>i.kind==='staff').length,2);assert.equal(LOOT.length,202);
assert.equal(new Set(CHARACTERS.map(c=>signatureFor(c).name)).size,12);
for(const c of CHARACTERS){const levels=restoreSignatureLevels(null),wallet={cash:100000},base=signatureFor(c,1);for(let i=1;i<10;i++)assert.ok(upgradeSignature(levels,c.id,wallet));const max=signatureFor(c,levels[c.id]);assert.ok(max.damage>base.damage&&max.range>base.range&&max.delay<base.delay);assert.equal(upgradeCost(levels,c.id),0);assert.equal(upgradeSignature(levels,c.id,wallet),false);assert.equal(restoreSignatureLevels(JSON.parse(JSON.stringify(levels)))[c.id],10);assert.equal(levels[CHARACTERS.find(other=>other.id!==c.id).id],1);}
const poor=restoreSignatureLevels(null);assert.equal(upgradeSignature(poor,CHARACTERS[0].id,{cash:0}),false);assert.equal(poor[CHARACTERS[0].id],1);
console.log('Gear PASS: class restriction, swap/drop/recover preserves wear, no duplicates/refills, armor drops, reload, 12 bound signatures, independent ten-tier progression and affordability.');
