import type {CharacterProfile} from './character-profile';
export type StartingLoadout={id:string;name:string;image:string;source:string;equipment:readonly string[];status:'reference-approved';};
/** User-provided starting arsenals. IDs bind to existing save-safe roster variants.
 * Equipment descriptions are canon, not a claim that every weapon mechanic is implemented. */
export const STARTING_LOADOUTS:Record<string,StartingLoadout>={
 'witch-seraphine':{id:'witch-1',name:'Cursed bow / familiar',image:'witch-1.webp',source:'B41A2F89-AF90-4ED9-A3DB-A07FB6054BDB(2).jpeg',status:'reference-approved',equipment:['Cursed bow and arrows','Transmutating spirit familiar','Staff of infinite spells','Saber and chained sickle']},
 'witch-vespera':{id:'witch-2',name:'Occult wrist crossbow',image:'witch-2.webp',source:'IMG_6027(2).jpeg',status:'reference-approved',equipment:['Occult wrist crossbow','Returning triangular ritual dagger','Staff of innumerable spells','Extending rapier / smoke gun']},
 'witch-morwen':{id:'witch-3',name:'Cursed stars / eight-head flail',image:'witch-3.webp',source:'IMG_6033(2).jpeg',status:'reference-approved',equipment:['Cursed throwing stars','Staff of endless spells','Eight-headed fang-and-claw flail','Demonic head talismans']},
 'knight-aldric':{id:'knight-1',name:'AK / katana',image:'knight-1.webp',source:'0FE6D164-3A28-4DF9-BBF0-90B44742FB2A(1).jpeg',status:'reference-approved',equipment:['AK-47','Glock 18','SPAS-12','Masamune replica katana']},
 'knight-cassian':{id:'knight-2',name:'SBR / Excalibur',image:'knight-2.webp',source:'18A13DE7-BB39-4526-9018-BD589E0D0606(1).jpeg',status:'reference-approved',equipment:['Suppressed SBR','Akimbo Colt King Cobra','McMillan TAC-50','Excalibur replica']},
 'knight-rook':{id:'knight-3',name:'MP5 / gladius',image:'knight-3.webp',source:'177EC8A8-422B-4CDE-9A46-95E673E70DB3(1).jpeg',status:'reference-approved',equipment:['MP5','Desert Eagle','MG3','Mainz gladius replica']},
};
export const loadoutFor=(profile:CharacterProfile)=>STARTING_LOADOUTS[profile.id]??null;
