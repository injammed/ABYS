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
assert.equal(signatures.size,40,'Each catalog object exports its own model');
assert.ok(triangles<750000,'Total geometry must remain within the interactive gallery budget');
const walk=await readFile('components/CurrencyWalk.tsx','utf8');assert.doesNotMatch(walk,/PlaneGeometry|TextureLoader/,'Pedestals must show 3D objects rather than image panels');assert.match(walk,/blocked/,'Visitors cannot walk through pedestals');
console.log(`Sculptures PASS: ${items.length} volumetric models; ${Math.round(triangles)} triangles; ${Math.round(bytes/1024)} KiB total GLB; all 40 export/import round trips match.`);
