import * as T from 'three';
import {BUNKER,HORIZON_MISSIONS,type HorizonQuest} from './horizon-quest.ts';
import {demonModel} from './demon-models.ts';
import {batchModel} from './model-utils.ts';
export function buildHorizon(reference:T.Texture){
 const root=new T.Group();root.name='APY0C / Eye of Horizons';
 const concrete=new T.MeshStandardMaterial({color:0x363c40,roughness:.95}),metal=new T.MeshStandardMaterial({color:0x111722,metalness:.75,roughness:.3}),gold=new T.MeshStandardMaterial({color:0xbda46c,metalness:.8,roughness:.25}),glow=new T.MeshBasicMaterial({color:0xa771ee});
 const collisions:T.Object3D[]=[];
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material,solid=false)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);root.add(mesh);if(solid)collisions.push(mesh);return mesh;};
 const {x,z}=BUNKER;
 box(2,12,38,x-13,6,z,concrete,true);box(2,12,38,x+13,6,z,concrete,true);box(26,12,2,x,6,z+18,concrete,true);
 box(10,12,2,x-8,6,z-18,concrete,true);box(10,12,2,x+8,6,z-18,concrete,true);box(6,4,2,x,10,z-18,concrete,true);box(28,.2,38,x,.02,z,metal);box(28,1,38,x,12.5,z,concrete,true);
 const door=box(6,8,1,x,4,z-18,metal,true);
 const console=box(4,1.5,2,x,.75,z+9,metal,true);console.name='Sever the Eye of Horizons';
 box(5,.5,5,x,.3,z+4,metal,true);
 const lens=new T.Group();lens.position.set(x,4,z+4);root.add(lens);
 lens.add(new T.Mesh(new T.SphereGeometry(1.35,24,16),new T.MeshBasicMaterial({color:0x020104})));
 for(let i=0;i<4;i++){const ring=new T.Mesh(new T.TorusGeometry(2+i*.24,.07,8,64),new T.MeshBasicMaterial({color:i%2?0xf5b974:0xbf88eb}));ring.rotation.x=1.1+i*.12;ring.rotation.y=i*.3;lens.add(ring);}
 for(let i=0;i<16;i++){const node=new T.Mesh(new T.OctahedronGeometry(.17),gold);node.position.set(Math.sin(i*Math.PI/8)*3.5,Math.sin(i*.9)*.9,Math.cos(i*Math.PI/8)*3.5);lens.add(node);}
 for(const side of [-1,1])for(let i=0;i<4;i++){box(1.5,4,1.5,x+side*11,2,z+8+i*2,metal,true);box(.08,3,.1,x+side*10.2,2,z+8+i*2,glow);}
 const screen=new T.Mesh(new T.PlaneGeometry(10,6.67),new T.MeshBasicMaterial({map:reference,side:T.DoubleSide}));screen.position.set(x,6,z+16.8);screen.rotation.y=Math.PI;root.add(screen);
 const boss=demonModel('warlock');boss.name='Dark wizard / corrupter of APY0C';boss.scale.multiplyScalar(1.25);boss.position.set(x-6,1,z+4);root.add(boss);
 const crown=new T.Group();for(let i=0;i<7;i++){const spike=new T.Mesh(new T.ConeGeometry(.08,.65,6),gold);spike.position.set(Math.sin(i*.9)*.38,3.25,Math.cos(i*.9)*.38);crown.add(spike);}boss.add(crown);
 const staff=new T.Mesh(new T.CylinderGeometry(.055,.055,3.6,8),gold);staff.position.set(1.3,1.65,0);boss.add(staff);const orb=new T.Mesh(new T.IcosahedronGeometry(.24,1),glow);orb.position.set(1.3,3.5,0);boss.add(orb);
 const curse=new T.Mesh(new T.RingGeometry(2.7,3,48),new T.MeshBasicMaterial({color:0xff4d95,side:T.DoubleSide}));curse.rotation.x=-Math.PI/2;curse.position.y=.15;curse.visible=false;root.add(curse);
 const markers=HORIZON_MISSIONS.map((m,i)=>{const station=box(1.3,1.6,1,m.x,.8,m.z,metal);const light=box(1.1,.5,.08,m.x,1.2,m.z-.55,glow);const beam=new T.Mesh(new T.CylinderGeometry(.12,.12,18,6),new T.MeshBasicMaterial({color:0xbb88ed,transparent:true,opacity:.5}));beam.position.set(m.x,9,m.z);root.add(beam);return {i,station,light,beam};});
 const rigid=new T.Group();root.children.filter(o=>o instanceof T.Mesh&&!collisions.includes(o)&&o!==screen&&o!==curse).forEach(o=>rigid.attach(o));root.add(rigid);batchModel(rigid);
 return {root,boss,lens,door,curse,collisions,update(h:HorizonQuest,age:number){door.visible=h.stage<3;boss.visible=h.stage===3&&h.wizardHealth>0;lens.visible=!h.lensSevered;lens.rotation.y=age*.25;markers.forEach(m=>m.beam.visible=m.i===h.stage);orb.scale.setScalar(1+Math.sin(age*5)*.12);},dispose(){const geos=new Set<T.BufferGeometry>(),mats=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){geos.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
