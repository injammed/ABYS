import * as T from 'three';
export const ARCADE_CABINETS=[{id:'campaign',name:'BREAK THE EYE',x:-8,z:-3,color:0xd4a855},{id:'pinball',name:'HORIZON PINBALL',x:8,z:-3,color:0x68d7bf},{id:'console',name:'BREAK THE EYE 64',x:8,z:-11,color:0x7ea0e1}] as const;
export function arcadeWalkable(x:number,z:number){return !ARCADE_CABINETS.some(c=>Math.abs(x-c.x)<1&&Math.abs(z-c.z)<1);}
export function buildArcadeCabinets(){
 const root=new T.Group(),collisions:T.Object3D[]=[],resources=new Set<T.Material|T.BufferGeometry|T.Texture>();
 const body=new T.MeshStandardMaterial({color:0x10151e,roughness:.5,metalness:.4}),edge=new T.MeshStandardMaterial({color:0xa79364,roughness:.35,metalness:.8});resources.add(body);resources.add(edge);
 for(const cabinet of ARCADE_CABINETS){const group=new T.Group();group.position.set(cabinet.x,0,cabinet.z);root.add(group);
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material)=>{const geometry=new T.BoxGeometry(w,h,d);resources.add(geometry);const mesh=new T.Mesh(geometry,m);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  if(cabinet.id==='console'){collisions.push(box(1.8,.85,1.3,0,.43,0,body));box(1.95,.12,1.45,0,.88,.04,edge);box(1.6,1.18,.7,0,1.55,-.12,body);}else{collisions.push(box(1.25,2.05,1.2,0,1.03,0,body));box(1.35,.16,1.28,0,2.12,0,edge);box(1.35,.2,1.48,0,.82,.15,edge);}
  const panel=document.createElement('canvas');panel.width=256;panel.height=320;const ctx=panel.getContext('2d');if(ctx){ctx.fillStyle='#07121c';ctx.fillRect(0,0,256,320);ctx.strokeStyle=cabinet.id==='campaign'?'#ddb76d':'#6fe8c8';ctx.lineWidth=3;ctx.strokeRect(9,9,238,302);ctx.fillStyle=ctx.strokeStyle;ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText(cabinet.id==='campaign'?'BREAK THE EYE':cabinet.id==='console'?'BREAK THE EYE 64':'HORIZON',128,47);ctx.fillText(cabinet.id==='campaign'?'1986 / APY0C':'PINBALL / 1987',128,74);ctx.beginPath();ctx.arc(128,161,54,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(128,161,30,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(128,161,23,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b1d7ca';ctx.font='15px monospace';ctx.fillText('FREE PLAY',128,252);ctx.fillText('E / START',128,281);}
  if(cabinet.id==='console'&&ctx){ctx.fillStyle='#07121c';ctx.fillRect(0,0,256,320);ctx.fillStyle='#83aade';ctx.font='bold 20px monospace';ctx.fillText('BREAK THE EYE',128,78);ctx.font='bold 38px monospace';ctx.fillText('64',128,131);for(let i=0;i<9;i++){ctx.fillStyle=i%2?'#253c55':'#34495a';ctx.fillRect(i*31,180-i%3*18,24,75);}ctx.fillStyle='#b7d3c8';ctx.font='17px monospace';ctx.fillText('1996 / FREE PLAY',128,285);}
  const texture=new T.CanvasTexture(panel);texture.colorSpace=T.SRGBColorSpace;resources.add(texture);const screen=new T.MeshBasicMaterial({map:texture});resources.add(screen);box(cabinet.id==='console'?1.4:1.08,cabinet.id==='console'?1:1.36,.018,0,cabinet.id==='console'?1.55:1.45,cabinet.id==='console'?.236:.616,screen);
  if(cabinet.id==='console'){
   group.name='1996 TV / three-grip controller console';
   // An original CRT and recognizable three-grip controller, connected by a real cable.
   const shell=new T.MeshStandardMaterial({color:0x75869c,roughness:.7});resources.add(shell);
   box(.72,.19,.48,-.22,.99,.7,shell);
   const controller=new T.Group();controller.position.set(.15,1.02,.98);group.add(controller);
   const part=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,scale:number[]= [1,1,1])=>{resources.add(g);const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.scale.set(...scale as [number,number,number]);controller.add(mesh);};
   part(new T.SphereGeometry(1,12,8),shell,0,0,0,[.27,.05,.15]);
   for(const x of [-.23,0,.23])part(new T.SphereGeometry(1,12,8),shell,x,-.015,.14,[.07,.055,.17]);
   part(new T.CylinderGeometry(.026,.026,.07,8),body,0,.063,-.025);part(new T.SphereGeometry(.024,8,6),body,0,.1,-.025);
   part(new T.BoxGeometry(.09,.015,.025),body,-.17,.05,-.025);part(new T.BoxGeometry(.025,.015,.09),body,-.17,.05,-.025);
   for(const [x,z]of [[.18,-.065],[.145,-.03],[.215,-.03],[.18,.005]])part(new T.CylinderGeometry(.017,.017,.015,8),edge,x,.05,z);
   const curve=new T.CatmullRomCurve3([new T.Vector3(.15,1.01,.94),new T.Vector3(.25,.95,.72),new T.Vector3(-.35,.95,.62),new T.Vector3(-.22,.99,.46)]),cable=new T.TubeGeometry(curve,20,.013,6,false);resources.add(cable);group.add(new T.Mesh(cable,body));
  }
  const glow=new T.MeshStandardMaterial({color:cabinet.color,emissive:cabinet.color,emissiveIntensity:.5});resources.add(glow);box(.13,.06,.13,-.28,.96,.53,glow);box(.13,.06,.13,.28,.96,.53,glow);
 }
 return {root,collisions,dispose(){resources.forEach(r=>r.dispose());}};
}
