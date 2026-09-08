"use client";
import { useEffect, useRef, useState } from "react";
import { asset, items } from "@/lib/currency-library";
import styles from "./CurrencyMuseum.module.css";

type Action = "forward" | "back" | "left" | "right" | "reset";
export function CurrencyWalk({ onSelect }: { onSelect: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const action = useRef<(a: Action) => void>(() => {});
  const select = useRef(onSelect);
  select.current = onSelect;
  const [status, setStatus] = useState("Opening the exhibition…");
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import("three").then(THREE => {
      if (disposed || !host.current) return;
      const parent = host.current;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
      catch { setStatus("3D is unavailable on this device. Explore the complete Catalog or Forecast instead."); return; }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setClearColor(0x080b10);
      parent.appendChild(renderer.domElement);
      const canvas = renderer.domElement;
      canvas.tabIndex = 0;
      canvas.setAttribute("aria-label", "Walkable ITEM exhibition. Focus here; use W A S D to move, arrow keys to turn, or drag to look. Select an exhibit for its record.");
      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x080b10, 20, 55);
      const camera = new THREE.PerspectiveCamera(62, 1, .1, 100);
      camera.position.set(0, 1.8, 6);
      let yaw = 0;
      const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
      const materials: InstanceType<typeof THREE.Material>[] = [];
      const textures: InstanceType<typeof THREE.Texture>[] = [];
      const panels: InstanceType<typeof THREE.Mesh>[] = [];
      const box = (w:number,h:number,d:number,x:number,y:number,z:number,color:number) => {
        const g = new THREE.BoxGeometry(w,h,d); const m = new THREE.MeshStandardMaterial({color,roughness:.7,metalness:.25});
        geometries.push(g);materials.push(m);const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);scene.add(mesh);return mesh;
      };
      scene.add(new THREE.HemisphereLight(0xc9d8f2,0x453820,3));
      box(12,.2,42,0,-.1,-13,0x151a22);
      box(.2,6,42,-6,3,-13,0x111723);box(.2,6,42,6,3,-13,0x111723);
      for(let z=7;z>-34;z-=5){box(.04,.02,3,0,.02,z,0x9f8251);box(12,.05,.08,0,5,z,0xb99964);}
      const loader = new THREE.TextureLoader();
      const artwork = loader.load(asset("world"),()=>{textures.forEach(texture=>{texture.needsUpdate=true;});},undefined,()=>{if(!disposed)setStatus("Artwork could not load. The Catalog still contains every record.");});
      artwork.colorSpace=THREE.SRGBColorSpace;textures.push(artwork);
      items.forEach((item,i)=>{
        const side=i%2===0?-1:1;const z=-Math.floor(i/2)*6;
        box(1,.55,3.8,side*4.5,.275,z,0x252b34);
        const texture=artwork.clone();
        texture.colorSpace=THREE.SRGBColorSpace;
        texture.repeat.set(.193,.24);texture.offset.set((item.tile%5)*.2+.003,item.tile<5?.61:.105);textures.push(texture);
        const g=new THREE.PlaneGeometry(3.5,3.4);geometries.push(g);
        const m=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});materials.push(m);
        const panel=new THREE.Mesh(g,m);panel.position.set(side*4.45,2.3,z);panel.rotation.y=-side*Math.PI/2;panel.userData.itemId=item.id;scene.add(panel);panels.push(panel);
        box(.12,3.7,3.8,side*4.6,2.25,z,0x9a7b47);
      });
      const clock=new THREE.Clock();const keys=new Set<string>();
      const move=(forward:number,side:number)=>{
        camera.position.x=Math.max(-3.6,Math.min(3.6,camera.position.x-Math.sin(yaw)*forward+Math.cos(yaw)*side));
        camera.position.z=Math.max(-29,Math.min(8,camera.position.z-Math.cos(yaw)*forward-Math.sin(yaw)*side));
      };
      action.current=a=>{ if(a==="reset"){camera.position.set(0,1.8,6);yaw=0;}else if(a==="left")yaw+=.35;else if(a==="right")yaw-=.35;else move(a==="forward"?1.6:-1.6,0); };
      const keydown=(e:KeyboardEvent)=>{if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(e.key.toLowerCase())){e.preventDefault();keys.add(e.key.toLowerCase());}};
      const keyup=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
      const clear=()=>keys.clear();
      let dragging=false;let startX=0;let lastX=0;let distance=0;
      const down=(e:PointerEvent)=>{canvas.focus();dragging=true;startX=e.clientX;lastX=startX;distance=0;canvas.setPointerCapture(e.pointerId);};
      const drag=(e:PointerEvent)=>{if(dragging){yaw-=(e.clientX-lastX)*.005;distance+=Math.abs(e.clientX-lastX);lastX=e.clientX;}};
      const up=(e:PointerEvent)=>{if(!dragging)return;dragging=false;if(distance>6)return;const rect=canvas.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=ray.intersectObjects(panels)[0];if(hit)select.current(hit.object.userData.itemId);};
      const cancel=()=>{dragging=false;clear();};
      canvas.addEventListener("keydown",keydown);window.addEventListener("keyup",keyup);canvas.addEventListener("blur",clear);window.addEventListener("blur",cancel);
      canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointermove",drag);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",cancel);
      const resize=new ResizeObserver(()=>{const {width,height}=parent.getBoundingClientRect();if(width&&height){renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}});resize.observe(parent);
      let frame=0;
      const render=()=>{if(disposed)return;const dt=Math.min(clock.getDelta(),.05);if(keys.has("arrowleft"))yaw+=dt*1.3;if(keys.has("arrowright"))yaw-=dt*1.3;move((Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown")))*dt*4,(Number(keys.has("d"))-Number(keys.has("a")))*dt*4);camera.rotation.set(0,yaw,0);if(document.visibilityState==="visible")renderer.render(scene,camera);frame=requestAnimationFrame(render);};render();setStatus("Drag to look · W A S D to walk · Select an exhibit");
      cleanup=()=>{cancelAnimationFrame(frame);resize.disconnect();canvas.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);canvas.removeEventListener("blur",clear);window.removeEventListener("blur",cancel);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",drag);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",cancel);geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());renderer.dispose();canvas.remove();action.current=()=>{};};
    }).catch(()=>{if(!disposed)setStatus("3D could not open. Explore the Catalog or Forecast instead.");});
    return()=>{disposed=true;cleanup();};
  },[]);
  return <div className={styles.walk}>
    <div className={styles.canvas} ref={host} style={{backgroundImage:`url("${asset("world")}")`,backgroundSize:"cover",backgroundPosition:"center"}} />
    <div className={styles.walkLabel}><span>THE WORLD COLLECTION</span><strong>Money, made spatial.</strong><p>Ten proposed objects. Eight national perspectives.</p><small>Speculative concept artwork · no confirmed national adoption</small></div>
    <div className={styles.walkControls}><p role="status">{status}</p><div>{([ ["left","Turn left"],["forward","Walk forward"],["back","Walk back"],["right","Turn right"],["reset","Entrance"] ] as const).map(([a,label])=><button key={a} onClick={()=>action.current(a)}>{label}</button>)}</div></div>
  </div>;
}
