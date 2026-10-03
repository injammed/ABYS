import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { buildCathedral, vaultGeometry, LOOK_LIMIT, ceilingAim } from '../lib/cathedral.ts';
const texture=new T.Texture();
const cathedral=buildCathedral(-126,texture);
cathedral.root.updateMatrixWorld(true);
assert.ok(cathedral.root.children.length<=7,'Architecture stays batched by material');
let triangles=0;
const resources=new Set();
cathedral.root.traverse(n=>{if(n.isMesh){
 for(const a of Object.values(n.geometry.attributes)) for(const value of a.array) assert.ok(Number.isFinite(value));
 triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;
 resources.add(n.geometry);resources.add(n.material);
}});
assert.ok(triangles<60000,'Architecture retains a mobile-sized geometry budget');
const painted=cathedral.root.children.find(n=>n.material.map===texture);
assert.ok(painted,'The supplied fresco is a real surface in the cathedral');
for(const z of [0,-30,-60,-90,-120]){
 const ray=new T.Raycaster(new T.Vector3(0,1.8,z),new T.Vector3(0,1,0));
 const hits=ray.intersectObject(painted);assert.ok(hits.length,'Every hall has a ceiling painting');
 assert.ok(hits[0].point.y>14,'Fresco is above the player, not an exhibit panel');
 assert.ok(Math.abs(hits[0].uv.x-.5)<.01&&Math.abs(hits[0].uv.y-.5)<.01,'Painting centered over each hall');
}
for(const x of [-5,0,5]) for(const z of [8,0,-14,-30,-74,-120,-131]) {
 const aim=ceilingAim(x,z,5);const camera=new T.PerspectiveCamera();camera.position.set(x,1.8,z);camera.rotation.set(aim.pitch,aim.yaw,0,'YXZ');
 const ray=new T.Raycaster(camera.position,camera.getWorldDirection(new T.Vector3()));
 assert.ok(ray.intersectObject(painted).length,'Look up must aim at painted vault from every hall and aisle');
}
assert.ok(LOOK_LIMIT>1.48&&LOOK_LIMIT<Math.PI/2,'Camera can look overhead without inversion');
const geometry=vaultGeometry(0,14);
assert.equal(geometry.attributes.position.count,98);geometry.dispose();
let disposed=0;resources.forEach(r=>r.addEventListener('dispose',()=>disposed++));cathedral.dispose();assert.equal(disposed,resources.size);
const image=await readFile('public/images/cathedral-fresco.jpeg');
assert.equal(createHash('sha256').update(image).digest('hex'),'8ff02d289af32c285e33dca0b77e455f13301b1723a20a83a8c31a30b6127ea5');
console.log(`Cathedral PASS: overhead fresco in all five halls; ${triangles} triangles; resources released; original artwork preserved.`);
