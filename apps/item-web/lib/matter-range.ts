import {MatterEngine,STEP} from './matter-engine.ts';
export type Vec = {x:number;y:number;z:number};
export type Target = {kind:'pottery'|'plate'|'gel';start:number;end:number;hit:boolean;x:number;y:number;z:number};
/** Stylised game impulses, not calibrated firearm or tissue ballistics. */
export class MatterRange {
 readonly physics=new MatterEngine(0,'range');
 readonly targets:Target[]=[];
 readonly owner=new Int16Array(5000);
 readonly rest=new Float32Array(15000);
 ammo=[7,7];cooldown=[0,0];reloadTime=0;shots=0;hits=0;
 constructor(){this.reset();}
 reset(){
  const s=this.physics;s.reset(0);this.targets.length=0;this.ammo=[7,7];this.cooldown=[0,0];this.reloadTime=0;this.shots=this.hits=0;
  for(let row=0;row<3;row++)for(let col=0;col<5;col++)this.addTarget((['pottery','plate','gel'] as const)[(col+row)%3],(col-2)*2.7,.13,-2-row*3.5);
  this.rest.set(s.position);
 }
 private addTarget(kind:Target['kind'],x:number,y:number,z:number){
  const s=this.physics,start=s.count,lookup=new Map<string,number>();
  for(let iy=0;iy<10;iy++)for(let ix=-3;ix<=3;ix++)for(let iz=-2;iz<=2;iz++){
   const px=ix*.25,py=iy*.25,pz=iz*.25,r=Math.hypot(px,pz);
   const include=kind==='pottery'?(py<1.5&&r<(.43+.13*Math.sin(py*3))&&(r>.2||iy===0)):
    kind==='plate'?(Math.hypot(px,py-.75)<.73&&iz===0):
    ((py<.5&&Math.abs(px)<.38&&Math.abs(pz)<.3)||(py>=.5&&py<1.5&&Math.abs(px)<.6&&Math.abs(pz)<.3)||(py>=1.5&&py<2&&Math.hypot(px,py-1.73,pz)<.34));
   if(!include||s.count>=s.capacity)continue;const i=s.count++;s.position.set([x+px,y+py,z+pz],i*3);s.previous.set([x+px,y+py,z+pz],i*3);s.pinned[i]=1;this.owner[i]=this.targets.length;lookup.set(`${ix},${iy},${iz}`,i);
  }
  for(const [key,i] of lookup){const [ix,iy,iz]=key.split(',').map(Number);for(const [dx,dy,dz] of [[1,0,0],[0,1,0],[0,0,1],[1,1,0],[0,1,1],[1,0,1]]){const j=lookup.get(`${ix+dx},${iy+dy},${iz+dz}`);if(j!==undefined)s.bonds.push({a:i,b:j,active:true,rest:.25*Math.hypot(dx,dy,dz),limit:kind==='gel'?2.4:1.3,stiffness:kind==='gel'?.25:.9});}}
  this.targets.push({kind,start,end:s.count,hit:false,x,y,z});
 }
 reload(){if(!this.reloadTime&&(this.ammo[0]<7||this.ammo[1]<7))this.reloadTime=1.2;}
 step(){for(let i=0;i<2;i++)this.cooldown[i]=Math.max(0,this.cooldown[i]-STEP);if(this.reloadTime){this.reloadTime=Math.max(0,this.reloadTime-STEP);if(!this.reloadTime)this.ammo=[7,7];}this.physics.step();}
 impact(index:number,direction:Vec,power=1){
  const s=this.physics,t=this.targets[this.owner[index]],p=s.position,hit={x:p[index*3],y:p[index*3+1],z:p[index*3+2]};t.hit=true;
  for(let i=t.start;i<t.end;i++){s.pinned[i]=0;const k=i*3,d=Math.hypot(p[k]-hit.x,p[k+1]-hit.y,p[k+2]-hit.z),force=power*.16/(1+d*3);s.previous[k]-=direction.x*force;s.previous[k+1]-=direction.y*force+.025/(1+d);s.previous[k+2]-=direction.z*force;}
  for(const b of s.bonds)if(b.active&&this.owner[b.a]===this.owner[index]){const d=Math.hypot(p[b.a*3]-hit.x,p[b.a*3+1]-hit.y,p[b.a*3+2]-hit.z);if(d<(t.kind==='gel'?.3:.7)){b.active=false;s.broken++;}}
 }
 fire(hand:number,origin:Vec,direction:Vec):{fired:boolean;point:Vec|null}{
  if(this.reloadTime||this.cooldown[hand]>0||this.ammo[hand]<=0)return {fired:false,point:null};
  this.ammo[hand]--;this.cooldown[hand]=.22;this.shots++;
  const s=this.physics;let nearest=35,index=-1;
  for(let i=0;i<s.count;i++){const k=i*3,dx=s.position[k]-origin.x,dy=s.position[k+1]-origin.y,dz=s.position[k+2]-origin.z,t=dx*direction.x+dy*direction.y+dz*direction.z;if(t<0||t>nearest)continue;if((dx-t*direction.x)**2+(dy-t*direction.y)**2+(dz-t*direction.z)**2<.19**2){nearest=t;index=i;}}
  if(index<0)return {fired:true,point:null};this.hits++;this.impact(index,direction);return {fired:true,point:{x:origin.x+direction.x*nearest,y:origin.y+direction.y*nearest,z:origin.z+direction.z*nearest}};
 }
 shove(position:Vec,direction:Vec){for(const t of this.targets){for(let i=t.start;i<t.end;i++){const p=this.physics.position,k=i*3;if(Math.hypot(p[k]-position.x,p[k+2]-position.z)<1.1){this.impact(i,direction,.35);break;}}}}
}
