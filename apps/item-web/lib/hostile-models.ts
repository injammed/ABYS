import * as T from 'three';
export type Skins={robot:T.Texture;alien:T.Texture;aircraft:T.Texture};
function crop(source:T.Texture,x:number,y:number,w:number,h:number){const t=source.clone();t.offset.set(x,y);t.repeat.set(w,h);t.needsUpdate=true;return t;}
function builder(root:T.Group){
 const mesh=(geometry:T.BufferGeometry,material:T.Material,x:number,y:number,z:number)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);root.add(m);return m;};
 const sphere=(r:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material)=>{const o=mesh(new T.SphereGeometry(r,12,8),m,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const bar=(a:T.Vector3,b:T.Vector3,r:number,m:T.Material)=>{const d=b.clone().sub(a);const o=mesh(new T.CylinderGeometry(r*.8,r,d.length(),8),m,...a.clone().add(b).multiplyScalar(.5).toArray() as [number,number,number]);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
 const spike=(r:number,h:number,x:number,y:number,z:number,m:T.Material)=>mesh(new T.ConeGeometry(r,h,7),m,x,y,z);
 return {mesh,sphere,bar,spike};
}
export function robotModel(skin:T.Texture){
 const root=new T.Group();root.name='Laser rifle robot';const b=builder(root);
 const armor=new T.MeshStandardMaterial({color:0x77888b,map:crop(skin,.45,.58,.28,.22),roughness:.3,metalness:.85});
 const joints=new T.MeshStandardMaterial({color:0x151c22,metalness:.8,roughness:.45});
 const red=new T.MeshBasicMaterial({color:0xff342b}),steel=new T.MeshStandardMaterial({color:0x39444a,metalness:.9,roughness:.3});
 b.sphere(.6,0,1.55,0,1,.95,.6,armor);b.sphere(.32,0,1.05,0,1.2,.7,.8,joints);
 const helmet=b.sphere(.32,0,2.26,-.08,.8,1,.85,armor);helmet.rotation.x=.15;
 for(const side of [-1,1]){
  b.mesh(new T.BoxGeometry(.11,.055,.045),red,side*.12,2.27,-.35);
  b.sphere(.29,side*.65,1.94,0,1.1,.75,1,armor);
  b.bar(new T.Vector3(side*.64,1.9,0),new T.Vector3(side*.78,1.35,-.13),.14,armor);
  b.bar(new T.Vector3(side*.78,1.35,-.13),new T.Vector3(side*.47,1.28,-.6),.13,joints);
 }
 const legs:T.Group[]=[];for(const side of [-1,1]){const leg=new T.Group();leg.position.set(side*.31,1.1,0);root.add(leg);const l=builder(leg);l.bar(new T.Vector3(0,0,0),new T.Vector3(side*.13,-.52,.07),.17,armor);l.sphere(.15,side*.13,-.52,.07,1,1,1,joints);l.bar(new T.Vector3(side*.13,-.52,.07),new T.Vector3(side*.16,-.95,0),.13,armor);l.mesh(new T.BoxGeometry(.32,.17,.5),joints,side*.16,-1.04,-.12);legs.push(leg);}
 for(let i=0;i<4;i++)b.mesh(new T.BoxGeometry(.6-i*.05,.04,.03),red,0,1.35+i*.12,-.36);
 const gun=new T.Group();gun.position.set(.43,1.32,-.7);root.add(gun);const g=builder(gun);g.mesh(new T.BoxGeometry(.2,.22,.7),steel,0,0,0);g.mesh(new T.BoxGeometry(.09,.09,.6),joints,0,.025,-.55);g.mesh(new T.BoxGeometry(.12,.05,.6),red,0,.14,-.15);
 root.userData.legs=legs;root.userData.muzzle=new T.Vector3(.43,1.35,-1.55);return root;
}
export function alienModel(skin:T.Texture){
 const root=new T.Group();root.name='Spined alien hunter';const b=builder(root);
 const flesh=new T.MeshStandardMaterial({color:0xc5c8a1,map:crop(skin,.5,.47,.26,.27),roughness:.72,metalness:.07});
 const bone=new T.MeshStandardMaterial({color:0xd8d6a7,roughness:.42}),dark=new T.MeshStandardMaterial({color:0x1d1734,roughness:.5});
 b.sphere(.74,0,1.16,.14,1.05,.83,1.6,flesh);b.sphere(.55,0,1.37,-.87,.8,.8,1.1,flesh);
 b.sphere(.42,0,1.16,-1.37,.9,.9,.22,dark);
 for(const side of [-1,1]){b.sphere(.11,side*.24,1.61,-1.27,1,.55,.5,dark);for(let i=0;i<7;i++){const tooth=b.spike(.035,.27,side*(.04+i*.045),1.3,-1.46,bone);tooth.rotation.z=Math.PI;const lower=b.spike(.035,.22,side*(.04+i*.045),.93,-1.45,bone);lower.rotation.z=0;}}
 const legs:T.Group[]=[];
 for(const side of [-1,1])for(const front of [true,false]){const leg=new T.Group();leg.position.set(side*(front?.57:.5),1.22,front?-.4:.8);root.add(leg);const l=builder(leg);
  const elbow=new T.Vector3(side*.35,-.48,front?-.35:.3),hand=new T.Vector3(side*.55,-1.04,front?-.83:.35);
  l.bar(new T.Vector3(),elbow,front?.24:.22,flesh);l.sphere(.22,elbow.x,elbow.y,elbow.z,1.1,1,1,flesh);l.bar(elbow,hand,.16,flesh);l.sphere(.22,hand.x,hand.y,hand.z,1.5,.5,1.2,flesh);
  for(let finger=0;finger<3;finger++){const claw=l.spike(.065,.45,hand.x+(finger-1)*.15,hand.y-.06,hand.z-.24,bone);claw.rotation.x=-1.25;}
  legs.push(leg);
 }
 for(let i=0;i<6;i++){const spine=b.spike(.12,.5+Math.sin(i/5*Math.PI)*.35,0,1.91,.9-i*.34,dark);spine.rotation.x=.4;}
 for(let side of [-1,1])for(let i=0;i<4;i++)b.sphere(.19,side*.58,1.2,.8-i*.34,1,.6,.5,flesh);
 // Long drooping jaw tendrils follow the supplied sketch.
 for(const side of [-1,1])b.bar(new T.Vector3(side*.27,1.1,-1.4),new T.Vector3(side*.31,.45,-1.5),.025,dark);
 root.userData.legs=legs;return root;
}
export function gunshipModel(skin:T.Texture){
 const root=new T.Group();root.name='F-49 VTOL gunship';const b=builder(root);
 const hull=new T.MeshStandardMaterial({color:0x7d858b,map:crop(skin,.46,.45,.15,.2),roughness:.42,metalness:.8});
 const dark=new T.MeshStandardMaterial({color:0x111b24,roughness:.25,metalness:.6});const glass=new T.MeshStandardMaterial({color:0x44718a,metalness:.7,roughness:.1});const glow=new T.MeshBasicMaterial({color:0x68e5ff});
 b.sphere(1,0,.15,0,.85,.55,3.4,hull);
 const nose=b.mesh(new T.ConeGeometry(.8,3,4),hull,0,.12,-3.25);nose.rotation.x=-Math.PI/2;nose.rotation.z=Math.PI/4;
 const panel=(points:number[][])=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geo.setAttribute('uv',new T.Float32BufferAttribute(points.flatMap(p=>[p[0]/8+.5,p[2]/8+.5]),2));geo.computeVertexNormals();const m=b.mesh(geo,hull,0,0,0);m.material=new T.MeshStandardMaterial({color:0x555e65,metalness:.8,roughness:.4,side:T.DoubleSide,map:hull.map});return m;};
 for(const side of [-1,1]){
  panel([[side*.5,0,-1.5],[side*4.2,-.12,1.7],[side*.5,0,2.5]]);
  panel([[side*.55,.15,1.1],[side*2.1,.1,3],[side*.4,.1,3]]);
  panel([[side*.65,.2,1.6],[side*1.3,1.6,2.8],[side*1.1,.2,3]]);
  const engine=b.mesh(new T.CylinderGeometry(.38,.42,1.4,12),dark,side*.82,0,2);engine.rotation.x=Math.PI/2;
  const exhaust=b.mesh(new T.CylinderGeometry(.27,.33,.2,12),glow,side*.82,0,2.8);exhaust.rotation.x=Math.PI/2;
  b.mesh(new T.CylinderGeometry(.38,.38,.2,12),dark,side*1.1,-.3,0);
  b.mesh(new T.CylinderGeometry(.28,.28,.1,12),glow,side*1.1,-.43,0);
  b.mesh(new T.BoxGeometry(.13,.13,1),dark,side*.6,-.3,-2.3);
  b.bar(new T.Vector3(side*.8,-.2,1.3),new T.Vector3(side*.8,-1,1.3),.065,dark);b.mesh(new T.BoxGeometry(.4,.13,.7),dark,side*.8,-1.02,1.3);
 }
 b.sphere(.8,0,.63,-1.05,.62,.5,1.65,glass);
 b.bar(new T.Vector3(0,.92,-1.7),new T.Vector3(0,.92,-.2),.045,dark);
 b.bar(new T.Vector3(0,-.3,-2),new T.Vector3(0,-1,-2),.055,dark);b.mesh(new T.BoxGeometry(.25,.13,.6),dark,0,-1,-2);
 const flash=b.mesh(new T.OctahedronGeometry(.2),new T.MeshBasicMaterial({color:0x94f4ff}),0,-.25,-3);flash.visible=false;
 root.userData.flash=flash;return root;
}
