import assert from 'node:assert/strict';
import {CHARACTERS} from '../lib/character-profile.ts';
import {newSquad,restoreSquad,damageSquad,succeedSquad,squadProfile} from '../lib/squad.ts';
const picks=[CHARACTERS[7],CHARACTERS[2],CHARACTERS[10]],s=newSquad(picks);assert.equal(squadProfile(s).id,picks[0].id);assert.throws(()=>newSquad([picks[0],picks[0],picks[1]]));assert.throws(()=>newSquad(picks.slice(0,2)));
damageSquad(s,1,35);damageSquad(s,0,100);assert.ok(succeedSquad(s));assert.equal(s.active,1);assert.equal(s.members[1].health,65);assert.equal(s.members[0].health,0);
const restored=restoreSquad(JSON.parse(JSON.stringify(s)),picks[0]);assert.deepEqual(restored,s);damageSquad(restored,2,100);assert.equal(restored.over,false);damageSquad(restored,1,100);assert.equal(succeedSquad(restored),false);assert.equal(restored.over,true);const ended=restoreSquad(JSON.parse(JSON.stringify(restored)),picks[0]);assert.equal(ended.over,true);assert.ok(ended.members.every(m=>m.health===0));assert.ok(newSquad(picks).members.every(m=>m.health===100));
for(let first=0;first<3;first++){const order=newSquad(picks);damageSquad(order,first,100);succeedSquad(order);assert.equal(order.members.filter(m=>m.health>0).length,2);assert.ok(order.members[order.active].health>0);}
console.log('Squad PASS: exactly three unique picks; first controls; companion health persists; ordered takeover; sidekick-first deaths; three deaths end run; reload preserves elimination; only a new run resets lives.');
