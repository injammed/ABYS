import assert from 'node:assert/strict';
import * as T from 'three';
import {CHARACTERS,CLASSES,freshProfile,restoreProfile,classFor} from '../lib/character-profile.ts';
import {characterModel,applyPresetCharacter} from '../lib/character-models.ts';
import {disposeSurface} from '../lib/world-materials.ts';
assert.equal(CHARACTERS.length,12);assert.equal(new Set(CHARACTERS.map(c=>c.id)).size,12);assert.equal(new Set(CHARACTERS.map(c=>c.name)).size,12);
for(const cl of CLASSES)assert.equal(CHARACTERS.filter(c=>c.classId===cl.id).length,3);
assert.equal(classFor('witch').identity,'Female · she/her');assert.equal(classFor('knight').identity,'Male · he/him');assert.equal(classFor('cyborg').identity,'Multidimensional · they/them');assert.equal(classFor('alien').identity,'Female · she/her');
assert.match(classFor('alien').lore,/eggs.*incubation/);
for(const c of CHARACTERS){assert.deepEqual(restoreProfile(JSON.parse(JSON.stringify(c))),c);assert.deepEqual(restoreProfile({...c,name:'custom',color:0,classId:'wizard'}),c);const model=characterModel(c.color,'player',c);assert.equal(model.name,c.name);assert.equal(model.userData.legs.length,2);assert.ok(new T.Box3().setFromObject(model).max.y>1.8);const materials=new Set();model.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();materials.add(o.material);}});materials.forEach(disposeSurface);}
assert.deepEqual(restoreProfile(null),freshProfile());assert.deepEqual(restoreProfile({id:'unknown'}),freshProfile());assert.deepEqual(restoreProfile({name:'old save'}),freshProfile());const copy=freshProfile();copy.name='changed';assert.equal(freshProfile().name,'Seraphine');
const avatar=characterModel(0,'player'),gear=new T.Group(),gearMesh=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial());gear.add(gearMesh);avatar.add(gear);let disposed=0,gearDisposed=0;avatar.traverse(o=>{if(o instanceof T.Mesh&&o!==gearMesh)o.geometry.addEventListener('dispose',()=>disposed++);});gearMesh.geometry.addEventListener('dispose',()=>gearDisposed++);applyPresetCharacter(avatar,CHARACTERS[8],gear);assert.ok(disposed>0);assert.equal(gearDisposed,0);assert.equal(gear.parent,avatar);assert.equal(avatar.name,'Axiom');assert.equal(avatar.userData.legs.length,2);applyPresetCharacter(avatar,CHARACTERS[10],gear);assert.equal(avatar.name,'Nyrra');assert.equal(avatar.scale.y,1.11);assert.equal(gearDisposed,0);
console.log('Character roster PASS: 12 fixed presets, identities, canonical saves, legacy defaults, distinct models, avatar replacement and gear preservation.');
