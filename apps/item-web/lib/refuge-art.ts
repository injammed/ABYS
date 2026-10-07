import * as T from 'three';
import {batchModel} from './model-utils.ts';
import {CAPITAL_LOOK,surfaceMaterial,disposeSurface} from './world-materials.ts';

export const WRECKS=[{x:-8,z:40},{x:8,z:77},{x:-8,z:108}] as const;
export function refugeWalkable(x:number,z:number){return WRECKS.every(w=>Math.abs(x-w.x)>1.5||Math.abs(z-w.z)>3);}

// Authored refuge slice: warm sanctuary, failed evacuation, occupied streets.
// All moving effects are fixed-size GPU pools; the aerial city remains streamed/chunked.
export function buildRefugeArt(){
 const root=new T.Group();root.name='Capital / sanctuary and collapse';
 const stone=surfaceMaterial('stone',0x867e6d,3),metal=surfaceMaterial('steel',0x394943,2),rubber=new T.MeshStandardMaterial({color:0x151b1d,roughness:1}),rust=surfaceMaterial('steel',0x775143),glass=new T.MeshStandardMaterial({color:0x213c46,metalness:.3,roughness:.2}),gold=new T.MeshStandardMaterial({color:0xbaa46c,metalness:.65,roughness:.3});
 const white=new T.MeshStandardMaterial({color:0xded7bb,roughness:.8}),amber=new T.MeshBasicMaterial({color:0xffcb77}),cyan=new T.MeshBasicMaterial({color:CAPITAL_LOOK.machine});
 const materials:T.Material[]=[stone,metal,rubber,rust,glass,gold,white,amber,cyan];const collisions:T.Object3D[]=[];
 const deco=new T.Group();root.add(deco);
 const box=(g:T.Group,w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;};
 const sign=(text:string,x:number,y:number,z:number,width=4,color='#dfd2ad')=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#142222';ctx.fillRect(0,0,512,128);ctx.strokeStyle=color;ctx.lineWidth=6;ctx.strokeRect(8,8,496,112);ctx.fillStyle=color;ctx.font='bold 30px monospace';ctx.textAlign='center';ctx.fillText(text,256,76);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:texture});materials.push(m);const o=new T.Mesh(new T.PlaneGeometry(width,width/4),m);o.position.set(x,y,z);deco.add(o);
 };
 // Heavy portal surrounds the existing playable entrance; clear 4m opening.
 for(const side of [-1,1]){box(deco,1.1,6.5,1,side*3,3.25,10.6,stone);box(deco,1.5,.35,1.4,side*3,6.4,10.6,gold);for(let i=0;i<6;i++)box(deco,1.12,.09,1.06,side*3,.5+i,10.6,gold);}
 box(deco,7.2,.65,1.2,0,6.9,10.6,stone);sign('AETIMM / SANCTUARY',0,6.88,11.25,5);
 // Small candles at the walls, clear of the exhibit aisle.
 for(const z of [-8,-38,-68,-98])for(const side of [-1,1]){
  box(deco,.55,.9,.55,side*5.15,.45,z,stone);for(let n=0;n<3;n++){box(deco,.06,.24+n*.08,.06,side*5.15+(n-1)*.13,1.03+n*.04,z,white);const flame=new T.Mesh(new T.SphereGeometry(.035,6,4),amber);flame.position.set(side*5.15+(n-1)*.13,1.19+n*.08,z);deco.add(flame);}
 }
 for(const z of [-3,-60,-120]){const light=new T.PointLight(0xffcb86,18,22,2);light.position.set(0,5,z);root.add(light);}
 // Abandoned vehicles have low, explicit collision hulls; central route remains open.
 for(const [i,w] of WRECKS.entries()){
  const car=new T.Group();car.position.set(w.x,0,w.z);deco.add(car);
  box(car,2.2,.7,4.8,0,.7,0,i===1?white:rust);box(car,1.9,.85,2.4,0,1.38,.1,glass);box(car,2,.1,2.6,0,1.85,.1,metal);box(car,2.3,.12,1.4,0,1.02,-1.5,metal);
  for(const side of [-1,1])for(const end of [-1,1]){const wheel=new T.Mesh(new T.CylinderGeometry(.42,.42,.22,10),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.13,.44,end*1.45);car.add(wheel);box(car,.3,.12,.05,side*.75,.9,-2.43,i===1?cyan:amber);}
  if(i===1){box(car,.7,.12,.5,0,1.95,0,cyan);box(car,.1,.5,.03,1.11,1.02,-.1,rust);box(car,.5,.1,.03,1.11,1.02,-.1,rust);}
  const blocker=box(root,2.5,1.8,5.4,w.x,.9,w.z,rubber);blocker.visible=false;collisions.push(blocker);
 }
 // Military dressing sits behind sidewalks: barriers, sandbags, utility cables.
 for(const side of [-1,1])for(const z of [29,56,92,130]){
  for(let n=0;n<6;n++)box(deco,.6,.25,.38,side*14.5+(n%3)*.55,.2+Math.floor(n/3)*.23,z,stone);
  const mast=box(deco,.12,7,.12,side*14.4,3.5,z,metal);
  const lamp=box(deco,.7,.12,.45,side*14.4,6.9,z,amber);lamp.rotation.z=side*.2;
  const cable=new T.CatmullRomCurve3([new T.Vector3(side*14.4,6.8,z),new T.Vector3(side*14.4,5.8,z+13),new T.Vector3(side*14.4,6.8,z+26)]);deco.add(new T.Mesh(new T.TubeGeometry(cable,12,.035,4,false),rubber));mast.name='Utility mast';
 }
 sign('EVACUATION / KEEP MOVING',-14,2.6,30,4);sign('DISTRICT 01 / SIGNAL LOST',14,3.3,96,4,'#73bec5');
 // Field hospital dressing at the existing quest station, leaving its center and refugees open.
 const hospital=new T.Group();hospital.position.set(-105,0,240);deco.add(hospital);
 for(const side of [-1,1]){box(hospital,4,.15,6,side*9,3.3,-2,white);for(const dz of [-4,0])for(const dx of [-1.8,1.8])box(hospital,.08,3.3,.08,side*9+dx,1.65,dz,metal);box(hospital,4,2,.15,side*9,1.8,-4.9,white);box(hospital,.18,.9,.03,side*9,2,-4.8,rust);box(hospital,.9,.18,.03,side*9,2,-4.8,rust);for(let n=0;n<3;n++){box(hospital,.7,.15,1.8,side*9,1,-3+n*2,metal);box(hospital,.6,.1,1.6,side*9,1.12,-3+n*2,white);}}
 sign('FIELD HOSPITAL / REFUGE',-105,4,237.8,5);
 // Broken roadway, discarded cases and scorched paving, never obstructing quest stations.
 for(let i=0;i<55;i++){const x=(i%2?1:-1)*(12+(i*7%3)),z=18+i*2.2;box(deco,.25+(i%4)*.12,.04,.4,x,.045,z,i%4===0?metal:stone).rotation.y=i*2.399;}
 for(const z of [43,79,111]){const scorch=new T.Mesh(new T.CircleGeometry(3.3,16),new T.MeshBasicMaterial({color:0x19201d,transparent:true,opacity:.42,depthWrite:false}));scorch.rotation.x=-Math.PI/2;scorch.position.set(z===79?8:-8,.012,z);deco.add(scorch);materials.push(scorch.material);}
 batchModel(deco);deco.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
 const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{rift:{value:0}},vertexShader:'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 direction; uniform float rift; void main(){vec3 d=normalize(direction);float h=max(0.,d.y);vec3 sky=mix(vec3(.61,.56,.47),vec3(.085,.16,.23),pow(h,.42));float sun=pow(max(0.,dot(d,normalize(vec3(-.6,.23,.4)))),180.);sky+=vec3(1.,.56,.23)*sun*.65;float clouds=sin(d.x*35.+sin(d.z*19.)*2.)*sin(d.z*31.+d.y*22.);sky*=1.-smoothstep(.12,.55,d.y)*max(0.,clouds)*.16;sky=mix(sky,sky*vec3(.8,.42,.44),rift*.55);gl_FragColor=vec4(sky,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const sky=new T.Mesh(new T.SphereGeometry(11000,32,16),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-100;root.add(sky);materials.push(skyMaterial);
 const dustGeometry=new T.BufferGeometry(),dustPositions=new Float32Array(256*3);for(let i=0;i<256;i++){dustPositions[i*3]=(i*73%113)-56;dustPositions[i*3+1]=(i*17%60)/4;dustPositions[i*3+2]=i*43%180;}dustGeometry.setAttribute('position',new T.BufferAttribute(dustPositions,3));
 const dustMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'uniform float time;void main(){vec3 p=position;p.y=mod(p.y+time*.12,15.);p.x+=sin(time*.2+p.z)*1.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=min(3.,35./max(1.,-mv.z));gl_Position=projectionMatrix*mv;}',fragmentShader:'void main(){float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.82,.74,.59,a*.25);}'});
 const dust=new T.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;root.add(dust);materials.push(dustMaterial);
 const smoke=new T.InstancedMesh(new T.SphereGeometry(1,8,6),new T.MeshStandardMaterial({color:0x464843,transparent:true,opacity:.32,depthWrite:false,roughness:1}),32);const transform=new T.Object3D();for(let i=0;i<32;i++){const site=i%4,j=Math.floor(i/4);transform.position.set([-65,60,-120,180][site]+Math.sin(j)*2,5+j*5,[123,180,350,550][site]);transform.scale.set(2+j*.8,4,2+j*.8);transform.updateMatrix();smoke.setMatrixAt(i,transform.matrix);}root.add(smoke);materials.push(smoke.material as T.Material);
 return {root,collisions,update(time:number,x:number,z:number,rift:boolean){sky.position.set(x,0,z);skyMaterial.uniforms.rift.value=rift?1:0;dustMaterial.uniforms.time.value=time;dust.position.set(x,0,z-70);},dispose(){const geometries=new Set<T.BufferGeometry>();root.traverse(o=>{const m=o as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(o instanceof T.InstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(disposeSurface);}};
}
