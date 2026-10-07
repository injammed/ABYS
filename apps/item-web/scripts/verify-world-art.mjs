import assert from 'node:assert/strict';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {buildRefugeArt,refugeWalkable,WRECKS} from '../lib/refuge-art.ts';
import {surfaceTexture} from '../lib/world-materials.ts';
import {canStand,SUPPLIES} from '../lib/survival.ts';
import {installFootprints} from '../lib/capital-map.ts';
import {VENDING} from '../lib/game-economy.ts';
// Minimal canvas fixture: verifies geometry/collision/resource contracts, not rendered quality.
const previous=globalThis.document;
globalThis.document={createElement(){return {width:0,height:0,getContext(){return {fillRect(){},strokeRect(){},fillText(){}};}};}};
try{
 installFootprints(JSON.parse(readFileSync(new URL('../public/maps/washington/buildings.json',import.meta.url))));
 for(let z=-126;z<150;z+=.5)assert.ok(refugeWalkable(0,z),'Central cathedral/street route stays open');
 for(const point of [...SUPPLIES,...VENDING])assert.ok(refugeWalkable(point.x,point.z),'No scenery blocks a supply or vending interaction');
 for(const w of WRECKS){assert.ok(canStand(w.x,w.z),'Vehicle dressing is on existing walkable streets');assert.equal(refugeWalkable(w.x,w.z),false);}
 const world=buildRefugeArt();world.root.updateMatrixWorld(true);
 const ray=new T.Raycaster(new T.Vector3(-8,1,30),new T.Vector3(0,0,1),0,20);assert.ok(ray.intersectObjects(world.collisions,true).length,'Vehicle hull blocks bullets and camera');
 const effects=world.root.children.filter(o=>o instanceof T.Points||o instanceof T.InstancedMesh);assert.equal(effects.length,2);assert.equal(effects.find(o=>o instanceof T.Points).geometry.getAttribute('position').count,256);assert.equal(effects.find(o=>o instanceof T.InstancedMesh).count,32);
 let geometryCount=0;world.root.traverse(o=>{if(o instanceof T.Mesh)geometryCount++;});for(let i=0;i<100;i++)world.update(i,0,40,true);let after=0;world.root.traverse(o=>{if(o instanceof T.Mesh)after++;});assert.equal(after,geometryCount,'Frames do not allocate new scene objects');
 let disposed=0;world.root.traverse(o=>{if(o instanceof T.Mesh)o.geometry.addEventListener('dispose',()=>disposed++);});world.dispose();assert.ok(disposed>0);
 for(const kind of ['stone','marble','asphalt','cloth','steel','facade']){const a=surfaceTexture(kind),b=surfaceTexture(kind);assert.deepEqual(a.image.data,b.image.data,'Surface generation is deterministic');assert.equal(a.image.data.length,128*128*4);a.dispose();b.dispose();}
}finally{globalThis.document=previous;installFootprints([]);}
console.log('World art PASS: open main route and interactions, vehicle collision hulls, deterministic bounded textures, fixed effect pools and disposal.');
