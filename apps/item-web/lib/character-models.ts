import * as T from 'three';
import {batchModel} from './model-utils.ts';
export type CharacterRole='refugee'|'player'|'mara'|'iri'|'infected';
export function characterModel(color:number,role:CharacterRole='refugee'){
 const root=new T.Group();root.name=role==='mara'?'Mara · cathedral keeper':role==='iri'?'Iri · stranded visitor':role==='player'?'Player · refuge ranger':role==='infected'?'Infected survivor':'Refugee';
 const cloth=new T.MeshStandardMaterial({color,roughness:.9}),skin=new T.MeshStandardMaterial({color:role==='iri'?0x8bafb2:role==='infected'?0x85927e:0xbc997e,roughness:.85});
 const dark=new T.MeshStandardMaterial({color:0x252a2b,roughness:.65}),leather=new T.MeshStandardMaterial({color:0x594536,roughness:.8});
 const detail=new T.MeshStandardMaterial({color:role==='player'?0x667a70:0xbbaa80,metalness:.35,roughness:.5});
 const mesh=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Group=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
 const ell=(x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material,parent=root)=>{const o=mesh(new T.SphereGeometry(1,12,10),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;};
 ell(0,1.1,0,.29,.39,.18,cloth);ell(0,.77,0,.25,.13,.17,dark);
 mesh(new T.CylinderGeometry(.085,.095,.13,8),skin,0,1.48,0);ell(0,1.69,0,.185,.24,.16,skin);
 const eyes=new T.MeshBasicMaterial({color:role==='infected'?0xff832b:role==='iri'?0x10101e:0x303632});
 for(const side of [-1,1]){ell(side*.065,1.73,-.147,role==='iri'?.052:.025,.018,.012,eyes);ell(side*.18,1.68,0,.028,.05,.025,skin);}
 ell(0,1.69,-.167,.025,.06,.025,skin);mesh(new T.BoxGeometry(.085,.012,.01),dark,0,1.6,-.15);
 if(role!=='infected'){ell(0,1.83,.025,.19,.1,.16,dark);for(let i=0;i<6;i++)ell((i-2.5)*.045,1.83,-.1,.028,.08,.03,dark);}
 const legs:T.Group[]=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.145,.79,0);root.add(leg);mesh(new T.CapsuleGeometry(.085,.28,4,8),cloth,0,-.2,0,leg);ell(0,-.39,-.005,.09,.09,.085,detail,leg);mesh(new T.CapsuleGeometry(.072,.24,4,8),cloth,0,-.55,.015,leg);ell(0,-.72,-.06,.105,.075,.16,leather,leg);legs.push(leg);
  mesh(new T.CapsuleGeometry(.075,.22,4,8),cloth,side*.34,1.23,0).rotation.z=side*.15;mesh(new T.CapsuleGeometry(.06,.2,4,8),cloth,side*.38,.95,-.025).rotation.x=-.1;ell(side*.38,.76,-.045,.062,.09,.055,skin);
  mesh(new T.BoxGeometry(.13,.15,.055),leather,side*.17,.83,-.17);mesh(new T.BoxGeometry(.11,.014,.015),detail,side*.17,.86,-.21);
 }
 if(role==='player'){mesh(new T.BoxGeometry(.43,.4,.11),detail,0,1.2,-.18);for(let i=0;i<3;i++)mesh(new T.BoxGeometry(.085,.16,.08),leather,(i-1)*.12,1.1,-.27);mesh(new T.BoxGeometry(.34,.43,.16),dark,0,1.18,.23);}
 if(role==='mara'){mesh(new T.CylinderGeometry(.28,.43,.65,12),cloth,0,.78,0);mesh(new T.TorusGeometry(.18,.065,6,16),detail,0,1.43,0).rotation.x=Math.PI/2;mesh(new T.BoxGeometry(.12,.5,.04),detail,.12,1.14,-.21);}
 if(role==='iri'){for(const side of [-1,1])ell(side*.21,1.79,.02,.04,.17,.05,skin);root.scale.set(.86,1.08,.86);}
 const possession=new T.Group();possession.visible=false;root.add(possession);
 if(role==='infected'){const flame=new T.MeshBasicMaterial({color:0xff6e18});for(let i=0;i<6;i++){const o=mesh(new T.ConeGeometry(.07,.25,5),flame,(i%2?1:-1)*.16,.9+i*.14,-.2,possession);o.rotation.z=(i%2?1:-1)*.4;}ell(0,1.75,-.16,.15,.045,.03,new T.MeshBasicMaterial({color:0xffe174}),possession);for(let i=0;i<5;i++)ell((i%2?1:-1)*.19,1+i*.13,-.18,.045,.08,.02,leather);root.rotation.z=.04;}
 root.userData.legs=legs;root.userData.possession=possession;return batchModel(root);
}
