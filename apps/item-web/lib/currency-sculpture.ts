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
    if(index%3!==1){circle(.505,.008,.016);circle(.538,.006,.011);if(high)guilloche(face,.524,.006,72,.02);}
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
  // These three source studies have dedicated construction, not generic cube presets.
  const faceMatrices=()=>[[0,0,0],[0,Math.PI/2,0],[0,Math.PI,0],[0,-Math.PI/2,0],[-Math.PI/2,0,0],[Math.PI/2,0,0]].map(r=>new T.Matrix4().makeRotationFromEuler(new T.Euler(...r as [number,number,number])).multiply(new T.Matrix4().makeTranslation(0,0,.715)));
  function faceRing(face:T.Matrix4,r:number,tube:number,z=0,m:T.Material=metal,sx=1,sy=1){const g=new T.TorusGeometry(r,tube,high?8:5,high?96:48);g.scale(sx,sy,1);g.translate(0,0,z);g.applyMatrix4(face);add(g,m);}
  function faceStroke(face:T.Matrix4,points:number[][],radius=.004,m:T.Material=metal){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p).applyMatrix4(face)));add(new T.TubeGeometry(path,high?32:16,radius,high?6:4,false),m);}
  function faceBead(face:T.Matrix4,p:number[],scale:number[],m:T.Material=metal){const g=new T.SphereGeometry(1,high?24:12,high?16:8);g.scale(...scale as [number,number,number]);g.translate(...p as [number,number,number]);g.applyMatrix4(face);add(g,m);}
  function stars(face:T.Matrix4){
    for(let row=0;row<4;row++)for(let col=0;col<4;col++){
      const x=-.54+col*.35+(row%2)*.025,y=-.53+row*.35;
      const points=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.024:.058;return [x+Math.cos(a)*r,y+Math.sin(a)*r];});
      const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:.0015,bevelEnabled:false});g.applyMatrix4(face);add(g,metal);
    }
  }
  function guilloche(face:T.Matrix4,r:number,amplitude:number,frequency:number,z=0,m:T.Material=metal,sx=1,sy=1){
    const points=Array.from({length:high?241:121},(_,i)=>{const a=i/(high?240:120)*Math.PI*2,rr=r+amplitude*Math.sin(a*frequency);return new T.Vector3(Math.cos(a)*rr*sx,Math.sin(a)*rr*sy,z).applyMatrix4(face);});
    add(new T.TubeGeometry(new T.CatmullRomCurve3(points),high?240:120,.003,4,true),m);
  }
  function franklin(face:T.Matrix4){
    // Bald crown, elongated face, side hair, nose, eyelids and coat are distinct volumes.
    faceBead(face,[0,.10,.048],[.195,.285,.064]);
    faceBead(face,[.014,-.06,.087],[.15,.155,.045]);
    faceBead(face,[.012,.045,.119],[.027,.085,.026]);
    faceBead(face,[.019,-.013,.134],[.035,.024,.026]);
    for(const side of [-1,1]){
      faceBead(face,[side*.17,.025,.044],[.045,.066,.029]);
      faceStroke(face,[[side*.031,.11,.108],[side*.078,.13,.112],[side*.125,.11,.093]],.01);
      faceStroke(face,[[side*.034,.095,.112],[side*.073,.085,.123],[side*.116,.093,.105]],.005,dark);
      faceBead(face,[side*.073,.094,.124],[.008,.009,.004],dark);
      for(let j=0;j<10;j++)faceStroke(face,[[side*(.14+j*.006),.23-j*.009,.04],[side*(.20+j*.005),.12,.068],[side*(.19+j*.006),-.06,.071],[side*(.23+j*.004),-.20,.046]],.006);
      faceStroke(face,[[side*.073,.20,.108],[side*.025,.213,.116],[0,.211,.117]],.0025,dark);
    }
    faceStroke(face,[[-.08,-.107,.111],[0,-.096,.13],[.073,-.10,.11]],.004,dark);
    faceStroke(face,[[-.06,-.132,.107],[0,-.142,.112],[.063,-.13,.103]],.003);
    relief([[-.31,-.43],[-.23,-.28],[-.09,-.19],[0,-.23],[.10,-.2],[.26,-.31],[.31,-.43]],.035,dark,face);
    relief([[-.09,-.2],[0,-.25],[-.04,-.39],[-.16,-.27]],.046,metal,face);
    relief([[.1,-.2],[.02,-.25],[.035,-.39],[.17,-.28]],.046,metal,face);
    for(let j=0;j<13;j++){const y=-.18+j*.035;faceStroke(face,[[-.11,y,.079],[-.06,y+.004,.099],[0,y+.007,.114],[.06,y+.004,.103],[.105,y,.079]],.0015,dark);}
  }
  if(item.form==="Inlaid"){
    dark.color.set(0x29211f);dark.metalness=.72;dark.roughness=.39;metal.color.set(0xc6c0b2);metal.roughness=.34;jewel.color.set(0xb97750);
    add(new RoundedBoxGeometry(1.43,1.43,1.43,3,.007),dark);
    faceMatrices().forEach(stars);
    const seal=new T.Matrix4().makeTranslation(-.48,.41,.721);
    const disk=new T.CylinderGeometry(.051,.051,.009,high?64:32);disk.rotateX(Math.PI/2);disk.applyMatrix4(seal);add(disk,jewel);
    faceRing(seal,.06,.008,.006,jewel);guilloche(seal,.062,.007,6,.008,jewel);
    for(let j=0;j<5;j++)faceStroke(seal,[[-.025,-.025+j*.012,.012],[.025,-.025+j*.012,.012]],.0015,jewel);
  }else if(item.form==="Filigree"){
    add(new RoundedBoxGeometry(1.40,1.40,1.40,3,.09),glass);
    const faces=faceMatrices();
    faces.forEach((face,i)=>{
      const shape=new T.Shape();shape.moveTo(-.61,-.68);shape.lineTo(.61,-.68);shape.lineTo(.68,-.61);shape.lineTo(.68,.61);shape.lineTo(.61,.68);shape.lineTo(-.61,.68);shape.lineTo(-.68,.61);shape.lineTo(-.68,-.61);shape.closePath();const hole=new T.Path();hole.absarc(0,0,.56,0,Math.PI*2,true);shape.holes.push(hole);
      const plate=new T.ExtrudeGeometry(shape,{depth:.014,bevelEnabled:true,bevelSize:.007,bevelThickness:.004,bevelSegments:2,curveSegments:high?64:32});plate.applyMatrix4(face);add(plate,metal);
      faceRing(face,.565,.012,.021);faceRing(face,.607,.009,.023);guilloche(face,.59,.01,40,.026);
      for(let j=0;j<24;j++){const a=j*Math.PI/12;const a1=new T.Vector3(Math.cos(a)*.27,Math.sin(a)*.27,-.06).applyMatrix4(face),a2=new T.Vector3(Math.cos(a)*.55,Math.sin(a)*.55,-.06).applyMatrix4(face);rod(a1,a2,.005,jewel);}
      for(const x of [-.5,.5])for(const y of [-.5,.5]){
        const corner=face.clone().multiply(new T.Matrix4().makeTranslation(x,y,.03));guilloche(corner,.092,.021,5,0);faceRing(corner,.056,.004);guilloche(corner,.055,.01,7,.004,jewel);
        const stone=new T.OctahedronGeometry(.037);stone.translate(x,y,.033);stone.applyMatrix4(face);add(stone,glass);
      }
      const center=face.clone().multiply(new T.Matrix4().makeScale(.88,.88,1));motif(center,i===0?0:i===4?1:i%3);
    });
    add(new T.IcosahedronGeometry(.22,2),jewel);for(let j=0;j<4;j++)ring(.34+j*.052,.014,[0,0,0],[j*.6,j*.8,.3],jewel);
  }else if(item.form==="Portrait"){
    add(new RoundedBoxGeometry(1.4,1.4,1.4,3,.012),glass);
    const faces=faceMatrices();
    faces.forEach((face,i)=>{
      if(i===4||i===5)return;
      // Pierced engraving panels keep the crystal interior visible around the relief.
      const shape=new T.Shape();shape.moveTo(-.685,-.685);shape.lineTo(.685,-.685);shape.lineTo(.685,.685);shape.lineTo(-.685,.685);shape.closePath();const hole=new T.Path();hole.absellipse(0,0,.37,.51,0,Math.PI*2,true,0);shape.holes.push(hole);
      const panel=new T.ExtrudeGeometry(shape,{depth:.006,bevelEnabled:false,curveSegments:high?64:32});panel.applyMatrix4(face);add(panel,dark);
      faceRing(face,.48,.012,.018,metal,.82,1.16);guilloche(face,.515,.008,52,.015,metal,.80,1.12);
      for(const side of [-1,1])for(let line=0;line<5;line++)faceStroke(face,Array.from({length:25},(_,j)=>[-.64+j*.053,side*(.57+line*.017)+Math.sin(j*2.3+line)*.006,.012]),.0025);
      for(const x of [-.57,.57])for(const y of [-.45,.45]){const corner=face.clone().multiply(new T.Matrix4().makeTranslation(x,y,.01));guilloche(corner,.076,.017,9);}
      if(i%2===0)franklin(face);else motif(face.clone().multiply(new T.Matrix4().makeScale(.83,.83,1)),1);
    });
    for(let j=0;j<5;j++)ring(.27+j*.054,.012,[0,.12,0],[j*.24,j*.40,0],jewel);
    ring(.60,.013,[0,.68,0],[Math.PI/2,0,0],jewel);
    motif(new T.Matrix4().makeRotationX(-Math.PI/2).multiply(new T.Matrix4().makeTranslation(0,0,.41)).multiply(new T.Matrix4().makeScale(.56,.56,.7)),1);
  }else if(item.form==="Union"){

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
  root.rotation.y=(index%5-2)*.11;root.userData.geometryEdition="signature-relief-v3";
  return root;
}

export function disposeCurrencySculpture(group:T.Object3D){group.traverse(object=>{if(object instanceof T.Mesh){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(m=>m.dispose());}});}
