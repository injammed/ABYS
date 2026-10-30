import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {BANQUET,buildCathedralBanquet} from '../lib/cathedral-banquet.ts';
import {buildCathedral} from '../lib/cathedral.ts';
import {cathedralWalkable} from '../lib/cathedral-plan.ts';

const map=new T.Texture(),painting=buildCathedralBanquet(map);
const cathedral=buildCathedral(-126,Array.from({length:5},()=>new T.Texture()),true);
painting.root.updateMatrixWorld(true);cathedral.root.updateMatrixWorld(true);
assert.equal(BANQUET.width/0.3048,21);
assert.ok(Math.abs(BANQUET.width/BANQUET.height-4/3)<1e-9);
assert.equal(painting.root.children.length,3,'Artwork and relief use three draw calls');
const bounds=new T.Box3().setFromObject(painting.root);
assert.ok(bounds.min.y>0&&bounds.max.y<6,'Frame fits below the outer aisle vault');
assert.ok(bounds.max.x< -15.4,'Frame stays behind the existing collision boundary');
const art=painting.root.children.find(o=>o.material.map===map);
for(const u of [-.48,0,.48])for(const v of [-.48,0,.48]){
 const target=new T.Vector3(u*BANQUET.width,v*BANQUET.height,.025).applyMatrix4(painting.root.matrixWorld);
 const eye=new T.Vector3(-13,1.8,target.z);
 assert.ok(cathedralWalkable(eye.x,eye.z),'Painting can be approached on foot');
 const ray=new T.Raycaster(eye,target.clone().sub(eye).normalize());
 const hit=ray.intersectObjects([...painting.root.children,...cathedral.root.children])[0];
 assert.equal(hit.object,art,'Entire painting is in front of wall/piers and below vault');
}
let triangles=0,disposals=0;const resources=new Set();
for(const mesh of painting.root.children){triangles+=mesh.geometry.attributes.position.count/3;resources.add(mesh.geometry);resources.add(mesh.material);}
assert.ok(triangles<20000,'Static relief has a bounded geometry budget');
resources.forEach(r=>r.addEventListener('dispose',()=>disposals++));
painting.dispose();assert.equal(disposals,resources.size);cathedral.dispose();
const bytes=await readFile(`public${BANQUET.path}`);
console.log(`Banquet PASS: full-image sightlines, 21-foot proportions, collision clearance, ${triangles} triangles, disposal; asset SHA256 ${createHash('sha256').update(bytes).digest('hex')}`);
