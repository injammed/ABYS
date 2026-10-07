import {buildRefugeArt,refugeWalkable} from './refuge-art';
import {CAPITAL_LOOK} from './world-materials';
import {buildEconomyWorld} from './economy-world';
import {freshEconomy,restoreEconomy,rewardKill,syncRegionalDeaths,rewardRescue,skullQuestAction,absorbSoul,sellSouls,buy,damagePlayer,tickUpgrades,tunnelGround,economyWalkable,VENDING,SOUL_TRADER,type Economy,type GearId} from './game-economy';
import {buildHorizon} from './horizon-world';
import {freshHorizon,restoreHorizon,horizonAction,hitWizard,bunkerWalkable,bunkerRoofAt,bunkerGroundSaveValid,HORIZON_MISSIONS,type HorizonQuest} from './horizon-quest';
import * as T from 'three';
import {buildRift} from './rift-world';
import {DEMON_STATS} from './demon-models';
import {canIgnite,demonContact} from './demon-rules';
import {STAR_STAFF,validStarTarget,inStarImpact,type StarTarget} from './star-staff';
import {buildStarStaff} from './star-staff-world';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildCathedral} from './cathedral';
import {buildDistrict} from './survival-world';
import {buildCapital} from './capital-world';
import {safe} from './capital-map';
import {freshCampaign,restoreCampaign,advanceCampaign,eliminate,eliminateDemon,missionAction,MISSIONS,type Campaign,type EradicationOption} from './capital-campaign';
import {ENEMY_STATS,F49_SPAWN,HOSTILES} from './hostiles';
import {buildCurrencySculpture,disposeCurrencySculpture} from './currency-sculpture';
import {items} from './currency-library';
import CEILINGS from './cathedral-art.json';
import {flightFloor,canHover,landingSpot,armPlayer,spendRound,reloadWeapon,advance,canStand,collect,consume,freshPlayer,restorePlayer,SUPPLIES,type Player} from './survival';
export type GameWeapon='ak'|'staff'|'skull';
export type EconomyHud=Omit<Economy,'pending'|'seen'>;
export const economyHud=(e:Economy):EconomyHud=>{const {pending,seen,...hud}=e;void pending;void seen;return hud;};
export type Hud={economy:EconomyHud;flying:boolean;horizon:HorizonQuest;campaign:Campaign;x:number;z:number;piloting:boolean;altitude:number;hull:number;armed:boolean;ammo:number;reserve:number;health:number;water:number;food:number;stamina:number;bottles:number;rations:number;zone:string;prompt:string;third:boolean;dead:boolean;minutes:number;locked:boolean;weapon:GameWeapon;staffCooldown:number};
export type Callbacks={hud:(h:Hud)=>void;interact:(target:string)=>void;pause:()=>void;notice:(text:string)=>void};
const KEY='aetimm-capital-v2';
export function createSurvival(host:HTMLDivElement,cb:Callbacks){
 let p:Player,c:Campaign,h:HorizonQuest,e:Economy;try{const raw=localStorage.getItem(KEY),data=raw?JSON.parse(raw):null;p=restorePlayer(data?.version===2?JSON.stringify({version:1,player:data.player}):localStorage.getItem('aetimm-survival-v1'));c=data?.version===2?restoreCampaign(data.campaign):freshCampaign();h=restoreHorizon(data?.horizon);e=restoreEconomy(data?.economy);if(!data?.economy)for(const id of p.defeated.filter(i=>i>=5)){const previous=HOSTILES[id];if(previous)rewardKill(e,previous.kind,{x:previous.x,y:1.5,z:previous.z});}if(!data)p.defeated=p.defeated.filter(i=>i>=5);}catch{p=freshPlayer();c=freshCampaign();h=freshHorizon();e=freshEconomy();}
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.setClearColor(CAPITAL_LOOK.sky);host.appendChild(renderer.domElement);const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','AETIMM survival world. WASD moves. Mouse looks. E interacts. V changes camera. Escape pauses.');
 const scene=new T.Scene();scene.fog=new T.FogExp2(CAPITAL_LOOK.sky,.00035);
 const camera=new T.PerspectiveCamera(68,1,.08,14000);let needsRender=true;let yaw=Math.PI,pitch=.03,third=false,paused=false,disposed=false,jump=0,vertical=0;
 let jetFlying=false,lastDamage=0;const groundY=()=>tunnelGround(p.x,p.z);
 const hurt=(amount:number)=>{damagePlayer(e,p,amount);lastDamage=p.elapsed;};
 const deathPoint=()=>({x:p.x,y:groundY()+1.5,z:p.z});
 const reconcile=()=>{syncRegionalDeaths(e,c,deathPoint());rewardRescue(e,c.saved);};
 let piloting=false,altitude=F49_SPAWN.y,hull=100,blastAge=c.launched?30:0;
 const motion={x:0,y:0,lookX:0,lookY:0,lift:0};const keys=new Set<string>();
 scene.add(new T.HemisphereLight(0x9fbac7,0x454033,1.15));const sun=new T.DirectionalLight(CAPITAL_LOOK.sun,2.4);sun.position.set(-60,65,35);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:220});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
 const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.4;room.dispose();pmrem.dispose();
 const textures:T.Texture[]=[];const loader=new T.TextureLoader();const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
 const frescoes=CEILINGS.map(art=>{const texture=loader.load(`${base}${art.path}`,()=>{if(disposed)texture.dispose();},undefined,()=>cb.notice('A ceiling image could not load.'));texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(texture);return texture;});
 const cathedral=buildCathedral(-126,frescoes,true);scene.add(cathedral.root);
 const skin=(name:string)=>{const t=loader.load(`${base}/images/hostiles/${name}-reference.jpeg`,()=>{needsRender=true;},undefined,()=>cb.notice('An enemy skin could not load.'));t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
 const capital=buildCapital(loader,base,()=>{needsRender=true;},()=>cb.notice('A map layer could not load. Refresh to retry.'));scene.add(capital.root);
 capital.ready.then(()=>{if(!piloting&&(!canStand(p.x,p.z)||!bunkerGroundSaveValid(p.x,p.z,h)||!economyWalkable(p.x,p.z)||!refugeWalkable(p.x,p.z))){p.x=0;p.z=3;cb.notice('Returned to the cathedral: saved ground position was obstructed.');}});
 const rift=buildRift();scene.add(rift.root);
 const reference=loader.load(`${base}/images/horizon-lens-reference.webp`,()=>{needsRender=true;});reference.colorSpace=T.SRGBColorSpace;textures.push(reference);
 const horizon=buildHorizon(reference);scene.add(horizon.root);horizon.update(h,p.elapsed);let curseAge=0,curseCooldown=0;
 const horizonCollisions=()=>horizon.collisions.filter(o=>o!==horizon.door||h.stage<3);
 const refugeArt=buildRefugeArt();scene.add(refugeArt.root);
 const economyWorld=buildEconomyWorld();scene.add(economyWorld.root);
 const walkable=(x:number,z:number)=>canStand(x,z)&&bunkerWalkable(x,z,h.stage>=3)&&economyWalkable(x,z)&&refugeWalkable(x,z);
 const hurtWizard=(damage:number)=>{if(hitWizard(h,damage)){rewardKill(e,'wizard',{x:horizon.boss.position.x,y:horizon.boss.position.y+1.5,z:horizon.boss.position.z});horizon.curse.visible=false;curseAge=0;cb.notice('Dark wizard defeated. Reach the Eye of Horizons severance terminal inside the bunker.');}};
 const district=buildDistrict({robot:skin('robot'),alien:skin('alien'),aircraft:skin('f49')});scene.add(district.root);district.player.add(economyWorld.gear);
 const staff=buildStarStaff();scene.add(staff.root);let selectedWeapon:GameWeapon='staff',staffCooldown=0,starAge=0,starTarget:T.Vector3|null=null,starResolved=false;
 const selectWeapon=(weapon:GameWeapon)=>{if(paused||piloting||p.health<=0)return;if(weapon==='skull'&&e.skullQuest!==2){cb.notice('Complete Mara’s Skull of Uk’onu’okele quest first');return;}if(weapon==='ak'&&!p.armed){cb.notice('Talk to Mara for the AK-47');return;}selectedWeapon=weapon;reloading=0;firing=false;needsRender=true;cb.notice(weapon==='skull'?'Skull of Uk’onu’okele · nearby souls revealed · hold Click / F to absorb':weapon==='staff'?'Starfall bowstaff · aim at terrain outside the refuge · Click / F summons':'AK-47 selected');};
 const sculptures:T.Group[]=[];const pedestals:T.Mesh[]=[];
 const pedestalMaterial=new T.MeshStandardMaterial({color:0xc5b896,roughness:.8});const pedestalGeometry=new T.BoxGeometry(1.95,1.1,1.95);
 items.forEach((item,i)=>{const x=i%2?3.3:-3.3,z=-Math.floor(i/2)*6;const base=new T.Mesh(pedestalGeometry,pedestalMaterial);base.position.set(x,.55,z);scene.add(base);pedestals.push(base);const model=buildCurrencySculpture(item);const box=new T.Box3().setFromObject(model);model.position.set(x,1.12-box.min.y,z);scene.add(model);sculptures.push(model);});
 const target=()=>{
  if(piloting)return 'exit-gunship';
  if(groundY()<-5&&jump<2&&Math.hypot(p.x-SOUL_TRADER.x,p.z-SOUL_TRADER.z)<4)return 'soul-trader';
  const vendor=VENDING.findIndex(v=>!jetFlying&&jump<2&&Math.hypot(p.x-v.x,p.z-v.z)<3.5);if(vendor>=0)return 'vending:'+vendor;
  if(Math.hypot(p.x-district.gunship.position.x,groundY()+jump-district.gunship.position.y,p.z-district.gunship.position.z)<5)return 'gunship';
  const mission=[...HORIZON_MISSIONS,...MISSIONS].find(m=>!jetFlying&&jump<2&&Math.hypot(p.x-m.x,p.z-m.z)<7);if(mission)return 'mission:'+mission.id;
  if(Math.hypot(p.x-2.6,p.z-6)<3.2)return 'terminal';
  if(Math.hypot(p.x+2.5,p.z-6)<3)return 'keeper';
  if(Math.hypot(p.x+8,p.z-57)<3)return 'visitor';
  const supply=SUPPLIES.find(s=>!p.looted.includes(s.id)&&Math.hypot(p.x-s.x,p.z-s.z)<2.8);if(supply)return 'supply:'+supply.id;
  const index=sculptures.findIndex(s=>Math.hypot(p.x-s.position.x,p.z-s.position.z)<2.4);return index>=0?'exhibit:'+items[index].id:'';
 };
 const protectedPoints=()=>[...district.protectedActors,...capital.protectedActors,economyWorld.trader].map(o=>o.getWorldPosition(new T.Vector3()));
 const ignite=(point:T.Vector3,explosion=false)=>{if(!canIgnite(point.x,point.z,protectedPoints()))return;rift.ignite(point);if(explosion&&!safe(p.x,p.z)&&Math.hypot(p.x-point.x,(piloting?altitude:groundY()+1.5+jump)-point.y,p.z-point.z)<7){if(piloting)hull=Math.max(0,hull-18);else hurt(18);}};
 const killEnemy=(enemy:typeof district.enemies[number],index:number)=>{if(!enemy.active||enemy.dead)return;rewardKill(e,enemy.kind,{x:enemy.mesh.position.x,y:enemy.mesh.position.y+1.5,z:enemy.mesh.position.z});enemy.dead=true;enemy.active=false;enemy.mesh.visible=false;enemy.laser.visible=false;if(enemy.kind==='infected'){eliminate(c);enemy.respawn=2;if(c.rift&&c.riftClock>=8)ignite(enemy.mesh.position.clone(),true);}else if(!p.defeated.includes(index))p.defeated.push(index);};
 const hitDemon=(enemy:typeof rift.enemies[number],damage:number)=>{if(!enemy.active||enemy.dead)return;enemy.damage+=damage;if(enemy.damage>=DEMON_STATS[enemy.kind].hits&&eliminateDemon(c,enemy.kind)){rewardKill(e,enemy.kind,{x:enemy.mesh.position.x,y:enemy.mesh.position.y+1.5,z:enemy.mesh.position.z});enemy.active=false;enemy.dead=true;enemy.respawn=4;enemy.mesh.visible=false;cb.notice(enemy.kind==='titan'?'Crust titan banished':enemy.kind==='warlock'?'Warlock banished':'Goblin banished');}};
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({version:2,player:piloting||jetFlying||jump>2?{...p,x:0,z:3}:p,campaign:c,horizon:h,economy:e}));return true;}catch{return false;/* Storage denial must never stop play. */}};
 let firing=false,shotCooldown=0,flashTime=0,reloading=0;
 const clear=()=>{firing=false;keys.clear();motion.x=motion.y=motion.lookX=motion.lookY=motion.lift=0;};
 const interact=()=>{if(paused||p.health<=0)return;const t=target();if(t==='gunship'){jetFlying=false;jump=vertical=0;piloting=true;pitch=-.08;p.x=district.gunship.position.x;p.z=district.gunship.position.z;altitude=district.gunship.position.y;clear();reloading=0;cb.notice('F-49 online · WASD flies · Space rises · C descends · F fires · E exits after landing');return;}if(t==='exit-gunship'){if(altitude>1.7){cb.notice('Descend with C before exiting');return;}const spot=landingSpot(p.x,p.z);if(!spot){cb.notice('No clear ground to exit here');return;}piloting=false;p.x=spot.x;p.z=spot.z;clear();jump=vertical=0;save();return;}if(t.startsWith('supply:')){if(collect(p,t.slice(7))){cb.notice('Supplies collected.');save();}}else if(t){clear();paused=true;document.exitPointerLock?.();if(t==='keeper'&&armPlayer(p)){save();cb.notice("Mara gave you an AK-47 · 30 loaded / 90 spare · Click or F fires · T reloads");}cb.interact(t);}};
 const keydown=(e:KeyboardEvent)=>{
  if(paused||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
  const k=e.key.toLowerCase();if(['1','2','3','j','m','w','a','s','d','shift',' ','e','v','q','r','f','t','c','escape','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  keys.add(k);if(e.repeat)return;
  if(k==='1')selectWeapon('ak');if(k==='2')selectWeapon('staff');if(k==='3')selectWeapon('skull');if(k==='j')toggleJetpack();
  if(k==='m'){clear();paused=true;document.exitPointerLock?.();cb.interact('fieldmap');}if(k==='t')reload();if(k==='e')interact();if(k==='v')third=!third;if(k==='q')cb.notice(consume(p,'water'));if(k==='r')cb.notice(consume(p,'food'));
  if(k===' '&&!piloting&&!jetFlying&&jump===0&&p.health>0){vertical=5;}
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
 const toggleJetpack=()=>{if(paused||p.health<=0||piloting)return;if(!e.jetpack){cb.notice('Purchase a repulsor jetpack at a vending machine');return;}if(safe(p.x,p.z)||groundY()<0){cb.notice('Use the jetpack outside the cathedral and tunnel');return;}if(!jetFlying&&e.fuel<10){cb.notice('Jetpack recharging');return;}jetFlying=!jetFlying;vertical=0;cb.notice(jetFlying?'Jetpack on · Space rises · C descends · J lands':'Jetpack off · descending');};
 const shotRay=new T.Raycaster();
 const summonStar=()=>{
  if(staffCooldown||starTarget)return;
  scene.updateMatrixWorld(true);shotRay.setFromCamera(new T.Vector2(0,0),camera);shotRay.far=STAR_STAFF.range;
  const hit=shotRay.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...horizonCollisions(),...economyWorld.collisions,...refugeArt.collisions,...pedestals,...district.protectedActors,...capital.protectedActors,economyWorld.trader,...district.enemies.filter(e=>e.active&&!e.dead).map(e=>e.mesh),...rift.enemies.filter(e=>e.active&&!e.dead).map(e=>e.mesh),...(h.stage===3&&h.wizardHealth>0?[horizon.boss]:[])],true)[0];
  const ground=shotRay.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),new T.Vector3());
  const target=hit?.point??ground,origin=new T.Vector3(p.x,groundY()+1.5+jump,p.z);
  const protectedPoints=[...district.protectedActors,...capital.protectedActors,economyWorld.trader].map(o=>o.getWorldPosition(new T.Vector3()));
  if(!target||!validStarTarget(origin,target,protectedPoints)){shotCooldown=.5;cb.notice('Aim at nearby terrain outside the refuge and away from survivors');return;}
  starTarget=target.clone();starAge=0;starResolved=false;staffCooldown=STAR_STAFF.cooldown;staff.update(0,starTarget);cb.notice('Starfall incoming');
 };
 const fire=()=>{
  if(paused||reloading||shotCooldown||(!piloting&&selectedWeapon==='ak'&&!p.armed)||p.health<=0)return;
  if(!piloting&&selectedWeapon==='skull'){shotCooldown=.1;scene.updateMatrixWorld(true);const origin=new T.Vector3(p.x,groundY()+1.5+jump,p.z);const soul=absorbSoul(e,origin,true,s=>{const aim=new T.Vector3(s.x,s.y,s.z),delta=aim.clone().sub(origin);shotRay.set(origin,delta.clone().normalize());shotRay.far=delta.length();return !shotRay.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...horizonCollisions(),...economyWorld.collisions,...refugeArt.collisions],true).some(h=>h.distance<delta.length()-.25);});if(soul){economyWorld.absorb(soul,origin);cb.notice(`Soul absorbed · ${e.souls.toLocaleString()} held`);save();}return;}
  if(safe(p.x,p.z)){shotCooldown=.5;cb.notice('Cathedral safe zone · weapon lowered');return;}
  if(!piloting&&selectedWeapon==='staff'){summonStar();return;}
  if(!piloting&&!spendRound(p)){cb.notice(p.reserve?'Empty · press T to reload':'Out of ammunition');return;}
  shotCooldown=piloting?.2:.14;flashTime=.065;scene.updateMatrixWorld(true);
  const live=district.enemies.filter(e=>e.active&&!e.dead),demons=rift.enemies.filter(e=>e.active&&!e.dead);
  const isChild=(object:T.Object3D,root:T.Object3D)=>{let o:T.Object3D|null=object;while(o){if(o===root)return true;o=o.parent;}return false;};
  const blockers=[cathedral.root,...district.collisions,...capital.collisions,...horizonCollisions(),...economyWorld.collisions,...refugeArt.collisions,...pedestals,...district.protectedActors,...capital.protectedActors,economyWorld.trader];
  shotRay.setFromCamera(new T.Vector2(0,0),camera);shotRay.far=90;
  const aim=shotRay.intersectObjects([...blockers,...live.map(e=>e.mesh),...demons.map(e=>e.mesh),...(h.stage===3&&h.wizardHealth>0?[horizon.boss]:[])],true)[0];
  const point=aim?aim.point:shotRay.ray.at(90,new T.Vector3());
  const origin=new T.Vector3(p.x,piloting?altitude+.4:groundY()+1.5+jump,p.z),direction=point.clone().sub(origin);shotRay.set(origin,direction.normalize());shotRay.far=90;
  const hit=shotRay.intersectObjects([...blockers,...live.map(e=>e.mesh),...demons.map(e=>e.mesh),...(h.stage===3&&h.wizardHealth>0?[horizon.boss]:[])],true)[0];
  if(hit){const index=district.enemies.findIndex(e=>{let o:T.Object3D|null=hit.object;while(o){if(o===e.mesh)return true;o=o.parent;}return false;});
   if(index>=0){const enemy=district.enemies[index];enemy.mesh.userData.damage=(enemy.mesh.userData.damage??0)+(piloting?2:1);
    if(enemy.mesh.userData.damage>=ENEMY_STATS[enemy.kind].hits+(c.rift&&c.riftClock>=8&&enemy.kind==='infected'?2:0)){killEnemy(enemy,index);cb.notice(enemy.robot?'Patrol disabled':enemy.alien?'Alien stopped':c.rift?'Possessed infected exploded':'Infected stopped');}else cb.notice('Hit');
   }else{const demon=demons.find(e=>isChild(hit.object,e.mesh));if(demon)hitDemon(demon,piloting?2:1);else if(isChild(hit.object,horizon.boss))hurtWizard(piloting?2:1);}
  }save();
 };
 const clock=new T.Clock();let frame=0,uiTime=0,saveTime=0;const ray=new T.Raycaster();
 function render(){
  if(disposed)return;const dt=Math.min(clock.getDelta(),.05);
  if(!paused&&p.health>0&&!document.hidden){
   staffCooldown=Math.max(0,staffCooldown-dt);
   if(starTarget){starAge+=dt;staff.update(starAge,starTarget);if(starAge>=STAR_STAFF.fallTime&&!starResolved){starResolved=true;let hits=0;
    district.enemies.forEach((enemy,index)=>{if(!enemy.active||enemy.dead||!inStarImpact(starTarget as StarTarget,{x:enemy.mesh.position.x,y:enemy.mesh.position.y+1,z:enemy.mesh.position.z}))return;
     hits++;killEnemy(enemy,index);
    });rift.enemies.forEach(e=>{if(e.active&&!e.dead&&inStarImpact(starTarget as StarTarget,{x:e.mesh.position.x,y:e.mesh.position.y+(e.kind==='titan'?8:1),z:e.mesh.position.z})){hitDemon(e,STAR_STAFF.damage);hits++;}});if(h.stage===3&&h.wizardHealth>0&&inStarImpact(starTarget as StarTarget,{x:horizon.boss.position.x,y:2,z:horizon.boss.position.z})){hurtWizard(STAR_STAFF.damage);hits++;}save();cb.notice(`Starfall impact · ${hits} hostiles hit`);
   }if(starAge>=2.2){starTarget=null;staff.reset();}}
   shotCooldown=Math.max(0,shotCooldown-dt);flashTime=Math.max(0,flashTime-dt);if(reloading){reloading=Math.max(0,reloading-dt);if(!reloading){reloadWeapon(p);save();cb.notice('Reloaded');}}
   yaw-=motion.lookX*dt*1.8;pitch=T.MathUtils.clamp(pitch-motion.lookY*dt*1.4,-1.48,1.48);
   if(keys.has('arrowleft'))yaw+=dt*1.5;if(keys.has('arrowright'))yaw-=dt*1.5;
   const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))-motion.y,side=Number(keys.has('d'))-Number(keys.has('a'))+motion.x;
   const len=Math.max(1,Math.hypot(forward,side));const running=keys.has('shift')&&p.stamina>1&&Math.hypot(forward,side)>.1;const speed=piloting?(keys.has('shift')?240:100):jetFlying?12:(running?8:3.4)*(e.exo?1.4:1);
   const nx=p.x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/len*speed*dt,nz=p.z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/len*speed*dt;
   const valid=piloting?(x:number,z:number)=>canHover(x,z,altitude)&&altitude>=bunkerRoofAt(x,z)&&(altitude>14||bunkerWalkable(x,z,h.stage>=3)):jump>2?(x:number,z:number)=>canHover(x,z,groundY()+jump+1.4)&&groundY()+jump>=bunkerRoofAt(x,z):walkable;if(valid(nx,p.z))p.x=nx;if(valid(p.x,nz))p.z=nz;
   if(piloting){altitude=T.MathUtils.clamp(altitude+(Number(keys.has(' '))-Number(keys.has('c'))+motion.lift)*dt*32,Math.max(flightFloor(p.x,p.z),bunkerRoofAt(p.x,p.z)),450);district.gunship.position.set(p.x,altitude,p.z);district.gunship.rotation.y=yaw;}
   if(jetFlying&&(e.fuel<=0||safe(p.x,p.z)||groundY()<0)){jetFlying=false;vertical=0;}
   if(jetFlying){const minHeight=Math.max(0,flightFloor(p.x,p.z)-groundY(),bunkerRoofAt(p.x,p.z)-groundY());jump=T.MathUtils.clamp(jump+(Number(keys.has(' '))-Number(keys.has('c'))+motion.lift)*dt*12,minHeight,80);vertical=0;}else{vertical-=dt*12;const minHeight=jump>2&&!piloting?Math.max(0,flightFloor(p.x,p.z)-groundY()-1.4,bunkerRoofAt(p.x,p.z)-groundY()):0;jump=Math.max(minHeight,jump+vertical*dt);if(jump<=minHeight)vertical=0;}
   advance(p,dt,running&&!piloting&&!jetFlying);tickUpgrades(e,p,dt,{flying:jetFlying,running:running&&!piloting&&!jetFlying,sinceDamage:p.elapsed-lastDamage,grounded:!piloting&&jump===0});advanceCampaign(c,dt);reconcile();if(c.launched){blastAge+=dt;capital.updateStrike(blastAge);}else capital.blast.visible=false;if(c.rift){rift.update(dt,c.riftClock,c.demons>0);scene.fog!.color.setHex(0x493b40);renderer.setClearColor(0x493b40);}else rift.root.visible=false;
   horizon.update(h,p.elapsed);curseCooldown=Math.max(0,curseCooldown-dt);
   if(h.stage===3&&h.wizardHealth>0){
    horizon.boss.position.y=1+Math.sin(p.elapsed*1.4)*.25;horizon.boss.rotation.y=Math.atan2(-(p.x-horizon.boss.position.x),-(p.z-horizon.boss.position.z));
    const origin=horizon.boss.position.clone().add(new T.Vector3(0,2,0)),aim=new T.Vector3(p.x,piloting?altitude:groundY()+1.5+jump,p.z),delta=aim.clone().sub(origin);
    shotRay.set(origin,delta.clone().normalize());shotRay.far=delta.length();
    const blocked=shotRay.intersectObjects(horizonCollisions(),true).some(v=>v.distance<delta.length()-.2);
    if(!curseAge&&!curseCooldown&&delta.length()<65&&!blocked&&!safe(p.x,p.z)){curseAge=1.5;horizon.curse.position.set(p.x,.15,p.z);horizon.curse.visible=true;cb.notice('Dark wizard’s curse · leave the pink circle');}
    if(curseAge){curseAge=Math.max(0,curseAge-dt);if(!curseAge){horizon.curse.visible=false;curseCooldown=3;if(Math.hypot(p.x-horizon.curse.position.x,p.z-horizon.curse.position.z)<3&&(piloting?altitude<5:groundY()+jump<5)){if(piloting)hull=Math.max(0,hull-24);else hurt(24);cb.notice('The wizard’s curse struck');}}}
   }else{curseAge=0;horizon.curse.visible=false;}
   capital.markers.forEach(m=>{m.beam.visible=m.index===(c.strategy==='trinity'?Math.min(c.quest,MISSIONS.length-1):Math.min(c.quest,4))&&!c.won;m.ring.visible=m.index<=c.quest;});
   let represented=0;
   district.enemies.forEach((e,i)=>{
    e.laser.visible=false;e.respawn=Math.max(0,e.respawn-dt);
    if(e.kind==='infected'){
     if(Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z)>180)e.active=false;
     const wanted=represented<c.zombies&&!e.respawn&&!c.won;
     if(wanted&&!e.active){
      if(c.converted>1||e.dead||Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z)>160){
       let placed=false;for(let j=0;j<20;j++){const angle=(i*2.4+j*.7),radius=22+(i%7)*3,x=p.x+Math.sin(angle)*radius,z=p.z+Math.cos(angle)*radius;if(walkable(x,z)&&!safe(x,z)){e.mesh.position.set(x,0,z);e.x=x;e.z=z;placed=true;break;}}if(!placed){e.mesh.visible=false;e.active=false;return;}
      }e.dead=false;e.mesh.userData.damage=0;e.active=true;
     }
     e.active=wanted;if(wanted)represented++;
    }else{e.active=!p.defeated.includes(i)&&!(e.robot&&h.lensSevered);e.dead=!e.active;}
    e.mesh.visible=e.active;if(e.kind==='infected'){(e.mesh.userData.possession as T.Group).visible=c.rift&&c.riftClock>=8;}if(!e.active)return;
    if(e.kind==='infected'&&c.rift&&c.riftClock>=8&&Math.sin(p.elapsed*.6+i)>.995)ignite(e.mesh.position.clone());
    const stats=ENEMY_STATS[e.kind],distance=Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z),chase=!safe(p.x,p.z)&&groundY()>=0&&distance<stats.range;
    const tx=chase?p.x:e.x+Math.sin(p.elapsed*.18+i)*5,tz=chase?p.z:e.z+Math.cos(p.elapsed*.18+i)*5;
    const direction=new T.Vector2(tx-e.mesh.position.x,tz-e.mesh.position.z),moving=direction.length()>.3&&!(e.robot&&chase&&distance<20);
    if(moving){direction.normalize();const speed=chase?stats.speed:.55,x=e.mesh.position.x+direction.x*dt*speed,z=e.mesh.position.z+direction.y*dt*speed;if(walkable(x,e.mesh.position.z))e.mesh.position.x=x;if(walkable(e.mesh.position.x,z))e.mesh.position.z=z;}
    if(chase||moving)e.mesh.rotation.y=Math.atan2(-(tx-e.mesh.position.x),-(tz-e.mesh.position.z));
    (e.mesh.userData.legs as T.Object3D[]).forEach((leg,n)=>leg.rotation.x=moving?Math.sin(p.elapsed*(e.alien?9:5)+n*Math.PI)*.3:0);
    e.cooldown=Math.max(0,e.cooldown-dt);e.beamTime=Math.max(0,e.beamTime-dt);
    if(e.robot){
     const muzzle=(e.mesh.userData.muzzle as T.Vector3).clone();e.mesh.localToWorld(muzzle);
     const playerAim=new T.Vector3(p.x,piloting?altitude+.4:groundY()+1.4+jump,p.z),aim=(e.windup||e.beamTime)?e.aim.clone():playerAim.clone(),delta=aim.clone().sub(muzzle);shotRay.set(muzzle,delta.clone().normalize());shotRay.far=delta.length();
     const blocked=shotRay.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...horizonCollisions(),...economyWorld.collisions,...refugeArt.collisions,...pedestals,...district.protectedActors,...capital.protectedActors,economyWorld.trader],true).some(h=>h.distance<delta.length()-.2);
     if(chase&&!blocked&&!e.cooldown&&!e.windup){e.windup=.8;e.aim.copy(playerAim);cb.notice('Laser lock · move or find cover');}
     if(e.windup){e.windup=Math.max(0,e.windup-dt);e.laser.visible=true;(e.laser.material as T.LineBasicMaterial).opacity=.25;
      if(!e.windup){e.cooldown=2.4;e.beamTime=.18;if(chase&&!blocked&&playerAim.distanceTo(e.aim)<(piloting?2:.9)){if(piloting)hull=Math.max(0,hull-stats.damage);else hurt(stats.damage);cb.notice(piloting?'F-49 hull hit':'Laser hit · find cover');}}
     }
     if(e.beamTime){e.laser.visible=true;(e.laser.material as T.LineBasicMaterial).opacity=1;}
     if(e.laser.visible){const attr=e.laser.geometry.getAttribute('position') as T.BufferAttribute;attr.setXYZ(0,muzzle.x,muzzle.y,muzzle.z);attr.setXYZ(1,aim.x,aim.y,aim.z);attr.needsUpdate=true;e.laser.geometry.computeBoundingSphere();}
    }else if(chase&&distance<(e.alien?2.1:1.3)&&!e.cooldown&&(piloting?altitude<2.8:groundY()+jump<2.8)){
     if(piloting)hull=Math.max(0,hull-stats.damage);else hurt(stats.damage);e.cooldown=1;cb.notice(e.alien?'Alien claws struck you':'An infected survivor struck you');
    }
   });
   if(c.rift&&c.riftClock>=8){
    let represented=0;
    rift.enemies.forEach((e,i)=>{
     e.respawn=Math.max(0,e.respawn-dt);e.cooldown=Math.max(0,e.cooldown-dt);
     if(Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z)>(e.kind==='titan'?500:180))e.active=false;
     const wanted=represented<c.demons&&!e.respawn&&!c.won;
     if(wanted&&!e.active){let placed=false;for(let n=0;n<24;n++){const a=i*2.4+n*.5,r=e.kind==='titan'?100:e.kind==='warlock'?45:28,x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r;if(walkable(x,z)&&canIgnite(x,z,protectedPoints())){e.mesh.position.set(x,e.kind==='warlock'?3:0,z);placed=true;break;}}if(!placed){e.mesh.visible=false;return;}e.damage=0;e.dead=false;e.active=true;}
     e.active=wanted;e.mesh.visible=wanted;if(!wanted)return;represented++;
     const distance=Math.hypot(p.x-e.mesh.position.x,p.z-e.mesh.position.z),stats=DEMON_STATS[e.kind],chase=!safe(p.x,p.z)&&groundY()>=0&&distance<stats.range;
     if(chase&&distance>(e.kind==='titan'?14:2)){const dx=(p.x-e.mesh.position.x)/distance*stats.speed*dt,dz=(p.z-e.mesh.position.z)/distance*stats.speed*dt;if(walkable(e.mesh.position.x+dx,e.mesh.position.z))e.mesh.position.x+=dx;if(walkable(e.mesh.position.x,e.mesh.position.z+dz))e.mesh.position.z+=dz;}
     e.mesh.rotation.y=Math.atan2(-(p.x-e.mesh.position.x),-(p.z-e.mesh.position.z));
     (e.mesh.userData.legs as T.Group[]).forEach((leg,n)=>leg.rotation.x=chase?Math.sin(p.elapsed*(e.kind==='titan'?2:7)+n*Math.PI)*.25:0);
     if(e.kind==='warlock'){e.mesh.position.y=3+Math.sin(p.elapsed*1.5+i)*.6;if(chase&&!e.cooldown&&!e.cast){e.cast=1.2;e.aim.set(p.x,0,p.z);cb.notice('Warlock fire curse · move away');}if(e.cast){e.cast=Math.max(0,e.cast-dt);if(!e.cast){ignite(e.aim);e.cooldown=4;}}}
     else if(chase&&!e.cooldown&&demonContact(e.kind,distance,piloting?altitude:groundY()+1.5+jump)){if(piloting)hull=Math.max(0,hull-stats.damage);else hurt(stats.damage);e.cooldown=e.kind==='titan'?2:1;cb.notice(e.kind==='titan'?'Titan shockwave':'Goblin claws');}
    });
    if(!c.won&&!safe(p.x,p.z)&&rift.fires.some(f=>f.age<8&&Math.hypot(p.x-f.group.position.x,(piloting?altitude:groundY()+1.5+jump)-f.group.position.y,p.z-f.group.position.z)<3.5)){if(piloting)hull=Math.max(0,hull-dt*8);else hurt(dt*8);}
   }else rift.enemies.forEach(e=>{e.active=false;e.mesh.visible=false;});
   if(piloting&&hull<=0)p.health=0;
   if(p.health<=0){save();clear();paused=true;document.exitPointerLock?.();}
  }
  district.supplies.forEach(s=>s.mesh.visible=!p.looted.includes(s.id));
  district.player.visible=third&&!piloting;district.player.position.set(p.x,groundY()+jump,p.z);district.player.rotation.y=yaw;
  economyWorld.update(e,selectedWeapon==='skull'&&!piloting,deathPoint(),p.elapsed,paused?0:dt,jetFlying);

  const moving=keys.has('w')||keys.has('s')||Math.abs(motion.y)>.1;(district.player.userData.legs as T.Mesh[]).forEach((leg,n)=>leg.rotation.x=moving&&!paused?Math.sin(p.elapsed*7+n*Math.PI)*.4:0);
  camera.position.set(p.x,piloting?altitude+1.25:groundY()+1.7+jump,p.z);camera.rotation.set(pitch,yaw,0,'YXZ');
  if(third){const origin=camera.position.clone();const offset=new T.Vector3(Math.sin(yaw)*(piloting?9:3.6),piloting?4:1.1,Math.cos(yaw)*(piloting?9:3.6));ray.set(origin,offset.clone().normalize());scene.updateMatrixWorld(true);const hits=ray.intersectObjects([cathedral.root,...district.collisions,...capital.collisions,...horizonCollisions(),...economyWorld.collisions,...refugeArt.collisions,...pedestals],true);const distance=Math.min(offset.length(),hits[0]?Math.max(.3,hits[0].distance-.25):offset.length());camera.position.add(offset.normalize().multiplyScalar(distance));camera.lookAt(origin.add(new T.Vector3(-Math.sin(yaw)*4,Math.sin(pitch)*5,-Math.cos(yaw)*4)));}
  economyWorld.held.visible=selectedWeapon==='skull'&&!piloting&&!paused&&p.health>0;economyWorld.held.position.copy(third?new T.Vector3(p.x,groundY()+1.2+jump,p.z):camera.position);economyWorld.held.quaternion.copy(camera.quaternion);economyWorld.held.translateX(.35);economyWorld.held.translateY(-.25);economyWorld.held.translateZ(-.65);
  if(!paused&&(firing||keys.has('f')))fire();
  (district.gunship.userData.flash as T.Mesh).visible=piloting&&flashTime>0&&!paused;
  district.weapon.group.visible=!piloting&&selectedWeapon==='ak'&&p.armed&&!paused&&p.health>0;
  district.weapon.flash.visible=selectedWeapon==='ak'&&flashTime>0&&!paused;
  staff.held.visible=!piloting&&selectedWeapon==='staff'&&!paused&&p.health>0;
  staff.held.position.copy(third?new T.Vector3(p.x,groundY()+1.2+jump,p.z):camera.position);staff.held.quaternion.copy(camera.quaternion);staff.held.translateX(.4);staff.held.translateY(-.25);staff.held.translateZ(-.7);
  if(third){district.weapon.group.position.set(p.x,groundY()+1.15+jump,p.z);district.weapon.group.quaternion.setFromEuler(new T.Euler(pitch,yaw,0,'YXZ'));district.weapon.group.translateX(.32);district.weapon.group.translateZ(-.35);}
  else{district.weapon.group.position.copy(camera.position);district.weapon.group.quaternion.copy(camera.quaternion);district.weapon.group.translateX(.25);district.weapon.group.translateY(reloading?-.5:-.25);district.weapon.group.translateZ(-.5+flashTime*.35);}
  sculptures.forEach(s=>s.visible=Math.abs(s.position.z-p.z)<36);
  uiTime+=dt;saveTime+=dt;if(uiTime>.15){uiTime=0;const t=target();const prompt=t==='gunship'?'E · Board F-49':t==='exit-gunship'?(altitude>1.7?'E · Land before exiting':'E · Exit F-49'):t==='soul-trader'?'E · Trade souls with Nera':t.startsWith('vending:')?'E · USD supply machine':t==='terminal'?'E · Open library terminal':t==='keeper'?'E · Talk to Mara':t==='visitor'?'E · Talk to Iri':t.startsWith('mission:')?'E · '+[...MISSIONS,...HORIZON_MISSIONS].find(m=>m.id===t.slice(8))?.name:t.startsWith('supply:')?'E · Collect supplies':t?'E · Inspect object':'';cb.hud({economy:economyHud(e),flying:jetFlying,horizon:{...h},campaign:{...c},x:p.x,z:p.z,piloting,altitude:Math.round((piloting?altitude:groundY()+jump)*10)/10,hull:Math.ceil(hull),armed:p.armed,ammo:p.ammo,reserve:p.reserve,health:Math.ceil(p.health),water:Math.ceil(p.water),food:Math.ceil(p.food),stamina:Math.ceil(p.stamina),bottles:p.bottles,rations:p.rations,zone:groundY()<0?'Underground · Nera’s tunnel':safe(p.x,p.z)?'Cathedral · safe zone':'Washington · Capital Refuge',prompt,third,dead:p.health<=0,minutes:Math.floor(p.elapsed/60),locked:document.pointerLockElement===canvas,weapon:selectedWeapon,staffCooldown:Math.ceil(staffCooldown)});}
  if(saveTime>10){saveTime=0;save();}if(!document.hidden&&(!paused||needsRender)){refugeArt.update(p.elapsed,p.x,p.z,c.rift);sun.position.set(p.x-60,65,p.z+35);sun.target.position.set(p.x,0,p.z);renderer.render(scene,camera);needsRender=false;}frame=requestAnimationFrame(render);
 }
 render();
 return {fire,reload,selectWeapon,toggleJetpack,economy:()=>economyHud(e),purchase(id:GearId){if(piloting||jetFlying||jump>2||p.health<=0||!VENDING.some(v=>Math.hypot(p.x-v.x,p.z-v.z)<3.5))return 'Reach a vending machine on foot first.';const result=buy(e,p,id);save();cb.notice(result);return result;},skullQuest(){if(piloting||p.health<=0||Math.hypot(p.x+2.5,p.z-6)>=3.5)return 'Return to Mara in the cathedral.';reconcile();const result=skullQuestAction(e,c.saved);save();cb.notice(result);return result;},tradeSouls(){if(piloting||jetFlying||jump>2||p.health<=0||groundY()>-5||Math.hypot(p.x-SOUL_TRADER.x,p.z-SOUL_TRADER.z)>=4)return 'Meet Nera below the tunnel entrance first.';const result=sellSouls(e);save();cb.notice(result);return result;},saveGame(){const saved=save();cb.notice(saved?'Game saved in this browser.':'Could not save: browser storage is unavailable or full.');return saved;},campaign:()=>({...c}),mission(id:string,choice:EradicationOption='containment'){if(![...MISSIONS,...HORIZON_MISSIONS].some(m=>m.id===id&&Math.hypot(p.x-m.x,p.z-m.z)<7)||piloting||jetFlying||jump>2||p.health<=0)return 'Reach this station on foot first.';const result=id.startsWith('horizon-')?horizonAction(h,id):missionAction(c,id,h.lensSevered?2:p.defeated.filter(i=>i===5||i===6).length,choice);reconcile();save();cb.notice(result);return result;},player:()=>p,motion,interact,setPaused(value:boolean){paused=value;clear();save();if(value)document.exitPointerLock?.();else canvas.focus({preventScroll:true});},toggleCamera(){third=!third;needsRender=true;},consume(kind:'water'|'food'){cb.notice(consume(p,kind));},restart(){rift.reset();scene.fog!.color.setHex(CAPITAL_LOOK.sky);renderer.setClearColor(CAPITAL_LOOK.sky);selectedWeapon='staff';staffCooldown=0;starTarget=null;starResolved=false;staff.reset();p=freshPlayer();c=freshCampaign();h=freshHorizon();e=freshEconomy();jetFlying=false;lastDamage=0;curseAge=curseCooldown=0;horizon.update(h,0);horizon.curse.visible=false;blastAge=0;piloting=false;hull=100;altitude=F49_SPAWN.y;district.gunship.position.set(F49_SPAWN.x,F49_SPAWN.y,F49_SPAWN.z);district.gunship.rotation.y=Math.PI;reloading=shotCooldown=flashTime=0;firing=false;yaw=Math.PI;pitch=.03;jump=vertical=0;paused=false;district.enemies.forEach(e=>{e.mesh.position.set(e.x,0,e.z);e.dead=e.active=false;e.respawn=0;e.cooldown=e.windup=e.beamTime=0;e.laser.visible=false;e.mesh.userData.damage=0;e.mesh.visible=true;});save();},dispose(){disposed=true;save();cancelAnimationFrame(frame);resize.disconnect();if(document.pointerLockElement===canvas)document.exitPointerLock();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('pointerlockchange',lock);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',look);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);refugeArt.dispose();economyWorld.dispose();horizon.dispose();rift.dispose();staff.dispose();cathedral.dispose();district.dispose();capital.dispose();textures.forEach(t=>t.dispose());sculptures.forEach(disposeCurrencySculpture);pedestalGeometry.dispose();pedestalMaterial.dispose();environment.dispose();renderer.dispose();canvas.remove();}};
}
