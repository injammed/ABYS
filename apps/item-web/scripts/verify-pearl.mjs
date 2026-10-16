import assert from 'node:assert/strict';
import {freshPearl,stepPearl,togglePearl,buildPearl} from '../lib/pearl-vehicle.ts';
import {canHover,flightFloor,landingSpot} from '../lib/survival.ts';
const s=freshPearl();assert.ok(canHover(s.x,s.z,s.y),'Spawn footprint must be clear');assert.ok(landingSpot(s.x,s.z));
const input={throttle:1,steer:0,lift:0,brake:false};for(let i=0;i<120;i++)stepPearl(s,input,1/60,()=>true,()=>1.4);assert.ok(s.speed>20);assert.ok(s.z>21);const heading=s.yaw;stepPearl(s,{...input,steer:1},.05,()=>true,()=>1.4);assert.notEqual(s.yaw,heading);
for(let i=0;i<100;i++)stepPearl(s,{...input,brake:true},1/60,()=>true,()=>1.4);assert.equal(s.speed,0);
assert.ok(togglePearl(s));for(let i=0;i<60;i++)stepPearl(s,{...input,throttle:0,lift:1},1/60,()=>true,()=>1.4);assert.ok(s.y>10);assert.equal(togglePearl(s),false);for(let i=0;i<120;i++)stepPearl(s,{...input,throttle:0,lift:-1},1/60,()=>true,()=>1.4);assert.equal(s.y,1.4);assert.ok(togglePearl(s));
const wall=freshPearl();wall.speed=32;stepPearl(wall,input,.05,(x,z)=>z<21.7,flightFloor);assert.ok(wall.z<21.7);assert.equal(wall.speed,0,'Sweep stops at obstacle');
const model=buildPearl();let triangles=0;model.root.traverse(n=>{if(n.isMesh){for(const a of Object.values(n.geometry.attributes))for(const v of a.array)assert.ok(Number.isFinite(v));triangles+=n.geometry.index.count/3;}});assert.ok(triangles<50000);model.update(s,.016);model.dispose();console.log('PEARL PASS: clear spawn/exit, acceleration, steering, brake, takeoff/landing, mode gate, swept collision, finite model; '+triangles+' triangles.');
