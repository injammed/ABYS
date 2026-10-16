import assert from 'node:assert/strict';
import {stat} from 'node:fs/promises';
import {CHARACTERS,restoreProfile} from '../lib/character-profile.ts';
import {STARTING_LOADOUTS,loadoutFor} from '../lib/character-loadouts.ts';
assert.equal(CHARACTERS.length,12);
assert.equal(Object.keys(STARTING_LOADOUTS).length,12);
for(const group of ['witch','knight','alien','cyborg']){
 const characters=CHARACTERS.filter(c=>c.classId===group);assert.equal(characters.length,3);
 for(const character of characters){assert.equal(restoreProfile(character.id).id,character.id);const kit=loadoutFor(character);
 {assert.ok(kit);assert.equal(kit.equipment.length,4);assert.ok((await stat('public/images/loadouts/'+kit.image)).size>1000);}

 }
}
assert.equal(new Set(Object.values(STARTING_LOADOUTS).map(k=>k.source)).size,12);
console.log('Loadouts PASS: twelve save-safe character IDs, twelve unique reference sheets, three complete reference kits per class.');
