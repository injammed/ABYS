import {MatterRefinement} from './matter-refinement.ts';
import {MATERIALS,ATTUM_LEVELS,type MaterialId,type AttumSize} from './matter-materials.ts';
import {MatterEngine,STEP} from './matter-engine.ts';
export type Vec = {x:number;y:number;z:number};
export type Target = {kind:'pottery'|'plate'|'gel'|'concrete'|'brick'|'glass'|'composite'|'alloy';start:number;end:number;hit:boolean;x:number;y:number;z:number};
/** Stylised game impulses, not calibrated firearm or tissue ballistics. */
export class MatterRange {
 readonly physics=new MatterEngine(0,'range');
 readonly detail=new MatterRefinement();
 readonly targets:Target[]=[];
 readonly owner=new Int16Array(5000);
 readonly rest=new Float32Array(15000);
 readonly particleMaterial:MaterialId[]=new Array(5000).fill('ceramic');
 requestedSize:AttumSize=.25;actualSize:AttumSize=.25;
 ammo=[7,7];cooldown=[0,0];reloadTime=0;shots=0;hits=0;
 constructor(size:AttumSize=.25){this.requestedSize=size;this.reset();}
 reset(size:AttumSize=this.requestedSize){
  if(!ATTUM_LEVELS.includes(size))throw new Error('Unsupported attum size');this.requestedSize=size;
  const kinds:Target['kind'][]=['pottery','plate','gel','concrete','brick','glass','composite','alloy'];
  this.actualSize=([...ATTUM_LEVELS].reverse().find(d=>d>=size&&kinds.reduce((n,k)=>n+this.cells(k,d).length,0)<=this.physics.capacity)??.25);this.physics.diameter=this.actualSize;
  const s=this.physics;s.reset(0);this.detail.reset();this.targets.length=0;this.ammo=[7,7];this.cooldown=[0,0];this.reloadTime=0;this.shots=this.hits=0;
  kinds.forEach((kind,i)=>this.addTarget(kind,(i%4-1.5)*3,this.actualSize/2,-2-Math.floor(i/4)*4));
  this.rest.set(s.position);
 }
 private cells(kind:Target['kind'],d:number){
  const cells:{ix:number;iy:number;iz:number;material:MaterialId}[]=[];
  for(let iy=0;iy<Math.ceil(2/d);iy++)for(let ix=-Math.ceil(.75/d);ix<=Math.ceil(.75/d);ix++)for(let iz=-Math.ceil(.6/d);iz<=Math.ceil(.6/d);iz++){
   const px=ix*d,py=iy*d,pz=iz*d,r=Math.hypot(px,pz);
   const torso=(py<.5&&Math.abs(px)<.38&&Math.abs(pz)<.3)||(py>=.5&&py<1.5&&Math.abs(px)<.6&&Math.abs(pz)<.3)||(py>=1.5&&Math.hypot(px,py-1.73,pz)<.34);
   const include=kind==='pottery'?(py<1.5&&r<(.43+.13*Math.sin(py*3))&&(r>.2||iy===0)):
    kind==='plate'?(Math.hypot(px,py-.75)<.73&&iz===0):kind==='gel'||kind==='composite'?torso:
    kind==='glass'?(Math.abs(px)<=.6&&py<1.5&&iz===0):(Math.abs(px)<=.5&&py<1.25&&Math.abs(pz)<=.35);
   if(!include)continue;
   const material:MaterialId=kind==='pottery'||kind==='plate'?'ceramic':kind==='composite'?(Math.abs(px)<d*.55&&Math.abs(pz)<d*.55||py<1.4&&py>.6&&Math.abs(pz)<d*.55&&iy%3===0?'bone':'flesh'):kind;
   cells.push({ix,iy,iz,material});
  }return cells;
 }
 private addTarget(kind:Target['kind'],x:number,y:number,z:number){
  const s=this.physics,start=s.count,lookup=new Map<string,number>(),d=this.actualSize;
  for(const {ix,iy,iz,material} of this.cells(kind,d)){
   if(s.count>=s.capacity)throw new Error('Complete target exceeds attum budget');
   const i=s.count++,m=MATERIALS[material];s.position.set([x+ix*d,y+iy*d,z+iz*d],i*3);s.previous.set([x+ix*d,y+iy*d,z+iz*d],i*3);s.pinned[i]=1;s.inverseMass[i]=1/m.density;s.damping[i]=m.damping;s.friction[i]=m.friction;this.owner[i]=this.targets.length;this.particleMaterial[i]=material;lookup.set(`${ix},${iy},${iz}`,i);
  }
  for(const [key,i] of lookup){const [ix,iy,iz]=key.split(',').map(Number);for(const [dx,dy,dz] of [[1,0,0],[0,1,0],[0,0,1],[1,1,0],[0,1,1],[1,0,1]]){const j=lookup.get(`${ix+dx},${iy+dy},${iz+dz}`);if(j===undefined)continue;const a=MATERIALS[this.particleMaterial[i]],b=MATERIALS[this.particleMaterial[j]],mortar=kind==='brick'&&dy===1&&iy%2===1;
   s.bonds.push({a:i,b:j,active:true,rest:d*Math.hypot(dx,dy,dz),limit:Math.min(a.stretch,b.stretch),stiffness:Math.min(a.stiffness,b.stiffness),toughness:(a.toughness+b.toughness)/2*(mortar?.35:1),damage:0});
  }}this.targets.push({kind,start,end:s.count,hit:false,x,y,z});
 }
 reload(){if(!this.reloadTime&&(this.ammo[0]<7||this.ammo[1]<7))this.reloadTime=1.2;}
 step(){for(let i=0;i<2;i++)this.cooldown[i]=Math.max(0,this.cooldown[i]-STEP);if(this.reloadTime){this.reloadTime=Math.max(0,this.reloadTime-STEP);if(!this.reloadTime)this.ammo=[7,7];}if(this.targets.some(t=>t.hit))this.physics.step();this.detail.step(this.physics);}
 impact(index:number,direction:Vec,power=1){
  const s=this.physics,t=this.targets[this.owner[index]],p=s.position,hit={x:p[index*3],y:p[index*3+1],z:p[index*3+2]};t.hit=true;
  for(let i=t.start;i<t.end;i++){if(!s.enabled[i])continue;const k=i*3,d=Math.hypot(p[k]-hit.x,p[k+1]-hit.y,p[k+2]-hit.z),force=power*.16/(1+d*3)*s.inverseMass[i];if(d>.45)continue;s.pinned[i]=0;s.previous[k]-=direction.x*force;s.previous[k+1]-=direction.y*force+.025/(1+d);s.previous[k+2]-=direction.z*force;}
  for(const b of s.bonds)if(b.active&&this.owner[b.a]===this.owner[index]){const d=Math.hypot(p[b.a*3]-hit.x,p[b.a*3+1]-hit.y,p[b.a*3+2]-hit.z);if(d<.7){b.damage=(b.damage??0)+power*(1-d/.7);if(b.damage>=(b.toughness??1)){b.active=false;s.broken++;}}}
  // Refine a struck coarse cell only after its material's local bonds have failed.
  const attached=s.bonds.some(b=>b.active&&(b.a===index||b.b===index));
  if(!attached&&s.enabled[index]&&power>=1&&this.detail.fracture(hit,this.actualSize,hit,this.particleMaterial[index],direction,{x:(p[index*3]-s.previous[index*3])/STEP,y:(p[index*3+1]-s.previous[index*3+1])/STEP,z:(p[index*3+2]-s.previous[index*3+2])/STEP})){s.enabled[index]=0;s.pinned[index]=1;}
 }
 fire(hand:number,origin:Vec,direction:Vec):{fired:boolean;point:Vec|null}{
  if(this.reloadTime||this.cooldown[hand]>0||this.ammo[hand]<=0)return {fired:false,point:null};
  this.ammo[hand]--;this.cooldown[hand]=.22;this.shots++;
  const s=this.physics;let nearest=35,index=-1;
  for(let i=0;i<s.count;i++){if(!s.enabled[i])continue;const k=i*3,dx=s.position[k]-origin.x,dy=s.position[k+1]-origin.y,dz=s.position[k+2]-origin.z,t=dx*direction.x+dy*direction.y+dz*direction.z;if(t<0||t>nearest)continue;if((dx-t*direction.x)**2+(dy-t*direction.y)**2+(dz-t*direction.z)**2<(this.actualSize*.8)**2){nearest=t;index=i;}}
  let fragment=-1;for(let i=0;i<this.detail.fragments.length;i++){const f=this.detail.fragments[i],dx=f.x-origin.x,dy=f.y-origin.y,dz=f.z-origin.z,t=dx*direction.x+dy*direction.y+dz*direction.z;if(t<0||t>nearest)continue;if((dx-t*direction.x)**2+(dy-t*direction.y)**2+(dz-t*direction.z)**2<(f.size*.8)**2){nearest=t;fragment=i;}}
  if(fragment>=0){this.hits++;this.detail.strike(fragment,direction);return {fired:true,point:{x:origin.x+direction.x*nearest,y:origin.y+direction.y*nearest,z:origin.z+direction.z*nearest}};}
  if(index<0)return {fired:true,point:null};this.hits++;this.impact(index,direction);return {fired:true,point:{x:origin.x+direction.x*nearest,y:origin.y+direction.y*nearest,z:origin.z+direction.z*nearest}};
 }
 shove(position:Vec,direction:Vec){for(const t of this.targets){for(let i=t.start;i<t.end;i++){if(!this.physics.enabled[i])continue;const p=this.physics.position,k=i*3;if(Math.hypot(p[k]-position.x,p[k+2]-position.z)<1.1){this.impact(i,direction,.35);break;}}}}
}
