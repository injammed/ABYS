"use client";
import { useEffect, useRef, useState } from "react";
import { asset, items } from "@/lib/currency-library";
import {CurrencyJoystick} from "./CurrencyJoystick";
import {smoothAxis} from "@/lib/currency-navigation";
import styles from "./CurrencyMuseum.module.css";

type Action = "reset" | `hall${number}`;
const hallCount=Math.ceil(items.length/10);
const lastRow=-Math.floor((items.length-1)/2)*6;
const corridorLength=20-lastRow;
const corridorCenter=(lastRow-4)/2;
export function CurrencyWalk({ onSelect }: { onSelect: (id: string) => void }) {
  const motion=useRef({x:0,y:0,lookX:0,lookY:0});
  const host = useRef<HTMLDivElement>(null);
  const action = useRef<(a: Action) => void>(() => {});
  const select = useRef(onSelect);
  select.current = onSelect;
  const [status, setStatus] = useState("Opening the exhibition…");
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    Promise.all([import("three"),import("@/lib/currency-sculpture"),import("three/addons/environments/RoomEnvironment.js")]).then(([THREE,{buildCurrencySculpture,disposeCurrencySculpture},{RoomEnvironment}]) => {
      if (disposed || !host.current) return;
      const parent = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
      catch { setStatus("3D is unavailable on this device. Explore the complete Catalog or Forecast instead."); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x080b10);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
      parent.appendChild(renderer.domElement);
      const canvas = renderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute("aria-label", "Walkable ITEM exhibition. Focus here; use W A S D to move, arrow keys to turn, or drag to look. Select an exhibit for its record.");
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x080b10, 15, 42);
      const camera = new THREE.PerspectiveCamera(62, 1, .1, 180);
      camera.position.set(0, 1.8, 6);
      let yaw = 0, pitch=0;let velocity={x:0,y:0};
      const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const materials: InstanceType<typeof THREE.Material>[] = [];
      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const sculptures: InstanceType<typeof THREE.Group>[] = [];
      const obstacles: {x:number;z:number}[] = [];
      const box = (w:number,h:number,d:number,x:number,y:number,z:number,color:number) => {
        const g = new THREE.BoxGeometry(w,h,d); const m = new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.25});
        geometries.push(g);materials.push(m);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;
      };
      scene.add(new THREE.HemisphereLight(0xc9d8f2,0x453820,2.2));
      const pmrem=new THREE.PMREMGenerator(renderer);
      const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
      const key=new THREE.DirectionalLight(0xffedcb,3);key.position.set(3,8,8);scene.add(key);
      const fill=new THREE.DirectionalLight(0xaacbff,2);fill.position.set(-4,4,-10);scene.add(fill);
      box(12,.2,corridorLength,0,-.1,corridorCenter,0x151a22);
      box(.2,6,corridorLength,-6,3,corridorCenter,0x111723);box(.2,6,corridorLength,6,3,corridorCenter,0x111723);
      for(let z=7;z>lastRow-8;z-=5){box(.04,.02,3,0,.02,z,0x9f8251);box(12,.05,.08,0,5,z,0xb99964);}
      items.forEach((item,i)=>{
        const x=i%2===0?-3.3:3.3;const z=-Math.floor(i/2)*6;
        box(1.9,1.05,1.9,x,.525,z,0x20252e);
        box(1.96,.06,1.96,x,1.08,z,0x9a7b47);
        const sculpture=buildCurrencySculpture(item);
        const bounds=new THREE.Box3().setFromObject(sculpture);
        sculpture.position.set(x,1.115-bounds.min.y,z);scene.add(sculpture);sculptures.push(sculpture);obstacles.push({x,z});
      });
      const clock=new THREE.Clock();const keys=new Set<string>();
      const blocked=(x:number,z:number)=>obstacles.some(o=>Math.abs(x-o.x)<1.22&&Math.abs(z-o.z)<1.22);
      const move=(forward:number,side:number)=>{
        const nx=Math.max(-5.25,Math.min(5.25,camera.position.x-Math.sin(yaw)*forward+Math.cos(yaw)*side));
        const nz=Math.max(lastRow-5,Math.min(8,camera.position.z-Math.cos(yaw)*forward-Math.sin(yaw)*side));
        if(!blocked(nx,camera.position.z))camera.position.x=nx;
        if(!blocked(camera.position.x,nz))camera.position.z=nz;
      };
      action.current=a=>{camera.position.set(0,1.8,a.startsWith("hall")?6-Number(a.slice(4))*30:6);yaw=0;pitch=0;motion.current={x:0,y:0,lookX:0,lookY:0};velocity={x:0,y:0};};
      const keydown=(e:KeyboardEvent)=>{if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());}};
      const keyup=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
      const clear=()=>keys.clear();
      let dragging=false;let startX=0;let lastX=0;let lastY=0;let distance=0;
      const down=(e:PointerEvent)=>{canvas.focus();dragging=true;startX=e.clientX;lastX=startX;lastY=e.clientY;distance=0;canvas.setPointerCapture(e.pointerId);};
      const drag=(e:PointerEvent)=>{if(dragging){yaw-=(e.clientX-lastX)*.005;pitch=Math.max(-.7,Math.min(.7,pitch-(e.clientY-lastY)*.003));distance+=Math.abs(e.clientX-lastX)+Math.abs(e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;}};
      const up=(e:PointerEvent)=>{if(!dragging)return;dragging=false;if(distance>6)return;const rect=canvas.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObjects(sculptures.filter(s=>s.visible),true)[0];if(hit)select.current(hit.object.userData.itemId);};
      const cancel=()=>{dragging=false;clear();motion.current={x:0,y:0,lookX:0,lookY:0};velocity={x:0,y:0};};
      canvas.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);canvas.addEventListener("blur",clear);window.addEventListener("blur",cancel);
      canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",drag);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",cancel);
      const resize=new ResizeObserver(()=>{const {width,height}=parent.getBoundingClientRect();if(width&&height){renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}});resize.observe(parent);
      let frame=0;
      const render=()=>{
        if(disposed)return;const dt=Math.min(clock.getDelta(),.05);
        if(keys.has("arrowleft"))yaw+=dt*1.3;if(keys.has("arrowright"))yaw-=dt*1.3;
        yaw-=motion.current.lookX*dt*1.55;pitch=Math.max(-.7,Math.min(.7,pitch-motion.current.lookY*dt));
        const forward=Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown"))-motion.current.y;
        const side=Number(keys.has("d"))-Number(keys.has("a"))+motion.current.x;const length=Math.max(1,Math.hypot(forward,side));
        velocity.x=smoothAxis(velocity.x,side/length,dt);velocity.y=smoothAxis(velocity.y,forward/length,dt);
        move(velocity.y*dt*3.8,velocity.x*dt*3.8);camera.rotation.set(pitch,yaw,0,"YXZ");
        for(const sculpture of sculptures)sculpture.visible=Math.abs(sculpture.position.z-camera.position.z)<38;
        if(document.visibilityState==="visible")renderer.render(scene,camera);frame=requestAnimationFrame(render);
      };render();setStatus("");
      cleanup=()=>{cancelAnimationFrame(frame);resize.disconnect();canvas.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);canvas.removeEventListener("blur",clear);window.removeEventListener("blur",cancel);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",drag);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",cancel);geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());sculptures.forEach(disposeCurrencySculpture);environment.dispose();renderer.dispose();canvas.remove();action.current=()=>{};};
    }).catch(()=>{if(!disposed)setStatus("3D could not open. Explore the Catalog or Forecast instead.");});
    return()=>{disposed=true;cleanup();};
  },[]);
  return <div className={styles.walk} data-sculpture-gallery="sculpted-relief-gallery-v4">
    <div className={styles.canvas} ref={host} style={{backgroundImage:`url("${asset("clear-relief")}")`,backgroundSize:"cover",backgroundPosition:"center"}} />
    <nav className={styles.halls} aria-label="Jump to exhibition hall">{Array.from({length:hallCount},(_,n)=>n).map(n=><button key={n} onClick={()=>action.current(`hall${n}` as Action)} aria-label={`Hall ${n+1}, objects ${n*10+1} to ${Math.min(items.length,n*10+10)}`}>{String(n+1).padStart(2,"0")}</button>)}</nav>
    <div className={styles.walkControls}>{status&&<p role="status">{status}</p>}<div className={styles.joystickRow}>
      <CurrencyJoystick label="Move" onMove={(x,y)=>{motion.current.x=x;motion.current.y=y;}}/>
      <button aria-label="Return to entrance" onClick={()=>action.current("reset")}>⌂</button>
      <CurrencyJoystick label="Look" onMove={(x,y)=>{motion.current.lookX=x;motion.current.lookY=y;}}/>
    </div></div>
  </div>;
}
