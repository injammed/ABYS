import assert from 'node:assert/strict';
import {MatterEngine,DIAMETER} from '../lib/matter-engine.ts';
const sim=new MatterEngine(1500);
assert.equal(sim.count,1500);assert.equal(DIAMETER,.25);
const anchored=Array.from(sim.position.slice(0,sim.floorCount*3));
for(let i=0;i<5;i++)sim.step();
assert.deepEqual(Array.from(sim.position.slice(0,sim.floorCount*3)),anchored,'Intact floor must hold its shape');
const waterBefore=sim.position[(sim.floorCount+500)*3+1];
sim.fracture(0,0);assert.ok(sim.broken>0);const broken=sim.broken;sim.fracture(0,0);assert.equal(sim.broken,broken,'Fracture must be idempotent');
const center=12*32+16;assert.equal(sim.pinned[center],0);
sim.blockTarget=-1.7;
for(let i=0;i<50;i++)sim.step();
assert.ok(sim.position[center*3+1]<-.1,'Freed floor must fall');
assert.ok(sim.position[(sim.floorCount+500)*3+1]<waterBefore,'Water must flow under gravity');
assert.ok(Math.abs(sim.block.x+1.7)<.001,'Solid must traverse to its target');
for(let i=0;i<sim.count*3;i++)assert.ok(Number.isFinite(sim.position[i]),'No non-finite positions');
for(let i=0;i<sim.count;i++){assert.ok(Math.abs(sim.position[i*3])<=4.101);assert.ok(sim.position[i*3+1]>=-2.001);}
sim.reset(5000);assert.equal(sim.broken,0);assert.equal(sim.count,5000);assert.equal(sim.pinned[center],1);
const times=[];for(let i=0;i<12;i++){const start=performance.now();sim.step();times.push(performance.now()-start);}
console.log('PASS: intact floor, fracture, gravity, moving solid, finite state, containment, reset, 5,000 particles.');
console.log(JSON.stringify({environment:'Node CPU only; not a browser/GPU benchmark',particles:sim.count,steps:times.length,meanStepMs:times.reduce((a,b)=>a+b)/times.length,maxStepMs:Math.max(...times),particleBufferBytes:sim.bytes}));
