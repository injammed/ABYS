import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { buildCathedral, vaultGeometry, LOOK_LIMIT, ceilingAim } from '../lib/cathedral.ts';
const ceilings=JSON.parse(await readFile('lib/cathedral-art.json','utf8'));
assert.equal(ceilings.length,5);assert.equal(new Set(ceilings.map(x=>x.sha256)).size,5);
const textures=ceilings.map(()=>new T.Texture());
const cathedral=buildCathedral(-126,textures);
cathedral.root.updateMatrixWorld(true);
assert.ok(cathedral.root.children.length<=10,'Architecture stays batched by material');
let triangles=0;
const resources=new Set();
cathedral.root.traverse(n=>{if(n.isMesh){
 for(const a of Object.values(n.geometry.attributes)) for(const value of a.array) assert.ok(Number.isFinite(value));
 triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;
 resources.add(n.geometry);resources.add(n.material);
}});
assert.ok(triangles<60000,'Architecture retains a mobile-sized geometry budget');
const painted=cathedral.root.children.filter(n=>textures.includes(n.material.map));
assert.equal(painted.length,5,'Five separate ceiling materials');
for(let hall=0;hall<5;hall++){
 const z=-hall*30;
 const ray=new T.Raycaster(new T.Vector3(0,1.8,z),new T.Vector3(0,1,0));
 const hits=ray.intersectObjects(painted);assert.equal(hits[0].object.material.map,textures[hall],'Every hall uses exactly its assigned painting');
 assert.ok(hits[0].point.y>14,'Fresco is above the player');
 assert.ok(Math.abs(hits[0].uv.x-.5)<.01&&Math.abs(hits[0].uv.y-.5)<.01,'Painting centered over each hall');
 const box=new T.Box3().setFromObject(hits[0].object);const length=box.max.z-box.min.z;
 assert.ok(Math.abs(5.94*Math.PI/length-ceilings[hall].width/ceilings[hall].height)<.0001,'Full painting keeps its physical aspect ratio');
}
for(const x of [-5,0,5]) for(const z of [8,0,-14,-30,-74,-120,-131]) {
 const aim=ceilingAim(x,z,5);const camera=new T.PerspectiveCamera();camera.position.set(x,1.8,z);camera.rotation.set(aim.pitch,aim.yaw,0,'YXZ');
 const ray=new T.Raycaster(camera.position,camera.getWorldDirection(new T.Vector3()));
 assert.ok(ray.intersectObjects(painted).length,'Look up must aim at painted vault from every hall and aisle');
}
assert.ok(LOOK_LIMIT>1.48&&LOOK_LIMIT<Math.PI/2,'Camera can look overhead without inversion');
const geometry=vaultGeometry(0,14);
assert.equal(geometry.attributes.position.count,98);geometry.dispose();
let disposed=0;resources.forEach(r=>r.addEventListener('dispose',()=>disposed++));cathedral.dispose();assert.equal(disposed,resources.size);
for(const art of ceilings){
 const image=await readFile(`public${art.path}`);
 assert.equal(createHash('sha256').update(image).digest('hex'),art.sha256,'Original image bytes preserved');
}
console.log(`Cathedral PASS: five distinct correctly assigned frescoes; ${triangles} triangles; resources released; originals preserved.`);
