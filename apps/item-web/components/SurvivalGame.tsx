"use client";
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {CurrencyJoystick} from './CurrencyJoystick';
import {talk} from '@/lib/survival';
import type {Hud} from '@/lib/survival-engine';
import styles from './SurvivalGame.module.css';
type Engine=ReturnType<(typeof import('@/lib/survival-engine'))['createSurvival']>;
const APPS=[['Library','/library/'],['Upload / Trough','/slop-trough/#field'],['Vote','/slop-trough/#vote'],['Museum / objects','/aetimm/'],['Shop','/shop/'],['Apyoc','/apyoc/'],['Scouts','/scouts/'],['Editions','/literature/item-0001/'],['Simulator','/simulator/'],['About','/about/']] as const;
const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
function Modal({children,onClose,label}:{children:ReactNode;onClose:()=>void;label:string}){
 const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal();},[]);
 return <dialog ref={ref} className={styles.modal} aria-label={label} onCancel={e=>{e.preventDefault();onClose();}}>{children}</dialog>;
}
export function SurvivalGame(){
 const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null);const [status,setStatus]=useState('Entering the cathedral…');
 const [hud,setHud]=useState<Hud>({health:100,water:100,food:100,stamina:100,bottles:2,rations:2,zone:'Cathedral · safe zone',prompt:'',third:false,dead:false,minutes:0,locked:false});
 const [modal,setModal]=useState<string|null>(null),[app,setApp]=useState<string|null>(null),[notice,setNotice]=useState(''),[message,setMessage]=useState('');
 const [dialogue,setDialogue]=useState<{speaker:string;text:string}[]>([]);
 const openInteraction=(target:string)=>{setMessage('');setDialogue([]);if(target.startsWith('exhibit:')){setApp('/shop/#item='+target.slice(8));setModal('terminal');}else{setApp(null);setModal(target);}};
 useEffect(()=>{let cancelled=false;
  import('@/lib/survival-engine').then(({createSurvival})=>{if(cancelled||!host.current)return;try{engine.current=createSurvival(host.current,{hud:setHud,interact:openInteraction,pause:()=>setModal('pause'),notice:setNotice});setStatus('');}catch{setStatus('This device could not open the 3D world. The library is still available below.');}}).catch(()=>setStatus('The world could not load. Refresh, or open the library below.'));
  return()=>{cancelled=true;engine.current?.dispose();engine.current=null;};
 },[]);
 useEffect(()=>{engine.current?.setPaused(!!modal);},[modal]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),5000);return()=>clearTimeout(t);},[notice]);
 const close=()=>{setModal(null);setApp(null);};
 const send=()=>{const text=message.trim();if(!text||!engine.current)return;const npc=modal==='visitor'?'visitor':'keeper';const reply=talk(engine.current.player(),npc,text);setDialogue(old=>[...old.slice(-18),{speaker:'You',text},{speaker:npc==='keeper'?'Mara':'Iri',text:reply}]);setMessage('');};
 return <section className={styles.game} data-game="survival-v1" aria-label="AETIMM survival game">
  <div ref={host} className={styles.world}/>
  <header className={styles.top}><div><strong>AETIMM</strong><span>{hud.zone}</span></div><div className={styles.topActions}><button onClick={()=>engine.current?.toggleCamera()} aria-label="Switch camera perspective">{hud.third?'Third person':'First person'} <kbd>V</kbd></button><button onClick={()=>setModal('pause')} aria-label="Pause and controls">Menu</button></div></header>
  <div className={styles.objective}>[ SURVIVE ]</div><div className={styles.reticle} aria-hidden="true">·</div>
  {!hud.locked&&!modal&&!status&&<p className={styles.hint}>Click the world to capture the mouse · WASD move · E interact · Esc release</p>}
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <div className={styles.bottom}><div className={styles.vitals} aria-label="Survival status"><span>Health <b>{hud.health}</b></span><span>Water <b>{hud.water}</b></span><span>Food <b>{hud.food}</b></span><span>Stamina <b>{hud.stamina}</b></span></div><div className={styles.inventory}><button onClick={()=>engine.current?.consume('water')}>Drink <kbd>Q</kbd> · {hud.bottles}</button><button onClick={()=>engine.current?.consume('food')}>Eat <kbd>R</kbd> · {hud.rations}</button></div></div>
  {!modal&&hud.prompt&&<button className={styles.interact} onClick={()=>engine.current?.interact()}>{hud.prompt}</button>}
  <div className={styles.touch}><CurrencyJoystick label="Move" onMove={(x,y)=>{if(engine.current){engine.current.motion.x=x;engine.current.motion.y=y;}}}/><CurrencyJoystick label="Look" onMove={(x,y)=>{if(engine.current){engine.current.motion.lookX=x;engine.current.motion.lookY=y;}}}/></div>
  {status&&<div className={styles.loading} role="status"><h1>AETIMM</h1><p>{status}</p><a href={`${base}/library/`}>Open the library directly</a></div>}
  {(modal||hud.dead)&&<Modal label={hud.dead?'Survival ended':modal==='terminal'?'Library terminal':modal==='pause'?'Pause menu':'NPC dialogue'} onClose={hud.dead?()=>{}:close}>
   {hud.dead?<><p className={styles.kicker}>SIGNAL LOST</p><h2>You survived {hud.minutes} minutes.</h2><p>The cathedral is still standing.</p><button autoFocus onClick={()=>{engine.current?.restart();close();}}>Respawn in the cathedral</button></>:
    modal==='pause'?<><p className={styles.kicker}>AETIMM / DISTRICT ZERO</p><h2>Paused.</h2><p>Your progress is saved on this browser. Simulation pauses while you use a terminal or talk.</p><dl className={styles.keys}><dt>W A S D</dt><dd>Move</dd><dt>Mouse / drag</dt><dd>Look</dd><dt>Shift / Space</dt><dd>Run / jump</dd><dt>E / V</dt><dd>Interact / change camera</dd><dt>Q / R</dt><dd>Drink / eat</dd><dt>Escape</dt><dd>Pause and release mouse</dd></dl><p>Find supplies outside. Return to the cathedral for shelter. Mara and the library terminal are beside the entrance.</p><p className={styles.small}>Early single-player district. NPC dialogue uses local rules; an open-ended AI conversation system and a larger city are planned. Fictional survival setting.</p><button autoFocus onClick={close}>Resume</button></>:
    modal==='terminal'?<><header className={styles.modalHeader}><h2>Library terminal</h2><button autoFocus onClick={close}>Return to world</button></header><div className={styles.apps}>{APPS.map(([name,path])=><button key={path} aria-pressed={app===path} onClick={()=>setApp(path)}>{name}</button>)}</div>{app?<><div className={styles.frameTools}><span>World paused</span><a href={`${base}${app}`} target="_blank" rel="noopener noreferrer">Open separately ↗</a></div><iframe title="Library terminal application" src={`${base}${app}`} className={styles.frame} onLoad={e=>{try{const frame=e.currentTarget;if(frame.contentWindow?.location.pathname===`${base}/`)frame.contentWindow.location.replace(`${base}/library/`);}catch{/* External navigation can always be closed with Return to world. */}}}/></>:<p className={styles.terminalWelcome}>All the library’s rooms are here. Select a destination above; your place in the world is held.</p>}</>:
    <><header className={styles.modalHeader}><h2>{modal==='visitor'?'Iri / stranded visitor':'Mara / cathedral keeper'}</h2><button onClick={close}>Leave conversation</button></header><p>{modal==='visitor'?'“Our ship is broken. Do you have water?”':'“You made it inside. What do you need?”'}</p><div className={styles.dialogue} role="log" aria-live="polite">{dialogue.map((line,i)=><p key={i}><strong>{line.speaker}</strong> {line.text}</p>)}</div><form onSubmit={e=>{e.preventDefault();send();}} className={styles.chat}><label className="gallery-sr-only" htmlFor="npc-message">Message to NPC</label><input id="npc-message" autoFocus value={message} maxLength={300} onChange={e=>setMessage(e.target.value)} placeholder="Say something…"/><button type="submit" disabled={!message.trim()}>Say</button></form><p className={styles.small}>Local dialogue · understands supplies, the city, the terminal, and water trading.</p></>}
  </Modal>}
 </section>;
}
