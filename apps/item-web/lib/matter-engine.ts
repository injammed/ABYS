/** Metres, seconds. Experimental position constraints, not engineering physics. */
export const DIAMETER=.25, STEP=1/30;
export class MatterEngine {
 readonly capacity=5000;readonly floorCount=32*24;
 readonly position=new Float32Array(this.capacity*3);
 readonly previous=new Float32Array(this.capacity*3);
 readonly pinned=new Uint8Array(this.capacity);
 diameter=DIAMETER;
 readonly inverseMass=new Float32Array(this.capacity).fill(1);
 readonly damping=new Float32Array(this.capacity).fill(.99);
 readonly friction=new Float32Array(this.capacity).fill(.2);
 readonly bonds:{a:number;b:number;active:boolean;rest?:number;limit?:number;stiffness?:number;damage?:number;toughness?:number}[]=[];
 count=0;collisions=0;broken=0;blockTarget=1.7;block={x:1.7,y:1.1,z:0,half:.65};
 readonly mode:'water'|'range';
 constructor(count=5000,mode: 'water'|'range'='water'){this.mode=mode;this.reset(count);}
 reset(count=this.count){
  if(this.mode==='range'){this.count=0;this.bonds.length=0;this.broken=0;this.pinned.fill(0);this.block.x=this.blockTarget=100;return;}
  this.count=Math.max(this.floorCount,Math.min(this.capacity,Math.floor(count)));this.bonds.length=0;this.broken=0;this.pinned.fill(0);this.blockTarget=1.7;this.block={x:1.7,y:1.1,z:0,half:.65};
  for(let i=0;i<this.count;i++){
   if(i<this.floorCount){const x=i%32,z=Math.floor(i/32);this.position.set([(x-15.5)*DIAMETER,0,(z-11.5)*DIAMETER],i*3);this.pinned[i]=1;
    if(x)this.bonds.push({a:i-1,b:i,active:true});if(z)this.bonds.push({a:i-32,b:i,active:true});
   }else{const n=i-this.floorCount;this.position.set([-3+(n%14)*.25,1+Math.floor(n/196)*.25,-2+(Math.floor(n/14)%14)*.25],i*3);}
  }this.previous.set(this.position);
 }
 fracture(x:number,z:number,radius=1.1){for(let i=0;i<this.floorCount;i++)if(Math.hypot(this.position[i*3]-x,this.position[i*3+2]-z)<radius)this.pinned[i]=0;for(const b of this.bonds)if(b.active&&[b.a,b.b].some(i=>Math.hypot(this.position[i*3]-x,this.position[i*3+2]-z)<radius)){b.active=false;this.broken++;}}
 step(){
  this.block.x+=Math.max(-.08,Math.min(.08,this.blockTarget-this.block.x));
  const p=this.position,o=this.previous;this.collisions=0;
  for(let i=0;i<this.count;i++)if(!this.pinned[i])for(let a=0;a<3;a++){const k=i*3+a,v=(p[k]-o[k])*this.damping[i];o[k]=p[k];p[k]+=v+(a===1?-9.81*STEP*STEP:0);}
  for(let it=0;it<3;it++){
   for(const b of this.bonds)if(b.active){const a=b.a*3,c=b.b*3,delta=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],d=Math.hypot(...delta),wa=(1-this.pinned[b.a])*this.inverseMass[b.a],wb=(1-this.pinned[b.b])*this.inverseMass[b.b],w=wa+wb;
    const rest=b.rest??DIAMETER;if(d>rest*(b.limit??1.8)){b.active=false;this.broken++;continue;}if(!w||!d)continue;const s=(d-rest)/d/w*(b.stiffness??1);for(let j=0;j<3;j++){p[a+j]+=delta[j]*s*wa;p[c+j]-=delta[j]*s*wb;}
   }
   const cell=this.diameter*1.2,grid=new Map<string,number[]>();
   for(let i=0;i<this.count;i++){const k=i*3,key=`${Math.floor(p[k]/cell)},${Math.floor(p[k+1]/cell)},${Math.floor(p[k+2]/cell)}`;const bucket=grid.get(key);if(bucket)bucket.push(i);else grid.set(key,[i]);}
   for(let i=0;i<this.count;i++){
    const k=i*3,cx=Math.floor(p[k]/cell),cy=Math.floor(p[k+1]/cell),cz=Math.floor(p[k+2]/cell);
    for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)for(const j of grid.get(`${cx+x},${cy+y},${cz+z}`)??[]){
     if(j<=i)continue;const l=j*3,delta=[p[l]-p[k],p[l+1]-p[k+1],p[l+2]-p[k+2]],d2=delta.reduce((s,v)=>s+v*v,0);if(d2>=this.diameter*this.diameter)continue;
     const d=Math.sqrt(d2),wa=(1-this.pinned[i])*this.inverseMass[i],wb=(1-this.pinned[j])*this.inverseMass[j],w=wa+wb;if(!w)continue;if(!d)delta[0]=.00001;const s=(this.diameter-d)/Math.max(d,.00001)/w;
     for(let a=0;a<3;a++){p[k+a]-=delta[a]*s*wa;p[l+a]+=delta[a]*s*wb;}this.collisions++;
    }
    if(this.pinned[i])continue;p[k]=Math.max(this.mode==='range'?-8:-4.1,Math.min(this.mode==='range'?8:4.1,p[k]));p[k+2]=Math.max(this.mode==='range'?-12:-3.1,Math.min(this.mode==='range'?12:3.1,p[k+2]));p[k+1]=Math.max(this.mode==='range'?this.diameter/2:-2,Math.min(10,p[k+1]));
    if(this.mode==='range'&&p[k+1]<=this.diameter/2+.001){o[k]+=(p[k]-o[k])*this.friction[i];o[k+2]+=(p[k+2]-o[k+2])*this.friction[i];}
    const b=this.block,delta=[p[k]-b.x,p[k+1]-b.y,p[k+2]-b.z],limit=b.half+this.diameter/2;
    if(delta.every(v=>Math.abs(v)<limit)){let axis=0;for(let a=1;a<3;a++)if(Math.abs(delta[a])>Math.abs(delta[axis]))axis=a;p[k+axis]=[b.x,b.y,b.z][axis]+(delta[axis]<0?-limit:limit);}
   }
  }
 }
 get bytes(){return this.position.byteLength+this.previous.byteLength+this.pinned.byteLength+this.inverseMass.byteLength+this.damping.byteLength+this.friction.byteLength;}
}
