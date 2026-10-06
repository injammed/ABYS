import * as T from 'three';
import {demonModel} from './demon-models.ts';
import type {DemonKind} from './capital-campaign';
export function buildRift(){
 const root=new T.Group();root.name='Trinity / crust breach';root.visible=false;
 const ember=new T.MeshBasicMaterial({color:0xff5a20}),voidMat=new T.MeshBasicMaterial({color:0x100b15,side:T.DoubleSide});
 const mouth=new T.Mesh(new T.CircleGeometry(42,48),voidMat);mouth.rotation.x=-Math.PI/2;mouth.position.set(0,.04,1450);root.add(mouth);
 const rim=new T.Mesh(new T.TorusGeometry(42,.7,6,48),ember);rim.rotation.x=Math.PI/2;rim.position.set(0,.15,1450);root.add(rim);
 const depth=new T.Mesh(new T.CylinderGeometry(40,13,80,24,1,true),new T.MeshStandardMaterial({color:0x29202b,emissive:0x7c2016,emissiveIntensity:.7,side:T.DoubleSide}));depth.position.set(0,-39,1450);root.add(depth);
 for(let i=0;i<9;i++){const points=Array.from({length:7},(_,j)=>{const angle=i*Math.PI*2/9+Math.sin(j*7+i)*.12;return new T.Vector3(Math.sin(angle)*(30+j*12),.1,1450+Math.cos(angle)*(30+j*12));});root.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),18,.6,5,false),ember));}
 const pillar=new T.Mesh(new T.ConeGeometry(18,90,12,1,true),new T.MeshBasicMaterial({color:0xce442c,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}));pillar.position.set(0,45,1450);root.add(pillar);
 const volley=new T.Group();root.add(volley);
 for(let i=0;i<18;i++){const trail=new T.Mesh(new T.CylinderGeometry(.3,.1,22,5),new T.MeshBasicMaterial({color:i%3?0xffb75f:0x9ddaff}));trail.position.set((i%6-2.5)*18,100+i*4,1300+Math.floor(i/6)*35);trail.rotation.z=.45;volley.add(trail);}
 const swarm=new T.InstancedMesh(new T.OctahedronGeometry(.3),new T.MeshBasicMaterial({color:0xa9e2f2}),192);const dummy=new T.Object3D();for(let i=0;i<192;i++){dummy.position.set(Math.sin(i*2.4)*(30+i%40),35+i%20,1350+Math.cos(i*2.4)*(30+i%40));dummy.updateMatrix();swarm.setMatrixAt(i,dummy.matrix);}root.add(swarm);
 const enemies=Array.from({length:23},(_,i)=>{const kind:DemonKind=i===22?'titan':i>=18?'warlock':'goblin';const mesh=demonModel(kind);mesh.visible=false;root.add(mesh);return {kind,mesh,active:false,dead:false,respawn:0,cooldown:0,damage:0,cast:0,aim:new T.Vector3()};});
 // Fixed pools keep repeated possession explosions/fire from allocating indefinitely.
 const fires=Array.from({length:24},()=>{const group=new T.Group();const flame=new T.Mesh(new T.ConeGeometry(2,6,7),new T.MeshBasicMaterial({color:0xff6b19,transparent:true,opacity:.8,depthWrite:false}));flame.position.y=3;group.add(flame);const core=new T.Mesh(new T.SphereGeometry(1,10,6),new T.MeshBasicMaterial({color:0xffe1a3}));core.position.y=1.5;group.add(core);group.visible=false;root.add(group);return {group,age:9};});let fireIndex=0;
 return {root,enemies,fires,ignite(point:T.Vector3){const f=fires[fireIndex++%fires.length];f.age=0;f.group.position.copy(point);f.group.visible=true;},update(dt:number,age:number,open:boolean){
  root.visible=true;volley.visible=age<8;volley.position.y=-age*18;swarm.visible=age<12;swarm.rotation.y=age*.4;
  rim.visible=pillar.visible=open;rim.scale.setScalar(1+Math.sin(age*2)*.015);pillar.rotation.y=age*.4;
  fires.forEach((f,i)=>{f.age+=dt;f.group.visible=f.age<8;f.group.scale.setScalar(f.age<.3?1+f.age*6:1+Math.sin(age*11+i)*.13);});
 },reset(){root.visible=false;enemies.forEach(e=>{e.active=e.dead=false;e.respawn=e.cooldown=e.damage=e.cast=0;e.mesh.visible=false;});fires.forEach(f=>{f.age=9;f.group.visible=false;});},dispose(){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o instanceof T.InstancedMesh)o.dispose();}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
