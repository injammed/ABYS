import * as T from 'three';
import type {CharacterProfile} from './character-profile.ts';
import {disposeSurface,surfaceMaterial} from './world-materials.ts';
import {batchModel} from './model-utils.ts';
export type CharacterRole='refugee'|'player'|'mara'|'iri'|'infected';
export function characterModel(color:number,role:CharacterRole='refugee',profile?:CharacterProfile){
 const root=new T.Group();root.name=role==='mara'?'Mara · cathedral keeper':role==='iri'?'Iri · stranded visitor':role==='player'?'Player · refuge ranger':role==='infected'?'Infected survivor':'Refugee';
 if(profile){root.name=profile.name;color=profile.color;}
 const cloth=surfaceMaterial('cloth',color,3),skin=new T.MeshStandardMaterial({color:profile?profile.skin:role==='iri'?0x8bafb2:role==='infected'?0x85927e:0xbc997e,roughness:.85});
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
 // Clothing construction and equipment establish role before effects or labels.
 for(const side of [-1,1]){mesh(new T.BoxGeometry(.035,.36,.025),leather,side*.18,1.18,-.18).rotation.z=side*.17;mesh(new T.BoxGeometry(.13,.035,.06),dark,side*.14,.78,-.17);ell(side*.065,1.76,-.147,.035,.012,.015,skin);}
 if(role==='mara'){const hood=ell(0,1.75,.045,.235,.27,.19,cloth);hood.position.z=.075;mesh(new T.BoxGeometry(.18,.12,.06),leather,-.15,.85,-.25);ell(0,1.38,-.2,.035,.035,.018,detail);}
 if(role==='player'){for(const side of [-1,1]){ell(side*.32,1.4,0,.13,.09,.16,detail);mesh(new T.BoxGeometry(.08,.05,.06),detail,side*.38,.8,-.09);}mesh(new T.BoxGeometry(.22,.12,.07),leather,0,1.42,-.2);}
 if(role==='infected'){for(let i=0;i<5;i++){mesh(new T.BoxGeometry(.09,.17,.02),dark,(i%2?1:-1)*.16,1.3-i*.09,-.175).rotation.z=i*.6;}mesh(new T.BoxGeometry(.12,.08,.02),skin,0,1.06,-.19);}
 if(profile){
  const v=profile.variant;
  if(profile.classId==='witch'){mesh(new T.CylinderGeometry(.25,.42,.7,12),cloth,0,.65,0);mesh(new T.ConeGeometry(.24,.43+v*.06,10),cloth,0,2.07,0);mesh(new T.CylinderGeometry(.32,.32,.035,12),dark,0,1.88,0);}
  if(profile.classId==='knight'){for(const side of [-1,1])ell(side*.34,1.4,0,.18,.15,.19,detail);mesh(new T.BoxGeometry(.39,.45,.12),detail,0,1.2,-.24);root.scale.set(1.08,1+v*.025,1.08);}
  if(profile.classId==='cyborg'){const glow=new T.MeshBasicMaterial({color:0x75e7df});for(let i=0;i<3+v;i++)mesh(new T.BoxGeometry(.025,.12,.03),glow,(i-1-v/2)*.06,1.28,-.255);for(const side of [-1,1])mesh(new T.BoxGeometry(.07,.34,.09),detail,side*.22,1.86,.05);}
  if(profile.classId==='alien'){for(let i=0;i<3+v;i++)mesh(new T.ConeGeometry(.055,.22+i*.025,6),skin,(i-1-v/2)*.07,1.97,.055);root.scale.set(.9,1.08+v*.03,.9);}
 }
 // Nacre: body-local right is negative X because the character faces -Z.
 if(profile?.id==='cyborg-nacre'){
  const shell=new T.MeshStandardMaterial({color:0x32343a,metalness:.8,roughness:.32}),edge=new T.MeshStandardMaterial({color:0x9a8260,metalness:.8,roughness:.35});
  const green=new T.MeshBasicMaterial({color:0x72ff30}),hot=new T.MeshBasicMaterial({color:0xffe9ab}),blue=new T.MeshBasicMaterial({color:0x738fff});
  ell(0,1.7,0,.205,.245,.18,shell);mesh(new T.BoxGeometry(.3,.045,.04),blue,0,1.73,-.177);
  mesh(new T.BoxGeometry(.49,.48,.15),shell,0,1.2,-.25);for(const side of [-1,1]){ell(side*.35,1.4,0,.2,.15,.2,shell);mesh(new T.BoxGeometry(.19,.31,.18),shell,side*.38,.95,-.03);}
  // Compact six-barrel shoulder minigun, parallel with the forward axis.
  const gun=new T.Group();gun.position.set(-.38,1.63,-.12);root.add(gun);
  mesh(new T.BoxGeometry(.24,.23,.29),shell,0,0,.03,gun);
  for(let n=0;n<6;n++){const angle=n*Math.PI/3;const barrel=mesh(new T.CylinderGeometry(.026,.026,.4,8),edge,Math.cos(angle)*.075,Math.sin(angle)*.075,-.27,gun);barrel.rotation.x=Math.PI/2;}
  mesh(new T.TorusGeometry(.1,.022,6,16),shell,0,0,-.41,gun);
  mesh(new T.BoxGeometry(.31,.32,.26),shell,.38,1.63,-.1);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){const tube=mesh(new T.CylinderGeometry(.033,.033,.08,8),edge,.29+col*.09,1.54+row*.09,-.26);tube.rotation.x=Math.PI/2;ell(.29+col*.09,1.54+row*.09,-.305,.017,.017,.008,hot);}
  // Integrated arm weapons follow the forearm axis rather than being hand-held.
  mesh(new T.BoxGeometry(.15,.38,.15),shell,-.38,.79,-.045);mesh(new T.BoxGeometry(.05,.31,.165),green,-.38,.79,-.05);
  const spear=new T.Mesh(new T.OctahedronGeometry(1,0),hot.clone());spear.scale.set(.065,.48,.028);spear.position.set(.38,.45,-.045);root.add(spear);
  mesh(new T.BoxGeometry(.12,.22,.12),edge,.38,.77,-.045);
  root.userData.loadout='nacre-v2';root.userData.mounts={rightShoulder:'minigun',leftShoulder:'swarm',leftForearm:'spear',rightForearm:'green-laser'};
 }
 const possession=new T.Group();possession.visible=false;root.add(possession);
 if(role==='infected'){const flame=new T.MeshBasicMaterial({color:0xff6e18});for(let i=0;i<6;i++){const o=mesh(new T.ConeGeometry(.07,.25,5),flame,(i%2?1:-1)*.16,.9+i*.14,-.2,possession);o.rotation.z=(i%2?1:-1)*.4;}ell(0,1.75,-.16,.15,.045,.03,new T.MeshBasicMaterial({color:0xffe174}),possession);for(let i=0;i<5;i++)ell((i%2?1:-1)*.19,1+i*.13,-.18,.045,.08,.02,leather);root.rotation.z=.04;}
 root.userData.legs=legs;root.userData.possession=possession;batchModel(root);root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});return root;
}

// Keep the avatar root and its purchased gear stable when a new preset is chosen.
export function applyPresetCharacter(root:T.Group,profile:CharacterProfile,gear:T.Group){
 root.remove(gear);const materials=new Set<T.Material>();
 root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});
 materials.forEach(disposeSurface);root.clear();
 const model=characterModel(profile.color,'player',profile);root.scale.copy(model.scale);root.name=profile.name;root.userData=model.userData;root.add(...model.children.slice(),gear);
}
