import * as T from 'three';
import {STAR_STAFF,validStarTarget,inStarImpact,type StarTarget} from './star-staff';
import {buildStarStaff} from './star-staff-world';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildCathedral} from './cathedral';
import {buildDistrict} from './survival-world';
import {buildCapital} from './capital-world';
import {safe} from './capital-map';
import {freshCampaign,restoreCampaign,advanceCampaign,eliminate,missionAction,MISSIONS,type Campaign,type EradicationOption} from './capital-campaign';
import {ENEMY_STATS,F49_SPAWN} from './hostiles';
import {buildCurrencySculpture,disposeCurrencySculpture} from './currency-sculpture';
import {items} from './currency-library';
import CEILINGS from './cathedral-art.json';
import {flightFloor,canHover,landingSpot,armPlayer,spendRound,reloadWeapon,advance,canStand,collect,consume,freshPlayer,restorePlayer,SUPPLIES,type Player} from './survival';
export type Hud={campaign:Campaign;x:number;z:number;piloting:boolean;altitude:number;hull:number;armed:boolean;ammo:number;reserve:number;health:number;water:number;food:number;stamina:number;bottles:number;rations:number;zone:string;prompt:string;third:boolean;dead:boolean;minutes:number;locked:boolean;weapon:'ak'|'staff';staffCooldown:number};
export type Callbacks={hud:(h:Hud)=>void;interact:(target:string)=>void;pause:()=>void;notice:(text:string)=>void};
const KEY='aetimm-capital-v2';
export function createSurvival(host:HTMLDivElement,cb:Callbacks){
 let p:Player,c:Campaign;try{const raw=localStorage.getItem(KEY),data=raw?JSON.parse(raw):null;p=restorePlayer(data?.version===2?JSON.stringify({version:1,player:data.player}):localStorage.getItem('aetimm-survival-v1'));c=data?.version===2?restoreCampaign(data.campaign):freshCampaign();if(!data)p.defeated=p.defeated.filter(i=>i>=5);}catch{p=freshPlayer();c=freshCampaign();}
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
 renderer.setClearColor(0x899a9e);host.appendChild(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','AETIMM survival world. WASD moves. Mouse looks. E interacts. V changes camera. Escape pauses.');
 const scene=new T.Scene();scene.fog=new T.FogExp2(0x899a9e,.00035);
 const camera=new T.PerspectiveCamera(68,1,.08,14000);let needsRender=true;let yaw=Math.PI,pitch=.03,third=false,paused=false,disposed=false,jump=0,vertical=0;
 let piloting=false,altitude=F49_SPAWN.y,hull=100,blastAge=c.launched?30:0;
 const motion={x:0,y:0,lookX:0,lookY:0,lift:0};const keys=new Set<string>();
 scene.add(new T.HemisphereLight(0xc6dacb,0x2a2920,1.5));const sun=new T.DirectionalLight(0xffd8a2,1.8);sun.position.set(-10,40,10);scene.add(sun);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 const textures:T.Texture[]=[];const loader=new T.TextureLoader();const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
 const frescoes=CEILINGS.map(art=>{const texture=loader.load(`${base}${art.path}`,()=>{if(disposed)texture.dispose();},undefined,()=>cb.notice('A ceiling image could not load.'));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(texture);return texture;});
 const cathedral=buildCathedral(-126,frescoes,true);scene.add(cathedral.root);
 const skin=(name:string)=>{const t=loader.load(`${base}/images/hostiles/${name}-reference.jpeg`,()=>{needsRender=true;},undefined,()=>cb.notice('An enemy skin could not load.'));t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 const capital=buildCapital(loader,base,()=>{needsRender=true;},()=>cb.notice('A map layer could not load. Refresh to retry.'));scene.add(capital.root);
 capital.ready.then(()=>{if(!piloting&&!canStand(p.x,p.z)){p.x=0;p.z=3;cb.notice('Returned to the cathedral: saved ground position was obstructed.');}});
 const district=buildDistrict({robot:skin('robot'),alien:skin('alien'),aircraft:skin('f49')});scene.add(district.root);
 const staff=buildStarStaff();scene.add(staff.root);let selectedWeapon:'ak'|'staff'='staff',staffCooldown=0,starAge=0,starTarget:T.Vector3|null=null,starResolved=false;
 const selectWeapon=(weapon:'ak'|'staff')=>{if(paused||piloting||p.health<=0)return;if(weapon==='ak'&&!p.armed){cb.notice('Talk to Mara for the AK-47');return;}selectedWeapon=weapon;reloading=0;firing=false;needsRender=true;cb.notice(weapon==='staff'?'Starfall bowstaff · aim at terrain outside the refuge · Click / F summons':'AK-47 selected');};
 const sculptures:T.Group[]=[];const pedestals:T.Mesh[]=[];
 const pedestalMaterial=new T.MeshStandardMaterial({color:0xc5b896,roughness:.8});const pedestalGeometry=new T.BoxGeometry(1.95,1.1,1.95);
 items.forEach((item,i)=>{const x=i%2?3.3:-3.3,z=-Math.floor(i/2)*6;const base=new T.Mesh(pedestalGeometry,pedestalMaterial);base.position.set(x,.55,z);scene.add(base);pedestals.push(base);const model=buildCurrencySculpture(item);const box=new T.Box3().setFromObject(model);model.position.set(x,1.12-box.min.y,z);scene.add(model);sculptures.push(model);});
 const target=()=>{
  if(piloting)return 'exit-gunship';
  if(Math.hypot(p.x-district.gunship.position.x,p.z-district.gunship.position.z)<5)return 'gunship';
  const mission=MISSIONS.find(m=>Math.hypot(p.x-m.x,p.z-m.z)<7);if(mission)return 'mission:'+mission.id;
  if(Math.hypot(p.x-2.6,p.z-6)<3.2)return 'terminal';
  if(Math.hypot(p.x+2.5,p.z-6)<3)return 'keeper';
  if(Math.hypot(p.x+8,p.z-57)<3)return 'visitor';
  const supply=SUPPLIES.find(s=>!p.looted.includes(s.id)&&Math.hypot(p.x-s.x,p.z-s.z)<2.8);if(supply)return 'supply:'+supply.id;
  const index=sculptures.findIndex(s=>Math.hypot(p.x-s.position.x,p.z-s.position.z)<2.4);return index>=0?'exhibit:'+items[index].id:'';
 };
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({version:2,player:piloting?{...p,x:0,z:3}:p,campaign:c}));}catch{/* Storage denial must never stop play. */}};
 let firing=false,shotCooldown=0,flashTime=0,reloading=0;
 const clear=()=>{firing=false;keys.clear();motion.x=motion.y=motion.lookX=motion.lookY=motion.lift=0;};
 const interact=()=>{if(paused||p.health<=0)return;const t=target();if(t==='gunship'){piloting=true;pitch=-.08;p.x=district.gunship.position.x;p.z=district.gunship.position.z;altitude=district.gunship.position.y;clear();reloading=0;cb.notice('F-49 online · WASD flies · Space rises · C descends · F fires · E exits after landing');return;}if(t==='exit-gunship'){if(altitude>1.7){cb.notice('Descend with C before exiting');return;}const spot=landingSpot(p.x,p.z);if(!spot){cb.notice('No clear ground to exit here');return;}piloting=false;p.x=spot.x;p.z=spot.z;clear();jump=vertical=0;save();return;}if(t.startsWith('supply:')){if(collect(p,t.slice(7))){cb.notice('Supplies collected.');save();}}else if(t){clear();paused=true;document.exitPointerLock?.();if(t==='keeper'&&armPlayer(p)){save();cb.notice("Mara gave you an AK-47 · 30 loaded / 90 spare · Click or F fires · T reloads");}cb.interact(t);}};
 const keydown=(e:KeyboardEvent)=>{
  if(paused||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
  const k=e.key.toLowerCase();if(['1','2','m','w','a','s','d','shift',' ','e','v','q','r','f','t','c','escape','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  keys.add(k);if(e.repeat)return;
  if(k==='1')selectWeapon('ak');if(k==='2')selectWeapon('staff');
  if(k==='m'){clear();paused=true;document.exitPointerLock?.();cb.interact('fieldmap');}if(k==='t')reload();if(k==='e')interact();if(k==='v')third=!third;if(k==='q')cb.notice(consume(p,'water'));if(k==='r')cb.notice(consume(p,'food'));
  if(k===' '&&!piloting&&jump===0&&p.health>0){vertical=5;}
  if(k==='escape'){paused=true;clear();document.exitPointerLock?.();cb.pause();}
 };
 const keyup=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase());
 let dragging=false,lastX=0,lastY=0,skipLockDelta=false;
 const down=(e:PointerEvent)=>{if(paused)return;if(e.button===0&&document.pointerLockElement===canvas)firing=true;canvas.focus({preventScroll:true});if(e.pointerType==='mouse'&&!document.pointerLockElement){try{const request=canvas.requestPointerLock?.();request?.catch(()=>cb.notice('Mouse capture unavailable. Drag to look.'));}catch{cb.notice('Drag to look.');}}dragging=true;lastX=e.clientX;lastY=e.clientY;if(e.pointerType!=='mouse'){try{canvas.setPointerCapture(e.pointerId);}catch{/* Pointer may already be released. */}}};
 const look=(e:PointerEvent)=>{if(paused)return;const locked=document.pointerLockElement===canvas;if(locked&&skipLockDelta){skipLockDelta=false;return;}if(!locked&&!dragging)return;const dx=locked?e.movementX:e.clientX-lastX,dy=locked?e.movementY:e.clientY-lastY;yaw-=dx*.0025;pitch=T.MathUtils.clamp(pitch-dy*.0025,-1.48,1.48);lastX=e.clientX;lastY=e.clientY;};
 const up=()=>{dragging=false;firing=false;};
 const lock=()=>{if(document.pointerLockElement===canvas)skipLockDelta=true;if(!document.pointerLockElement&&!paused){paused=true;clear();cb.pause();}};
 const blur=()=>{clear();if(!paused){paused=true;cb.pause();}save();};
 const hidden=()=>{if(document.hidden)blur();};
 window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',hidden);document.addEventListener('pointerlockchange',lock);canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',look);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 const resize=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(width&&height){renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();needsRender=true;}});resize.observe(host);
 const reload=()=>{if(paused||p.health<=0||piloting||selectedWeapon!=='ak'||!p.armed||reloading||p.ammo===30||p.reserve===0)return;reloading=1.6;cb.notice('Reloading…');};
 const shotRay=new T.Raycaster();
 const summonStar=()=>{
  if(staffCooldown||starTarget)return;
  scene.updateMatrixWorld(true);shotRay.setFromCamera(new T.Vector2(0,0),camera);shotRay.far=STAR_STAFF.range;
  const hit=shotRay.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...pedestals,...district.protectedActors,...capital.protectedActors,...district.enemies.filter(e=>e.active&&!e.dead).map(e=>e.mesh)],true)[0];
  const ground=shotRay.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());
  const target=hit?.point??ground,origin=new T.Vector3(p.x,1.5+jump,p.z);
  const protectedPoints=[...district.protectedActors,...capital.protectedActors].map(o=>o.getWorldPosition(new T.Vector3()));
  if(!target||!validStarTarget(origin,target,protectedPoints)){shotCooldown=.5;cb.notice('Aim at nearby terrain outside the refuge and away from survivors');return;}
  starTarget=target.clone();starAge=0;starResolved=false;staffCooldown=STAR_STAFF.cooldown;staff.update(0,starTarget);cb.notice('Starfall incoming');
 };
 const fire=()=>{
  if(paused||reloading||shotCooldown||(!piloting&&selectedWeapon==='ak'&&!p.armed)||p.health<=0)return;
  if(safe(p.x,p.z)){shotCooldown=.5;cb.notice('Cathedral safe zone · weapon lowered');return;}
  if(!piloting&&selectedWeapon==='staff'){summonStar();return;}
  if(!piloting&&!spendRound(p)){cb.notice(p.reserve?'Empty · press T to reload':'Out of ammunition');return;}
  shotCooldown=piloting?.2:.14;flashTime=.065;scene.updateMatrixWorld(true);
  const live=district.enemies.filter(e=>e.active&&!e.dead);
  const blockers=[cathedral.root,...district.collisions,...capital.collisions,...pedestals,...district.protectedActors,...capital.protectedActors];
  shotRay.setFromCamera(new T.Vector2(0,0),camera);shotRay.far=90;
  const aim=shotRay.intersectObjects([...blockers,...live.map(e=>e.mesh)],true)[0];
  const point=aim?aim.point:shotRay.ray.at(90,new T.Vector3());
  const origin=new T.Vector3(p.x,piloting?altitude+.4:1.5+jump,p.z),direction=point.clone().sub(origin);shotRay.set(origin,direction.normalize());shotRay.far=90;
  const hit=shotRay.intersectObjects([...blockers,...live.map(e=>e.mesh)],true)[0];
  if(hit){const index=district.enemies.findIndex(e=>{let o:T.Object3D|null=hit.object;while(o){if(o===e.mesh)return true;o=o.parent;}return false;});
   if(index>=0){const enemy=district.enemies[index];enemy.mesh.userData.damage=(enemy.mesh.userData.damage??0)+(piloting?2:1);
    if(enemy.mesh.userData.damage>=(ENEMY_STATS[enemy.kind].hits)){if(enemy.kind==='infected'){eliminate(c);enemy.dead=true;enemy.active=false;enemy.respawn=2;}else p.defeated.push(index);enemy.mesh.visible=false;cb.notice(enemy.robot?'Patrol disabled':enemy.alien?'Alien stopped':'Infected stopped');}else cb.notice('Hit');
   }
  }save();
 };
 const clock=new T.Clock();let frame=0,uiTime=0,saveTime=0;const ray=new T.Raycaster();
 function render(){
  if(disposed)return;const dt=Math.min(clock.getDelta(),.05);
  if(!paused&&p.health>0&&!document.hidden){
   staffCooldown=Math.max(0,staffCooldown-dt);
   if(starTarget){starAge+=dt;staff.update(starAge,starTarget);if(starAge>=STAR_STAFF.fallTime&&!starResolved){starResolved=true;let hits=0;
    district.enemies.forEach((enemy,index)=>{if(!enemy.active||enemy.dead||!inStarImpact(starTarget as StarTarget,{x:enemy.mesh.position.x,y:enemy.mesh.position.y+1,z:enemy.mesh.position.z}))return;
     hits++;enemy.mesh.userData.damage=STAR_STAFF.damage;enemy.dead=true;enemy.active=false;enemy.mesh.visible=false;enemy.laser.visible=false;
     if(enemy.kind==='infected'){eliminate(c);enemy.respawn=2;}else if(!p.defeated.includes(index))p.defeated.push(index);
    });save();cb.notice(`Starfall impact · ${hits} hostiles stopped`);
   }if(starAge>=2.2){starTarget=null;staff.reset();}}
   shotCooldown=Math.max(0,shotCooldown-dt);flashTime=Math.max(0,flashTime-dt);if(reloading){reloading=Math.max(0,reloading-dt);if(!reloading){reloadWeapon(p);save();cb.notice('Reloaded');}}
   yaw-=motion.lookX*dt*1.8;pitch=T.MathUtils.clamp(pitch-motion.lookY*dt*1.4,-1.48,1.48);
   if(keys.has('arrowleft'))yaw+=dt*1.5;if(keys.has('arrowright'))yaw-=dt*1.5;
   const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))-motion.y,side=Number(keys.has('d'))-Number(keys.has('a'))+motion.x;
   const len=Math.max(1,Math.hypot(forward,side));const running=keys.has('shift')&&p.stamina>1&&Math.hypot(forward,side)>.1;const speed=piloting?(keys.has('shift')?240:100):running?8:3.4;
   const nx=p.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/len*speed*dt,nz=p.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/len*speed*dt;
   const valid=piloting?(x:number,z:number)=>canHover(x,z,altitude):canStand;if(valid(nx,p.z))p.x=nx;if(valid(p.x,nz))p.z=nz;
   if(piloting){altitude=T.MathUtils.clamp(altitude+(Number(keys.has(' '))-Number(keys.has('c'))+motion.lift)*dt*32,flightFloor(p.x,p.z),450);district.gunship.position.set(p.x,altitude,p.z);district.gunship.rotation.y=yaw;}
   vertical-=dt*12;jump=Math.max(0,jump+vertical*dt);if(!jump)vertical=0;
   advance(p,dt,running&&!piloting);advanceCampaign(c,dt);if(c.launched){blastAge+=dt;capital.updateStrike(blastAge);}else capital.blast.visible=false;capital.markers.forEach(m=>{m.beam.visible=m.index===Math.min(c.quest,4)&&!c.won;m.ring.visible=m.index<=c.quest;});
   let represented=0;
   district.enemies.forEach((e,i)=>{
    e.laser.visible=false;e.respawn=Math.max(0,e.respawn-dt);
    if(e.kind==='infected'){
     if(Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z)>180)e.active=false;
     const wanted=represented<c.zombies&&!e.respawn&&!c.won;
     if(wanted&&!e.active){
      if(c.converted>1||e.dead||Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z)>160){
       let placed=false;for(let j=0;j<20;j++){const angle=(i*2.4+j*.7),radius=22+(i%7)*3,x=p.x+Math.sin(angle)*radius,z=p.z+Math.cos(angle)*radius;if(canStand(x,z)&&!safe(x,z)){e.mesh.position.set(x,0,z);e.x=x;e.z=z;placed=true;break;}}if(!placed){e.mesh.visible=false;e.active=false;return;}
      }e.dead=false;e.mesh.userData.damage=0;e.active=true;
     }
     e.active=wanted;if(wanted)represented++;
    }else{e.active=!p.defeated.includes(i);e.dead=!e.active;}
    e.mesh.visible=e.active;if(!e.active)return;
    const stats=ENEMY_STATS[e.kind],distance=Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z),chase=!safe(p.x,p.z)&&distance<stats.range;
    const tx=chase?p.x:e.x+Math.sin(p.elapsed*.18+i)*5,tz=chase?p.z:e.z+Math.cos(p.elapsed*.18+i)*5;
    const direction=new T.Vector2(tx-e.mesh.position.x,tz-e.mesh.position.z),moving=direction.length()>.3&&!(e.robot&&chase&&distance<20);
    if(moving){direction.normalize();const speed=chase?stats.speed:.55,x=e.mesh.position.x+direction.x*dt*speed,z=e.mesh.position.z+direction.y*dt*speed;if(canStand(x,e.mesh.position.z))e.mesh.position.x=x;if(canStand(e.mesh.position.x,z))e.mesh.position.z=z;}
    if(chase||moving)e.mesh.rotation.y=Math.atan2(-(tx-e.mesh.position.x),-(tz-e.mesh.position.z));
    (e.mesh.userData.legs as T.Object3D[]).forEach((leg,n)=>leg.rotation.x=moving?Math.sin(p.elapsed*(e.alien?9:5)+n*Math.PI)*.3:0);
    e.cooldown=Math.max(0,e.cooldown-dt);e.beamTime=Math.max(0,e.beamTime-dt);
    if(e.robot){
     const muzzle=(e.mesh.userData.muzzle as T.Vector3).clone();e.mesh.localToWorld(muzzle);
     const playerAim=new T.Vector3(p.x,piloting?altitude+.4:1.4+jump,p.z),aim=(e.windup||e.beamTime)?e.aim.clone():playerAim.clone(),delta=aim.clone().sub(muzzle);shotRay.set(muzzle,delta.clone().normalize());shotRay.far=delta.length();
     const blocked=shotRay.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...pedestals,...district.protectedActors,...capital.protectedActors],true).some(h=>h.distance<delta.length()-.2);
     if(chase&&!blocked&&!e.cooldown&&!e.windup){e.windup=.8;e.aim.copy(playerAim);cb.notice('Laser lock · move or find cover');}
     if(e.windup){e.windup=Math.max(0,e.windup-dt);e.laser.visible=true;(e.laser.material as T.LineBasicMaterial).opacity=.25;
      if(!e.windup){e.cooldown=2.4;e.beamTime=.18;if(chase&&!blocked&&playerAim.distanceTo(e.aim)<(piloting?2:.9)){if(piloting)hull=Math.max(0,hull-stats.damage);else p.health=Math.max(0,p.health-stats.damage);cb.notice(piloting?'F-49 hull hit':'Laser hit · find cover');}}
     }
     if(e.beamTime){e.laser.visible=true;(e.laser.material as T.LineBasicMaterial).opacity=1;}
     if(e.laser.visible){const attr=e.laser.geometry.getAttribute('position') as T.BufferAttribute;attr.setXYZ(0,muzzle.x,muzzle.y,muzzle.z);attr.setXYZ(1,aim.x,aim.y,aim.z);attr.needsUpdate=true;e.laser.geometry.computeBoundingSphere();}
    }else if(chase&&distance<(e.alien?2.1:1.3)&&!e.cooldown&&(!piloting||altitude<2.8)){
     if(piloting)hull=Math.max(0,hull-stats.damage);else p.health=Math.max(0,p.health-stats.damage);e.cooldown=1;cb.notice(e.alien?'Alien claws struck you':'An infected survivor struck you');
    }
   });
   if(piloting&&hull<=0)p.health=0;
   if(p.health<=0){save();clear();paused=true;document.exitPointerLock?.();}
  }
  district.supplies.forEach(s=>s.mesh.visible=!p.looted.includes(s.id));
  district.player.visible=third&&!piloting;district.player.position.set(p.x,jump,p.z);district.player.rotation.y=yaw;
  const moving=keys.has('w')||keys.has('s')||Math.abs(motion.y)>.1;(district.player.userData.legs as T.Mesh[]).forEach((leg,n)=>leg.rotation.x=moving&&!paused?Math.sin(p.elapsed*7+n*Math.PI)*.4:0);
  camera.position.set(p.x,piloting?altitude+1.25:1.7+jump,p.z);camera.rotation.set(pitch,yaw,0,'YXZ');
  if(third){const origin=camera.position.clone();const offset=new T.Vector3(Math.sin(yaw)*(piloting?9:3.6),piloting?4:1.1,Math.cos(yaw)*(piloting?9:3.6));ray.set(origin,offset.clone().normalize());scene.updateMatrixWorld(true);const hits=ray.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...pedestals],true);const distance=Math.min(offset.length(),hits[0]?Math.max(.3,hits[0].distance-.25):offset.length());camera.position.add(offset.normalize().multiplyScalar(distance));camera.lookAt(origin.add(new T.Vector3(-Math.sin(yaw)*4,Math.sin(pitch)*5,-Math.cos(yaw)*4)));}
  if(!paused&&(firing||keys.has('f')))fire();
  (district.gunship.userData.flash as T.Mesh).visible=piloting&&flashTime>0&&!paused;
  district.weapon.group.visible=!piloting&&selectedWeapon==='ak'&&p.armed&&!paused&&p.health>0;
  district.weapon.flash.visible=selectedWeapon==='ak'&&flashTime>0&&!paused;
  staff.held.visible=!piloting&&selectedWeapon==='staff'&&!paused&&p.health>0;
  staff.held.position.copy(third?new T.Vector3(p.x,1.2+jump,p.z):camera.position);staff.held.quaternion.copy(camera.quaternion);staff.held.translateX(.4);staff.held.translateY(-.25);staff.held.translateZ(-.7);
  if(third){district.weapon.group.position.set(p.x,1.15+jump,p.z);district.weapon.group.quaternion.setFromEuler(new T.Euler(pitch,yaw,0,'YXZ'));district.weapon.group.translateX(.32);district.weapon.group.translateZ(-.35);}
  else{district.weapon.group.position.copy(camera.position);district.weapon.group.quaternion.copy(camera.quaternion);district.weapon.group.translateX(.25);district.weapon.group.translateY(reloading?-.5:-.25);district.weapon.group.translateZ(-.5+flashTime*.35);}
  sculptures.forEach(s=>s.visible=Math.abs(s.position.z-p.z)<36);
  uiTime+=dt;saveTime+=dt;if(uiTime>.15){uiTime=0;const t=target();const prompt=t==='gunship'?'E · Board F-49':t==='exit-gunship'?(altitude>1.7?'E · Land before exiting':'E · Exit F-49'):t==='terminal'?'E · Open library terminal':t==='keeper'?'E · Talk to Mara':t==='visitor'?'E · Talk to Iri':t.startsWith('mission:')?'E · '+MISSIONS.find(m=>m.id===t.slice(8))?.name:t.startsWith('supply:')?'E · Collect supplies':t?'E · Inspect object':'';cb.hud({campaign:{...c},x:p.x,z:p.z,piloting,altitude:Math.round(altitude*10)/10,hull:Math.ceil(hull),armed:p.armed,ammo:p.ammo,reserve:p.reserve,health:Math.ceil(p.health),water:Math.ceil(p.water),food:Math.ceil(p.food),stamina:Math.ceil(p.stamina),bottles:p.bottles,rations:p.rations,zone:safe(p.x,p.z)?'Cathedral · safe zone':'Washington · Capital Refuge',prompt,third,dead:p.health<=0,minutes:Math.floor(p.elapsed/60),locked:document.pointerLockElement===canvas,weapon:selectedWeapon,staffCooldown:Math.ceil(staffCooldown)});}
  if(saveTime>10){saveTime=0;save();}if(!document.hidden&&(!paused||needsRender)){renderer.render(scene,camera);needsRender=false;}frame=requestAnimationFrame(render);
 }
 render();
 return {fire,reload,selectWeapon,campaign:()=>({...c}),mission(id:string,choice:EradicationOption='containment'){if(!MISSIONS.some(m=>m.id===id&&Math.hypot(p.x-m.x,p.z-m.z)<7)||piloting||p.health<=0)return 'Reach this station on foot first.';const result=missionAction(c,id,p.defeated.filter(i=>i===5||i===6).length,choice);save();cb.notice(result);return result;},player:()=>p,motion,interact,setPaused(value:boolean){paused=value;clear();save();if(value)document.exitPointerLock?.();else canvas.focus({preventScroll:true});},toggleCamera(){third=!third;needsRender=true;},consume(kind:'water'|'food'){cb.notice(consume(p,kind));},restart(){selectedWeapon='staff';staffCooldown=0;starTarget=null;starResolved=false;staff.reset();p=freshPlayer();c=freshCampaign();blastAge=0;piloting=false;hull=100;altitude=F49_SPAWN.y;district.gunship.position.set(F49_SPAWN.x,F49_SPAWN.y,F49_SPAWN.z);district.gunship.rotation.y=Math.PI;reloading=shotCooldown=flashTime=0;firing=false;yaw=Math.PI;pitch=.03;jump=vertical=0;paused=false;district.enemies.forEach(e=>{e.mesh.position.set(e.x,0,e.z);e.dead=e.active=false;e.respawn=0;e.cooldown=e.windup=e.beamTime=0;e.laser.visible=false;e.mesh.userData.damage=0;e.mesh.visible=true;});save();},dispose(){disposed=true;save();cancelAnimationFrame(frame);resize.disconnect();if(document.pointerLockElement===canvas)document.exitPointerLock();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('pointerlockchange',lock);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',look);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);staff.dispose();cathedral.dispose();district.dispose();capital.dispose();textures.forEach(t=>t.dispose());sculptures.forEach(disposeCurrencySculpture);pedestalGeometry.dispose();pedestalMaterial.dispose();environment.dispose();renderer.dispose();canvas.remove();}};
}
