import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Original supplied painting, 21 × 15.75 feet; coordinates use game metres.
export const BANQUET = {path:'/images/infernal-banquet.jpeg',width:6.4008,height:4.8006,x:-15.6,y:2.85,z:-13} as const;

export function buildCathedralBanquet(texture:T.Texture) {
 const root=new T.Group();root.name='Infernal Lords’ Banquet · 21 ft × 15.75 ft';
 const gold=new T.MeshStandardMaterial({color:0xc59a45,metalness:.78,roughness:.32});
 const recess=new T.MeshStandardMaterial({color:0x302016,metalness:.55,roughness:.55});
 const art=new T.MeshBasicMaterial({map:texture,toneMapped:false});
 const batches=new Map<T.Material,T.BufferGeometry[]>();
 const add=(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0,sx=1,sy=1,sz=1,rz=0)=>{
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),rz),new T.Vector3(sx,sy,sz));
  const copy=(g.index?g.toNonIndexed():g.clone()).applyMatrix4(matrix);g.dispose();
  const batch=batches.get(m)??[];batch.push(copy);batches.set(m,batch);
 };
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m=gold)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
 const orb=(x:number,y:number,z:number,sx:number,sy:number,sz:number,m=gold)=>add(new T.SphereGeometry(1,10,8),m,x,y,z,sx,sy,sz);
 const curl=(points:number[][],radius=.025)=>add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p as [number,number,number]))),14,radius,5,false),gold);
 const w=BANQUET.width,h=BANQUET.height;
 // A shallow relief keeps the full artwork ahead of wall piers but behind the
 // existing collision boundary. Its original UVs show the entire image.
 add(new T.PlaneGeometry(w,h),art,0,0,.025);
 box(w+.7,h+.7,.04,0,0,-.025,recess);
 for(const [offset,thick,depth] of [[.04,.06,.07],[.13,.1,.12],[.27,.07,.08]]) {
  for(const sign of [-1,1]) {
   box(w+offset*2,thick,depth,0,sign*(h/2+offset),.02);
   box(thick,h+offset*2,depth,sign*(w/2+offset),0,.02);
  }
 }
 // Repeating gilded acanthus scrolls, individually modelled in relief.
 for(const sign of [-1,1])for(let x=-w/2+.25;x<w/2;x+=.36){
  const y=sign*(h/2+.16);
  curl([[x-.13,y,.07],[x-.09,y+sign*.09,.08],[x+.06,y+sign*.08,.08],[x+.1,y,.07],[x+.03,y-sign*.05,.075]]);
 }
 for(const sign of [-1,1])for(let y=-h/2+.25;y<h/2;y+=.36){
  const x=sign*(w/2+.16);
  curl([[x,y-.13,.07],[x+sign*.09,y-.08,.08],[x+sign*.08,y+.07,.08],[x,y+.1,.07],[x-sign*.05,y+.03,.075]]);
 }
 const demon=(x:number,y:number,size:number)=>{
  orb(x,y,.075,size*.48,size*.65,.065);
  for(const sign of [-1,1]) {
   orb(x+sign*size*.2,y+size*.13,.13,size*.13,size*.065,.015,recess);
   add(new T.BoxGeometry(size*.3,size*.09,.035),gold,x+sign*size*.2,y+size*.22,.13,1,1,1,-sign*.3);
   curl([[x+sign*size*.32,y+size*.37,.07],[x+sign*size*.68,y+size*.8,.07],[x+sign*size*.56,y+size*1.14,.06],[x+sign*size*.4,y+size*1.3,.04]],size*.08);
   // Swept bat-wing silhouette and raised ribs flank each demonic mask.
   const wing=new T.Shape();wing.moveTo(x+sign*size*.4,y);
   wing.lineTo(x+sign*size*1.6,y+size*.9);wing.lineTo(x+sign*size*1.35,y+size*.2);
   wing.quadraticCurveTo(x+sign*size,y+size*.45,x+sign*size*.8,y-size*.15);wing.closePath();
   add(new T.ShapeGeometry(wing),gold,0,0,.045);
   curl([[x+sign*size*.4,y,.065],[x+sign*size,y+size*.5,.075],[x+sign*size*1.6,y+size*.9,.055]],size*.035);
  }
  orb(x,y-size*.22,.13,size*.22,size*.12,.015,recess);
  for(const sign of [-1,1])add(new T.ConeGeometry(size*.06,size*.2,5),gold,x+sign*size*.13,y-size*.22,.145,1,1,1,Math.PI);
 };
 for(const x of [-1,1])for(const y of [-1,1])demon(x*(w/2+.08),y*(h/2+.08),.24);
 demon(0,h/2+.29,.28);demon(0,-h/2-.21,.22);
 for(const [material,parts] of batches){
  const geometry=mergeGeometries(parts)!;parts.forEach(g=>g.dispose());
  const mesh=new T.Mesh(geometry,material);mesh.name=material===art?'Original banquet painting':'Gilded demonic relief';
  root.add(mesh);
 }
 root.position.set(BANQUET.x,BANQUET.y,BANQUET.z);root.rotation.y=Math.PI/2;
 return {root,dispose(){root.children.forEach(o=>(o as T.Mesh).geometry.dispose());gold.dispose();recess.dispose();art.dispose();}};
}
