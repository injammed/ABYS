import {MATERIALS,type MaterialId} from './matter-materials.ts';
import {STEP,type MatterEngine} from './matter-engine.ts';
type V={x:number;y:number;z:number};
export type Fragment={x:number;y:number;z:number;vx:number;vy:number;vz:number;size:number;material:MaterialId;asleep:boolean;still:number};
/** Local octree fracture. Volume is partitioned, never multiplied. No atomic/ballistic calibration. */
export class MatterRefinement {
 readonly capacity=2048;
 readonly fragments:Fragment[]=[];
 allowRefinement=true;
 reset(){this.fragments.length=0;this.allowRefinement=true;}
 private partition(center:V,size:number,hit:V,material:MaterialId):Fragment[]{
  const result:Fragment[]=[];
  // Refine only the octant containing the impact. Other octants stay coarse.
  const split=(c:V,d:number)=>{
   if(d<=.02){result.push({...c,size:d,material,vx:0,vy:0,vz:0,asleep:false,still:0});return;}
   const half=d/2,quarter=d/4;
   for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
    const child={x:c.x+x*quarter,y:c.y+y*quarter,z:c.z+z*quarter};
    if(x===(hit.x<c.x?-1:1)&&y===(hit.y<c.y?-1:1)&&z===(hit.z<c.z?-1:1))split(child,half);
    else result.push({...child,size:half,material,vx:0,vy:0,vz:0,asleep:false,still:0});
   }
  };split(center,size);return result;
 }
 fracture(center:V,size:number,hit:V,material:MaterialId,direction:V,velocity:V){
  if(!this.allowRefinement)return false;
  const parts=this.partition(center,size,hit,material);
  if(this.fragments.length+parts.length>this.capacity)return false;
  for(const f of parts){const impulse=1.4/MATERIALS[material].density;f.vx=velocity.x+direction.x*impulse;f.vy=velocity.y+direction.y*impulse+.3;f.vz=velocity.z+direction.z*impulse;}
  this.fragments.push(...parts);return true;
 }
 strike(index:number,direction:V){const f=this.fragments[index];f.asleep=false;f.still=0;const impulse=3/MATERIALS[f.material].density;f.vx+=direction.x*impulse;f.vy+=direction.y*impulse+.4;f.vz+=direction.z*impulse;const speed=Math.hypot(f.vx,f.vy,f.vz);if(speed>12){f.vx*=12/speed;f.vy*=12/speed;f.vz*=12/speed;}}
 get active(){return this.fragments.reduce((n,f)=>n+Number(!f.asleep),0);}
 get smallest(){return this.fragments.reduce((d,f)=>Math.min(d,f.size),Infinity);}
 step(coarse:MatterEngine){
  if(!this.active)return;
  const cell=coarse.diameter,grid=new Map<string,number[]>(),key=(x:number,y:number,z:number)=>`${Math.floor(x/cell)},${Math.floor(y/cell)},${Math.floor(z/cell)}`;
  for(let i=0;i<coarse.count;i++)if(coarse.enabled[i]){const k=i*3,id=key(coarse.position[k],coarse.position[k+1],coarse.position[k+2]);const bucket=grid.get(id);if(bucket)bucket.push(i);else grid.set(id,[i]);}
  // Two substeps and swept sampling prevent centimetre fragments tunnelling through coarse targets.
  const dt=STEP/2;
  for(let sub=0;sub<2;sub++){
   for(const f of this.fragments){if(f.asleep)continue;const mat=MATERIALS[f.material];f.vy-=9.81*dt;const damping=Math.sqrt(mat.damping);f.vx*=damping;f.vy*=damping;f.vz*=damping;
    const travel=Math.hypot(f.vx,f.vy,f.vz)*dt,slices=Math.max(1,Math.ceil(travel/(cell*.4)));
    for(let n=0;n<slices;n++){
     f.x+=f.vx*dt/slices;f.y+=f.vy*dt/slices;f.z+=f.vz*dt/slices;
     const cx=Math.floor(f.x/cell),cy=Math.floor(f.y/cell),cz=Math.floor(f.z/cell);
     for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const i of grid.get(`${cx+x},${cy+y},${cz+z}`)??[]){
      const k=i*3,h=(cell+f.size)/2,delta=[f.x-coarse.position[k],f.y-coarse.position[k+1],f.z-coarse.position[k+2]];
      if(delta.some(v=>Math.abs(v)>=h))continue;
      let axis=0;for(let a=1;a<3;a++)if(Math.abs(delta[a])>Math.abs(delta[axis]))axis=a;
      const pos=(['x','y','z'] as const)[axis],vel=(['vx','vy','vz'] as const)[axis],sign=delta[axis]<0?-1:1;
      f[pos]=coarse.position[k+axis]+sign*h;if(f[vel]*sign<0)f[vel]*=-.12;
     }
     const h=f.size/2;
     if(f.y<h){f.y=h;f.vy=Math.abs(f.vy)<.3?0:Math.abs(f.vy)*.12;f.vx*=1-mat.friction;f.vz*=1-mat.friction;}
     if(Math.abs(f.x)>8-h){f.x=Math.sign(f.x)*(8-h);f.vx*=-.12;}
     if(f.z< -12+h||f.z>12-h){f.z=Math.max(-12+h,Math.min(12-h,f.z));f.vz*=-.12;}
    }
   }
   // Local fragment contacts, using a grid whose cells cover the largest fragment.
   const fine=new Map<string,number[]>();
   for(let i=0;i<this.fragments.length;i++){const f=this.fragments[i],id=key(f.x,f.y,f.z);const bucket=fine.get(id);if(bucket)bucket.push(i);else fine.set(id,[i]);}
   for(let i=0;i<this.fragments.length;i++){const a=this.fragments[i],cx=Math.floor(a.x/cell),cy=Math.floor(a.y/cell),cz=Math.floor(a.z/cell);
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const j of fine.get(`${cx+x},${cy+y},${cz+z}`)??[]){
     if(j<=i)continue;const b=this.fragments[j];if(a.asleep&&b.asleep)continue;
     const delta=[b.x-a.x,b.y-a.y,b.z-a.z],h=(a.size+b.size)/2;if(delta.some(v=>Math.abs(v)>=h))continue;
     let axis=0;for(let k=1;k<3;k++)if(Math.abs(delta[k])>Math.abs(delta[axis]))axis=k;
     const pos=(['x','y','z'] as const)[axis],vel=(['vx','vy','vz'] as const)[axis],sign=delta[axis]<0?-1:1;
     const wa=1/(MATERIALS[a.material].density*a.size**3),wb=1/(MATERIALS[b.material].density*b.size**3),penetration=h-Math.abs(delta[axis]);
     a[pos]-=sign*penetration*wa/(wa+wb);b[pos]+=sign*penetration*wb/(wa+wb);
     const relative=(b[vel]-a[vel])*sign;if(relative<0){const impulse=-relative*1.1/(wa+wb);a[vel]-=sign*impulse*wa;b[vel]+=sign*impulse*wb;if(relative<-.2){a.asleep=b.asleep=false;a.still=b.still=0;}}
    }
   }
  }
  for(const f of this.fragments){f.y=Math.max(f.size/2,f.y);if(f.y<=f.size/2+.002&&Math.hypot(f.vx,f.vy,f.vz)<.12){f.still++;if(f.still>20){f.asleep=true;f.vx=f.vy=f.vz=0;}}else f.still=0;}
 }
}
