"use client";
import { useEffect, useRef, useState } from "react";
import { asset, items, imageFor, cropFor, frameAspect } from "@/lib/currency-library";
import styles from "./CurrencyMuseum.module.css";

type Action = "forward" | "back" | "left" | "right" | "reset" | "hall0" | "hall1" | "hall2" | "hall3";
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
      scene.fog = new THREE.Fog(0x080b10, 25, 145);
      const camera = new THREE.PerspectiveCamera(62, 1, .1, 180);
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
      box(12,.2,132,0,-.1,-58,0x151a22);
      box(.2,6,132,-6,3,-58,0x111723);box(.2,6,132,6,3,-58,0x111723);
      for(let z=7;z>-124;z-=5){box(.04,.02,3,0,.02,z,0x9f8251);box(12,.05,.08,0,5,z,0xb99964);}
      const loader = new THREE.TextureLoader();
      const artworks = new Map<string, InstanceType<typeof THREE.Texture>>();
      const getArtwork = (name: string) => {
        let artwork = artworks.get(name);
        if (!artwork) {
          artwork = loader.load(asset(name),()=>{textures.forEach(texture=>{texture.needsUpdate=true;});},undefined,()=>{if(!disposed)setStatus("Artwork could not load. Open Catalog to browse the records.");});
          artwork.colorSpace=THREE.SRGBColorSpace; textures.push(artwork); artworks.set(name,artwork);
        }
        return artwork;
      };
      items.forEach((item,i)=>{
        const side=i%2===0?-1:1;const z=-Math.floor(i/2)*6;
        box(1,.55,3.8,side*4.5,.275,z,0x252b34);
        const texture=getArtwork(imageFor(item)).clone();
        texture.colorSpace=THREE.SRGBColorSpace;
        const [x,y,w,h]=cropFor(item);texture.repeat.set(w,h);texture.offset.set(x,1-y-h);textures.push(texture);
        const ratio=frameAspect(item);const g=new THREE.PlaneGeometry(Math.min(3.5,3.4*ratio),Math.min(3.4,3.5/ratio));geometries.push(g);
        const m=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});materials.push(m);
        const panel=new THREE.Mesh(g,m);panel.position.set(side*4.45,2.3,z);panel.rotation.y=-side*Math.PI/2;panel.userData.itemId=item.id;scene.add(panel);panels.push(panel);
        box(.12,3.7,3.8,side*4.6,2.25,z,0x9a7b47);
      });
      const clock=new THREE.Clock();const keys=new Set<string>();
      const move=(forward:number,side:number)=>{
        camera.position.x=Math.max(-3.6,Math.min(3.6,camera.position.x-Math.sin(yaw)*forward+Math.cos(yaw)*side));
        camera.position.z=Math.max(-119,Math.min(8,camera.position.z-Math.cos(yaw)*forward-Math.sin(yaw)*side));
      };
      action.current=a=>{ if(a.startsWith("hall")){camera.position.set(0,1.8,6-Number(a.slice(4))*30);yaw=0;}else if(a==="reset"){camera.position.set(0,1.8,6);yaw=0;}else if(a==="left")yaw+=.35;else if(a==="right")yaw-=.35;else move(a==="forward"?1.6:-1.6,0); };
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
      const render=()=>{if(disposed)return;const dt=Math.min(clock.getDelta(),.05);if(keys.has("arrowleft"))yaw+=dt*1.3;if(keys.has("arrowright"))yaw-=dt*1.3;move((Number(keys.has("w")||keys.has("arrowup"))-Number(keys.has("s")||keys.has("arrowdown")))*dt*4,(Number(keys.has("d"))-Number(keys.has("a")))*dt*4);camera.rotation.set(0,yaw,0);if(document.visibilityState==="visible")renderer.render(scene,camera);frame=requestAnimationFrame(render);};render();setStatus("");
      cleanup=()=>{cancelAnimationFrame(frame);resize.disconnect();canvas.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);canvas.removeEventListener("blur",clear);window.removeEventListener("blur",cancel);canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointermove",drag);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",cancel);geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());renderer.dispose();canvas.remove();action.current=()=>{};};
    }).catch(()=>{if(!disposed)setStatus("3D could not open. Explore the Catalog or Forecast instead.");});
    return()=>{disposed=true;cleanup();};
  },[]);
  return <div className={styles.walk}>
    <div className={styles.canvas} ref={host} style={{backgroundImage:`url("${asset("clear-relief")}")`,backgroundSize:"cover",backgroundPosition:"center"}} />
    <nav className={styles.halls} aria-label="Jump to exhibition hall">{[0,1,2,3].map(n=><button key={n} onClick={()=>action.current(`hall${n}` as Action)} aria-label={`Hall ${n+1}, objects ${n*10+1} to ${n*10+10}`}>{String(n+1).padStart(2,"0")}</button>)}</nav>
    <div className={styles.walkControls}>{status&&<p role="status">{status}</p>}<div>{([ ["left","↶"],["forward","↑"],["back","↓"],["right","↷"],["reset","⌂"] ] as const).map(([a,label])=><button aria-label={a==="left"?"Turn left":a==="right"?"Turn right":a==="forward"?"Walk forward":a==="back"?"Walk back":"Return to entrance"} key={a} onClick={()=>action.current(a)}>{label}</button>)}</div></div>
  </div>;
}
