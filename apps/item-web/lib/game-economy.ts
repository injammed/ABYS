// USD here is fictional single-player cash; no real-money purchases.
export type GearId='ammo'|'water'|'food'|'medicine'|'plates'|'helmet'|'exo'|'jetpack'|'nanites';
export const GOODS:{id:GearId;name:string;price:number;description:string}[]=[
 {id:'ammo',name:'90 AK rounds',price:100,description:'Adds up to 90 spare rounds. Requires Mara’s rifle.'},
 {id:'water',name:'Water bottle',price:25,description:'One bottle for your inventory.'},
 {id:'food',name:'Food ration',price:25,description:'One ration for your inventory.'},
 {id:'medicine',name:'Med kit',price:75,description:'Immediately restores 50 health.'},
 {id:'plates',name:'Armor plates',price:200,description:'Refills 100 armor. Plates absorb 70% of incoming damage until depleted.'},
 {id:'helmet',name:'Combat helmet',price:350,description:'Permanent 15% damage reduction.'},
 {id:'exo',name:'Exo suit',price:1800,description:'40% faster ground movement; sprint consumes less stamina.'},
 {id:'jetpack',name:'Repulsor jetpack',price:3500,description:'J toggles flight. Space rises, C descends. Fuel recharges on the ground.'},
 {id:'nanites',name:'Cyborg nanite enhancement',price:5000,description:'Heals 3 health per second after 8 seconds without damage.'},
];
export const SOUL_PRICE=50,SOUL_RANGE=18,MAX_SOUL_CLUSTERS=512;
export const TUNNEL={x:170,z:500,length:40,width:8,depth:6};
export const SOUL_TRADER={x:TUNNEL.x,z:TUNNEL.z+34,name:'Nera · soul trader'};
export const VENDING=[{x:0,z:20},{x:35,z:200},{x:-250,z:150},{x:250,z:150},{x:-650,z:550},{x:650,z:550},{x:-1050,z:950},{x:1110,z:950},{x:-250,z:1350},{x:250,z:1350},{x:-650,z:1750},{x:650,z:1750},{x:-1050,z:2150},{x:1050,z:2150},{x:-250,z:2550},{x:250,z:2550},{x:-650,z:2950},{x:740,z:2950},{x:-1050,z:3350},{x:1050,z:3350},{x:-250,z:3750},{x:250,z:3750},{x:-650,z:4150},{x:650,z:4150},{x:-1050,z:4550},{x:1050,z:4550},{x:-250,z:4950},{x:250,z:4950},{x:-650,z:5350},{x:650,z:5350},{x:-1050,z:5750},{x:1050,z:5750},{x:-250,z:6150},{x:250,z:6150}];
export type SoulCluster={x:number;y:number;z:number;count:number};
export type Economy={cash:number;points:number;earned:number;spent:number;kills:number;rescuePaid:number;armor:number;helmet:boolean;exo:boolean;jetpack:boolean;nanites:boolean;fuel:number;skullQuest:number;souls:number;sold:number;departed:number;pending:SoulCluster[];seen:{zombies:number;demons:number;civilians:number}};
export const freshEconomy=():Economy=>({cash:250,points:0,earned:0,spent:0,kills:0,rescuePaid:0,armor:0,helmet:false,exo:false,jetpack:false,nanites:false,fuel:100,skullQuest:0,souls:0,sold:0,departed:0,pending:[],seen:{zombies:0,demons:0,civilians:0}});
const integer=(n:unknown,max=1e12)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=max;
export function restoreEconomy(raw:unknown):Economy{
 const e=raw as Economy;if(!e||typeof e!=='object')return freshEconomy();
 for(const k of ['cash','points','earned','spent','kills','rescuePaid','skullQuest','souls','sold','departed'] as const)if(!integer(e[k]))return freshEconomy();
 for(const k of ['helmet','exo','jetpack','nanites'] as const)if(typeof e[k]!=='boolean')return freshEconomy();
 if(![e.armor,e.fuel].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||e.skullQuest>2||!Array.isArray(e.pending)||e.pending.length>MAX_SOUL_CLUSTERS||!e.seen)return freshEconomy();
 if(!Object.values(e.seen).every(n=>integer(n))||Object.keys(e.seen).sort().join()!=='civilians,demons,zombies')return freshEconomy();
 if(e.pending.some(p=>!p||!integer(p.count)||p.count===0||![p.x,p.y,p.z].every(n=>Number.isFinite(n)&&Math.abs(n)<20000)))return freshEconomy();
 if(e.departed!==e.souls+e.sold+e.pending.reduce((n,p)=>n+p.count,0)||e.cash!==250+e.earned+e.sold*SOUL_PRICE-e.spent||(e.skullQuest<2&&(e.souls||e.sold)))return freshEconomy();
 return {...e,seen:{...e.seen},pending:e.pending.map(p=>({...p}))};
}
export function leaveSouls(e:Economy,point:{x:number;y:number;z:number},count=1){
 if(!integer(count)||count===0||![point.x,point.y,point.z].every(n=>Number.isFinite(n)&&Math.abs(n)<20000))return;
 let cluster=e.pending.find(p=>Math.hypot(p.x-point.x,p.y-point.y,p.z-point.z)<6);
 // Compact visual cohorts preserve every individual soul count, even at regional scale.
 if(!cluster&&e.pending.length>=MAX_SOUL_CLUSTERS)cluster=e.pending.reduce((a,b)=>Math.hypot(a.x-point.x,a.z-point.z)<Math.hypot(b.x-point.x,b.z-point.z)?a:b);
 if(cluster)cluster.count+=count;else e.pending.push({...point,count});e.departed+=count;
}
export type KillKind='infected'|'robot'|'alien'|'goblin'|'warlock'|'titan'|'wizard';
const REWARDS:Record<KillKind,[number,number]>={infected:[100,25],robot:[400,100],alien:[250,75],goblin:[150,40],warlock:[500,150],titan:[5000,1500],wizard:[10000,2500]};
export function rewardKill(e:Economy,kind:KillKind,point:{x:number;y:number;z:number}){const [points,cash]=REWARDS[kind];e.kills++;e.points+=points;e.cash+=cash;e.earned+=cash;leaveSouls(e,point);if(kind==='infected')e.seen.zombies++;else if(['goblin','warlock','titan'].includes(kind))e.seen.demons++;}
export function syncRegionalDeaths(e:Economy,c:{eliminated:number;demonsEliminated:number;dead:number},point:{x:number;y:number;z:number}){const totals={zombies:c.eliminated,demons:c.demonsEliminated,civilians:c.dead};for(const k of ['zombies','demons','civilians'] as const){const count=Math.max(0,totals[k]-e.seen[k]);leaveSouls(e,point,count);e.seen[k]=totals[k];}}
export function rewardRescue(e:Economy,saved:number){const n=Math.max(0,saved-e.rescuePaid);if(n){const cash=Math.floor(n/10);e.cash+=cash;e.earned+=cash;e.points+=n;e.rescuePaid=saved;}return n;}
export function skullQuestAction(e:Economy,saved:number){if(e.skullQuest===2)return 'The Skull of Uk’onu’okele is yours. Press 3 to reveal souls; hold Click / F to absorb. Find Nera below the tunnel entrance to sell them.';if(e.skullQuest===0){e.skullQuest=1;return 'Mara’s quest: protect 5,000 refugees and defeat 3 enemies. Return to Mara to receive the Skull of Uk’onu’okele.';}if(saved<5000||e.kills<3)return `Skull quest: refugees ${Math.min(saved,5000).toLocaleString()}/5,000 · enemies ${Math.min(e.kills,3)}/3. Return when both are complete.`;e.skullQuest=2;return 'Mara gave you the Skull of Uk’onu’okele. Press 3: the unseen souls become visible. Hold Click / F nearby to absorb them, one soul per dead thing.';}
export function absorbSoul(e:Economy,point:{x:number;y:number;z:number},visible:boolean,clear:(s:SoulCluster)=>boolean=()=>true){if(!visible||e.skullQuest!==2)return null;const target=e.pending.filter(s=>Math.hypot(s.x-point.x,s.y-point.y,s.z-point.z)<=SOUL_RANGE&&clear(s)).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y,a.z-point.z)-Math.hypot(b.x-point.x,b.y-point.y,b.z-point.z))[0];if(!target)return null;target.count--;e.souls++;const soul={...target};if(!target.count)e.pending.splice(e.pending.indexOf(target),1);return soul;}
export function sellSouls(e:Economy){if(!e.souls)return 'Nera: Bring me souls in the skull. I pay $50 in-game USD for each.';const n=e.souls;e.souls=0;e.sold+=n;e.cash+=n*SOUL_PRICE;return `Nera bought ${n.toLocaleString()} souls for $${(n*SOUL_PRICE).toLocaleString()}.`;}
export function buy(e:Economy,p:{armed:boolean;reserve:number;bottles:number;rations:number;health:number},id:string){const item=GOODS.find(g=>g.id===id);if(!item)return 'Unknown item.';if(e.cash<item.price)return 'Not enough cash.';if(id==='ammo'&&(!p.armed||p.reserve>=999))return p.armed?'Ammo reserve is full.':'Receive Mara’s rifle first.';if(id==='medicine'&&p.health>=100||id==='plates'&&e.armor>=100)return 'Already full.';if(['helmet','exo','jetpack','nanites'].includes(id)&&e[id as 'helmet'|'exo'|'jetpack'|'nanites'])return 'Upgrade already installed.';if((id==='water'&&p.bottles>=1e7)||(id==='food'&&p.rations>=1e7))return 'Inventory is full.';
 e.cash-=item.price;e.spent+=item.price;if(id==='ammo')p.reserve=Math.min(999,p.reserve+90);else if(id==='water')p.bottles++;else if(id==='food')p.rations++;else if(id==='medicine')p.health=Math.min(100,p.health+50);else if(id==='plates')e.armor=100;else e[id as 'helmet'|'exo'|'jetpack'|'nanites']=true;return `${item.name} acquired.`;}
export function damagePlayer(e:Economy,p:{health:number},amount:number){if(!Number.isFinite(amount)||amount<=0||p.health<=0)return 0;const damage=amount*(e.helmet?.85:1),blocked=Math.min(e.armor,damage*.7);e.armor=Math.max(0,e.armor-blocked);const loss=Math.min(p.health,damage-blocked);p.health=Math.max(0,p.health-loss);return loss;}
export function tickUpgrades(e:Economy,p:{health:number;stamina:number},dt:number,active:{flying:boolean;running:boolean;sinceDamage:number;grounded:boolean}){dt=Math.max(0,Math.min(.1,dt));if(p.health<=0)return;if(e.nanites&&active.sinceDamage>=8)p.health=Math.min(100,p.health+3*dt);if(e.exo&&active.running)p.stamina=Math.min(100,p.stamina+8*dt);e.fuel=Math.max(0,Math.min(100,e.fuel+(active.flying?-20:active.grounded?10:0)*dt));}
export function tunnelGround(x:number,z:number){const dz=z-TUNNEL.z;return Math.abs(x-TUNNEL.x)<4&&dz>0&&dz<=40?-6*Math.min(1,dz/16):0;}
export function economyWalkable(x:number,z:number){const dx=Math.abs(x-TUNNEL.x),dz=z-TUNNEL.z;if(dz>0&&dz<41&&dx>=3.6&&dx<5)return false;if(dx<5&&dz>39&&dz<41)return false;return !VENDING.some(v=>Math.abs(x-v.x)<1.1&&Math.abs(z-v.z)<.85);}
