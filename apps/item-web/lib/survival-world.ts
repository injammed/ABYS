import * as T from 'three';
import {surfaceMaterial} from './world-materials.ts';
import { BUILDINGS, SUPPLIES } from './survival';
import {HOSTILES,OUTBREAK_SLOTS,F49_SPAWN} from './hostiles';
import {robotModel,alienModel,gunshipModel,type Skins} from './hostile-models';

export {characterModel as person} from './character-models';
import {characterModel as person} from './character-models';
export function rifle(){
 const group=new T.Group();group.name='AK-47';
 const metal=new T.MeshStandardMaterial({color:0x252a29,metalness:.8,roughness:.35}),wood=new T.MeshStandardMaterial({color:0x75432b,roughness:.7});
 const part=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
 part(.09,.12,.34,0,0,0,metal);part(.075,.1,.23,0,-.015,.27,wood);part(.1,.09,.22,0,0,-.28,wood);part(.035,.035,.35,0,.02,-.54,metal);part(.06,.17,.09,0,-.12,.08,wood).rotation.x=-.25;
 part(.055,.23,.12,0,-.16,-.1,metal).rotation.x=.25;part(.025,.075,.025,0,.06,-.63,metal);
 const flash=new T.Mesh(new T.OctahedronGeometry(.065),new T.MeshBasicMaterial({color:0xffcb60}));flash.position.z=-.74;flash.visible=false;group.add(flash);
 return {group,flash};
}
export function buildDistrict(skins:Skins){
 const root=new T.Group();root.name='Capital Refuge / cathedral camp';const collisions:T.Object3D[]=[];
 const materials=new Map<number,T.MeshStandardMaterial>();
 const mat=(color:number)=>{let m=materials.get(color);if(!m){m=surfaceMaterial(color===0x222b29||color===0x111b1b?'asphalt':'stone',color,3);materials.set(color,m);}return m;};
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,color:number)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);mesh.receiveShadow=true;mesh.castShadow=h>.3;root.add(mesh);return mesh;};
 box(145,.2,140,0,-.2,78,0x111b1b);
 box(24,.04,136,0,-.07,78,0x222b29);
 for(const side of [-1,1])box(2,.12,135,side*13,.02,78,0x3e4943);
 for(let z=16;z<145;z+=8)box(.15,.015,3,0,-.04,z,0xa49b6e);
 BUILDINGS.forEach((b,i)=>{
  const height=10+(i*17)%31;const building=box(b.w,height,b.d,b.x,height/2,b.z,i%3===0?0x263b35:0x313839);collisions.push(building);
  for(let floor=2;floor<height-1;floor+=3.5)for(let w=-5;w<=5;w+=5){
   const pane=new T.Mesh(new T.PlaneGeometry(1.5,1.7),new T.MeshBasicMaterial({color:(i+floor)%3<1?0xb16126:0x365749}));
   pane.position.set(b.x+w,floor,b.z-8.51);root.add(pane);
  }
  box(b.w+.4,.4,b.d+.4,b.x,height,b.z,0x151d1c);
 });
 // Perimeter is a visibly sealed district, not a promise of an infinite map.
 // Open streets lead into the geographic capital map.
 for(let z=19;z<140;z+=24)for(const side of [-1,1]){
  box(.12,5,.12,side*11.8,2.5,z,0x35443f);
  const lamp=new T.Mesh(new T.BoxGeometry(.6,.15,.6),new T.MeshBasicMaterial({color:0x83ffc0}));lamp.position.set(side*11.8,5,z);root.add(lamp);
 }
 // Crashed visitor craft.
 const ship=new T.Group();ship.position.set(-12,2,65);ship.rotation.z=.3;
 const hull=new T.Mesh(new T.SphereGeometry(5,24,12),mat(0x4f6862));hull.scale.y=.22;ship.add(hull);
 const rim=new T.Mesh(new T.TorusGeometry(4.4,.17,6,32),new T.MeshBasicMaterial({color:0x8acbb8}));rim.rotation.x=Math.PI/2;ship.add(rim);root.add(ship);collisions.push(hull);
 const terminal=new T.Group();terminal.position.set(2.6,0,6);
 const pedestal=new T.Mesh(new T.BoxGeometry(1,.9,.7),mat(0x162922));pedestal.position.y=.45;terminal.add(pedestal);
 const screen=new T.Mesh(new T.BoxGeometry(1.1,.8,.12),new T.MeshStandardMaterial({color:0x173c2c,emissive:0x40fa91,emissiveIntensity:1}));screen.position.set(0,1.25,0);screen.rotation.x=-.2;terminal.add(screen);root.add(terminal);
 const label=(text:string,x:number,y:number,z:number)=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#07140fea';ctx.fillRect(0,0,512,128);ctx.fillStyle='#b9ffd7';ctx.textAlign='center';ctx.font='28px monospace';ctx.fillText(text,256,76);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true}));sprite.position.set(x,y,z);sprite.scale.set(1.65,.4125,1);root.add(sprite);return sprite;
 };
 label('LIBRARY TERMINAL',2.6,2.35,6);label('MARA / KEEPER',-2.5,2.6,6);label('IRI / SURVIVOR',-8,2.6,57);
 label('CAPITAL REFUGE',0,4.2,12);label('CATHEDRAL / SAFE',0,5.7,9.9);
 const keeper=person(0x998b6e,'mara');keeper.position.set(-2.5,0,6);root.add(keeper);
 const visitor=person(0x6b94a0,'iri');visitor.scale.set(.8,1.15,.8);visitor.position.set(-8,0,57);root.add(visitor);
 const supplies=SUPPLIES.map(s=>{const mesh=box(.7,.6,.7,s.x,.3,s.z,s.kind==='water'?0x57acc1:s.kind==='medicine'?0xcda789:0x679a55);return {id:s.id,mesh};});
 const enemies=[...HOSTILES,...OUTBREAK_SLOTS].map(({kind,x,z})=>{const robot=kind==='robot',alien=kind==='alien';const mesh=robot?robotModel(skins.robot):alien?alienModel(skins.alien):person(0x596449,'infected');mesh.position.set(x,0,z);root.add(mesh);const laser=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),new T.LineBasicMaterial({color:0xff382b,transparent:true,opacity:.8}));laser.visible=false;root.add(laser);return {mesh,robot,alien,kind,x,z,dead:false,active:false,respawn:0,cooldown:0,windup:0,beamTime:0,aim:new T.Vector3(),laser};});
 const gunship=gunshipModel(skins.aircraft);gunship.position.set(F49_SPAWN.x,F49_SPAWN.y,F49_SPAWN.z);gunship.rotation.y=Math.PI;root.add(gunship);
 label('F-49 / E TO BOARD',8,3.5,19);
 // Visible landing pad beside the cathedral exit.
 box(9,.04,12,8,-.03,19,0x2b413a);

 const weapon=rifle();root.add(weapon.group);
 const player=person(0x252d2c,'player');root.add(player);
 return {root,player,weapon,gunship,protectedActors:[keeper,visitor],enemies,supplies,collisions,dispose(){
  const geometries=new Set<T.BufferGeometry>(),mats=new Set<T.Material>(),textures=new Set<T.Texture>();root.traverse(n=>{
   const m=n as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)for(const a of Array.isArray(m.material)?m.material:[m.material]){mats.add(a);const map=(a as T.MeshStandardMaterial).map,bump=(a as T.MeshStandardMaterial).bumpMap;if(map)textures.add(map);if(bump)textures.add(bump);}
  });geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
 }};
}
