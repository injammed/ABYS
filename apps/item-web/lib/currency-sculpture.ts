import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {RoundedBoxGeometry} from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Item } from "./currency-library";

// Reference-guided sculptural interpretations. Hidden surfaces and relief are inferred.
// Dimensions are exhibition units, not manufacturing specifications.
export function buildCurrencySculpture(item: Item, detail: "gallery" | "hero" = "gallery"): T.Group {
  const high=detail==="hero";
  const index=Number(item.id.slice(-3));
  const root=new T.Group();root.name=`${item.id} ${item.name}`;
  root.userData={itemId:item.id,interpretation:"Reference-guided 3D study; hidden geometry inferred; not manufacturing CAD",sourceImage:item.image??"world",sourceTile:item.tile};
  const warm=index<=10 && ![6,7,10].includes(index);
  const metal=new T.MeshStandardMaterial({color:warm?0xc4a35c:0xc8d2dc,metalness:1,roughness:.22});
  const dark=new T.MeshStandardMaterial({color:0x19212b,metalness:.92,roughness:.3});
  const glass=new T.MeshPhysicalMaterial({color:index===5?0xcce8ff:0xffffff,metalness:0,roughness:.045,transmission:1,thickness:1.1,ior:index===5?1.77:2.417,dispersion:.045,attenuationColor:new T.Color(0xdceeff),attenuationDistance:6,clearcoat:1,clearcoatRoughness:.06});
  const jewel=new T.MeshStandardMaterial({color:index===4?0x285b49:index===9?0x709d83:index===10?0x256796:0xb29145,metalness:.86,roughness:.19});
  const buckets=new Map<T.Material,T.BufferGeometry[]>();
  function add(g:T.BufferGeometry,m:T.Material=metal,p:[number,number,number]=[0,0,0],r:[number,number,number]=[0,0,0],scale:[number,number,number]=[1,1,1]) {
    const matrix=new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...scale));
    g.applyMatrix4(matrix);const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();flat.deleteAttribute("uv");
    const group=buckets.get(m)??[];group.push(flat);buckets.set(m,group);
  }
  function rod(a:T.Vector3,b:T.Vector3,r=.018,m:T.Material=metal){const delta=b.clone().sub(a);const g=new T.CylinderGeometry(r,r,delta.length(),8);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(g,m);}
  function ring(radius:number,tube:number,p:[number,number,number]=[0,0,0],r:[number,number,number]=[0,0,0],m:T.Material=metal){add(new T.TorusGeometry(radius,tube,8,64),m,p,r);}
  function relief(points:number[][],depth:number,m:T.Material,origin:T.Matrix4){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.014,bevelThickness:.012,curveSegments:10});g.applyMatrix4(origin);add(g,m);}
  function motif(face:T.Matrix4,kind:number){
    const local=(g:T.BufferGeometry,m:T.Material=metal)=>{g.applyMatrix4(face);add(g,m);};
    const bead=(x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material=metal,angle=0)=>{const g=new T.SphereGeometry(1,high?16:(sx<.02?6:10),high?10:(sx<.02?4:6));g.scale(sx,sy,sz);g.rotateZ(angle);g.translate(x,y,z);local(g,m);};
    const stroke=(points:number[][],radius=.007,m:T.Material=metal)=>{const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p).applyMatrix4(face)));add(new T.TubeGeometry(curve,high?points.length*5:8,radius,high?6:4,false),m);};
    const circle=(radius:number,tube:number,z:number,m:T.Material=metal)=>{const g=new T.TorusGeometry(radius,tube,high?8:5,high?80:40);g.translate(0,0,z);local(g,m);};
    // Multiple relief levels produce real silhouette, highlights and parallax.
    if(kind%3===0){
      relief([[-.23,-.34],[-.07,-.22],[-.08,-.1],[-.18,.02],[-.17,.19],[-.07,.29],[.12,.29],[.18,.17],[.19,.115],[.285,.07],[.20,.035],[.207,-.01],[.15,-.05],[.11,-.17],[.27,-.34]],.042,metal,face);
      bead(-.065,.12,.045,.125,.165,.056);bead(.067,.055,.065,.069,.102,.043);bead(.13,.125,.084,.045,.013,.014);
      stroke([[.16,.04,.094],[.18,.03,.10],[.201,.032,.084]],.006,dark);
      bead(.153,.124,.098,.009,.007,.006,dark);
      stroke([[.13,-.015,.09],[.168,-.02,.094],[.19,-.016,.081]],.004,dark);
      // Curled hair: individually modeled strands flowing into the neck.
      for(let j=0;j<11;j++){const x=-.17+j*.022;stroke([[x,.205,.075],[x-.022,.1,.10],[x+.028,.006,.104],[x-.018,-.12,.079],[x+.016,-.21,.055]],.007);}
      for(let j=0;j<7;j++){const a=Math.PI*.04+j*Math.PI*.145;relief([[Math.cos(a)*.16,Math.sin(a)*.16+.14],[Math.cos(a)*.43,Math.sin(a)*.40+.14],[Math.cos(a+.1)*.16,Math.sin(a+.1)*.16+.14]],.034,metal,face);}
      stroke([[-.15,.25,.09],[-.04,.30,.10],[.10,.28,.09],[.17,.19,.082]],.016);
      for(let j=0;j<4;j++)stroke([[-.12+j*.03,-.23,.07],[-.10+j*.045,-.27,.068],[.03+j*.05,-.32,.057]],.006);
    }else if(kind%3===1){
      // Layered flight feathers, breast, shield, beak and tail.
      for(const side of [-1,1])for(let j=0;j<11;j++){
        const x=side*(.11+j*.031),y=.15+j*.014;
        bead(x,y,.037,.037,.14-j*.006,.018,metal,-side*(.6+j*.065));
        stroke([[side*.08,.13,.066],[x,y+.045,.064],[x+side*.05,y-.05,.055]],.0045);
      }
      bead(0,.035,.049,.09,.16,.045);bead(.018,.216,.071,.055,.067,.041);
      relief([[.045,.245],[.14,.212],[.055,.191]],.08,metal,face);bead(.047,.237,.112,.008,.007,.005,dark);
      for(let j=0;j<5;j++)bead((j-2)*.037,-.21,.04,.018,.10,.017,metal,(j-2)*-.22);
      relief([[-.105,.03],[.105,.03],[.09,-.12],[0,-.20],[-.09,-.12]],.093,dark,face);
      for(let j=0;j<7;j++){const x=(j-3)*.023;stroke([[x,.006,.107],[x,-.06,.112],[x*.5,-.15,.107]],.006);}
      stroke([[-.09,.025,.109],[0,.03,.113],[.09,.025,.109]],.012);
      for(const side of [-1,1]){stroke([[side*.04,-.13,.07],[side*.11,-.21,.07],[side*.19,-.20,.065]],.009);}
    }else{
      relief([[-.19,-.38],[.17,-.38],[.10,-.16],[.075,.14],[-.09,.14],[-.13,-.17]],.041,metal,face);
      bead(-.008,.22,.053,.054,.071,.039);bead(-.014,.228,.078,.039,.05,.018);
      for(let j=0;j<7;j++){const a=j*Math.PI/6;stroke([[Math.cos(a)*.038,.25+Math.sin(a)*.035,.076],[Math.cos(a)*.082,.25+Math.sin(a)*.07,.071]],.008);}
      stroke([[-.055,.11,.072],[-.14,.21,.076],[-.21,.36,.06]],.022);
      stroke([[-.21,.33,.062],[-.21,.44,.062]],.018);bead(-.21,.48,.063,.027,.065,.019,jewel);
      stroke([[.055,.12,.072],[.11,.03,.075],[.16,.025,.071]],.02);
      relief([[.09,.1],[.22,.075],[.2,-.14],[.08,-.12]],.072,metal,face);
      for(let j=0;j<9;j++)stroke([[-.07+j*.016,.08,.068],[-.08+j*.018,-.08,.08],[-.155+j*.037,-.355,.055]],.006);
      for(let j=0;j<3;j++)stroke([[-.085,.08-j*.055,.075],[0,.025-j*.058,.082],[.075,.02-j*.06,.07]],.007);
    }
    // Coin-like concentric reeding, beaded rims and laurel leaves.
    if(index%3!==1){circle(.505,.008,.016);circle(.538,.006,.011);}
    for(let j=0;j<32;j++){const a=j*Math.PI/16;bead(Math.cos(a)*.55,Math.sin(a)*.55,.014,.009,.009,.009);}
    for(const side of [-1,1]){
      stroke([[side*.1,-.49,.024],[side*.33,-.38,.024],[side*.43,-.14,.024]],.006);
      for(let j=0;j<6;j++){const a=.25+j*.16;bead(side*(.12+j*.048),-.46+j*.053,.03,.016,.043,.01,metal,-side*a);}
    }
  }
  function cube(size=1.36,opaque=false,bevel=false){
    if(bevel){const shape=new T.Shape();const h=size/2,c=.14;[[-h+c,-h],[h-c,-h],[h,-h+c],[h,h-c],[h-c,h],[-h+c,h],[-h,h-c],[-h,-h+c]].forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:size-.2,bevelEnabled:true,bevelSize:.09,bevelThickness:.1,bevelSegments:2,steps:1});g.translate(0,0,-size/2+.1);add(g,opaque?metal:glass);}
    else add(new RoundedBoxGeometry(size,size,size,2,.028),opaque?metal:glass);
    const h=size/2;for(const y of [-h,h])for(const z of [-h,h])rod(new T.Vector3(-h,y,z),new T.Vector3(h,y,z),.006);
    for(const x of [-h,h])for(const z of [-h,h])rod(new T.Vector3(x,-h,z),new T.Vector3(x,h,z),.006);
    for(const x of [-h,h])for(const y of [-h,h])rod(new T.Vector3(x,y,-h),new T.Vector3(x,y,h),.006);
    const faceRotations=[[0,0,0],[0,Math.PI/2,0],[0,Math.PI,0],[0,-Math.PI/2,0],[-Math.PI/2,0,0],[Math.PI/2,0,0]];
    faceRotations.forEach((r,i)=>{const face=new T.Matrix4().makeRotationFromEuler(new T.Euler(...r as [number,number,number]));face.multiply(new T.Matrix4().makeTranslation(0,0,h+.012));if(index!==6)motif(face,i===4?1:index+i);});
    if(!opaque&&(index%3===2||index===6)){
      add(new T.SphereGeometry(.18,24,16),jewel);
      for(let j=0;j<5;j++)ring(.27+j*.048,.014,[0,0,0],[j*.53,j*.71,j*.23],j%2?metal:jewel);
      for(const x of [-.42,.42])for(const y of [-.42,.42])for(const z of [-.42,.42])add(new T.OctahedronGeometry(.037),metal,[x,y,z]);
    }
  }
  if(item.form==="Union"){
    for(const angle of [-.7,.7]){const disk=new T.CylinderGeometry(.66,.66,.085,48);disk.rotateX(Math.PI/2);disk.rotateY(angle);add(disk);const face=new T.Matrix4().makeRotationY(angle);face.multiply(new T.Matrix4().makeTranslation(0,0,.055));motif(face,1);
      for(let j=0;j<64;j++){const a=j*Math.PI/32;const g=new T.BoxGeometry(.007,.025,.095);g.translate(0,.642,0);g.rotateZ(a);g.rotateY(angle);add(g);}
      const rim=new T.TorusGeometry(.625,.012,6,64);rim.translate(0,0,.051);rim.rotateY(angle);add(rim);
    }
  }else if(item.form==="Torus"){
    ring(.68,.095);ring(.68,.036,[0,0,0],[.8,.4,0]);ring(.52,.035,[0,0,0],[.4,-.6,0]);
    for(let j=0;j<12;j++){const a=j*Math.PI/6;add(new T.OctahedronGeometry(.075),jewel,[Math.cos(a)*.68,Math.sin(a)*.68,0],[a,a,0]);}
  }else if(item.form==="Sphere"){
    add(new T.SphereGeometry(.36,40,24),jewel);for(let j=0;j<5;j++)ring(.7,.018,[0,0,0],[0,j*Math.PI/5,0]);ring(.7,.018,[0,0,0],[Math.PI/2,0,0]);
    for(let j=0;j<8;j++){const a=j*Math.PI/4;add(new T.SphereGeometry(.055,8,6),metal,[Math.cos(a)*.7,0,Math.sin(a)*.7]);}
  }else if(item.form==="Pyramid"){
    add(new T.ConeGeometry(.85,1.6,4),glass,[0,0,0],[0,Math.PI/4,0]);const corners=[[-.6,-.8,-.6],[.6,-.8,-.6],[.6,-.8,.6],[-.6,-.8,.6]];for(let j=0;j<4;j++){rod(new T.Vector3(...corners[j]),new T.Vector3(0,.8,0),.022);rod(new T.Vector3(...corners[j]),new T.Vector3(...corners[(j+1)%4]),.022);}add(new T.IcosahedronGeometry(.22,1),jewel,[0,-.28,0]);ring(.32,.022,[0,-.4,0],[Math.PI/2,0,0]);
  }else if(item.form==="Stellar"){
    add(new T.IcosahedronGeometry(.20,2),jewel);
    const count=index===9?12:index===10?7:8;
    for(let layer=0;layer<2;layer++)for(let j=0;j<count;j++){
      const a=(j+layer*.5)*Math.PI*2/count;
      const petal=new T.SphereGeometry(1,high?24:12,high?16:8);
      petal.scale(index===9?.145:.10,layer?.29:.38,.04);
      petal.translate(0,layer?.30:.43,layer?.11:0);petal.rotateX(layer?.27:.10);petal.rotateZ(-a);
      add(petal,(j+layer)%3===0?glass:metal);
      const points=[.12,.32,.58,.78].map((v,k)=>new T.Vector3(Math.sin(a)*v,Math.cos(a)*v,.045+Math.sin(k)*.015));
      if(!layer)add(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.006,5,false),jewel);
    }
    ring(.18,.024,[0,0,.15]);add(new T.SphereGeometry(.12,20,12),jewel,[0,0,.16]);
  }else if(item.form==="Rough"){
    const g=new T.IcosahedronGeometry(.9,1);const pos=g.attributes.position;for(let j=0;j<pos.count;j++){const x=pos.getX(j),y=pos.getY(j),z=pos.getZ(j);const factor=.88+.1*Math.sin(x*9+y*7+z*11);pos.setXYZ(j,x*factor,y*factor,z*factor);}g.computeVertexNormals();add(g,glass);add(new T.IcosahedronGeometry(.33,0),metal);ring(.43,.022,[0,0,0],[.4,.2,0]);
  }else cube(1.24+(index%4)*.045,item.form==="Solid",item.form==="Chamfered"||item.name.includes("Faceted"));
  for(const [material,geometries]of buckets){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!merged)throw new Error(`Cannot build ${item.id}`);const mesh=new T.Mesh(merged,material);mesh.name=`${item.id} ${material===glass?"crystal":material===metal?"relief":"core"}`;mesh.userData.itemId=item.id;mesh.castShadow=material!==glass;mesh.receiveShadow=true;root.add(mesh);}
  for(const material of [metal,dark,glass,jewel])if(!buckets.has(material))material.dispose();
  root.rotation.y=(index%5-2)*.11;root.userData.geometryEdition="sculpted-relief-v2";
  return root;
}

export function disposeCurrencySculpture(group:T.Object3D){group.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});}
