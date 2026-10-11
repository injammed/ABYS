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

const hybridTextures=ceilings.map(()=>new T.Texture()),hybrid=buildCathedral(-126,hybridTextures,true);hybrid.root.updateMatrixWorld(true);
assert.equal(hybrid.root.userData.architecture.style,'Cologne × Seville');assert.equal(hybrid.root.userData.architecture.aisles,5);assert.equal(hybrid.root.userData.architecture.orangeTrees,4);
assert.ok(hybrid.root.children.length<=14,'Hybrid keeps architecture batched');
const bounds=new T.Box3().setFromObject(hybrid.root);assert.ok(bounds.max.y>=56&&bounds.max.x>=30,'Twin spires and the eastern patio shape the skyline');
let hybridTriangles=0;const hybridResources=new Set();hybrid.root.traverse(n=>{if(n.isMesh){hybridTriangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;hybridResources.add(n.geometry);hybridResources.add(n.material);for(const a of Object.values(n.geometry.attributes))for(const value of a.array)assert.ok(Number.isFinite(value));}});
assert.ok(hybridTriangles<85000,'Detailed sanctuary stays below the fixed triangle budget');
for(let hall=0;hall<5;hall++){const ray=new T.Raycaster(new T.Vector3(0,1.8,-hall*30),new T.Vector3(0,1,0));const hit=ray.intersectObjects(hybrid.root.children)[0];assert.equal(hit.object.material.map,hybridTextures[hall],'Real roof ray reaches assigned painting before structural ribs');}
const {cathedralWalkable,cathedralSafe,cathedralRoofAt}=await import('../lib/cathedral-plan.ts');
const {canStand,flightFloor}=await import('../lib/survival.ts');const {validStarTarget}=await import('../lib/star-staff.ts');
for(let z=3;z<22;z+=.1){assert.ok(canStand(0,z));const ray=new T.Raycaster(new T.Vector3(0,1.8,z),new T.Vector3(0,0,1),0,.1);assert.equal(ray.intersectObjects(hybrid.root.children).length,0,'Doorway path is visually unobstructed at eye height');}
for(const x of [-13,-8,8,13])for(let z=-12;z>=-126;z-=6)assert.ok(canStand(x,z),'All four side aisles are usable');
for(let x=12;x<=23;x+=.1)assert.ok(canStand(x,-42),'East portal joins nave and orange-tree court');
for(const [x,z] of [[16,-10],[0,-135],[3,10],[11,5],[23,-17],[30,-42],[20,-53],[5.65,-4]])assert.equal(cathedralWalkable(x,z),false,'Wall, tower, tree or column cannot be walked through');
for(const [x,z] of [[13,-50],[23,-42]]){assert.ok(cathedralSafe(x,z));assert.equal(validStarTarget({x:0,y:1.8,z:3},{x,y:0,z}),false,'New aisle/court remains protected from Starfall');}
assert.equal(cathedralRoofAt(-11,5),57);assert.ok(flightFloor(23,-17)>=46,'VTOL collision includes new belfry');
const outsideDoor=new T.Raycaster(new T.Vector3(0,1.8,12),new T.Vector3(0,0,-1),0,5);assert.equal(outsideDoor.intersectObjects(hybrid.root.children).length,0,'Exit works in both directions');
const roseRay=new T.Raycaster(new T.Vector3(0,11.1,8),new T.Vector3(0,0,1),0,3);const roseHit=roseRay.intersectObjects(hybrid.root.children)[0];assert.equal(roseHit.object.material.color.getHex(),0x88bbcc,'Spawn-facing rose window sits in a real facade opening');
let hybridDisposed=0;hybridResources.forEach(r=>r.addEventListener('dispose',()=>hybridDisposed++));hybrid.dispose();assert.equal(hybridDisposed,hybridResources.size);
console.log(`Hybrid cathedral PASS: ${hybridTriangles} triangles, ${hybrid.root.children.length} batches, five retained paintings, five walkable aisles, doors, court, safety, flight and disposal.`);
