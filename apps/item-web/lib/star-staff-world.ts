import * as T from 'three';
export function buildStarStaff(){
 const root=new T.Group(),held=new T.Group(),strike=new T.Group();root.add(held,strike);
 const gold=new T.MeshStandardMaterial({color:0xd9b76e,metalness:.8,roughness:.25});
 const glow=new T.MeshBasicMaterial({color:0xffe6a2});
 const shaft=new T.Mesh(new T.CylinderGeometry(.035,.045,1.7,12),gold);held.add(shaft);
 for(const y of [-.65,.55]){const band=new T.Mesh(new T.TorusGeometry(.07,.015,6,16),gold);band.rotation.x=Math.PI/2;band.position.y=y;held.add(band);}
 const jewel=new T.Mesh(new T.IcosahedronGeometry(.12,1),glow);jewel.position.y=.9;held.add(jewel);
 const star=new T.Mesh(new T.IcosahedronGeometry(1.2,2),glow);strike.add(star);
 const corona=new T.Mesh(new T.SphereGeometry(2,16,12),new T.MeshBasicMaterial({color:0xff9d35,transparent:true,opacity:.3,depthWrite:false}));strike.add(corona);
 const trail=new T.Mesh(new T.ConeGeometry(.8,12,12),new T.MeshBasicMaterial({color:0xffb34b,transparent:true,opacity:.6,depthWrite:false}));trail.position.y=6;strike.add(trail);
 const light=new T.PointLight(0xffc470,20,40);strike.add(light);
 const impact=new T.Mesh(new T.RingGeometry(.9,1,48),new T.MeshBasicMaterial({color:0xffd18d,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));impact.rotation.x=-Math.PI/2;root.add(impact);
 strike.visible=impact.visible=false;
 return {root,held,strike,impact,update(age:number,target:T.Vector3){
  strike.visible=age<1.5;strike.position.copy(target);strike.position.y+=Math.max(0,1-age/1.5)**2*90;star.rotation.y=age*4;corona.scale.setScalar(1+Math.sin(age*20)*.15);
  impact.visible=age>=1.5&&age<2.2;impact.position.copy(target);impact.position.y+=.15;
  impact.scale.setScalar(1+Math.max(0,age-1.5)/.7*17);(impact.material as T.MeshBasicMaterial).opacity=Math.max(0,1-(age-1.5)/.7);
 },reset(){strike.visible=impact.visible=false;},dispose(){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
