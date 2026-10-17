export const GEAR={
 ak:{name:'AK',uses:60,range:90,damage:1,delay:.14,melee:false},
 pistol:{name:'Pistol',uses:24,range:65,damage:1,delay:.3,melee:false},
 shotgun:{name:'Shotgun',uses:12,range:22,damage:3,delay:.8,melee:false},
 sword:{name:'Sword',uses:35,range:3,damage:2,delay:.55,melee:true},
 axe:{name:'Axe',uses:25,range:2.8,damage:3,delay:.8,melee:true},
 hammer:{name:'Hammer',uses:20,range:2.6,damage:4,delay:1,melee:true},
 staff:{name:'Exotic Starfall staff',uses:4,range:180,damage:10,delay:6,melee:false},
} as const;
export type GearKind=keyof typeof GEAR;
export type HeldGear={kind:GearKind;uses:number};
export type Scavenge={taken:number[];hands:(HeldGear|null)[];armor:number[]};
export const freshScavenge=():Scavenge=>({taken:[],hands:[null,{kind:'ak',uses:60},{kind:'ak',uses:60}],armor:[0,0,0]});
export function restoreScavenge(raw:unknown):Scavenge{const s=freshScavenge();if(!raw||typeof raw!=='object')return s;const r=raw as Partial<Scavenge>;s.taken=Array.isArray(r.taken)?[...new Set(r.taken.filter(n=>Number.isInteger(n)&&n>=0&&n<1000))]:[];for(let i=0;i<3;i++){const h=r.hands?.[i];if(h&&Object.hasOwn(GEAR,h.kind)&&Number.isFinite(h.uses))s.hands[i]={kind:h.kind,uses:Math.max(0,Math.min(GEAR[h.kind].uses,Math.floor(h.uses)))};s.armor[i]=Math.max(0,Math.min(100,Number(r.armor?.[i])||0));}return s;}
export function takeGear(s:Scavenge,id:number,kind:GearKind|'armor',slot:number){if(s.taken.includes(id))return false;s.taken.push(id);if(kind==='armor')s.armor[slot]=100;else s.hands[slot]={kind,uses:GEAR[kind].uses};return true;}
export function useGear(s:Scavenge,slot:number){const h=s.hands[slot];if(!h||h.uses<=0)return false;h.uses--;return true;}
export function discardGear(s:Scavenge,slot:number){s.hands[slot]=null;}
// Fixed per-run placements: two exotic finds out of 202 items, never respawn until a new run.
export const LOOT=Array.from({length:202},(_,i)=>({id:i,kind:(i>=200?'staff':['ak','pistol','sword','armor','shotgun','axe','hammer'][i%7]) as GearKind|'armor',x:i<7?-8+i*2:Math.sin(i*2.399)* (45+(i%20)*25),z:i<7?19:40+Math.floor(i/20)*100+(i%20)*3}));
