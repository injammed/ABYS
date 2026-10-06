import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshCampaign,advanceCampaign,missionAction,eliminate,restoreCampaign,POPULATION,MISSIONS,civilianLossFor} from '../lib/capital-campaign.ts';
import {installFootprints,roofAt,geo,capitalBounds,safe} from '../lib/capital-map.ts';
import {canStand,canHover} from '../lib/survival.ts';
const conserved=c=>assert.equal(c.humans+c.zombies+c.saved+c.dead+c.eliminated,POPULATION);
const fresh=freshCampaign();assert.equal(fresh.humans,5_000_000);assert.equal(fresh.zombies,1);conserved(fresh);
const fast=freshCampaign();eliminate(fast);for(let i=0;i<500;i++)advanceCampaign(fast,1);assert.equal(fast.zombies,0);assert.equal(fast.humans,5_000_000);assert.ok(fast.won);conserved(fast);
const outbreak=freshCampaign();for(let i=0;i<500;i++){advanceCampaign(outbreak,1);conserved(outbreak);}assert.ok(outbreak.zombies>500_000);assert.ok(outbreak.humans>=0);
const c=freshCampaign();for(let i=0;i<300;i++)advanceCampaign(c,1);const initial=c.zombies;
assert.match(missionAction(c,'aegis',2,true),/First/);assert.equal(c.quest,0);
missionAction(c,'hospital',0);assert.equal(c.saved,5000);const once=c.saved;missionAction(c,'hospital',0);assert.equal(c.saved,once,'No duplicate convoy before cooldown');
missionAction(c,'relay',0);const infected=c.zombies;for(let i=0;i<35;i++)advanceCampaign(c,1);assert.equal(c.zombies,infected,'Quarantine stops conversions');
assert.match(missionAction(c,'command',1),/both/);missionAction(c,'command',2);missionAction(c,'evac',2);assert.equal(c.saved,10000);
const nuclear={...c};const civilianLoss=Math.ceil(nuclear.humans*.25);missionAction(nuclear,'aegis',2,true);assert.ok(nuclear.launched&&nuclear.won);assert.equal(nuclear.dead,civilianLoss);assert.equal(nuclear.saved,10000);conserved(nuclear);const dead=nuclear.dead;missionAction(nuclear,'aegis',2,true);assert.equal(nuclear.dead,dead);
for(const strategy of ['hypersonic','swarm']){
 const branch={...c};const expected=civilianLossFor(branch,strategy);missionAction(branch,'aegis',2,strategy);
 assert.equal(branch.strategy,strategy);assert.equal(branch.dead,expected);assert.equal(branch.saved,10000);conserved(branch);
 const committed={...branch};assert.match(missionAction(branch,'aegis',2,'nuclear'),/already committed/);assert.deepEqual(branch,committed);
 for(let i=0;i<2000;i++){advanceCampaign(branch,1);conserved(branch);}assert.ok(branch.won);assert.deepEqual(restoreCampaign(branch),branch);
}
const legacy={...nuclear};delete legacy.strategy;assert.deepEqual(restoreCampaign(legacy),nuclear);
const invalid={...c};assert.match(missionAction(invalid,'aegis',2,'invalid'),/Unknown/);assert.deepEqual(invalid,c);
assert.deepEqual(restoreCampaign({...c,strategy:'invalid'}),freshCampaign());
missionAction(c,'aegis',2);for(let i=0;i<2000;i++){advanceCampaign(c,1);conserved(c);}assert.ok(c.won);assert.equal(c.dead,0);assert.equal(c.zombies,0);assert.ok(c.eliminated>=initial);
assert.deepEqual(restoreCampaign(c),c);for(const patch of [{humans:-1},{saved:NaN},{quest:7},{dead:1},{won:false},{clock:Infinity},{converted:0},{carry:-1},{lastEvac:c.clock+1}])assert.deepEqual(restoreCampaign({...c,...patch}),freshCampaign());
const rows=JSON.parse(readFileSync(new URL('../public/maps/washington/buildings.json',import.meta.url)));assert.ok(rows.length>20000);installFootprints(rows);for(const m of MISSIONS)assert.ok(canStand(m.x,m.z),'Every mission is reachable on foot');assert.ok(capitalBounds(...Object.values(geo(-77.01,38.88))));assert.ok(safe(0,3));assert.equal(safe(100,0),false);
installFootprints([[20,[[200,200],[220,200],[220,220],[200,220]]]]);assert.equal(roofAt(210,210),20);assert.equal(canStand(210,210),false);assert.equal(canHover(210,210,40),true);assert.equal(canHover(210,210,2),false);installFootprints([]);
console.log('Capital PASS: outbreak growth, conservation, early eradication, quarantine, rescue cooldown, gated quests, all four endings, legacy migration and committed decisions, recovery and geographic collision.');

const {eliminateDemon,DEMON_POPULATION}=await import('../lib/capital-campaign.ts');
const trinity=freshCampaign();for(let i=0;i<300;i++)advanceCampaign(trinity,1);
missionAction(trinity,'hospital',0);missionAction(trinity,'relay',0);missionAction(trinity,'command',2);missionAction(trinity,'evac',2);
assert.match(missionAction(trinity,'aegis',2,'trinity'),/25,000/);assert.equal(trinity.rift,false);
for(let i=0;i<3;i++){for(let j=0;j<30;j++)advanceCampaign(trinity,1);missionAction(trinity,'hospital',2);}
assert.equal(trinity.saved,25000);const zBefore=trinity.zombies;missionAction(trinity,'aegis',2,'trinity');
assert.equal(trinity.zombies,zBefore-Math.floor(zBefore*.8));assert.equal(trinity.demons,DEMON_POPULATION);assert.equal(trinity.won,false);conserved(trinity);
assert.equal(eliminateDemon(trinity,'goblin'),false,'No kills before rupture');assert.match(missionAction(trinity,'riftseal',2),/requirements/);
for(let j=0;j<9;j++)advanceCampaign(trinity,1);const remaining=trinity.zombies;for(let j=0;j<30;j++)advanceCampaign(trinity,1);assert.equal(trinity.zombies,remaining,'Possessed zombies do not silently clear');
for(let j=0;j<8;j++)assert.equal(eliminateDemon(trinity,'goblin'),true);eliminateDemon(trinity,'titan');for(let j=0;j<3;j++)eliminateDemon(trinity,'warlock');
assert.equal(trinity.demons+trinity.demonsEliminated,DEMON_POPULATION);assert.deepEqual(restoreCampaign(trinity),trinity);
assert.deepEqual(restoreCampaign({...trinity,demons:0}),freshCampaign());assert.deepEqual(restoreCampaign({...trinity,rift:false}),freshCampaign());
const legacyFresh=freshCampaign();for(const key of ['rift','riftClock','demons','demonsEliminated','goblinKills','titanKills','warlockKills'])delete legacyFresh[key];assert.deepEqual(restoreCampaign(legacyFresh),freshCampaign());
missionAction(trinity,'riftseal',2);assert.ok(trinity.won);assert.equal(trinity.demons,0);assert.equal(trinity.zombies,0);assert.equal(trinity.saved,25000);assert.equal(trinity.quest,6);conserved(trinity);assert.deepEqual(restoreCampaign(trinity),trinity);
const final={...trinity};missionAction(trinity,'riftseal',2);assert.deepEqual(trinity,final,'Seal cannot duplicate ledger effects');
console.log('Trinity PASS: rescue gating, coordinated release, finite possession/demon ledgers, seal requirements, completion and legacy recovery.');
