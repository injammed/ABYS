export type ClassId='witch'|'knight'|'cyborg'|'alien';
export const CLASSES=[
 {id:'witch',name:'Witch',identity:'Female · she/her',lore:'Human witches who wield starfire.'},
 {id:'knight',name:'Knight',identity:'Male · he/him',lore:'Human knights sworn to protect the refuge.'},
 {id:'cyborg',name:'Cyborg',identity:'Multidimensional · they/them',lore:'A distributed identity embodied across dimensions and machine-organic bodies.'},
 {id:'alien',name:'Alien',identity:'Female · she/her',lore:'Oviparous extraterrestrials: protected eggs mature in nursery chambers, with distinct incubation and communal care stages. Biology is story lore.'},
] as const;
export const classFor=(id:ClassId)=>CLASSES.find(c=>c.id===id)!;
export type CharacterProfile={id:string;classId:ClassId;name:string;title:string;color:number;skin:number;variant:number};
export const CHARACTERS:readonly CharacterProfile[]=[
 {id:'witch-seraphine',classId:'witch',name:'Seraphine',title:'The Starfire Witch',color:0x695182,skin:0xbd9371,variant:0},
 {id:'witch-vespera',classId:'witch',name:'Vespera',title:'The Veil Witch',color:0x344864,skin:0x584435,variant:1},
 {id:'witch-morwen',classId:'witch',name:'Morwen',title:'The Ash Witch',color:0x803f43,skin:0xdac0a2,variant:2},
 {id:'knight-aldric',classId:'knight',name:'Aldric',title:'The Bastion Knight',color:0xbca97c,skin:0xdac0a2,variant:0},
 {id:'knight-cassian',classId:'knight',name:'Cassian',title:'The Iron Knight',color:0x58666e,skin:0x926a4d,variant:1},
 {id:'knight-rook',classId:'knight',name:'Rook',title:'The Crimson Knight',color:0x803f43,skin:0x584435,variant:2},
 {id:'cyborg-parallax',classId:'cyborg',name:'Parallax',title:'The Many-Sided Self',color:0x45898d,skin:0xa9ada4,variant:0},
 {id:'cyborg-nacre',classId:'cyborg',name:'Nacre',title:'The Lattice Walker',color:0xb7ada3,skin:0x77758c,variant:1},
 {id:'cyborg-axiom',classId:'cyborg',name:'Axiom',title:'The Fractured Continuum',color:0x525386,skin:0x747b83,variant:2},
 {id:'alien-saela',classId:'alien',name:'Saela',title:'The Nursery Guardian',color:0x637d4c,skin:0x9cb886,variant:0},
 {id:'alien-nyrra',classId:'alien',name:'Nyrra',title:'The Wreck Explorer',color:0x4b7483,skin:0x8bafb2,variant:1},
 {id:'alien-ithara',classId:'alien',name:'Ithara',title:'The Brood Archivist',color:0x7a5683,skin:0xb28cb7,variant:2},
];
export const freshProfile=():CharacterProfile=>({...CHARACTERS[0]});
// Only a roster ID is trusted. Names, identity and appearance cannot be customized through saves.
export function restoreProfile(raw:unknown):CharacterProfile{
 const id=typeof raw==='string'?raw:raw&&typeof raw==='object'?(raw as {id?:unknown}).id:undefined;
 return {...(CHARACTERS.find(c=>c.id===id)??CHARACTERS[0])};
}
