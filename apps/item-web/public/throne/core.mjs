/** Deterministic, bounded fighting-game rules. World rewrites are game data, never evaluated code. */
export const RULES=[['LIGHT','DARK'],['LEFT','RIGHT'],['SMALL','BIG'],['BOUND','FREE'],['ASLEEP','AWAKE']];
export const MOVES={light:{wind:.11,active:.09,recovery:.22,range:120,damage:7,cost:0},heavy:{wind:.34,active:.12,recovery:.42,range:170,damage:17,cost:18},pulse:{wind:.28,active:.1,recovery:.5,range:780,damage:12,cost:30},sweep:{wind:.6,active:.13,recovery:.58,range:205,damage:18,cost:0},beam:{wind:.85,active:.12,recovery:.65,range:950,damage:15,cost:0}};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const body=(x)=>({x,y:0,vy:0,hp:100,energy:70,facing:1,move:null,stun:0,invulnerable:0,dash:0,dashCooldown:0,guard:false,flash:0,combo:0,comboTime:0});
export function createDuel(difficulty='normal'){return {mode:'title',difficulty,player:body(330),boss:body(900),time:99,elapsed:0,round:1,wins:[0,0],phase:1,aiTimer:1.1,aiIndex:0,events:[],projectiles:[],effects:[],hitstop:0,rewrite:[0,1,0,1,1],rewriteCooldown:0,field:null,roundTimer:0,result:'',hits:0,blocked:0,rewrites:0};}
export function startRound(s){s.mode='fight';s.player=body(330);s.boss=body(900);s.boss.facing=-1;s.time=99;s.aiTimer=1.2;s.aiIndex=0;s.phase=1;s.hitstop=0;s.field=null;s.projectiles=[];s.effects=[];s.rewriteCooldown=0;s.roundTimer=0;s.result='';s.events=[];}
export function attack(s,f,type){const m=MOVES[type];if(s.mode!=='fight'||!m||f.move||f.stun>0||f.dash>0||f.energy<m.cost)return false;f.energy-=m.cost;f.move={type,t:0,hit:false};f.guard=false;return true;}
export function dash(s,direction){const p=s.player;if(s.mode!=='fight'||p.stun>0||p.move||p.dashCooldown>0||p.energy<16)return false;p.energy-=16;p.dash=.18;p.dashDirection=direction||p.facing;p.dashCooldown=.65;p.invulnerable=.16;return true;}
export function applyRewrite(s){if(s.mode!=='fight'||s.rewriteCooldown>0||s.player.energy<35||s.player.stun>0)return false;const [light,right,big,free,awake]=s.rewrite;s.player.energy-=35;s.rewriteCooldown=9;s.rewrites++;s.field={x:right?880:400,radius:big?205:120,free:!!free,awake:!!awake,light:!light,life:big?4:6};s.events.push('rewrite');return true;}
export function rewriteDescription(bits){return `${bits[0]?'Dark: stronger strike':'Light: regenerate'} · ${bits[1]?'right':'left'} side · ${bits[2]?'wide / 4s':'focused / 6s'} · ${bits[3]?'free: weakens APY0C inside':'bound: refills your energy inside'} · ${bits[4]?'awake: active field':'asleep: protective field'}`;}
function hit(s,attacker,defender,damage,knock=30){if(defender.invulnerable>0)return false;const facing=(attacker.x-defender.x)*defender.facing>=0;const block=defender.guard&&defender.y<5&&facing&&defender.energy>8;
 if(block){defender.energy=Math.max(0,defender.energy-12);damage*=.18;s.blocked++;s.events.push('block');}else {defender.stun=.18;defender.flash=.13;defender.x=clamp(defender.x+Math.sign(defender.x-attacker.x)*knock,90,1190);s.events.push('hit');attacker.combo=attacker.comboTime>0?attacker.combo+1:1;attacker.comboTime=1.1;if(attacker===s.player)s.hits++;}
 if(attacker===s.player&&s.field?.awake&&!s.field.light&&Math.abs(attacker.x-s.field.x)<s.field.radius)damage*=1.2;
 if(defender===s.player&&s.field&&!s.field.awake&&Math.abs(defender.x-s.field.x)<s.field.radius)damage*=.65;
 defender.hp=Math.max(0,defender.hp-damage);s.hitstop=.045;s.effects.push({x:defender.x,y:475-defender.y,life:.25,block});if(s.effects.length>30)s.effects.shift();return true;
}
function endRound(s){if(s.player.hp>0&&s.boss.hp>0&&s.time>0)return;const winner=s.player.hp===s.boss.hp?-1:s.player.hp>s.boss.hp?0:1;if(winner>=0)s.wins[winner]++;s.mode=s.wins.some(w=>w>=2)?'over':'round';s.result=winner<0?'DRAW':winner===0?'THE THRONE IS CONTESTED':'THE EYE REMAINS BOUND';if(s.mode==='over')s.result=winner===0?'THE DIMENSION ENDURES':'APY0C CLAIMS THE THRONE';s.roundTimer=2.2;}
export function step(s,input={},dt=1/60){dt=clamp(Number.isFinite(dt)?dt:0,0,.05);s.events=[];if(s.mode!=='fight')return;if(s.hitstop>0){s.hitstop=Math.max(0,s.hitstop-dt);return;}s.elapsed+=dt;s.time=Math.max(0,s.time-dt);s.rewriteCooldown=Math.max(0,s.rewriteCooldown-dt);
 for(const f of [s.player,s.boss]){for(const k of ['stun','invulnerable','dash','dashCooldown','flash','comboTime'])f[k]=Math.max(0,f[k]-dt);f.energy=Math.min(100,f.energy+dt*(f.guard?5:12));f.vy-=1500*dt;f.y=Math.max(0,f.y+f.vy*dt);if(f.y===0)f.vy=0;}
 const p=s.player,b=s.boss;p.facing=b.x>=p.x?1:-1;b.facing=-p.facing;p.guard=!!input.guard&&!p.move&&p.stun===0&&p.dash===0;
 if(p.stun===0&&!p.move){if(input.jump&&p.y===0){p.vy=590;p.y=.1;}const direction=Number(!!input.right)-Number(!!input.left);p.x+=((p.dash>0?p.dashDirection*680:direction*(p.guard?110:260)))*dt;}
 p.x=clamp(p.x,90,1190);if(input.light)attack(s,p,'light');if(input.heavy)attack(s,p,'heavy');if(input.pulse)attack(s,p,'pulse');
 s.phase=b.hp<=35?3:b.hp<=65?2:1;s.aiTimer-=dt;const distance=Math.abs(p.x-b.x),weak=s.field?.free&&Math.abs(b.x-s.field.x)<s.field.radius;
 b.guard=!b.move&&p.move?.type==='heavy'&&s.aiIndex%3===0&&distance<185;
 if(!b.move&&b.stun===0){if(distance>145)b.x+=b.facing*(weak?75:130+s.phase*12)*dt;else if(distance<90)b.x-=b.facing*100*dt;
  if(s.aiTimer<=0){const pattern=['light','sweep','beam','heavy','beam','sweep'];const type=distance>300?'beam':pattern[s.aiIndex++%pattern.length];attack(s,b,type);s.aiTimer=(s.difficulty==='story'?1.65:1.15)+(weak?.6:0);}}
 b.x=clamp(b.x,90,1190);if(Math.abs(p.x-b.x)<60&&Math.abs(p.y-b.y)<75){const mid=(p.x+b.x)/2,sign=p.x<b.x?-1:1;p.x=clamp(mid+sign*30,90,1190);b.x=clamp(mid-sign*30,90,1190);}
 for(const [a,d] of [[p,b],[b,p]])if(a.move){const move=a.move,m=MOVES[move.type];move.t+=dt;if(!move.hit&&move.t>=m.wind){move.hit=true;if(move.type==='pulse'||move.type==='beam'){s.projectiles.push({x:a.x+a.facing*45,y:move.type==='beam'?55:95,vx:a.facing*(move.type==='beam'?610:760),owner:a===p?'player':'boss',damage:m.damage,life:2});s.events.push('cast');}
   else if(Math.abs(a.x-d.x)<=m.range&&(d.x-a.x)*a.facing>=0&&(move.type==='sweep'?d.y<45:Math.abs(a.y-d.y)<115))hit(s,a,d,m.damage*(a===b&&s.difficulty==='story'?.65:1),move.type==='heavy'?65:25);}
  if(move.t>=m.wind+m.active+m.recovery)a.move=null;}
 for(const shot of s.projectiles){shot.life-=dt;const prev=shot.x;shot.x+=shot.vx*dt;const target=shot.owner==='player'?b:p,source=shot.owner==='player'?p:b;if(shot.life>0&&target.x>=Math.min(prev,shot.x)-24&&target.x<=Math.max(prev,shot.x)+24&&shot.y>target.y&&shot.y<target.y+150){hit(s,source,target,shot.damage*(shot.owner==='boss'&&s.difficulty==='story'?.65:1));shot.life=0;}}
 s.projectiles=s.projectiles.filter(p=>p.life>0&&p.x>0&&p.x<1280);for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
 if(s.field){const f=s.field;f.life-=dt;if(Math.abs(p.x-f.x)<f.radius){if(f.light&&f.awake)p.hp=Math.min(100,p.hp+dt*2);if(!f.free)p.energy=Math.min(100,p.energy+dt*10);}if(f.life<=0)s.field=null;}
 endRound(s);
}
export function nextRound(s){if(s.mode==='round'){s.round++;startRound(s);return true;}return false;}
