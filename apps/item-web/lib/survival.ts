import {safe,capitalBounds,roofAt} from './capital-map.ts';
export type Player = {x:number;z:number;health:number;water:number;food:number;stamina:number;bottles:number;rations:number;elapsed:number;looted:string[];helped:boolean;gift:boolean;armed:boolean;ammo:number;reserve:number;defeated:number[]};
export type Obstacle = {x:number;z:number;w:number;d:number};
export const freshPlayer = ():Player=>({x:0,z:3,health:100,water:100,food:100,stamina:100,bottles:2,rations:2,elapsed:0,looted:[],helped:false,gift:false,armed:false,ammo:0,reserve:0,defeated:[]});
export const SUPPLIES = [
 {id:'water-1',x:-8,z:23,kind:'water'},{id:'food-1',x:9,z:31,kind:'food'},
 {id:'med-1',x:-16,z:49,kind:'medicine'},{id:'water-2',x:22,z:68,kind:'water'},
 {id:'food-2',x:-9,z:89,kind:'food'},{id:'med-2',x:12,z:118,kind:'medicine'},
] as const;
export const BUILDINGS:Obstacle[]=[];
for(let row=0;row<5;row++)for(const side of [-1,1])for(let col=0;col<2;col++)BUILDINGS.push({x:side*(25+col*24),z:28+row*25,w:17,d:17});
export const PEDESTALS:Obstacle[]=Array.from({length:43},(_,i)=>({x:i%2?3.3:-3.3,z:-Math.floor(i/2)*6,w:2.05,d:2.05}));
export function canStand(x:number,z:number){
 if(!Number.isFinite(x)||!Number.isFinite(z)||!capitalBounds(x,z))return false;
 if(z<10.65&&Math.abs(x)<6.5&&z>=-132){if(Math.abs(x)>5.2)return false;if(z>9.35&&Math.abs(x)>1.5)return false;}
 if(z>=10.65&&z<11.1&&Math.abs(x)>1.5&&Math.abs(x)<6.5)return false;
 if(roofAt(x,z)>0)return false;
 const obstacles=safe(x,z)?[...PEDESTALS,{x:2.6,z:6,w:1,d:.7}]:[...BUILDINGS,{x:-12,z:65,w:10,d:10}];
 return !obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.35&&Math.abs(z-o.z)<o.d/2+.35);
}
export function advance(p:Player,dt:number,running:boolean){
 dt=Math.max(0,Math.min(.1,dt));if(p.health<=0)return;
 p.elapsed+=dt;p.stamina=Math.max(0,Math.min(100,p.stamina+dt*(running?-20:12)));
 if(!safe(p.x,p.z)){p.water=Math.max(0,p.water-dt*(running?.22:.1));p.food=Math.max(0,p.food-dt*.055);if(!p.water||!p.food)p.health=Math.max(0,p.health-dt*2);}
}
export function consume(p:Player,kind:'water'|'food'){
 if(kind==='water'&&p.bottles>0&&p.water<100){p.bottles--;p.water=Math.min(100,p.water+40);return 'Water restored.';}
 if(kind==='food'&&p.rations>0&&p.food<100){p.rations--;p.food=Math.min(100,p.food+35);return 'Hunger eased.';}
 return kind==='water'?'No water needed, or no bottles left.':'No food needed, or no rations left.';
}
export function collect(p:Player,id:string){
 const supply=SUPPLIES.find(s=>s.id===id);if(!supply||p.looted.includes(id)||Math.hypot(p.x-supply.x,p.z-supply.z)>3)return false;
 p.looted.push(id);if(supply.kind==='water')p.bottles+=2;else if(supply.kind==='food')p.rations+=2;else p.health=Math.min(100,p.health+40);return true;
}
export function armPlayer(p:Player){
 if(p.armed)return false;p.armed=true;p.ammo=30;p.reserve=90;return true;
}
export function spendRound(p:Player){if(!p.armed||p.ammo<=0||p.health<=0||safe(p.x,p.z))return false;p.ammo--;return true;}
export function reloadWeapon(p:Player){const rounds=Math.min(30-p.ammo,p.reserve);if(!p.armed||rounds<=0)return false;p.ammo+=rounds;p.reserve-=rounds;return true;}
export function talk(p:Player,npc:'keeper'|'visitor',raw:string){
 const text=raw.toLowerCase().slice(0,300);
 if(npc==='keeper'){
  if(/quest|mission|refugee|outbreak|evac|quarantine|nuclear/.test(text))return 'Five million refugees came to the capital. One infection can become thousands. Open the field map with M. Restore the hospital, quarantine relay and evacuation route. Aegis offers a fictional strike, but civilian losses are permanent. Containment is another path.';
  if(/ak.?47|weapon|rifle|gun|ammo|shoot/.test(text)){if(armPlayer(p))return 'Take this AK-47 and 120 rounds. Click or F fires; T reloads. The cathedral is a safe zone.';return 'You have my AK-47. Click or F fires; T reloads. I have no more ammunition to spare.';}
  if(/help|suppl|food|water|hungr|thirst/.test(text)){if(!p.gift){p.gift=true;p.bottles++;p.rations++;return 'Take a bottle and a ration. This is all I can spare. Outside, look for the green supply crates. Q drinks; R eats.';}return 'I already gave you my spare supplies. Search the crates along the central avenue. This cathedral is safe.';}
  if(/terminal|library|shop|upload|apyoc|trough/.test(text))return 'The green terminal beside me holds the entire library. Walk to it and press E. You can return to your body when you close it.';
  if(/outside|city|danger|war|robot|zombie|surviv|alien|f.?49|vtol|gunship/.test(text))return 'Infected roam the avenue. Spined aliens rush you; rifle robots fire lasers. The F-49 is on the pad outside: E boards, Space rises, C descends, click or F fires. Land before exiting.';
  if(/who|name|hello|hi\b/.test(text))return 'I am Mara, the keeper. I keep the doors open. Ask me for help, about the terminal, or about the city.';
 }else{
  if(/give|share|offer|trade/.test(text)&&/water|bottle|drink/.test(text)){
   if(p.helped)return 'You already shared water with me. I will remember it. I have nothing else to trade.';
   if(p.bottles<1)return 'You have no water to spare. Find a sealed bottle first.';
   p.bottles--;p.rations+=2;p.helped=true;return 'Water. Thank you. Take two of our sealed rations. Your atmosphere burns; our ship will not leave again.';
  }
  if(/ship|crash|who|name|alien|hello/.test(text))return 'I am Iri. Our landing failed. I need water. If you can spare a bottle, say “give water.” I have food to exchange.';
  if(/food|water|help|thirst/.test(text))return 'One bottle of water for two rations. Say “give water” if you want to trade. I cannot promise more.';
 }
 return npc==='keeper'?'I do not know how to help with that yet. Ask about supplies, the terminal, or dangers outside.':'I do not understand. Ask about the ship, or offer water.';
}
export function restorePlayer(raw:string|null):Player{
 const fallback=freshPlayer();if(!raw||raw.length>5000)return fallback;
 try{const data=JSON.parse(raw);const p=data.player;if(data.version!==1||!p||!canStand(p.x,p.z))return fallback;
 for(const k of ['health','water','food','stamina'] as const)if(!Number.isFinite(p[k])||p[k]<0||p[k]>100)return fallback;
 if(p.health===0)return fallback;
 for(const k of ['bottles','rations','elapsed'] as const)if(!Number.isFinite(p[k])||p[k]<0||p[k]>1e7)return fallback;
 if(!Number.isInteger(p.bottles)||!Number.isInteger(p.rations)||typeof p.gift!=='boolean'||typeof p.helped!=='boolean'||!Array.isArray(p.looted)||p.looted.length>6||new Set(p.looted).size!==p.looted.length||p.looted.some((id:string)=>!SUPPLIES.some(s=>s.id===id)))return fallback;
 const armed=p.armed??false,ammo=p.ammo??0,reserve=p.reserve??0,defeated=p.defeated??[];
 if(typeof armed!=='boolean'||!Number.isInteger(ammo)||ammo<0||ammo>30||!Number.isInteger(reserve)||reserve<0||reserve>90||(!armed&&(ammo||reserve))||!Array.isArray(defeated)||defeated.length>10||new Set(defeated).size!==defeated.length||defeated.some((id:number)=>!Number.isInteger(id)||id<0||id>9))return fallback;
 return {...fallback,...p,armed,ammo,reserve,defeated};
 }catch{return fallback;}
}

// This first district supports bounded VTOL flight along its open corridors.
export function flightFloor(x:number,z:number){let height=0;for(const dx of [-2,2])for(const dz of [-2,2]){height=Math.max(height,roofAt(x+dx,z+dz));BUILDINGS.forEach((b,i)=>{if(Math.abs(x+dx-b.x)<b.w/2&&Math.abs(z+dz-b.z)<b.d/2)height=Math.max(height,10+(i*17)%31);});}return height?height+3:1.4;}
export function canHover(x:number,z:number,altitude=1.4){return capitalBounds(x,z)&&!safe(x,z)&&altitude>=flightFloor(x,z)&&[-2,2].every(dx=>[-2,2].every(dz=>altitude>flightFloor(x+dx,z+dz)+2||canStand(x+dx,z+dz)));}
export function landingSpot(x:number,z:number){for(const [dx,dz] of [[-4,0],[4,0],[0,-5],[0,5]])if(canStand(x+dx,z+dz))return {x:x+dx,z:z+dz};return null;}
