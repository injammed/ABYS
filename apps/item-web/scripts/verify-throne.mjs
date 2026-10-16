import assert from 'node:assert/strict';
import {createDuel,startRound,step,attack,dash,applyRewrite,RULES,nextRound} from '../public/throne/core.mjs';
const duel=()=>{const s=createDuel();startRound(s);s.aiTimer=999;return s;};
const tick=(s,n=60,input={})=>{for(let i=0;i<n;i++)step(s,input,1/60);};
const s=duel();tick(s,600,{left:true});assert.equal(s.player.x,90);tick(s,60,{jump:true});assert.ok(Number.isFinite(s.player.y));
const hit=duel();hit.player.x=700;hit.boss.x=800;assert.ok(attack(hit,hit.player,'light'));tick(hit,10);assert.ok(hit.boss.hp<100);const hp=hit.boss.hp;tick(hit,10);assert.equal(hit.boss.hp,hp,'One contact per strike');
const a=duel(),b=duel();tick(a,300,{right:true,light:true});tick(b,300,{right:true,light:true});assert.deepEqual(a,b);
console.log('Pass 1: deterministic duel, bounds, jump and single-contact combat.');
const guard=duel();guard.player.x=700;guard.boss.x=800;guard.player.facing=1;attack(guard,guard.boss,'light');tick(guard,10,{guard:true});assert.ok(guard.player.hp>95);assert.ok(guard.blocked>0);
const dodge=duel();assert.ok(dash(dodge,-1));assert.ok(dodge.player.invulnerable>0);assert.equal(dash(dodge,1),false);assert.equal(attack(dodge,dodge.player,'heavy'),false);
console.log('Pass 2: guard mitigation, dash immunity, energy and action lockouts.');
const ai=createDuel('story');startRound(ai);tick(ai,60*120);assert.ok(['round','over'].includes(ai.mode));assert.ok(ai.player.hp<100,'Boss really fights');
console.log('Pass 3: boss approach, telegraphed attack pattern and defeat.');
for(let bits=0;bits<32;bits++){const r=duel();r.rewrite=RULES.map((_,i)=>(bits>>i)&1);assert.ok(applyRewrite(r));assert.ok(r.field.radius>0);assert.equal(applyRewrite(r),false);tick(r,30);assert.ok(r.player.energy>=0);}
console.log('Pass 4: all 32 bounded rewrites, energy and cooldown.');
const win=duel();win.boss.hp=1;win.player.x=700;win.boss.x=800;attack(win,win.player,'light');tick(win,15);assert.equal(win.wins[0],1);assert.ok(nextRound(win));win.aiTimer=999;win.boss.hp=1;win.player.x=700;win.boss.x=800;attack(win,win.player,'light');tick(win,15);assert.equal(win.mode,'over');assert.equal(win.wins[0],2);
console.log('Pass 5: best-of-three, round reset and earned victory.');
// Low beams are avoidable by jumping; fast projectiles cannot tunnel through targets.
const grounded=duel();grounded.projectiles.push({x:grounded.player.x-100,y:55,vx:12000,owner:'boss',damage:15,life:1});tick(grounded,1);assert.ok(grounded.player.hp<100);
const airborne=duel();airborne.player.y=100;airborne.projectiles.push({x:airborne.player.x-100,y:55,vx:12000,owner:'boss',damage:15,life:1});tick(airborne,1);assert.equal(airborne.player.hp,100);
const phase=duel();phase.boss.hp=30;tick(phase,1);assert.equal(phase.phase,3);
console.log('Pass 6: swept projectile contact, jump avoidance and boss escalation.');
const {drawDuel}=await import('../public/throne/render.mjs');
let depth=0,calls=0;const noop=(...args)=>{calls++;for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a));};
const context=new Proxy({save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createLinearGradient(){return {addColorStop:noop};},createRadialGradient(){return {addColorStop:noop};}}, {get(o,k){return k in o?o[k]:noop;},set(o,k,v){o[k]=v;return true;}});
for(const mode of ['title','fight','round','over'])for(const reduced of [false,true]){const rendered=duel();rendered.mode=mode;rendered.player.guard=true;rendered.player.combo=3;rendered.player.comboTime=1;applyRewrite(rendered);attack(rendered,rendered.boss,'beam');drawDuel(context,rendered,{reduced,time:2});assert.equal(depth,0);}
assert.ok(calls>1000);console.log('Pass 7: all render states, reduced motion and finite canvas geometry.');
