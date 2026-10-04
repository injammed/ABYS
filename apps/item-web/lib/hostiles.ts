export type EnemyKind='infected'|'robot'|'alien';
export const HOSTILES:{kind:EnemyKind;x:number;z:number}[]=[
 {kind:'infected',x:-5,z:38},{kind:'infected',x:7,z:52},{kind:'infected',x:-9,z:66},{kind:'infected',x:5,z:80},{kind:'infected',x:-7,z:94},
 {kind:'robot',x:8,z:58},{kind:'robot',x:-5,z:106},
 {kind:'alien',x:-7,z:49},{kind:'alien',x:7,z:88},{kind:'alien',x:-7,z:126},
];
export const ENEMY_STATS={infected:{hits:2,speed:1.5,range:16,damage:7},robot:{hits:5,speed:2,range:30,damage:12},alien:{hits:4,speed:3.1,range:22,damage:14}};
export const F49_SPAWN={x:8,z:19,y:1.4};
