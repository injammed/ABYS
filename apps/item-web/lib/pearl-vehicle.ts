import * as T from 'three';
export const PEARL_SPAWN={x:-5,z:21,y:1.4};
export type PearlState={x:number;z:number;y:number;yaw:number;speed:number;flight:boolean};
export const freshPearl=():PearlState=>({...PEARL_SPAWN,yaw:Math.PI,speed:0,flight:false});
/** Arcade vehicle motion with swept footprint checks, not a real flight simulator. */
export function stepPearl(s:PearlState,input:{throttle:number;steer:number;lift:number;brake:boolean},dt:number,valid:(x:number,z:number,y:number)=>boolean,floor:(x:number,z:number)=>number){
 dt=Math.max(0,Math.min(.05,dt));const throttle=T.MathUtils.clamp(input.throttle,-1,1),steer=T.MathUtils.clamp(input.steer,-1,1);
 const target=throttle*(s.flight?65:throttle<0?10:32),rate=input.brake?60:throttle?15:9;
 s.speed+=T.MathUtils.clamp((input.brake?0:target)-s.speed,-rate*dt,rate*dt);
 if(s.flight)s.y=T.MathUtils.clamp(s.y+T.MathUtils.clamp(input.lift,-1,1)*dt*16,Math.max(1.4,floor(s.x,s.z)),180);
 s.yaw-=steer*dt*(s.flight?1.1:Math.min(1.5,Math.abs(s.speed)*.12))*Math.sign(s.speed||1);
 const distance=s.speed*dt,steps=Math.max(1,Math.ceil(Math.abs(distance)/.4));
 for(let i=0;i<steps;i++){const x=s.x-Math.sin(s.yaw)*distance/steps,z=s.z-Math.cos(s.yaw)*distance/steps;if(!valid(x,z,s.y)){s.speed=0;break;}s.x=x;s.z=z;}
}
export function togglePearl(s:PearlState){if(s.flight&&(s.y>1.65||Math.abs(s.speed)>2))return false;s.flight=!s.flight;s.speed=0;return true;}
export function buildPearl(){
 const root=new T.Group();root.name='PEARL / road-flight coupe';const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
 const pearl=new T.MeshPhysicalMaterial({color:0xf0eee2,metalness:.7,roughness:.18,clearcoat:1,clearcoatRoughness:.12});const gold=new T.MeshStandardMaterial({color:0xd9b767,metalness:.9,roughness:.24});const glass=new T.MeshPhysicalMaterial({color:0x263b46,metalness:.55,roughness:.12,clearcoat:1});const black=new T.MeshStandardMaterial({color:0x10151b,roughness:.65});const light=new T.MeshBasicMaterial({color:0xd9f9ff});[pearl,gold,glass,black,light].forEach(m=>materials.add(m));
 const mesh=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,sx=1,sy=1,sz=1)=>{geometries.add(g);const n=new T.Mesh(g,m);n.position.set(x,y,z);n.scale.set(sx,sy,sz);n.castShadow=n.receiveShadow=true;root.add(n);return n;};
 const oval=(x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material)=>mesh(new T.SphereGeometry(1,32,16),m,x,y,z,sx,sy,sz);
 oval(0,-.65,0,1.12,.46,2.5,pearl);oval(0,-.42,-1.15,1.05,.38,1.35,pearl);oval(0,-.03,.2,.81,.7,1.18,glass);
 // Curved wheel fairings and inset gold hoops preserve the reference's continuous body.
 const wheels:T.Mesh[]=[];for(const side of [-1,1])for(const z of [-1.48,1.5]){oval(side*.93,-.58,z,.5,.53,.8,pearl);const w=mesh(new T.CylinderGeometry(.49,.49,.22,24),black,side*1.18,-.91,z);w.rotation.z=Math.PI/2;wheels.push(w);const ring=mesh(new T.TorusGeometry(.44,.025,8,36),gold,side*1.3,-.91,z);ring.rotation.y=Math.PI/2;oval(side*1.305,-.91,z,.025,.36,.36,pearl);}
 for(const side of [-1,1]){oval(side*.88,-.65,.1,.26,.2,.65,black);const curve=new T.CatmullRomCurve3([new T.Vector3(side*.15,-.52,-2.3),new T.Vector3(side*.75,-.3,-1.6),new T.Vector3(side*1.12,-.15,-.8),new T.Vector3(side*1.08,-.36,.5),new T.Vector3(side*.9,-.35,2)]);mesh(new T.TubeGeometry(curve,32,.018,6,false),gold,0,0,0);oval(side*.65,-.62,-2.18,.36,.035,.08,light);oval(side*.7,-.45,2.15,.25,.04,.08,gold);}
 const jets:T.Mesh[]=[];for(const side of [-1,1])for(const z of [-1.3,1.3]){const j=mesh(new T.ConeGeometry(.21,.8,12),light,side*.8,-1.15,z);j.rotation.z=Math.PI;j.visible=false;jets.push(j);}
 root.position.set(PEARL_SPAWN.x,PEARL_SPAWN.y,PEARL_SPAWN.z);root.rotation.y=Math.PI;
 return {root,update(s:PearlState,dt:number){root.position.set(s.x,s.y,s.z);root.rotation.y=s.yaw;wheels.forEach(w=>w.rotation.x+=s.speed*dt/.49);jets.forEach(j=>j.visible=s.flight);},dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
