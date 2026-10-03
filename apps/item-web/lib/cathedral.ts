import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import CEILINGS from "./cathedral-art.json" with {type:"json"};

export const LOOK_LIMIT = Math.PI / 2 - .06;

export function ceilingAim(x: number, z: number, hallCount: number) {
  const hall = Math.max(0, Math.min(hallCount - 1, Math.round(-z / 30)));
  const dz = z + hall * 30;
  return { yaw: Math.atan2(x, dz), pitch: Math.min(LOOK_LIMIT, Math.atan2(14.94 - 1.8, Math.hypot(x, dz))) };
}

// Inward-facing barrel vault. Physical arc width / panel length matches the
// individual painting so its figures retain their proportions on the vault.
export function vaultGeometry(z: number, length: number, radius = 5.94) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const segments = 48;
  for (let row = 0; row < 2; row++) for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI;
    positions.push(-radius * Math.cos(angle), 9 + radius * Math.sin(angle), z + (row - .5) * length);
    uv.push(i / segments, row);
  }
  for (let i = 0; i < segments; i++) {
    const a = i, b = i + segments + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export function buildCathedral(lastRow: number, frescoes: THREE.Texture[]) {
  const root = new THREE.Group(); root.name = "AETIMM cathedral";
  const stone = new THREE.MeshStandardMaterial({ color: 0xe7d9bb, roughness: .82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x303b3d, roughness: .36, metalness: .16 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb98a3e, roughness: .3, metalness: .72 });
  const light = new THREE.MeshBasicMaterial({ color: 0xffe8b3 });
  if(frescoes.length!==CEILINGS.length)throw new Error("Each hall requires its own ceiling texture");
  const paintings = frescoes.map(map=>new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false }));
  const glass = new THREE.MeshBasicMaterial({ color: 0x88bbcc });
  const geometries = new Set<THREE.BufferGeometry>();
  function mesh(g: THREE.BufferGeometry, m: THREE.Material, x=0, y=0, z=0) {
    geometries.add(g); const object = new THREE.Mesh(g,m); object.position.set(x,y,z); root.add(object); return object;
  }
  function box(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material) {
    return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  }
  function arch(z:number, radius=5.87) {
    const points = Array.from({length:49},(_,i)=>{const a=i/48*Math.PI;return new THREE.Vector3(-radius*Math.cos(a),9+radius*Math.sin(a),z);});
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,.075,6,false),gold);
  }
  const length = 20-lastRow, center = (lastRow-4)/2;
  box(12,.25,length,0,-.125,center,stone);
  box(.35,9,length,-6.15,4.5,center,stone); box(.35,9,length,6.15,4.5,center,stone);
  box(12,15,.3,0,7.5,lastRow-9,stone); box(12,15,.3,0,7.5,10,stone);
  mesh(vaultGeometry(center,length,6),stone).material.side=THREE.DoubleSide;
  // Five paintings, one overhead in each hall. These are architectural surfaces;
  // all collection exhibits remain the existing volumetric sculptures.
  for(let hall=0;hall<Math.ceil((-lastRow/6*2+1)/10);hall++) {
    const z=-hall*30;
    const art=CEILINGS[hall];
    const panelLength=5.94*Math.PI/(art.width/art.height);
    mesh(vaultGeometry(z,panelLength),paintings[hall]);
    arch(z-panelLength/2); arch(z+panelLength/2);
  }
  const shaft = new THREE.CylinderGeometry(.27,.36,8.15,12);
  const collar = new THREE.CylinderGeometry(.46,.46,.22,12);
  for(let z=8;z>=lastRow-8;z-=6) {
    for(const side of [-1,1]) {
      mesh(shaft,stone,side*5.65,4.45,z);
      mesh(collar,gold,side*5.65,.46,z); mesh(collar,gold,side*5.65,8.55,z);
      box(.98,.34,.98,side*5.65,.17,z,stone);
      box(1.08,.4,1.08,side*5.65,8.86,z,stone);
      // Luminous clerestory windows and gold mullions.
      box(.03,3.4,1.85,side*5.96,6.2,z-2.8,glass);
      box(.09,3.55,.08,side*5.91,6.2,z-2.8,gold);
      box(.09,.08,1.95,side*5.91,6.6,z-2.8,gold);

      box(.07,.09,1.8,side*5.86,4.4,z-2.8,light);
    }
    // Inlaid marble path: readable depth without heavy texture assets.
    box(3.8,.014,2.9,0,.008,z,dark);
    box(.045,.018,5.8,-2,.01,z,gold); box(.045,.018,5.8,2,.01,z,gold);
  }
  for(const side of [-1,1]) box(.07,.1,length,side*5.87,9,center,gold);
  // Rose window at the far end provides a visible destination.
  const rose=mesh(new THREE.CircleGeometry(2.7,48),glass,0,8,lastRow-8.8);
  rose.rotation.y=0;
  mesh(new THREE.TorusGeometry(2.7,.13,8,48),gold,0,8,lastRow-8.7);
  for(let i=0;i<12;i++) {
    const spoke=box(.07,5.25,.08,0,8,lastRow-8.65,gold);spoke.rotation.z=i*Math.PI/12;
  }
  // Batch the static architecture by material: ten draw calls, not hundreds.
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.updateMatrixWorld(true);
  for (const child of root.children) {
    const object = child as THREE.Mesh<THREE.BufferGeometry,THREE.Material>;
    const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
    const batch=batches.get(object.material)??[];batch.push(geometry);batches.set(object.material,batch);
  }
  root.clear();geometries.forEach(g=>g.dispose());geometries.clear();
  for(const [material,batch] of batches) {
    const merged=mergeGeometries(batch);batch.forEach(g=>g.dispose());
    if(merged)mesh(merged,material);
  }
  return {root,dispose(){geometries.forEach(g=>g.dispose());[stone,dark,gold,light,...paintings,glass].forEach(m=>m.dispose());}};
}
