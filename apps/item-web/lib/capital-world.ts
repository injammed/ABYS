import {groundWithTunnel} from './tunnel-ground';
import * as T from 'three';
import {surfaceMaterial,disposeSurface} from './world-materials.ts';
import {WEST,EAST,NORTH,SOUTH,REGION,installFootprints,type Footprint} from './capital-map';
import {MISSIONS} from './capital-campaign';
import {person} from './survival-world';

export function buildCapital(loader:T.TextureLoader,base:string,onReady:()=>void,onError:()=>void){
 const root=new T.Group();root.name='Washington / Capital Refuge';const collisions:T.Object3D[]=[];
 let disposed=false;const abort=new AbortController();
 const aerial=loader.load(`${base}/maps/washington/aerial.jpg`,onReady,undefined,onError);aerial.colorSpace=T.SRGBColorSpace;aerial.anisotropy=4;
 const roof=new T.MeshStandardMaterial({map:aerial,roughness:1,side:T.DoubleSide}),wall=surfaceMaterial('facade',0x9c9b90);wall.side=T.DoubleSide;
 const floor=new T.Mesh(groundWithTunnel(WEST,EAST,NORTH,SOUTH),roof);floor.receiveShadow=true;root.add(floor);
 const boundary=new T.LineLoop(new T.BufferGeometry().setFromPoints(REGION.map(([x,z])=>new T.Vector3(x,1,z))),new T.LineBasicMaterial({color:0xd86a47}));root.add(boundary);
 const protectedActors:T.Object3D[]=[];
 const markers=MISSIONS.map((m,i)=>{
  const group=new T.Group();group.position.set(m.x,0,m.z);group.name=m.name;
  const terminal=new T.Mesh(new T.BoxGeometry(1.6,2,.9),new T.MeshStandardMaterial({color:0x203b37,emissive:0x13bc86,emissiveIntensity:.5}));terminal.position.y=1;group.add(terminal);
  const ring=new T.Mesh(new T.TorusGeometry(6,.15,6,32),new T.MeshBasicMaterial({color:0x82ffd2}));ring.rotation.x=Math.PI/2;ring.position.y=.1;group.add(ring);
  const beam=new T.Mesh(new T.CylinderGeometry(.15,.15,35,6),new T.MeshBasicMaterial({color:0x82ffd2,transparent:true,opacity:.4}));beam.position.y=17.5;group.add(beam);root.add(group);
  if(i===0||i===3)for(let n=0;n<12;n++){const refugee=person([0x9a8c71,0x746f69,0x586e7a][n%3]);refugee.position.set((n%4-1.5)*1.7,0,4+Math.floor(n/4)*1.5);group.add(refugee);protectedActors.push(refugee);}
  return {group,terminal,ring,beam,index:i};
 });
 // Geographic footprints are chunked so distant city geometry can be culled.
 const ready=fetch(`${base}/maps/washington/buildings.json`,{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error('Footprints unavailable');return r.json();}).then((rows:Footprint[])=>{
  if(disposed)return;installFootprints(rows);
  const chunks=new Map<string,Footprint[]>();
  for(const row of rows){const key=Math.floor(row[1][0][0]/500)+','+Math.floor(row[1][0][1]/500);const list=chunks.get(key)??[];list.push(row);chunks.set(key,list);}
  for(const rows of chunks.values()){
   const roofs:number[]=[],roofUV:number[]=[],walls:number[]=[],wallUV:number[]=[];
   for(const [height,points] of rows){
    const contour=points.map(([x,z])=>new T.Vector2(x,z));
    for(const triangle of T.ShapeUtils.triangulateShape(contour,[]))for(const index of triangle){const [x,z]=points[index];roofs.push(x,height,z);roofUV.push((x-WEST)/(EAST-WEST),1-(z-NORTH)/(SOUTH-NORTH));}
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],u=Math.hypot(b[0]-a[0],b[1]-a[1])/12,v=height/12;wallUV.push(0,0,u,0,0,v,u,0,u,v,0,v);walls.push(a[0],0,a[1],b[0],0,b[1],a[0],height,a[1],b[0],0,b[1],b[0],height,b[1],a[0],height,a[1]);}
   }
   const geometry=(positions:number[],uv?:number[])=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.computeBoundingSphere();return g;};
   const top=new T.Mesh(geometry(roofs,roofUV),roof),sides=new T.Mesh(geometry(walls,wallUV),wall);top.receiveShadow=sides.receiveShadow=true;root.add(top,sides);collisions.push(top,sides);
  }onReady();
 }).catch(e=>{if(e.name!=='AbortError')onError();});
 const blast=new T.Group();blast.position.set(0,0,1300);blast.visible=false;root.add(blast);
 const cloud=new T.Mesh(new T.SphereGeometry(90,24,16),new T.MeshBasicMaterial({color:0xff9d41,transparent:true,opacity:.5}));cloud.position.y=120;cloud.scale.y=1.4;blast.add(cloud);
 const stem=new T.Mesh(new T.CylinderGeometry(28,60,160,16),new T.MeshBasicMaterial({color:0x6b5040,transparent:true,opacity:.65}));stem.position.y=60;blast.add(stem);
 const missile=new T.Mesh(new T.ConeGeometry(.8,6,8),new T.MeshStandardMaterial({color:0xc1c8c4,emissive:0xffb355,emissiveIntensity:.35}));missile.visible=false;root.add(missile);
 return {root,collisions,protectedActors,markers,blast,ready,updateStrike(age:number){missile.visible=age<4;missile.position.set(0,4+age*age*45,1090);blast.visible=age>=4;blast.scale.setScalar(Math.min(1,Math.max(.01,(age-4)/4)));},dispose(){disposed=true;abort.abort();installFootprints([]);const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();root.traverse(o=>{const m=o as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)for(const material of Array.isArray(m.material)?m.material:[m.material])materials.add(material);});geometries.forEach(g=>g.dispose());materials.forEach(disposeSurface);aerial.dispose();}};
}
