import * as T from 'three';
import {batchModel} from './model-utils.ts';
import type {DemonKind} from './capital-campaign';
export const DEMON_STATS={goblin:{hits:3,speed:4,range:40,damage:9,height:.9144},titan:{hits:30,speed:3,range:140,damage:30,height:60.96},warlock:{hits:6,speed:2.4,range:60,damage:15,height:2.8}};
export function demonModel(kind:DemonKind){
 const root=new T.Group();root.name=kind==='goblin'?'Greeble goblin · 3 feet':kind==='titan'?'Crust titan · 200 feet':'Floating witch / warlock';
 const flesh=new T.MeshStandardMaterial({color:kind==='goblin'?0x6c7850:kind==='titan'?0x3c2828:0x392b4c,roughness:.86});
 const bone=new T.MeshStandardMaterial({color:0xbaa886,roughness:.7}),lava=new T.MeshBasicMaterial({color:kind==='warlock'?0xc67eff:0xff6823}),black=new T.MeshStandardMaterial({color:0x15101b,roughness:.85});
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
 const ell=(x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material,parent=root)=>{const o=add(new T.SphereGeometry(1,12,8),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;};
 ell(0,1.5,0,.65,.85,.4,flesh);ell(0,2.55,-.05,.43,.48,.35,flesh);ell(0,2.38,-.34,.3,.23,.16,black);
 for(const side of [-1,1]){ell(side*.17,2.65,-.37,.08,.045,.035,lava);const horn=add(new T.ConeGeometry(.16,.85,8),bone,side*.35,3.02,.03);horn.rotation.z=-side*.45;
  ell(side*.85,1.5,0,.22,.65,.22,flesh);ell(side*.96,.89,-.08,.2,.24,.2,flesh);for(let j=0;j<3;j++)add(new T.ConeGeometry(.045,.32,6),bone,side*.96+(j-1)*.1,.66,-.18).rotation.x=Math.PI;
  for(let j=0;j<5;j++)add(new T.ConeGeometry(.035,.18,5),bone,side*(.03+j*.05),2.4,-.48).rotation.x=Math.PI;
 }
 const legs:T.Group[]=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.34,.94,0);root.add(leg);ell(0,-.29,0,.19,.4,.18,flesh,leg);ell(0,-.75,-.1,.22,.18,.3,black,leg);legs.push(leg);}
 for(let j=0;j<14;j++){const angle=j*2.399;ell(Math.sin(angle)*.56,1+((j*7)%13)*.09,Math.cos(angle)*.38,.07,.09,.05,j%4===0?lava:flesh);}
 if(kind==='warlock'){const robe=add(new T.ConeGeometry(.9,2.1,12,1,true),black,0,1.1,0);robe.rotation.x=Math.PI;const halo=add(new T.TorusGeometry(.65,.035,6,32),lava,0,2.85,.04);halo.rotation.x=.35;for(const side of [-1,1])add(new T.TorusGeometry(.3,.025,6,20),lava,side*1.08,1.08,-.12);}
 if(kind==='titan'){for(let i=0;i<7;i++){const plate=add(new T.BoxGeometry(1.12-i*.055,.055,.035),lava,0,1.05+i*.17,-.4);plate.rotation.z=Math.sin(i)*.07;}for(const side of [-1,1])for(let i=0;i<3;i++)add(new T.ConeGeometry(.16,.6,6),bone,side*(.55+i*.14),2.05+i*.07,0).rotation.z=-side*.6;}
 batchModel(root);const height=new T.Box3().setFromObject(root).getSize(new T.Vector3()).y;root.scale.setScalar(DEMON_STATS[kind].height/height);root.userData.legs=legs;return root;
}
