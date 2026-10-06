import assert from 'node:assert/strict';
import {freshPlayer,canStand,advance,consume,collect,talk,restorePlayer} from '../lib/survival.ts';
for(let z=3;z<22;z+=.1)assert.ok(canStand(0,z),'Walk out of cathedral through doorway');
assert.equal(canStand(3,10),false);assert.equal(canStand(7,0),true);assert.equal(canStand(25,28),false);assert.equal(canStand(0,149),true);
const p=freshPlayer();assert.ok(canStand(p.x,p.z));advance(p,1,false);assert.equal(p.water,100,'Safe zone does not drain water');
p.z=20;for(let n=0;n<100;n++)advance(p,.05,true);assert.ok(p.water<100&&p.stamina<100);
p.water=50;const bottles=p.bottles;consume(p,'water');assert.equal(p.bottles,bottles-1);assert.equal(p.water,90);
p.x=-8;p.z=23;assert.ok(collect(p,'water-1'));const got=p.bottles;assert.equal(collect(p,'water-1'),false);assert.equal(p.bottles,got,'No duplicate loot');assert.equal(collect(p,'med-2'),false,'Cannot collect remotely');
const q=freshPlayer();talk(q,'keeper','Please help me find food');assert.equal(q.bottles,3);talk(q,'keeper','help');assert.equal(q.bottles,3,'Keeper gift is once only');
talk(q,'visitor','I want to give water');assert.equal(q.bottles,2);assert.equal(q.rations,5);talk(q,'visitor','give water');assert.equal(q.bottles,2,'Trade is once only');
assert.match(talk(q,'keeper','invent a helicopter'),/do not know/);
assert.deepEqual(restorePlayer(JSON.stringify({version:1,player:q})),q);
for(const bad of [null,'{',JSON.stringify({version:2,player:q}),JSON.stringify({version:1,player:{...q,x:900000}}),JSON.stringify({version:1,player:{...q,health:0}}),JSON.stringify({version:1,player:{...q,bottles:-1}})])assert.deepEqual(restorePlayer(bad),freshPlayer());
console.log('Survival PASS: doorway/collisions, resource drain, bounded loot, dialogue mutations and validated save recovery.');
const {armPlayer,spendRound,reloadWeapon}=await import('../lib/survival.ts');
const armed=freshPlayer();assert.ok(armPlayer(armed));assert.equal(armed.ammo,30);assert.equal(armed.reserve,90);assert.equal(armPlayer(armed),false);
assert.equal(spendRound(armed),false,'Cathedral blocks firing');armed.z=34;assert.ok(spendRound(armed));assert.equal(armed.ammo,29);assert.ok(reloadWeapon(armed));assert.equal(armed.ammo,30);assert.equal(armed.reserve,89);assert.equal(reloadWeapon(armed),false);
armed.ammo=0;assert.equal(spendRound(armed),false);armed.defeated=[0,2];assert.deepEqual(restorePlayer(JSON.stringify({version:1,player:armed})),armed);
const legacy=freshPlayer();delete legacy.armed;delete legacy.ammo;delete legacy.reserve;delete legacy.defeated;assert.deepEqual(restorePlayer(JSON.stringify({version:1,player:legacy})),freshPlayer());
for(const patch of [{ammo:31},{reserve:-1},{defeated:[0,0]},{defeated:[10]},{armed:false,ammo:30}])assert.deepEqual(restorePlayer(JSON.stringify({version:1,player:{...armed,...patch}})),freshPlayer());
console.log('Combat PASS: one-time rifle gift, ammunition, safe zone, reload, defeated IDs and legacy saves.');

const {HOSTILES,ENEMY_STATS,F49_SPAWN}=await import('../lib/hostiles.ts');
const {canHover,landingSpot}=await import('../lib/survival.ts');
assert.equal(HOSTILES.length,10);assert.equal(HOSTILES.filter(e=>e.kind==='alien').length,3);
assert.ok(canHover(F49_SPAWN.x,F49_SPAWN.z));assert.equal(canHover(0,10),false);assert.equal(canHover(25,28),false);assert.ok(landingSpot(8,19));
const expanded=freshPlayer();expanded.defeated=[7,8,9];assert.deepEqual(restorePlayer(JSON.stringify({version:1,player:expanded})),expanded);
assert.ok(ENEMY_STATS.robot.range>ENEMY_STATS.infected.range);assert.ok(ENEMY_STATS.alien.speed>ENEMY_STATS.infected.speed);
console.log('Hostiles PASS: stable IDs, added aliens, legacy save continuity and bounded flight/landing.');

const {STAR_STAFF,validStarTarget,inStarImpact}=await import('../lib/star-staff.ts');
assert.equal(validStarTarget({x:0,y:1.5,z:35},{x:0,y:0,z:60}),true);
assert.equal(validStarTarget({x:0,y:1.5,z:35},{x:0,y:0,z:20}),false,'Blast must not overlap refuge');
assert.equal(validStarTarget({x:0,y:1.5,z:35},{x:0,y:0,z:300}),false,'Range bounded');
assert.equal(validStarTarget({x:0,y:1.5,z:35},{x:0,y:0,z:60},[{x:1,y:0,z:61}]),false,'Nearby survivors protected');
assert.equal(validStarTarget({x:0,y:1.5,z:35},{x:NaN,y:0,z:60}),false);
assert.equal(inStarImpact({x:0,y:0,z:60},{x:0,y:1,z:61}),true);
assert.equal(inStarImpact({x:0,y:0,z:60},{x:0,y:30,z:60}),false,'Rooftop impact does not reach distant ground');
assert.equal(STAR_STAFF.damage>=5,true);console.log('Starfall PASS: bounded targeting, refuge/survivor exclusion and 3D impact radius.');

const {buildStarStaff}=await import('../lib/star-staff-world.ts');
const {Vector3}=await import('three');const visual=buildStarStaff();const impactPoint=new Vector3(0,0,60);
visual.update(0,impactPoint);assert.equal(visual.strike.visible,true);assert.equal(visual.strike.position.y,90);assert.equal(visual.impact.visible,false);
visual.update(1.5,impactPoint);assert.equal(visual.strike.visible,false);assert.equal(visual.impact.visible,true);assert.ok(visual.impact.position.distanceTo(impactPoint)<.2);
visual.update(2.2,impactPoint);assert.equal(visual.impact.visible,false);visual.reset();assert.equal(visual.strike.visible,false);visual.dispose();
console.log('Starfall visual PASS: falling star, timed impact ring and reset.');

const {demonModel,DEMON_STATS}=await import('../lib/demon-models.ts');const {Box3}=await import('three');
for(const kind of ['goblin','titan','warlock']){const model=demonModel(kind);const size=new Box3().setFromObject(model).getSize(new Vector3());assert.ok(Math.abs(size.y-DEMON_STATS[kind].height)<.001);assert.equal(model.userData.legs.length,2);let count=0;model.traverse(o=>{if(o.isMesh)count++;});assert.ok(count<15,'Rigid parts batch into bounded draw calls');}
const {characterModel}=await import('../lib/character-models.ts');for(const role of ['player','mara','iri','refugee','infected']){const model=characterModel(0x555555,role);assert.equal(model.userData.legs.length,2);assert.ok(new Box3().setFromObject(model).getSize(new Vector3()).y>1.5);}
const {canIgnite,demonContact}=await import('../lib/demon-rules.ts');assert.equal(canIgnite(0,6),false);assert.equal(canIgnite(0,40),true);assert.equal(canIgnite(0,40,[{x:0,z:42}]),false);assert.equal(demonContact('titan',10,20),true);assert.equal(demonContact('goblin',1,10),false);
const {buildRift}=await import('../lib/rift-world.ts');const rift=buildRift();assert.equal(rift.enemies.length,23);assert.equal(rift.fires.length,24);rift.update(.1,9,true);assert.equal(rift.root.visible,true);for(let i=0;i<100;i++)rift.ignite(new Vector3(0,0,40));assert.equal(rift.fires.length,24);rift.reset();assert.ok(rift.fires.every(f=>!f.group.visible));rift.dispose();
console.log('Rift models PASS: 3ft/200ft/hover silhouettes, batched geometry, protected fire exclusions and fixed effect pools.');
