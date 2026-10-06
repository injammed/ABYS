import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Batch rigid decorative parts by material; leave animated limb groups intact.
export function batchModel(root:T.Group){
 for(const child of root.children)if(child instanceof T.Group)batchModel(child);
 const buckets=new Map<T.Material,T.Mesh[]>();
 for(const child of root.children)if(child instanceof T.Mesh&&!Array.isArray(child.material)){const list=buckets.get(child.material)??[];list.push(child);buckets.set(child.material,list);}
 for(const [material,meshes] of buckets){if(meshes.length<2)continue;const geometries=meshes.map(mesh=>{mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(mesh.matrix);});const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;meshes.forEach(m=>{root.remove(m);m.geometry.dispose();});root.add(new T.Mesh(merged,material));}
 return root;
}
