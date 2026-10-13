import assert from 'node:assert/strict';
import {MatterRange} from '../lib/matter-range.ts';
const s=new MatterRange();
assert.equal(s.targets.length,15);assert.ok(s.physics.count>500&&s.physics.count<=5000);
assert.deepEqual(new Set(s.targets.map(t=>t.kind)),new Set(['pottery','plate','gel']));
const snapshot=Array.from(s.physics.position.slice(0,s.physics.count*3));s.step();assert.deepEqual(Array.from(s.physics.position.slice(0,s.physics.count*3)),snapshot);
const t=s.targets[0],index=t.start+2,point={x:s.physics.position[index*3],y:s.physics.position[index*3+1],z:s.physics.position[index*3+2]};
const origin={x:point.x,y:point.y,z:point.z+3},dir={x:0,y:0,z:-1};
const hit=s.fire(0,origin,dir);assert.equal(hit.fired,true);assert.ok(hit.point);assert.equal(s.ammo[0],6);assert.equal(s.ammo[1],7);assert.equal(s.fire(0,origin,dir).fired,false,'Per-hand cooldown');assert.equal(s.fire(1,origin,dir).fired,true,'Independent off-hand firing');
assert.ok(s.physics.broken>0);assert.ok(t.hit);assert.ok(s.targets.some(t=>!t.hit),'Other targets remain intact');
for(let n=0;n<15;n++)s.step();assert.notDeepEqual(Array.from(s.physics.position.slice(t.start*3,t.end*3)),snapshot.slice(t.start*3,t.end*3),'Debris must physically move');
s.reload();assert.ok(s.reloadTime>0);assert.equal(s.fire(1,origin,dir).fired,false);for(let n=0;n<40;n++)s.step();assert.deepEqual(s.ammo,[7,7]);
const gel=s.targets.find(t=>t.kind==='gel');assert.ok(s.physics.bonds.some(b=>s.owner[b.a]===s.targets.indexOf(gel)&&b.stiffness===.25));s.impact(gel.start,dir);for(let n=0;n<20;n++)s.step();
for(let i=0;i<s.physics.count;i++){const p=s.physics.position;assert.ok(Number.isFinite(p[i*3])&&Number.isFinite(p[i*3+1])&&Number.isFinite(p[i*3+2]));assert.ok(p[i*3+1]>=.124);assert.ok(Math.abs(p[i*3])<=8.001);}
s.reset();assert.ok(s.targets.every(t=>!t.hit));assert.equal(s.shots,0);assert.equal(s.physics.broken,0);
const count=s.physics.count;s.shove({x:s.targets[0].x,y:1.7,z:s.targets[0].z},{x:0,y:0,z:-1});assert.ok(s.targets[0].hit);assert.equal(s.physics.count,count,'Impacts preserve allocated matter');
const times=[];for(let n=0;n<20;n++){const start=performance.now();s.step();times.push(performance.now()-start);}console.log('PASS range: materials, stable scene, ray hits, independent weapons, cooldown, reload, fracture, persistent debris, gel bonds, containment, restock and shove.');console.log(JSON.stringify({environment:'Node CPU only, not browser',particles:count,meanStepMs:times.reduce((a,b)=>a+b)/times.length,maxStepMs:Math.max(...times)}));
