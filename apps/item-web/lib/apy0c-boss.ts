import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import type {Item} from './currency-library';
export const APY0C_EXHIBIT:Item={id:'APY0C-001',name:'APY0C / the black-hole deity',country:'AETIMM · fictional galaxy',materials:'Obsidian armor · gold orbital instruments',form:'Boss',denomination:'Final boss · not for sale',tile:0,gate:'Original reference-guided game sculpture; hidden surfaces inferred.',idea:'The Eye of Horizons made into a duelist: a singularity face, orbital halo, articulated armor, crescent scythe and taloned feet.'};
/** True volumetric sculpture; no image planes or imported third-party models. */
export function buildApy0cBoss(){
 const root=new T.Group();root.name=APY0C_EXHIBIT.name;root.userData={itemId:APY0C_EXHIBIT.id,interpretation:APY0C_EXHIBIT.gate,geometryEdition:'apy0c-duelist-v1'};
 const armor=new T.MeshStandardMaterial({color:0x10151c,metalness:.9,roughness:.24}),gold=new T.MeshStandardMaterial({color:0xcda34c,metalness:.95,roughness:.25}),ivory=new T.MeshStandardMaterial({color:0xd1d4cb,metalness:.9,roughness:.2}),eye=new T.MeshStandardMaterial({color:0x020203,roughness:.95});
 const buckets=new Map<T.Material,T.BufferGeometry[]>();
 const add=(g:T.BufferGeometry,m:T.Material,p:number[]=[0,0,0],r:number[]=[0,0,0],s:number[]=[1,1,1])=>{g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...r)),new T.Vector3(...s)));g.deleteAttribute('uv');if(!g.index)g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));const list=buckets.get(m)??[];list.push(g);buckets.set(m,list);};
 const sphere=(p:number[],s:number[],m=armor)=>add(new T.SphereGeometry(1,16,12),m,p,[0,0,0],s);
 const link=(a:number[],b:number[],radius:number,m=armor)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);const g=new T.CylinderGeometry(radius*.85,radius,delta.length(),10);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));g.translate(...from.add(to).multiplyScalar(.5).toArray());add(g,m);};
 const ring=(p:number[],radius:number,tilt:number[]= [0,0,0],tube=.014)=>add(new T.TorusGeometry(radius,tube,8,64),gold,p,tilt);
 sphere([0,.9,0],[.16,.14,.13]);sphere([0,1.24,0],[.25,.32,.15]);
 for(const side of [-1,1]){
  sphere([side*.26,1.42,0],[.14,.13,.17],ivory);sphere([side*.3,1.41,.08],[.095,.08,.13]);
  link([side*.25,1.37,0],[side*.36,1.1,.04],.065);sphere([side*.36,1.08,.04],[.075,.065,.065],gold);link([side*.36,1.07,.04],[side*.47,.84,.11],.06,ivory);
  sphere([side*.47,.82,.11],[.05,.065,.045]);for(let n=0;n<3;n++)link([side*.44+n*.025,.81,.12],[side*.48+n*.018,.7,.17],.012,gold);
  sphere([side*.12,.81,0],[.11,.15,.12],ivory);link([side*.12,.8,0],[side*.18,.46,.03],.075);sphere([side*.18,.44,.03],[.08,.075,.09],gold);link([side*.18,.43,.03],[side*.26,.14,.07],.055,ivory);
  for(let n=0;n<3;n++)link([side*.26,.14,.08],[side*.26+(n-1)*.065,.015,.24],.022,ivory);
  for(let i=0;i<3;i++){const g=new T.ConeGeometry(.055,.25,4);add(g,ivory,[side*(.24+i*.027),1.2-i*.1,.145],[0,0,side*-.45]);}
 }
 // Face: a dark sphere surrounded by a luminous accretion rim and three orbital rings.
 link([0,1.47,0],[0,1.61,0],.04,gold);sphere([0,1.7,0],[.09,.09,.08],eye);ring([0,1.7,.03],.108,[0,0,0],.023);ring([0,1.7,0],.25,[.5,.2,.1]);ring([0,1.7,0],.275,[-.5,.7,.2]);ring([0,1.7,0],.28,[0,.9,0]);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;add(new T.ConeGeometry(.025,.105,5),gold,[Math.sin(a)*.3,1.7+Math.cos(a)*.3,0],[0,0,-a]);}
 for(let i=0;i<5;i++){ring([0,1.13+i*.075,.04],.17-i*.019,[Math.PI/2,0,.15],.01);sphere([0,1.35-i*.07,.16],[.021,.021,.013],gold);}
 // Curving halo blades around the shoulders and the crescent dueling scythe.
 for(const side of [-1,1]){const points=[new T.Vector3(side*.32,1.5,0),new T.Vector3(side*.49,1.65,-.01),new T.Vector3(side*.54,1.86,0),new T.Vector3(side*.45,2.02,0)];add(new T.TubeGeometry(new T.CatmullRomCurve3(points),20,.023,6,false),ivory);}
 link([-.48,.83,.12],[-.72,.19,.2],.024,gold);link([-.48,.83,.12],[-.34,1.2,.08],.024,gold);
 const blade=new T.Shape();blade.moveTo(-.74,.19);blade.quadraticCurveTo(-.55,-.06,.56,.19);blade.quadraticCurveTo(-.23,.05,-.66,.27);blade.closePath();add(new T.ExtrudeGeometry(blade,{depth:.025,bevelEnabled:true,bevelSegments:2,bevelSize:.009,bevelThickness:.009,curveSegments:24}),ivory,[0,0,.22]);
 add(new T.ConeGeometry(.04,.23,4),gold,[-.34,1.27,.08],[0,0,-.35]);
 for(const [m,gs]of buckets){const g=mergeGeometries(gs);gs.forEach(x=>x.dispose());if(!g)throw Error('APY0C geometry assembly failed');const mesh=new T.Mesh(g,m);mesh.castShadow=mesh.receiveShadow=true;mesh.userData.itemId=APY0C_EXHIBIT.id;root.add(mesh);}
 return root;
}
