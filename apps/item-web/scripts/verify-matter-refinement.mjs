import assert from 'node:assert/strict';
import {MatterRange} from '../lib/matter-range.ts';
import {MatterRefinement} from '../lib/matter-refinement.ts';
import {MatterEngine} from '../lib/matter-engine.ts';
const dir={x:0,y:0,z:-1},zero={x:0,y:0,z:0};
for(const size of [.25,.18,.125]){
 const d=new MatterRefinement();assert.ok(d.fracture({x:0,y:1,z:0},size,{x:0,y:1,z:0},'ceramic',dir,zero));
 assert.ok(d.smallest>=.01&&d.smallest<=.02);
 assert.ok(Math.abs(d.fragments.reduce((sum,f)=>sum+f.size**3,0)-size**3)<1e-10,'Partition preserves volume');
 assert.ok(d.fragments.every(f=>Math.abs(f.x)+f.size/2<=size/2+1e-8));
}
const r=new MatterRange(.125),s=r.physics,t=r.targets[0],index=t.start;
const original=s.count,volume=s.count*r.actualSize**3;
r.impact(index,dir);assert.equal(s.enabled[index],0,'Refined parent no longer collides or renders');assert.ok(r.detail.fragments.length>0);
assert.ok(s.pinned.slice(t.start,t.end).some(Boolean),'Undamaged region remains supported');
const enabled=()=>s.enabled.slice(0,s.count).reduce((a,b)=>a+b,0);
assert.ok(Math.abs(enabled()*r.actualSize**3+r.detail.fragments.reduce((a,f)=>a+f.size**3,0)-volume)<1e-8);
const n=r.detail.fragments.length;r.detail.allowRefinement=false;r.impact(t.start+1,dir);assert.equal(r.detail.fragments.length,n,'Performance throttle preserves existing debris');r.detail.allowRefinement=true;
const timings=[];for(let i=0;i<180;i++){const start=performance.now();r.step();timings.push(performance.now()-start);}
assert.ok(r.detail.fragments.every(f=>[f.x,f.y,f.z,f.vx,f.vy,f.vz].every(Number.isFinite)&&f.y>=f.size/2-.0001));
assert.equal(s.count,original);assert.equal(r.detail.fragments.length,n);
const floor=new MatterEngine(0,'range'),d=new MatterRefinement();
d.fracture({x:0,y:.3,z:0},.125,{x:0,y:.3,z:0},'concrete',zero,zero);
for(let i=0;i<400;i++)d.step(floor);assert.ok(d.fragments.some(f=>f.asleep),'Settled fragments sleep');
const asleep=d.fragments.findIndex(f=>f.asleep);d.strike(asleep,dir);assert.equal(d.fragments[asleep].asleep,false,'A hit wakes sleeping matter');
while(d.fracture({x:0,y:1,z:0},.125,zero,'glass',dir,zero)){}
assert.ok(d.fragments.length<=d.capacity);const full=d.fragments.length;assert.equal(d.fracture(zero,.125,zero,'glass',dir,zero),false);assert.equal(d.fragments.length,full);
r.reset();assert.equal(r.detail.fragments.length,0);assert.equal(enabled(),s.count);
console.log('PASS refinement: 1–2 cm leaves, volume conservation, disabled parents, local damage, finite contacts, persistent debris, sleep/wake, throttle, hard cap, reset.');
console.log(JSON.stringify({environment:'Node CPU only',base:s.count,meanStepMs:timings.reduce((a,b)=>a+b)/timings.length,p95StepMs:timings.sort((a,b)=>a-b)[Math.floor(timings.length*.95)]}));
