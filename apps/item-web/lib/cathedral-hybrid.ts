import * as T from 'three';
import {CATHEDRAL_PLAN as PLAN} from './cathedral-plan.ts';
// Original procedural architecture; recognisable influences, not a monument scan.
export function buildHybridArchitecture(mesh:(g:T.BufferGeometry,m:T.Material,x?:number,y?:number,z?:number)=>T.Mesh,stone:T.Material,gold:T.Material,dark:T.Material,glass:T.Material,leaf:T.Material,fruit:T.Material,vault:(z:number,length:number,radius?:number)=>T.BufferGeometry){
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,m=stone)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 const tube=(points:T.Vector3[],r=.065,m=stone)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,r,4,false),m);
 const arch=(x:number,z:number,half:number,spring:number,peak:number,axis:'x'|'z',m=stone,r=.085)=>{
  const points:T.Vector3[]=[];for(let i=0;i<=24;i++){const t=i/24,u=t*2-1,y=spring+(peak-spring)*(1-Math.abs(u))**.7;points.push(new T.Vector3(x+(axis==='x'?u*half:0),y,z+(axis==='z'?u*half:0)));}tube(points,r,m);
 };
 const pinnacle=(x:number,y:number,z:number,h=2)=>{box(.34,.3,.34,x,y,z);mesh(new T.ConeGeometry(.22,h,4),stone,x,y+h/2+.15,z);};
 const tracery=(x:number,y:number,z:number,w:number,h:number)=>{box(w,h,.08,x,y,z,glass);arch(x,z,w/2,y+h*.15,y+h*.6,'x',stone,.055);for(const side of [-1,1])box(.06,h,.12,x+side*w*.2,y,z);mesh(new T.TorusGeometry(w*.2,.04,5,12),gold,x,y+h*.2,z+.07);};
 // Cologne's tall twin westwork: deep portals, belfry tiers and pierced spire ribs.
 for(const t of PLAN.towers.slice(0,2)){
  box(t.w,25,t.d,t.x,12.5,t.z);box(t.w+.7,.45,t.d+.7,t.x,5.5,t.z);box(t.w+.5,.45,t.d+.5,t.x,14,t.z);box(t.w+.7,.5,t.d+.7,t.x,25,t.z);
  for(const side of [-1,1]){box(.55,28,.6,t.x+side*2.9,14,t.z+4);pinnacle(t.x+side*2.9,28,t.z+4,3);}
  for(const level of [10,19])for(const dx of [-1.35,1.35])tracery(t.x+dx,level,t.z+4.06,1.8,5);
  // Open belfry voids framed by corner posts; no filled cube above the tower.
  for(const dx of [-2.4,2.4])for(const dz of [-3,3])box(.48,9,.48,t.x+dx,30,t.z+dz);
  for(const dz of [-3,3]){arch(t.x,t.z+dz,2.4,30,34,'x',stone,.13);box(5.4,.4,.5,t.x,34.6,t.z+dz);}
  const baseY=35,tipY=55;for(let i=0;i<8;i++){const a=i*Math.PI/4,x=t.x+3*Math.cos(a),z=t.z+3*Math.sin(a);tube([new T.Vector3(x,baseY,z),new T.Vector3(t.x+(x-t.x)*.55,43,t.z+(z-t.z)*.55),new T.Vector3(t.x,tipY,t.z)],.085);pinnacle(x,35,z,2.3);}
  for(const [y,r] of [[36,2.9],[41,2.15],[47,1.25]]){const ring=mesh(new T.TorusGeometry(r,.085,5,8),stone,t.x,y,t.z);ring.rotation.x=Math.PI/2;}
  box(.1,2.2,.1,t.x,55.8,t.z,gold);box(.8,.1,.1,t.x,56.3,t.z,gold);
 }
 // Pointed, recessed archivolts above the kept-clear central exit.
 for(let layer=0;layer<4;layer++)arch(0,10.15+layer*.18,2.15+layer*.15,3.6,7.3+layer*.2,'x',stone,.12);
 for(const side of [-1,1])for(let layer=0;layer<4;layer++)box(.12,3.6,.15,side*(2.15+layer*.15),1.8,10.15+layer*.18);
 arch(16,-42,1.9,2.8,4.4,'z',stone,.1);
 // Rose wheel and ornamental gable in the west facade, readable from spawn.
 mesh(new T.CircleGeometry(2.1,32),glass,0,11.1,10.2);mesh(new T.TorusGeometry(2.15,.16,6,32),stone,0,11.1,10.3);
 for(let i=0;i<12;i++){const rib=box(.065,4.1,.1,0,11.1,10.35,gold);rib.rotation.z=i*Math.PI/12;}
 tube([new T.Vector3(-5.8,14.5,10.2),new T.Vector3(0,20,10.2),new T.Vector3(5.8,14.5,10.2)],.17);pinnacle(0,20,10.2,2);
 // Seville's broad, five-aisle interior: four lower vaulted galleries.
 const length=145,center=-62.5;
 for(const side of [-1,1])for(const x of [8.15,13.15]){const g=vault(center,length,2.5),p=g.getAttribute('position');for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+side*x,p.getY(i)-3.5,p.getZ(i));g.computeVertexNormals();mesh(g,stone);}
 for(let z=8;z>=-134;z-=6){
  arch(0,z,5.6,9,14.83,'x',stone,.075);
  for(const side of [-1,1]){
   for(const x of [5.65,10.65]){const sx=side*x;box(.88,.35,.88,sx,.175,z);mesh(new T.CylinderGeometry(.24,.3,5.5,8),stone,sx,3,z);for(const dx of [-.2,.2])mesh(new T.CylinderGeometry(.06,.07,5.3,6),stone,sx+dx,3,z);box(.85,.25,.85,sx,5.65,z);if(z>-132)arch(sx,z-3,2.9,5.7,8.85,'z',stone,.09);}
   for(const x of [8.15,13.15])arch(side*x,z,2.45,5.5,7.9,'x',gold,.045);
   // Arcade spandrels join the high nave vault to the lower aisle roofs.
   if(z>-132){const s=new T.Shape();s.moveTo(-3,9);s.lineTo(-3,5.7);for(let i=0;i<=24;i++){const u=i/12-1;s.lineTo(u*3,5.7+3.15*(1-Math.abs(u))**.7);}s.lineTo(3,9);s.closePath();const wall=mesh(new T.ExtrudeGeometry(s,{depth:.18,bevelEnabled:false}),stone,side*5.82,0,z-3);wall.rotation.y=Math.PI/2;}
   // External flying buttress arcs and pinnacled wall piers.
   box(.7,9,.9,side*16,4.5,z);pinnacle(side*16,9,z,2.5);
   if((8-z)%12===0){tube([new T.Vector3(side*6,11.8,z),new T.Vector3(side*11,12.4,z),new T.Vector3(side*16,8.6,z)],.17);}
   // Clerestory masonry frames and amber-blue lancets at the outer wall.
   const pane=box(.09,3.4,2.1,side*15.93,5.5,z-3,glass);pane.name='Seville aisle lancet';box(.12,3.5,.09,side*15.84,5.5,z-3);box(.12,.09,2.1,side*15.84,5.5,z-3);
  }
 }
 // Giralda-inspired square shaft, paired arched belfry and Renaissance crown.
 const t=PLAN.towers[2];box(5,26,5,t.x,13,t.z);for(const y of [3,8,13,18,23]){
  for(const dx of [-1.4,1.4]){tracery(t.x+dx,y+1,t.z+2.55,1.15,2.4);tube([new T.Vector3(t.x+dx-.7,y,t.z+2.6),new T.Vector3(t.x+dx,y+3,t.z+2.6),new T.Vector3(t.x+dx+.7,y,t.z+2.6)],.055);}
 }box(5.8,.5,5.8,t.x,26.3,t.z);
 for(const dx of [-2,0,2])for(const dz of [-2,2]){box(.32,6,.32,t.x+dx,29.5,t.z+dz);pinnacle(t.x+dx,32.5,t.z+dz,1.3);}
 for(const dz of [-2,2])for(const dx of [-1,1])arch(t.x+dx,t.z+dz,.85,29,32,'x',stone,.09);
 for(const dx of [-1.1,1.1])mesh(new T.CylinderGeometry(.36,.56,.8,10),dark,t.x+dx,30,t.z);
 box(4.6,.5,4.6,t.x,33,t.z);box(2.7,4,2.7,t.x,35,t.z);mesh(new T.ConeGeometry(1.7,3.5,4),gold,t.x,38.75,t.z);box(.09,2.5,.09,t.x,41,t.z,gold);mesh(new T.SphereGeometry(.3,8,6),gold,t.x,42.6,t.z);
 // Orange-tree patio: tiled ground, open-to-sky enclosure and four small trees.
 const c=PLAN.court;box(14,.12,32,23,-.06,-42);for(const z of [c.back,c.front]){box(14,3.8,.3,23,1.9,z);for(let x=18;x<30;x+=3){arch(x,z,1.3,3.8,5.7,'x',stone,.12);box(.3,4,.3,x-1.4,2,z);}}
 box(.3,4,32,c.right,2,-42);for(let z=-55;z<-28;z+=4)arch(c.right,z,1.8,4,6,'z',stone,.1);
 for(let x=17;x<30;x+=2)for(let z=-57;z<-26;z+=2)box(.8,.014,.8,x,.008,z,(x+z)%4?dark:gold);
 for(const x of [20,26])for(const z of [-53,-32]){box(1.6,.35,1.6,x,.175,z);mesh(new T.CylinderGeometry(.15,.22,2.4,7),dark,x,1.4,z);for(const [dx,dz,y] of [[0,0,3.4],[-.65,0,3],[.65,.3,3.1]]){const canopy=mesh(new T.IcosahedronGeometry(.85,1),leaf,x+dx,y,z+dz);canopy.scale.set(1,1.1,1);}for(let i=0;i<6;i++)mesh(new T.SphereGeometry(.09,6,4),fruit,x+Math.sin(i*2)*.7,2.7+(i%3)*.35,z+Math.cos(i*2)*.7);}
 // Return material-neutral metadata for bounds/collision regression checks.
 return {style:'Cologne × Seville',aisles:5,spireHeight:57,orangeTrees:4};
}
