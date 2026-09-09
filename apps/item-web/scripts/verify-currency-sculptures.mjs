import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {items} from '../lib/currency-library.ts';
import {buildCurrencySculpture,disposeCurrencySculpture} from '../lib/currency-sculpture.ts';
// Browser API used by GLTFExporter; exercise actual binary export in Node CI.
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(x=>{this.result=x;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(x=>{this.result='data:application/octet-stream;base64,'+Buffer.from(x).toString('base64');this.onloadend?.();});}};
const signatures=new Set();let triangles=0;let bytes=0;
for(const item of items){
 const model=buildCurrencySculpture(item);model.updateMatrixWorld(true);
 const box=new T.Box3().setFromObject(model);const size=box.getSize(new T.Vector3());
 assert.ok(size.x>.5&&size.y>.5&&size.z>.5,`${item.id} must have physical depth in all axes`);
 assert.ok(size.x<2.2&&size.y<2.2&&size.z<2.2,`${item.id} must fit its pedestal space`);
 let meshes=0;model.traverse(node=>{if(node.isMesh){meshes++;assert.notEqual(node.geometry.type,'PlaneGeometry');const p=node.geometry.attributes.position;for(const n of p.array)assert.ok(Number.isFinite(n));triangles+=(node.geometry.index?.count??p.count)/3;}});
 assert.ok(meshes>0&&meshes<=4,'Merged material meshes keep the forty-object gallery bounded');
 const binary=await new GLTFExporter().parseAsync(model,{binary:true});assert.ok(binary instanceof ArrayBuffer);assert.equal(new DataView(binary).getUint32(0,true),0x46546c67);bytes+=binary.byteLength;
 signatures.add(createHash('sha256').update(Buffer.from(binary)).digest('hex'));
 const loaded=await new GLTFLoader().parseAsync(binary,'');const roundtrip=new T.Box3().setFromObject(loaded.scene).getSize(new T.Vector3());assert.ok(roundtrip.distanceTo(size)<.001,`${item.id} survives GLB export/import`);
 disposeCurrencySculpture(loaded.scene);disposeCurrencySculpture(model);
}
assert.equal(signatures.size,items.length,'Each catalog object exports its own model');
assert.ok(triangles<1500000,'Detailed gallery geometry must stay under 1.5M triangles; distant sculptures are culled');
// Detail models and downloaded GLBs preserve the higher-resolution sculpting.
for(const heroItem of [items[11],...items.slice(-3)]){const hero=buildCurrencySculpture(heroItem,"hero");const detailBinary=await new GLTFExporter().parseAsync(hero,{binary:true});assert.ok(detailBinary instanceof ArrayBuffer);const detailLoaded=await new GLTFLoader().parseAsync(detailBinary,'');assert.ok(new T.Box3().setFromObject(detailLoaded.scene).getSize(new T.Vector3()).distanceTo(new T.Box3().setFromObject(hero).getSize(new T.Vector3()))<.001);disposeCurrencySculpture(hero);disposeCurrencySculpture(detailLoaded.scene);}
const {joystickVector,smoothAxis}=await import('../lib/currency-navigation.ts');
assert.deepEqual(joystickVector(.05,.04),{x:0,y:0});assert.deepEqual(joystickVector(0,-1),{x:0,y:-1});
for(const [x,y] of [[8,8],[-8,8],[8,-8],[-8,-8]]){const v=joystickVector(x,y);assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-10);assert.equal(Math.sign(v.x),Math.sign(x));assert.equal(Math.sign(v.y),Math.sign(y));}
let fast=0,slow=0;for(let i=0;i<120;i++)fast=smoothAxis(fast,1,1/120);for(let i=0;i<30;i++)slow=smoothAxis(slow,1,1/30);assert.ok(Math.abs(fast-slow)<1e-10,'Movement response is frame-rate independent');for(let i=0;i<60;i++)fast=smoothAxis(fast,0,1/60);assert.ok(fast<.00001,'Releasing joystick stops movement');
const walk=await readFile('components/CurrencyWalk.tsx','utf8');assert.doesNotMatch(walk,/PlaneGeometry|TextureLoader/,'Pedestals must show 3D objects rather than image panels');assert.match(walk,/blocked/,'Visitors cannot walk through pedestals');
console.log(`Sculptures PASS: ${items.length} volumetric models; ${Math.round(triangles)} triangles; ${Math.round(bytes/1024)} KiB total GLB; all ${items.length} export/import round trips match.`);
