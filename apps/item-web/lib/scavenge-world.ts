import type {CharacterProfile} from './character-profile';
import * as T from 'three';
import {GEAR,LOOT,type GearKind} from './scavenge';
export function gearMesh(kind:GearKind|'armor',signature?:CharacterProfile){
 const group=new T.Group(),metal=new T.MeshStandardMaterial({color:signature?signature.color:kind==='staff'?0x9870ff:kind==='armor'?0xc2bca9:0x545966,metalness:.7,roughness:.35});
 const part=(w:number,h:number,d:number,x=0,y=0,z=0)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),metal);m.position.set(x,y,z);group.add(m);};
 if(signature?.classId==='witch'){if(signature.variant===0){const curve=new T.EllipseCurve(0,0,.28,.6,-Math.PI/2,Math.PI/2,false,0);const bow=new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(32)),new T.LineBasicMaterial({color:signature.color}));group.add(bow);part(.02,1.2,.02,0,0,0);part(.02,.02,.8,0,0,-.35);}else if(signature.variant===1){part(.6,.06,.08);part(.07,.08,.5,0,0,-.2);}else{const star=new T.Mesh(new T.OctahedronGeometry(.23,0),metal);star.scale.set(1,.15,1);group.add(star);}}
 else if(kind==='armor'){part(.65,.8,.25);part(.26,.15,.3,-.45,.25);part(.26,.15,.3,.45,.25);}
 else if(GEAR[kind].melee){part(.08,.08,.85,0,0,-.25);part(.35,.06,.08,0,0,.1);if(kind!=='sword')part(kind==='axe'?.4:.3,.2,.2,0,0,-.65);}
 else if(kind==='staff'){part(.06,1.6,.06);const orb=new T.Mesh(new T.IcosahedronGeometry(.16,1),metal);orb.position.y=.85;group.add(orb);}
 else{part(.12,.14,kind==='pistol'?.35:.8,0,0,-.2);part(.1,.25,.12,0,-.14);if(kind==='ak')part(.09,.27,.14,0,-.16,-.3);}
 if(signature){const seal=new T.Mesh(new T.TorusGeometry(.1,.02,5,16),new T.MeshBasicMaterial({color:0xffd56b}));seal.position.set(0,.1,0);group.add(seal);group.scale.setScalar(1+signature.variant*.08);}
 return group;
}
export function buildLoot(){const root=new T.Group();const entries=LOOT.map(item=>{const mesh=gearMesh(item.kind);mesh.position.set(item.x,.65,item.z);root.add(mesh);const ring=new T.Mesh(new T.TorusGeometry(.65,.035,5,20),new T.MeshBasicMaterial({color:item.kind==='staff'?0xb18aff:0x72c7ef}));ring.rotation.x=Math.PI/2;ring.position.y=-.55;mesh.add(ring);return {...item,mesh};});return {root,entries};}
