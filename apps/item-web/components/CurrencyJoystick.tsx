"use client";
import {useEffect,useRef} from "react";
import type {KeyboardEvent,PointerEvent} from "react";
import {joystickVector} from "@/lib/currency-navigation";
import styles from "./CurrencyMuseum.module.css";

export function CurrencyJoystick({label,onMove}:{label:string;onMove:(x:number,y:number)=>void}){
  const base=useRef<HTMLDivElement>(null),thumb=useRef<HTMLSpanElement>(null);
  const active=useRef<number|null>(null),keys=useRef(new Set<string>()),callback=useRef(onMove);callback.current=onMove;
  const output=(x:number,y:number)=>{callback.current(x,y);if(thumb.current)thumb.current.style.transform=`translate(${x*32}px,${y*32}px)`;};
  const reset=()=>{active.current=null;keys.current.clear();output(0,0);};
  useEffect(()=>{const stop=()=>{active.current=null;keys.current.clear();callback.current(0,0);if(thumb.current)thumb.current.style.transform="translate(0,0)";};window.addEventListener("blur",stop);document.addEventListener("visibilitychange",stop);return()=>{stop();window.removeEventListener("blur",stop);document.removeEventListener("visibilitychange",stop);};},[]);
  const update=(e:PointerEvent<HTMLDivElement>)=>{if(active.current!==e.pointerId||!base.current)return;const r=base.current.getBoundingClientRect();const v=joystickVector((e.clientX-r.left-r.width/2)/32,(e.clientY-r.top-r.height/2)/32);output(v.x,v.y);};
  const keyboard=(e:KeyboardEvent<HTMLDivElement>,down:boolean)=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();e.stopPropagation();if(down)keys.current.add(e.key);else keys.current.delete(e.key);const k=keys.current;const v=joystickVector(Number(k.has("ArrowRight"))-Number(k.has("ArrowLeft")),Number(k.has("ArrowDown"))-Number(k.has("ArrowUp")));output(v.x,v.y);};
  return <div className={styles.joystick} ref={base} role="group" tabIndex={0} aria-label={`${label} joystick. Hold and drag; arrow keys also work.`} onPointerDown={e=>{if(active.current!==null)return;e.preventDefault();active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={update} onPointerUp={e=>{if(active.current===e.pointerId)reset();}} onPointerCancel={reset} onLostPointerCapture={reset} onBlur={reset} onKeyDown={e=>keyboard(e,true)} onKeyUp={e=>keyboard(e,false)}><span className={styles.joystickRing}/><span className={styles.joystickThumb} ref={thumb}/><span className={styles.joystickLabel}>{label}</span></div>;
}
