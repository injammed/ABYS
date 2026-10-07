// Fictional campaign: independent of the public library's observation tools.
export const WIZARD_HEALTH=48;
export const BUNKER={x:120,z:1600};
export const HORIZON_MISSIONS=[
 {id:'horizon-evidence',name:'Alien infection archive',x:105,z:255,task:'Recover the alien-virus record. The infection, possession and machine takeover are three linked threats.'},
 {id:'horizon-relay',name:'APY0C command relay',x:175,z:445,task:'Disconnect the wizard’s command channel. Recover the bunker access key.'},
 {id:'horizon-bunker',name:'Dark wizard’s nuclear bunker',x:120,z:1582,task:'Unlock the reinforced lair. Defeat the dark wizard inside with the AK-47, Starfall or F-49.'},
 {id:'horizon-lens',name:'Eye of Horizons · severance',x:120,z:1609,task:'After defeating the wizard, sever the black-hole observation link and quarantine corrupted APY0C. Restore agency through the Transcendence Protocol.'},
] as const;
export type HorizonQuest={stage:number;wizardHealth:number;lensSevered:boolean};
export const freshHorizon=():HorizonQuest=>({stage:0,wizardHealth:WIZARD_HEALTH,lensSevered:false});
export function restoreHorizon(raw:unknown):HorizonQuest{
 const h=raw as HorizonQuest;
 if(!h||!Number.isInteger(h.stage)||h.stage<0||h.stage>4||!Number.isInteger(h.wizardHealth)||h.wizardHealth<0||h.wizardHealth>WIZARD_HEALTH||typeof h.lensSevered!=='boolean'||h.lensSevered!==(h.stage===4)||(h.stage<3&&h.wizardHealth!==WIZARD_HEALTH)||(h.stage===4&&h.wizardHealth!==0))return freshHorizon();
 return {stage:h.stage,wizardHealth:h.wizardHealth,lensSevered:h.lensSevered};
}
export function horizonAction(h:HorizonQuest,id:string){
 const i=HORIZON_MISSIONS.findIndex(m=>m.id===id);if(i<0)return 'Unknown Horizon station.';
 if(i<h.stage)return 'Horizon station secured.';
 if(i>h.stage)return `First: ${HORIZON_MISSIONS[h.stage].task}`;
 if(i===3&&h.wizardHealth>0)return `The wizard still holds the Eye. Defeat him first · ${h.wizardHealth}/${WIZARD_HEALTH} health.`;
 h.stage++;
 if(i===0)return 'Evidence recovered: an alien-engineered infection, demonic possession and APY0C’s robotic takeover. The wizard corrupted the machine mind. Find its command relay.';
 if(i===1)return 'Command channel disconnected. Bunker key recovered. The Eye of Horizons still watches galactic life through its fictional black-hole lens. Reach the wizard’s lair.';
 if(i===2)return 'Bunker unlocked. The dark wizard is inside. His curse marks the ground before it strikes: keep moving and use cover.';
 h.lensSevered=true;return 'Eye of Horizons severed. APY0C quarantined; robot patrols shut down. Transcendence restores human agency. Infection and demons still require containment. Continue rescuing survivors.';
}
export function hitWizard(h:HorizonQuest,damage:number){
 if(h.stage!==3||h.wizardHealth===0||!Number.isFinite(damage)||damage<=0)return false;
 h.wizardHealth=Math.max(0,h.wizardHealth-Math.floor(damage));return h.wizardHealth===0;
}
export const humanityVictory=(h:HorizonQuest,c:{won:boolean;saved:number})=>h.lensSevered&&c.won&&c.saved>0;
export function bunkerWalkable(x:number,z:number,unlocked:boolean){
 const dx=x-BUNKER.x,dz=z-BUNKER.z;
 if(Math.abs(dx)>14||dz< -19||dz>19)return true;
 if(Math.abs(dx)>12||dz>17)return false;
 if(dz< -17)return unlocked&&Math.abs(dx)<3;
 // Consoles and lens pedestal are solid; the room remains accessible around them.
 return !(Math.abs(dx)<3&&Math.abs(dz-4)<3)&&!(Math.abs(dx)>9&&dz>6);
}

export const bunkerRoofAt=(x:number,z:number)=>Math.abs(x-BUNKER.x)<=14&&Math.abs(z-BUNKER.z)<=19?15:0;
export const bunkerGroundSaveValid=(x:number,z:number,h:HorizonQuest)=>(h.stage>=3||bunkerRoofAt(x,z)===0)&&bunkerWalkable(x,z,h.stage>=3);
