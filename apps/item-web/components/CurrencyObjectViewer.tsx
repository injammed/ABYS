"use client";
import {useEffect,useRef,useState} from "react";
import type {Item} from "@/lib/currency-library";
import styles from "./CurrencyMuseum.module.css";

export function CurrencyObjectViewer({item}:{item:Item}) {
  const host=useRef<HTMLDivElement>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    let disposed=false;let cleanup=()=>{};setMessage("");
    Promise.all([import("three"),import("three/addons/controls/OrbitControls.js"),import("three/addons/environments/RoomEnvironment.js"),import("@/lib/currency-sculpture")]).then(([T,{OrbitControls},{RoomEnvironment},{buildCurrencySculpture,disposeCurrencySculpture}])=>{
      if(disposed||!host.current)return;
      const parent=host.current;
      let renderer:InstanceType<typeof T.WebGLRenderer>;
      try{renderer=new T.WebGLRenderer({antialias:true});}catch{setMessage("3D preview unavailable. The model can still be downloaded.");return;}
      renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0x090e17);parent.appendChild(renderer.domElement);
      const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute("aria-label",`${item.name} 3D view. Drag to rotate; pinch or scroll to zoom. Arrow keys rotate the object.`);
      const scene=new T.Scene();const camera=new T.PerspectiveCamera(40,1,.05,30);camera.position.set(2.8,1.8,3.4);
      const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=1.4;controls.maxDistance=7;
      const model=buildCurrencySculpture(item,"hero");scene.add(model);
      const bottom=new T.Box3().setFromObject(model).min.y;
      const stageGeometry=new T.CylinderGeometry(1.03,1.09,.10,80);const stageMaterial=new T.MeshStandardMaterial({color:0x171c26,metalness:.65,roughness:.27});const stage=new T.Mesh(stageGeometry,stageMaterial);stage.position.y=bottom-.055;stage.receiveShadow=true;scene.add(stage);
      const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
      scene.add(new T.HemisphereLight(0xd9e8ff,0x51402c,.7));const light=new T.DirectionalLight(0xffe9c4,3);light.position.set(3,5,4);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-2;light.shadow.camera.right=2;light.shadow.camera.top=2;light.shadow.camera.bottom=-2;light.shadow.normalBias=.018;scene.add(light);
      const render=()=>{if(!disposed)renderer.render(scene,camera);};controls.addEventListener("change",render);
      const keys=(e:KeyboardEvent)=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();if(e.key==="ArrowLeft")model.rotation.y-=.16;if(e.key==="ArrowRight")model.rotation.y+=.16;if(e.key==="ArrowUp")model.rotation.x-=.16;if(e.key==="ArrowDown")model.rotation.x+=.16;render();}};canvas.addEventListener("keydown",keys);
      const resize=new ResizeObserver(()=>{const {width,height}=parent.getBoundingClientRect();if(width&&height){renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();render();}});resize.observe(parent);controls.update();render();
      cleanup=()=>{resize.disconnect();controls.removeEventListener("change",render);controls.dispose();canvas.removeEventListener("keydown",keys);disposeCurrencySculpture(model);stageGeometry.dispose();stageMaterial.dispose();light.shadow.map?.dispose();env.dispose();renderer.dispose();canvas.remove();};
    }).catch(()=>{if(!disposed)setMessage("3D preview could not load. Try the model download.");});
    return()=>{disposed=true;cleanup();};
  },[item]);
  async function download(){
    setBusy(true);setMessage("");let cleanup=()=>{};
    try{
      const [{buildCurrencySculpture,disposeCurrencySculpture},{GLTFExporter}]=await Promise.all([import("@/lib/currency-sculpture"),import("three/addons/exporters/GLTFExporter.js")]);
      const model=buildCurrencySculpture(item,"hero");cleanup=()=>disposeCurrencySculpture(model);
      const binary=await new GLTFExporter().parseAsync(model,{binary:true});
      if(!(binary instanceof ArrayBuffer))throw new Error("No model generated");
      const url=URL.createObjectURL(new Blob([binary],{type:"model/gltf-binary"}));const link=document.createElement("a");link.href=url;link.download=`${item.id}-sculpture.glb`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    }catch{setMessage("Model export failed. Please try again.");}finally{cleanup();setBusy(false);}
  }
  return <div className={styles.modelViewer}><div className={styles.modelCanvas} ref={host}/><button onClick={download} disabled={busy}>{busy?"Preparing model…":"Download 3D model · GLB"}</button><p>Interpretive reconstruction · hidden geometry inferred · not manufacturing CAD</p>{message&&<p role="status">{message}</p>}</div>;
}
