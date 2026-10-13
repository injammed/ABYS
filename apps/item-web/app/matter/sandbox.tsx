'use client';
import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {MatterEngine,DIAMETER,STEP} from '../../lib/matter-engine';
import {vaultGeometry} from '../../lib/cathedral';
import styles from './matter.module.css';

type Sample={frameMs:number;simulationMs:number;particles:number;collisions:number;brokenBonds:number;droppedSteps:number};
export default function MatterSandbox(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<MatterEngine|null>(null),paused=useRef(false),debug=useRef(false),samples=useRef<Sample[]>([]),stats=useRef<HTMLDivElement>(null);
 const [running,setRunning]=useState(true),[count,setCount]=useState(5000),[raw,setRaw]=useState(false),[error,setError]=useState('');
 useEffect(()=>{
  const element=host.current;if(!element)return;
  let renderer:T.WebGLRenderer;try{renderer=new T.WebGLRenderer({antialias:true});}catch{setError('WebGL is unavailable. Try a browser with hardware acceleration.');return;}
  const sim=new MatterEngine(matchMedia('(max-width:700px)').matches?1500:5000);engine.current=sim;setCount(sim.count);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));element.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#0a1015');scene.fog=new T.Fog('#0a1015',22,55);
  const camera=new T.PerspectiveCamera(48,1,.1,100);camera.position.set(11,10,13);
  const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1,0);orbit.enableDamping=true;orbit.maxDistance=28;orbit.minDistance=7;orbit.maxPolarAngle=Math.PI*.49;
  scene.add(new T.HemisphereLight(0xd6f4ff,0x29313a,3));const sun=new T.DirectionalLight(0xffe7ba,4);sun.position.set(5,12,4);scene.add(sun);
  const stone=new T.MeshStandardMaterial({color:0xaaa99c,roughness:.85}),dark=new T.MeshStandardMaterial({color:0x273741}),waterMaterial=new T.MeshStandardMaterial({color:0x46bfc8,roughness:.22,metalness:.25,side:T.DoubleSide});
  function mesh(g:T.BufferGeometry,m:T.Material,x=0,y=0,z=0){const obj=new T.Mesh(g,m);obj.position.set(x,y,z);scene.add(obj);return obj;}
  // Reuse the production vault's geometry, cropped to one arena bay. No game mutations.
  stone.side=T.DoubleSide;mesh(vaultGeometry(0,10,6),stone);
  for(const x of [-5.65,5.65])for(const z of [-4.5,4.5])mesh(new T.CylinderGeometry(.27,.36,8.15,12),stone,x,4.45,z);
  mesh(new T.BoxGeometry(9,.25,7),dark,0,-2.25,0);
  for(const x of [-4.4,4.4])mesh(new T.BoxGeometry(.3,2,7),stone,x,-1.1,0);
  for(const z of [-3.4,3.4])mesh(new T.BoxGeometry(9,2,.3),stone,0,-1.1,z);
  const block=mesh(new T.BoxGeometry(1.3,1.3,1.3),new T.MeshStandardMaterial({color:0xd7ad64,metalness:.6,roughness:.3}));
  const floor=new T.InstancedMesh(new T.BoxGeometry(DIAMETER,.18,DIAMETER),stone,sim.floorCount);scene.add(floor);
  const dots=new T.InstancedMesh(new T.SphereGeometry(DIAMETER/2,6,4),waterMaterial,5000);scene.add(dots);
  const surface=new MarchingCubes(36,waterMaterial,false,false,50000);surface.position.set(0,4,0);surface.scale.set(6,6,6);surface.isolation=60;scene.add(surface);
  const dummy=new T.Object3D();let raf=0,last=performance.now(),accumulator=0,lastReport=last,slow=0,dropped=0,disposed=false;
  const resize=()=>{const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(element);resize();
  const onLost=(e:Event)=>{e.preventDefault();paused.current=true;setRunning(false);setError('Graphics context lost. Reload this prototype to restart.');};renderer.domElement.addEventListener('webglcontextlost',onLost);
  const animate=(now:number)=>{
   if(disposed)return;raf=requestAnimationFrame(animate);const elapsed=now-last;last=now;const begin=performance.now();let stepMs=0;
   if(!paused.current){accumulator+=Math.min(elapsed/1000,.1);let steps=0;while(accumulator>=STEP&&steps<2){const start=performance.now();sim.step();stepMs+=performance.now()-start;accumulator-=STEP;steps++;}if(accumulator>=STEP){dropped+=Math.floor(accumulator/STEP);accumulator%=STEP;}}
   else accumulator=0;
   for(let i=0;i<sim.floorCount;i++){dummy.position.fromArray(sim.position,i*3);dummy.updateMatrix();floor.setMatrixAt(i,dummy.matrix);}floor.instanceMatrix.needsUpdate=true;
   dots.visible=debug.current;surface.visible=!debug.current;
   if(debug.current){dots.count=sim.count-sim.floorCount;for(let i=sim.floorCount;i<sim.count;i++){dummy.position.fromArray(sim.position,i*3);dummy.updateMatrix();dots.setMatrixAt(i-sim.floorCount,dummy.matrix);}dots.instanceMatrix.needsUpdate=true;}
   else {surface.reset();for(let i=sim.floorCount;i<sim.count;i++){const k=i*3;surface.addBall((sim.position[k]+6)/12,(sim.position[k+1]+2)/12,(sim.position[k+2]+6)/12,.045,12);}surface.update();}
   block.position.set(sim.block.x,sim.block.y,sim.block.z);orbit.update();renderer.render(scene,camera);
   const workMs=performance.now()-begin;
   if(!paused.current){samples.current.push({frameMs:elapsed,simulationMs:stepMs,particles:sim.count,collisions:sim.collisions,brokenBonds:sim.broken,droppedSteps:dropped});if(samples.current.length>1800)samples.current.shift();}
   // Sustained overload reduces particles and rendering resolution, never increases them silently.
   slow=workMs>30?slow+1:Math.max(0,slow-1);if(slow>60&&sim.count>1500){sim.count=Math.max(1500,Math.floor(sim.count*.75));setCount(sim.count);renderer.setPixelRatio(1);slow=0;}
   if(now-lastReport>500){if(stats.current)stats.current.textContent=`${sim.count.toLocaleString()} particles · Ø 0.25 m\n${(1000/Math.max(1,elapsed)).toFixed(0)} FPS · ${elapsed.toFixed(1)} ms/frame\n${stepMs.toFixed(1)} ms simulation/frame\n${sim.collisions} contact corrections · ${sim.broken} broken bonds\n${dropped} dropped simulation steps\n${(sim.bytes/1024).toFixed(0)} KiB particle buffers*`;lastReport=now;}
  };raf=requestAnimationFrame(animate);
  const visibility=()=>{last=performance.now();accumulator=0;};document.addEventListener('visibilitychange',visibility);
  return()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',onLost);orbit.dispose();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();engine.current=null;};
 },[]);
 function reset(n=count){engine.current?.reset(n);samples.current=[];setCount(n);}
 function download(){const body={recordedAt:new Date().toISOString(),userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],targets:{simulationHz:30,renderFps:60,particleDiameterM:.25},limitations:'Experimental positional fluid; no validated density solver. Buffer memory excludes GPU, geometry, hash and JS heap.',samples:samples.current};const url=URL.createObjectURL(new Blob([JSON.stringify(body,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aetimm-matter-benchmark.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 return <main className={styles.shell}><div className={styles.view} ref={host}/><header className={styles.header}><span className={styles.tag}>AETIMM / REFINE / EXPERIMENT 001</span><h1>Matter Engine</h1><p>Break the floor. Move the solid. Watch matter respond.<br/>A cathedral bay, isolated from the survival world.</p></header><div className={styles.stats} ref={stats} aria-label="Live performance measurements"/>{error&&<p className={styles.error} role="alert">{error}</p>}<nav className={styles.panel} aria-label="Physics experiment controls"><button onClick={()=>engine.current?.fracture(0,0)}>Break floor</button><button onClick={()=>{const s=engine.current;if(s)s.blockTarget=s.blockTarget>0?-1.7:1.7;}}>Move solid</button><button onClick={()=>{paused.current=!paused.current;setRunning(!paused.current);}}>{running?'Pause':'Resume'}</button><button onClick={()=>reset()}>Reset</button><label>Particles <select value={count} onChange={e=>reset(Number(e.target.value))}>{[...new Set([1500,3000,5000,count])].sort((a,b)=>a-b).map(n=><option key={n} value={n}>{n}</option>)}</select></label><button aria-pressed={raw} onClick={()=>{debug.current=!debug.current;setRaw(debug.current);}}>{raw?'Smooth surface':'Particle view'}</button><button onClick={download}>Export measurements</button><a href={`${process.env.NEXT_PUBLIC_BASE_PATH??''}/`}>Return to game</a><span className={styles.note}>Drag to orbit · pinch/scroll to zoom. Targets: 30 Hz simulation / 60 FPS render, unverified across devices. Auto-reduces under load. *Buffer allocation only. Water is approximate; density validation, heat and smoke are pending.</span></nav></main>;
}
