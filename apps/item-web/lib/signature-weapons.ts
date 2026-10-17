import {CHARACTERS,type CharacterProfile} from './character-profile.ts';
import type {GearKind} from './scavenge.ts';
export type Signature={name:string;kind:GearKind;damage:number;range:number;delay:number};
// Character-bound abilities use renewable cooldowns, never a replaceable loot slot.
const definitions:Signature[]=[
 {name:'Cursed bow',kind:'pistol',damage:2,range:85,delay:.8},
 {name:'Occult wrist crossbow',kind:'pistol',damage:1.6,range:70,delay:.55},
 {name:'Cursed throwing stars',kind:'pistol',damage:1.2,range:40,delay:.35},
 {name:'Masamune katana',kind:'sword',damage:3,range:3.5,delay:.55},
 {name:'Excalibur',kind:'sword',damage:4,range:3.3,delay:.8},
 {name:'Mainz gladius',kind:'sword',damage:2,range:2.7,delay:.3},
 {name:'White-hot war axe',kind:'axe',damage:5,range:3,delay:1},
 {name:'Forearm lance',kind:'sword',damage:3,range:4.5,delay:.65},
 {name:'Golden optic beam',kind:'ak',damage:1.5,range:90,delay:.4},
 {name:'Magneto-fusion beam',kind:'ak',damage:4,range:100,delay:1.2},
 {name:'Reactor laser rifle',kind:'ak',damage:2,range:90,delay:.65},
 {name:'Micro-reactor lightning rifle',kind:'ak',damage:2.5,range:80,delay:.8},
];
export const MAX_SIGNATURE_LEVEL=10;
export type SignatureLevels=Record<string,number>;
export function restoreSignatureLevels(raw:unknown):SignatureLevels{const source=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};return Object.fromEntries(CHARACTERS.map(c=>[c.id,typeof source[c.id]==='number'&&Number.isFinite(source[c.id])?Math.max(1,Math.min(10,Math.floor(source[c.id] as number))):1]));}
export const signatureLevel=(levels:SignatureLevels,id:string)=>levels[id]??1;
export const upgradeCost=(levels:SignatureLevels,id:string)=>signatureLevel(levels,id)>=10?0:250*signatureLevel(levels,id);
export function upgradeSignature(levels:SignatureLevels,id:string,wallet:{cash:number}){const cost=upgradeCost(levels,id);if(!CHARACTERS.some(c=>c.id===id)||!cost||wallet.cash<cost)return false;wallet.cash-=cost;levels[id]=signatureLevel(levels,id)+1;return true;}
export function signatureFor(profile:CharacterProfile,level=1):Signature{const base=definitions[CHARACTERS.findIndex(c=>c.id===profile.id)]??definitions[0],tier=Math.max(1,Math.min(10,level))-1;return {...base,damage:base.damage*(1+tier*.22),range:base.range*(1+tier*.025),delay:base.delay/(1+tier*.06)};}
