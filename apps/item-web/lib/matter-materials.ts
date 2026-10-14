/** Dimensionless game-material coefficients. No engineering or tissue calibration. */
export const MATERIALS={
 ceramic:{label:'Ceramic',color:0xe6ddcd,density:1.8,stiffness:.9,stretch:1.3,toughness:.7,friction:.3,damping:.99},
 gel:{label:'Synthetic gel',color:0xe5aa61,density:1,stiffness:.25,stretch:2.4,toughness:.8,friction:.4,damping:.97},
 flesh:{label:'Synthetic flesh',color:0xc58b76,density:1,stiffness:.18,stretch:2.8,toughness:1,friction:.45,damping:.96},
 bone:{label:'Synthetic bone',color:0xf1e9ce,density:1.9,stiffness:.95,stretch:1.2,toughness:1.5,friction:.3,damping:.99},
 concrete:{label:'Concrete',color:0x898c87,density:2.4,stiffness:.95,stretch:1.18,toughness:1.5,friction:.5,damping:.985},
 brick:{label:'Brick / mortar',color:0xaf6142,density:1.9,stiffness:.85,stretch:1.22,toughness:1.1,friction:.5,damping:.985},
 glass:{label:'Glass',color:0x87dce4,density:2.5,stiffness:.98,stretch:1.08,toughness:.35,friction:.15,damping:.995},
 alloy:{label:'APY0C void lattice · fictional',color:0x5f567e,density:4,stiffness:.75,stretch:1.7,toughness:3.5,friction:.2,damping:.992},
} as const;
export type MaterialId=keyof typeof MATERIALS;
export const ATTUM_LEVELS=[.25,.18,.125,.1] as const;
export type AttumSize=typeof ATTUM_LEVELS[number];
