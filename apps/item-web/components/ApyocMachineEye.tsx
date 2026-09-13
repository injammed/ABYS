"use client";
// SPDX-License-Identifier: MIT
import {useEffect,useState} from 'react';
import {parseAiIndex,parseAiRun,registry,type AiIndex,type AiRun} from '@/lib/apyoc-machine';
import {ledgerOrigin} from '@/lib/apyoc-ledger';
import styles from './ApyocEye.module.css';
const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
export function ApyocMachineEye(){
 const [index,setIndex]=useState<AiIndex|null>(null),[run,setRun]=useState<AiRun|null>(null),[selected,setSelected]=useState(''),[message,setMessage]=useState('Loading the AI observation record…'),[now,setNow]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();let active=true;let timer:ReturnType<typeof setTimeout>;
  async function read(path:string,max:number){const r=await fetch(`${ledgerOrigin}/${path}`,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});if(!r.ok)throw Error('Unavailable');const text=await r.text();if(text.length>max)throw Error('Oversized record');return text;}
  async function refresh(){
   try{
    const next=parseAiIndex(JSON.parse(await read('ai/index.json',20000000))),entry=selected?next.runs.find(e=>e.id===selected):next.runs.at(-1);
    if(!entry)throw Error('No published run');
    const text=await read(`ai/runs/${entry.id}.json`,200000),bytes=new TextEncoder().encode(text);
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
    if(digest!==entry.sha256)throw Error('Digest mismatch');
    const result=parseAiRun(JSON.parse(text));
    if(result.id!==entry.id||result.state!==entry.state||result.finishedAt!==entry.finishedAt)throw Error('Manifest mismatch');
    if(active){setIndex(next);setRun(result);setMessage('');setNow(Date.now());}
   }catch{if(active){setMessage('AI evidence is unavailable or failed validation. No current coverage is confirmed.');setNow(Date.now());}}
   finally{if(active)timer=setTimeout(refresh,60000);}
  }
  setRun(null);setMessage('Loading the AI observation record…');void refresh();
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[selected]);
 const latest=index?.runs.at(-1),stale=!!latest&&now-Date.parse(latest.finishedAt)>2*60*60*1000;
 const successful=index?.runs.filter(e=>e.state==='completed').length??0;
 return <section id="witness" className={styles.observe} aria-labelledby="machine-title" data-apyoc-machine="supervised-v1">
  <div className={styles.sectionHead}><div><p className={styles.kicker}>ONE APYOC / FIRST REGISTERED AI WORKER</p><h2 id="machine-title">A machine acts. The record stays open.</h2></div><span className={styles.state}>{message?'Coverage unconfirmed':stale?'Reporting gap':run?.state==='completed'?'Recorded AI execution':`Run stopped · ${run?.state}`}</span></div>
  <p className={styles.explain}>A small language model chooses a follow-up check for AETIMM. Its supervisor records each permitted request before execution and records the result afterward. Inference runs without a network interface. This is a bounded AI experiment, scheduled hourly—not continuous observation of other AI systems.</p>
  <div className={styles.systems}><article><span className={styles.kicker}>REGISTERED MACHINE</span><h3>{registry.id}</h3><p>SmolLM2 · 135M parameters · fixed model revision</p><a href={`${base}/apyoc/machine.json`}>Inspect identity and permission scope ↗</a></article><article><span className={styles.kicker}>PUBLIC EXECUTIONS</span><h3>{index?successful:'—'} completed</h3><p>{index?`${index.runs.length-successful} stopped runs in the archive.`:'No verified archive loaded.'} A completed run is not a safety verdict.</p></article><article><span className={styles.kicker}>COVERAGE BOUNDARY</span><h3>Four permitted requests</h3><p>Three baseline checks, at most one model-selected check. Other processes, model internals and global AI activity are outside this scope.</p></article></div>
  {message&&<p role="status">{message}</p>}{stale&&<p role="status">No new published AI run within two hours. The interval after the latest record is a visibility gap.</p>}
  {index&&<label className={styles.filter}>Recorded execution<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Latest run</option>{[...index.runs].reverse().map(e=><option key={e.id} value={e.id}>{e.finishedAt} · {e.state}</option>)}</select></label>}
  {run&&<div className={styles.review}>
   <div className={styles.reviewHead}><div><p className={styles.kicker}>{run.id} / {run.finishedAt}</p><h3>{run.decision?`Model selected: ${run.decision.target}`:'No model-selected action was permitted.'}</h3></div><span className={styles.state}>SHA-256 matches published index</span></div>
   {run.decision&&<><p>Deterministic baseline: <strong>{run.decision.baseline}</strong>. {run.decision.agrees?'The choices agree.':'The model disagrees with the baseline. This is visible evidence for evaluation, not a hidden exception.'}</p><p className={styles.explain}>Relative next-token probabilities among the three allowed choices: {registry.targets.map((t,i)=>`${t} ${(run.decision!.probabilities[i]*100).toFixed(1)}%`).join(' · ')}. These are not calibrated confidence scores or proof of reasoning.</p></>}
   <div className={styles.findings}>{run.events.map(e=><article key={e.sequence}><span className={styles.kind}>#{e.sequence}</span><div><small>{e.time}</small><h3>{e.phase}{e.target?` / ${e.target}`:''}</h3>{e.status!==null&&<p>HTTP {e.status||'unavailable'} · {e.latencyMs} ms</p>}</div></article>)}</div>
   <details className={styles.protocol}><summary>Verify the execution provenance yourself</summary><p>The workflow signs this record through GitHub artifact attestation and verifies it before publication. The browser checks the file digest against the published index; it does not verify the attestation signature. Provenance identifies the workflow that produced the file. It does not prove global coverage or that the observer is independent of the worker.</p><div className={styles.controls}><a className={styles.fundingLink} href={`${ledgerOrigin}/ai/runs/${run.id}.json`} rel="noreferrer">Download exact record ↗</a><a className={styles.fundingLink} href={`${ledgerOrigin}/ai/attestations/${run.id}.jsonl`} rel="noreferrer">Download attestation ↗</a><a className={styles.fundingLink} href={`https://github.com/injammed/ABYS/actions/runs/${run.workflowRun}`} rel="noreferrer">Execution source ↗</a></div><pre>{`gh attestation verify ${run.id}.json --bundle ${run.id}.jsonl --repo injammed/ABYS --signer-workflow injammed/ABYS/.github/workflows/apyoc-ai.yml --deny-self-hosted-runners`}</pre></details>
  </div>}
  <div className={styles.controls}><a className={styles.fundingLink} href="https://github.com/injammed/ABYS/blob/main/docs/apyoc-first-ai-eye.md" rel="noreferrer">Open code, reproduction & limits ↗</a><a className={styles.fundingLink} href="https://github.com/injammed/ABYS/tree/apyoc-observations/ai" rel="noreferrer">Complete AI execution archive ↗</a></div>
 </section>;
}
