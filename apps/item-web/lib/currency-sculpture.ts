import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Item } from "./currency-library";

// Reference-guided sculptural interpretations. Hidden surfaces and relief are inferred.
// Dimensions are exhibition units, not manufacturing specifications.
export function buildCurrencySculpture(item: Item): T.Group {
  const index=Number(item.id.slice(-3));
  const root=new T.Group();root.name=`${item.id} ${item.name}`;
  root.userData={itemId:item.id,interpretation:"Reference-guided 3D study; hidden geometry inferred; not manufacturing CAD",sourceImage:item.image??"world",sourceTile:item.tile};
  const warm=index<=10 && ![6,7,10].includes(index);
  const metal=new T.MeshStandardMaterial({color:warm?0xc4a35c:0xc8d2dc,metalness:.87,roughness:.29});
  const dark=new T.MeshStandardMaterial({color:0x19212b,metalness:.68,roughness:.35});
  const glass=new T.MeshPhysicalMaterial({color:index===5?0xaed7f4:0xe3eff7,metalness:.05,roughness:.08,transparent:true,opacity:.27,side:T.FrontSide,depthWrite:false,clearcoat:1});
  const jewel=new T.MeshStandardMaterial({color:index===4?0x285b49:index===9?0x709d83:index===10?0x256796:0xb29145,metalness:.48,roughness:.2});
  const buckets=new Map<T.Material,T.BufferGeometry[]>();
  function add(g:T.BufferGeometry,m:T.Material=metal,p:[number,number,number]=[0,0,0],r:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1]) {
    const matrix=new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...scale));
    g.applyMatrix4(matrix);const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();flat.deleteAttribute("uv");
    const group=buckets.get(m)??[];group.push(flat);buckets.set(m,group);
  }
  function rod(a:T.Vector3,b:T.Vector3,r=.018,m:T.Material=metal){const delta=b.clone().sub(a);const g=new T.CylinderGeometry(r,r,delta.length(),6);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,m);}
  function ring(radius:number,tube:number,p:[number,number,number]=[0,0,0],r:[number,number,number]=[0,0,0],m:T.Material=metal){add(new T.TorusGeometry(radius,tube,6,40),m,p,r);}
  function relief(points:number[][],depth:number,m:T.Material,origin:T.Matrix4){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.008,bevelThickness:.008,curveSegments:4});g.applyMatrix4(origin);add(g,m);}
  function motif(face:T.Matrix4,kind:number){
    const local=(g:T.BufferGeometry,m:T.Material=metal)=>{g.applyMatrix4(face);add(g,m);};
    const line=(a:[number,number,number],b:[number,number,number],r=.012)=>rod(new T.Vector3(...a).applyMatrix4(face),new T.Vector3(...b).applyMatrix4(face),r);
    if(kind%3===0){ // stylized Liberty profile, with a dimensional crown
      relief([[-.21,-.32],[-.05,-.19],[-.08,-.09],[-.16,.03],[-.15,.19],[-.05,.29],[.13,.28],[.2,.15],[.3,.09],[.19,.045],[.2,-.02],[.14,-.065],[.11,-.18],[.26,-.32]],.06,metal,face);
      for(let j=0;j<7;j++){const a=Math.PI*.08+j*Math.PI*.135;relief([[Math.cos(a)*.16,Math.sin(a)*.17+.12],[Math.cos(a)*.44,Math.sin(a)*.42+.12],[Math.cos(a+.12)*.16,Math.sin(a+.12)*.17+.12]],.025,metal,face);}
      const med=new T.TorusGeometry(.47,.012,5,40);med.translate(0,0,.006);if(index%2===0)local(med);else med.dispose();
    }else if(kind%3===1){ // eagle relief: separate wings, body, shield and feather ribs
      relief([[-.045,.1],[-.19,.25],[-.49,.36],[-.4,.1],[-.16,-.07],[-.065,-.1]],.035,metal,face);
      relief([[.045,.1],[.19,.25],[.49,.36],[.4,.1],[.16,-.07],[.065,-.1]],.035,metal,face);
      relief([[-.07,.2],[-.04,.31],[.03,.34],[.13,.27],[.045,.255],[.1,.03],[.07,-.12],[.18,-.29],[0,-.22],[-.18,-.29],[-.07,-.12],[-.1,.03]],.06,metal,face);
      relief([[-.13,.015],[.13,.015],[.11,-.14],[0,-.24],[-.11,-.14]],.082,dark,face);
      for(let j=0;j<5;j++){const x=.19+j*.057;line([x,.26,.052],[x*.83,-.045+j*.027,.052]);line([-x,.26,.052],[-x*.83,-.045+j*.027,.052]);}
    }else{ // standing Liberty with torch, drapery and tablet
      relief([[-.18,-.38],[.17,-.38],[.09,-.14],[.06,.15],[-.08,.15],[-.13,-.16]],.035,metal,face);
      const head=new T.SphereGeometry(.07,10,8);head.scale(.78,1,.45);head.translate(-.015,.245,.045);local(head);
      line([-.07,.12,.05],[-.23,.31,.05],.032);line([-.23,.31,.05],[-.25,.46,.05],.026);
      const flame=new T.ConeGeometry(.045,.12,6);flame.translate(-.25,.51,.05);local(flame);
      for(let j=0;j<5;j++)line([-.075+j*.031,.08,.05],[-.13+j*.06,-.35,.05],.009);
      relief([[.06,.09],[.22,.1],[.19,-.13],[.08,-.15]],.055,metal,face);
    }
    for(let j=0;j<8;j++){const a=j*Math.PI/4;const g=new T.OctahedronGeometry(.02);g.translate(Math.cos(a)*.54,Math.sin(a)*.54,.02);local(g);}
  }
  function cube(size=1.36,opaque=false,bevel=false){
    if(bevel){const shape=new T.Shape();const h=size/2,c=.14;[[-h+c,-h],[h-c,-h],[h,-h+c],[h,h-c],[h-c,h],[-h+c,h],[-h,h-c],[-h,-h+c]].forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:size-.2,bevelEnabled:true,bevelSize:.09,bevelThickness:.1,bevelSegments:1,steps:1});g.translate(0,0,-size/2+.1);add(g,opaque?metal:glass);}
    else add(new T.BoxGeometry(size,size,size),opaque?metal:glass);
    const h=size/2;for(const y of [-h,h])for(const z of [-h,h])rod(new T.Vector3(-h,y,z),new T.Vector3(h,y,z));
    for(const x of [-h,h])for(const z of [-h,h])rod(new T.Vector3(x,-h,z),new T.Vector3(x,h,z));
    for(const x of [-h,h])for(const y of [-h,h])rod(new T.Vector3(x,y,-h),new T.Vector3(x,y,h));
    const faceRotations=[[0,0,0],[0,Math.PI/2,0],[0,Math.PI,0],[0,-Math.PI/2,0],[-Math.PI/2,0,0],[Math.PI/2,0,0]];
    faceRotations.forEach((r,i)=>{const face=new T.Matrix4().makeRotationFromEuler(new T.Euler(...r as [number,number,number]));face.multiply(new T.Matrix4().makeTranslation(0,0,h+.012));motif(face,index+i);});
    if(!opaque&&index%3===2){add(new T.IcosahedronGeometry(.28,1),jewel);ring(.38,.025,[0,0,0],[Math.PI/2,0,0]);}
  }
  if(item.form==="Union"){
    for(const angle of [-.7,.7]){const disk=new T.CylinderGeometry(.66,.66,.085,48);disk.rotateX(Math.PI/2);disk.rotateY(angle);add(disk);const face=new T.Matrix4().makeRotationY(angle);face.multiply(new T.Matrix4().makeTranslation(0,0,.055));motif(face,1);}
  }else if(item.form==="Torus"){
    ring(.68,.095);ring(.68,.036,[0,0,0],[.8,.4,0]);ring(.52,.035,[0,0,0],[.4,-.6,0]);
    for(let j=0;j<12;j++){const a=j*Math.PI/6;add(new T.OctahedronGeometry(.075),jewel,[Math.cos(a)*.68,Math.sin(a)*.68,0],[a,a,0]);}
  }else if(item.form==="Sphere"){
    add(new T.IcosahedronGeometry(.36,2),jewel);for(let j=0;j<5;j++)ring(.7,.026,[0,0,0],[0,j*Math.PI/5,0]);ring(.7,.028,[0,0,0],[Math.PI/2,0,0]);
    for(let j=0;j<8;j++){const a=j*Math.PI/4;add(new T.SphereGeometry(.055,8,6),metal,[Math.cos(a)*.7,0,Math.sin(a)*.7]);}
  }else if(item.form==="Pyramid"){
    add(new T.ConeGeometry(.85,1.6,4),glass,[0,0,0],[0,Math.PI/4,0]);const corners=[[-.6,-.8,-.6],[.6,-.8,-.6],[.6,-.8,.6],[-.6,-.8,.6]];for(let j=0;j<4;j++){rod(new T.Vector3(...corners[j]),new T.Vector3(0,.8,0),.022);rod(new T.Vector3(...corners[j]),new T.Vector3(...corners[(j+1)%4]),.022);}add(new T.IcosahedronGeometry(.22,1),jewel,[0,-.28,0]);ring(.32,.022,[0,-.4,0],[Math.PI/2,0,0]);
  }else if(item.form==="Stellar"){
    add(new T.IcosahedronGeometry(.34,1),jewel);const count=index===9?12:8;for(let j=0;j<count;j++){const a=j*Math.PI*2/count;const g=new T.ConeGeometry(.18,.78,4);g.translate(0,.44,0);g.rotateZ(-a);add(g,j%2?glass:metal,[0,0,(j%2-.5)*.15],[.16*(j%3),0,0]);}ring(.42,.026);
  }else if(item.form==="Rough"){
    const g=new T.IcosahedronGeometry(.9,1);const pos=g.attributes.position;for(let j=0;j<pos.count;j++){const x=pos.getX(j),y=pos.getY(j),z=pos.getZ(j);const factor=.88+.1*Math.sin(x*9+y*7+z*11);pos.setXYZ(j,x*factor,y*factor,z*factor);}g.computeVertexNormals();add(g,glass);add(new T.IcosahedronGeometry(.33,0),metal);ring(.43,.022,[0,0,0],[.4,.2,0]);
  }else cube(1.24+(index%4)*.045,item.form==="Solid"||index%11===0,item.form==="Chamfered"||item.name.includes("Faceted"));
  for(const [material,geometries]of buckets){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)throw new Error(`Cannot build ${item.id}`);const mesh=new T.Mesh(merged,material);mesh.name=`${item.id} ${material===glass?"crystal":material===metal?"relief":"core"}`;mesh.userData.itemId=item.id;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}
  for(const material of [metal,dark,glass,jewel])if(!buckets.has(material))material.dispose();
  root.rotation.y=(index%5-2)*.11;
  return root;
}

export function disposeCurrencySculpture(group:T.Object3D){group.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});}
