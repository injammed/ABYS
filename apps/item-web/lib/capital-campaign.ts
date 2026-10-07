// Fictional game state. Every transition conserves the original population.
export const POPULATION=5_000_001;
export const DEMON_POPULATION=2_000_000;
export type DemonKind='goblin'|'titan'|'warlock';
export const ERADICATION_OPTIONS=[
 {id:'containment',name:'Containment teams',description:'Gradual regional clearance. No strike casualties.',civilianLoss:0,clearance:.025,minimum:5},
 {id:'hypersonic',name:'Hypersonic Salvo Kinetic Weapons',description:'Immediate conventional clearance. Permanently loses 2% of unprotected humans.',civilianLoss:.02,clearance:0,minimum:0},
 {id:'swarm',name:'Massive Autonomous Drone Swarms (MADS)',description:'Accelerated regional clearance with civilian exclusion zones. No strike casualties in this game model.',civilianLoss:0,clearance:.08,minimum:15},
 {id:'trinity',name:'Trinity release · HSGV / reentry / MADS',description:'Rescue 25,000 first. Releases all three systems, destroys 80% of zombies and loses 12% of unprotected humans. The crust ruptures: two million demons emerge and remaining zombies become possessed.',civilianLoss:.12,clearance:0,minimum:0},
 {id:'nuclear',name:'Nuclear strike',description:'Immediate clearance. Permanently loses 25% of unprotected humans.',civilianLoss:.25,clearance:0,minimum:0},
] as const;
export type EradicationOption=typeof ERADICATION_OPTIONS[number]['id'];
export const optionFor=(id:EradicationOption)=>ERADICATION_OPTIONS.find(o=>o.id===id)!;
export const civilianLossFor=(c:Campaign,id:EradicationOption)=>Math.ceil(c.humans*optionFor(id).civilianLoss);
export type Campaign={rift:boolean;riftClock:number;demons:number;demonsEliminated:number;goblinKills:number;titanKills:number;warlockKills:number;strategy:EradicationOption|null;humans:number;zombies:number;saved:number;dead:number;eliminated:number;converted:number;clock:number;carry:number;quest:number;convoys:number;lastEvac:number;contained:boolean;launched:boolean;won:boolean;};
export const freshCampaign=():Campaign=>({rift:false,riftClock:0,demons:0,demonsEliminated:0,goblinKills:0,titanKills:0,warlockKills:0,strategy:null,humans:POPULATION-1,zombies:1,saved:0,dead:0,eliminated:0,converted:1,clock:0,carry:0,quest:0,convoys:0,lastEvac:-30,contained:false,launched:false,won:false});
export const MISSIONS=[
 {id:'hospital',name:'Field hospital',x:-105,z:240,task:'Restore the evacuation station. Save the first 5,000 refugees.'},
 {id:'relay',name:'Quarantine relay',x:150,z:430,task:'Activate quarantine communications to stop new infections.'},
 {id:'command',name:'Aegis command bunker',x:-180,z:690,task:'Disable two laser robots, then recover fictional Aegis authorization.'},
 {id:'evac',name:'Refugee evacuation',x:80,z:870,task:'Dispatch another evacuation convoy. Protect at least 10,000 people.'},
 {id:'aegis',name:'Aegis decision terminal',x:0,z:1090,task:'Choose containment, a hypersonic salvo, MADS, or a nuclear strike. Compare survivor costs first. Rescue 25,000 to unlock Trinity.'},
 {id:'riftseal',name:'Crust breach · seal terminal',x:80,z:1350,task:'After Trinity: defeat 8 goblins, 1 titan and 3 floating warlocks. Restore the seal to banish the demon horde and cleanse remaining possessed zombies.'},
] as const;
export function advanceCampaign(c:Campaign,dt:number){
 dt=Math.max(0,Math.min(1,dt));c.clock+=dt;if(c.won)return;if(c.rift)c.riftClock+=dt;
 if(!c.contained&&c.zombies&&c.humans){
  c.carry+=c.zombies*Math.expm1(Math.LN2*dt/18)*(c.humans/POPULATION);
  const n=Math.min(c.humans,Math.floor(c.carry));c.carry-=n;c.humans-=n;c.zombies+=n;c.converted+=n;
 }
 if(c.contained&&c.quest>=5&&c.zombies&&c.strategy!=='trinity'){
  // Abstract regional clearance teams, not millions of individually simulated agents.
  const option=optionFor(c.strategy??'containment');
  c.carry+=Math.max(option.minimum,c.zombies*option.clearance)*dt;
  const n=Math.min(c.zombies,Math.floor(c.carry));c.carry-=n;eliminate(c,n);
 }
 c.won=c.zombies===0&&c.demons===0;
}
export function eliminate(c:Campaign,amount=1){const n=Math.min(c.zombies,Math.max(0,Math.floor(amount)));c.zombies-=n;c.eliminated+=n;if(!c.zombies){c.won=c.demons===0;c.carry=0;}return n;}
export function eliminateDemon(c:Campaign,kind:DemonKind){
 if(!c.rift||c.riftClock<8||c.demons===0||!['goblin','titan','warlock'].includes(kind))return false;
 c.demons--;c.demonsEliminated++;c[kind==='goblin'?'goblinKills':kind==='titan'?'titanKills':'warlockKills']++;c.won=c.zombies===0&&c.demons===0;return true;
}
function evacuate(c:Campaign){const n=Math.min(c.humans,5000);c.humans-=n;c.saved+=n;c.convoys++;c.lastEvac=c.clock;return n;}
export function missionAction(c:Campaign,id:string,robots:number,choice:EradicationOption|boolean='containment'){
 const strategy=typeof choice==='boolean'?(choice?'nuclear':'containment'):choice;
 if(!ERADICATION_OPTIONS.some(o=>o.id===strategy))return 'Unknown eradication option.';
 const index=MISSIONS.findIndex(m=>m.id===id);if(index<0)return 'Unknown station.';
 if(id==='aegis'&&c.quest>=5)return 'Your eradication decision is already committed.';
 if(c.won){if(id==='hospital'&&c.quest===0){const n=evacuate(c);c.quest=1;return `${n.toLocaleString()} refugees evacuated. Keep saving survivors.`;}if(index<c.quest&&(id==='hospital'||id==='evac')){if(c.clock-c.lastEvac<30)return 'Next convoy in '+Math.ceil(30-(c.clock-c.lastEvac))+' seconds of play.';return `${evacuate(c).toLocaleString()} refugees evacuated. Keep saving survivors.`;}return 'The outbreak has been eradicated. Your survivors remain protected.';}
 if(index>c.quest)return `First: ${MISSIONS[Math.min(c.quest,MISSIONS.length-1)].task}`;
 if(index<c.quest){if((id==='hospital'||id==='evac')&&c.clock-c.lastEvac>=30){return `${evacuate(c).toLocaleString()} refugees evacuated.`;}return 'Station secured. Evacuation convoys can depart every 30 seconds of play.';}
 if(id==='hospital'){const n=evacuate(c);c.quest=1;return `Hospital restored. ${n.toLocaleString()} refugees protected. Find the quarantine relay.`;}
 if(id==='relay'){c.contained=true;c.carry=0;c.quest=2;return 'Quarantine active. New conversions stopped. Existing zombies remain. Locate the Aegis bunker.';}
 if(id==='command'){if(robots<2)return 'Disable both laser robot patrols before securing this bunker.';c.quest=3;return 'Aegis authorization recovered. This is a fictional game system. Evacuate more civilians before the final decision.';}
 if(id==='evac'){const n=evacuate(c);c.quest=4;return `${n.toLocaleString()} more refugees evacuated. Find the Aegis decision terminal.`;}
 if(id==='riftseal'){
  if(!c.rift)return 'The crust breach only opens on the Trinity path.';
  if(c.riftClock<8||c.goblinKills<8||c.titanKills<1||c.warlockKills<3)return `Seal requirements: goblins ${c.goblinKills}/8 · titans ${c.titanKills}/1 · warlocks ${c.warlockKills}/3.`;
  c.demonsEliminated+=c.demons;c.demons=0;eliminate(c,c.zombies);c.quest=6;c.won=true;
  return 'The breach is sealed. The demon horde is banished, possession is cleansed, and protected survivors endure.';
 }
 if(strategy==='trinity'&&c.saved<25_000)return 'Rescue 25,000 people to unlock the coordinated Trinity release. Return to the evacuation stations.';
 if(c.saved<10_000)return 'Protect 10,000 refugees first. Return to an evacuation station.';
 c.quest=5;c.contained=true;c.carry=0;c.strategy=strategy;
 const casualties=civilianLossFor(c,strategy);c.humans-=casualties;c.dead+=casualties;
 if(strategy==='trinity'){c.rift=true;c.demons=DEMON_POPULATION;c.launched=true;eliminate(c,Math.floor(c.zombies*.8));c.won=false;return 'Trinity released: HSGV salvo, nuclear reentry warheads and MADS. The crust is fracturing. Reach the breach and defend survivors.';}
 if(strategy==='nuclear'||strategy==='hypersonic'){
  c.launched=strategy==='nuclear';eliminate(c,c.zombies);
  return `${optionFor(strategy).name} resolved. ${casualties.toLocaleString()} civilians lost permanently. Protected evacuees survive. All remaining zombies eliminated.`;
 }
 return `${optionFor(strategy).name} deployed. Regional clearance is running. No civilian strike losses. Keep evacuating survivors.`;
}
export function restoreCampaign(raw:unknown):Campaign{
 const source=raw as Campaign;const c=source&&typeof source==='object'?{...source,rift:source.rift??false,riftClock:source.riftClock??0,demons:source.demons??0,demonsEliminated:source.demonsEliminated??0,goblinKills:source.goblinKills??0,titanKills:source.titanKills??0,warlockKills:source.warlockKills??0,strategy:source.strategy===undefined?(source.quest>=5?(source.launched?'nuclear':'containment'):null):source.strategy}:source;if(!c||typeof c!=='object')return freshCampaign();
 for(const k of ['humans','zombies','saved','dead','eliminated','converted','quest','convoys'] as const)if(!Number.isSafeInteger(c[k])||c[k]<0||c[k]>POPULATION)return freshCampaign();
 if(c.quest>6||c.humans+c.zombies+c.saved+c.dead+c.eliminated!==POPULATION||c.converted!==c.zombies+c.eliminated||c.lastEvac>c.clock)return freshCampaign();
 for(const k of ['clock','carry','lastEvac','riftClock'] as const)if(!Number.isFinite(c[k])||c[k]<(k==='lastEvac'?-30:0)||c[k]>1e9)return freshCampaign();
 for(const k of ['contained','launched','won','rift'] as const)if(typeof c[k]!=='boolean')return freshCampaign();
 if(c.won!==(c.zombies===0&&c.demons===0)||c.carry>=POPULATION||(c.launched&&c.strategy!=='trinity'&&!c.won)||(c.quest>=2&&!c.contained))return freshCampaign();
 if(c.strategy!==null&&!ERADICATION_OPTIONS.some(o=>o.id===c.strategy))return freshCampaign();
 if((c.quest>=5)!==(c.strategy!==null)||c.launched!==(c.strategy==='nuclear'||c.strategy==='trinity')||((c.strategy==='nuclear'||c.strategy==='hypersonic')&&!c.won))return freshCampaign();
 for(const k of ['demons','demonsEliminated','goblinKills','titanKills','warlockKills'] as const)if(!Number.isSafeInteger(c[k])||c[k]<0||c[k]>DEMON_POPULATION)return freshCampaign();
 if(c.rift!==(c.strategy==='trinity')||c.demons+c.demonsEliminated!==(c.rift?DEMON_POPULATION:0)||c.goblinKills+c.titanKills+c.warlockKills>c.demonsEliminated||(!c.rift&&c.riftClock!==0)||(c.quest===6&&(!c.rift||!c.won)))return freshCampaign();
 return {...c};
}
