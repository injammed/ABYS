"use client";
// SPDX-License-Identifier: MIT — see public/apyoc/LICENSE.txt
import {useEffect,useState} from 'react';
import {ledgerOrigin,parseLedgerIndex,parseProbeEvents,type LedgerIndex,type ProbeEvent} from '@/lib/apyoc-ledger';
import styles from './ApyocEye.module.css';
export function ApyocLedger(){
 const [index,setIndex]=useState<LedgerIndex|null>(null),[events,setEvents]=useState<ProbeEvent[]>([]),[day,setDay]=useState(''),[message,setMessage]=useState('Connecting to the public record…'),[now,setNow]=useState(0),[limit,setLimit]=useState(30);
 useEffect(()=>{
  let active=true;const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  async function refresh(){
   try{
    const response=await fetch(`${ledgerOrigin}/index.json`,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});
    if(!response.ok)throw Error('Observation record unavailable. Coverage cannot be confirmed.');
    const next=parseLedgerIndex(await response.json()),selected=day||next.days.at(-1);
    let rows:ProbeEvent[]=[];
    if(selected){if(!next.days.includes(selected))throw Error('Archive day unavailable.');const archive=await fetch(`${ledgerOrigin}/days/${selected}.json`,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});if(!archive.ok)throw Error('Archive unavailable.');rows=parseProbeEvents(await archive.json());if(rows.some(e=>!e.time.startsWith(selected)))throw Error('Archive date mismatch.');}
    if(active){setIndex(next);setEvents(rows);setMessage('');setNow(Date.now());}
   }catch{if(active){setMessage('Connection or validation failed. Last loaded records may be stale; coverage is unknown.');setNow(Date.now());}}
   finally{if(active)timer=setTimeout(()=>{if(document.visibilityState==='visible')void refresh();else timer=setTimeout(refresh,60000);},60000);}
  }
  setEvents([]);setMessage('Loading observation record…');void refresh();
  return()=>{active=false;controller.abort();clearTimeout(timer);};
 },[day]);
 const stale=!!index&&now-Date.parse(index.updatedAt)>45*60*1000;
 return <section id="witness" className={styles.observe} aria-labelledby="witness-title" data-apyoc-ledger="public-v1">
  <div className={styles.sectionHead}><div><p className={styles.kicker}>PUBLIC RECORD / OPEN OBSERVER</p><h2 id="witness-title">See what Apyoc sees.</h2></div><span className={styles.state}>{message?'Coverage unconfirmed':stale?'Reporting gap · stale':'Latest published observations'}</span></div>
  <p className={styles.explain}>The first eye checks AETIMM’s own machine infrastructure. Scheduled every 15 minutes; this view refreshes about once a minute. Scheduling and delivery can be delayed. This is a periodic public record, not a real-time AI activity stream.</p>
  <div className={styles.systems}><article><span className={styles.kicker}>AI SYSTEMS CONNECTED</span><h3>0</h3><p>Global AI activity coverage: unknown. Universal visibility remains the mission.</p></article><article><span className={styles.kicker}>ACTIVE SCOPE</span><h3>One infrastructure probe</h3><p>Home, Eye and Shop HTTP responses. No visitor traffic, prompts, identities or response content enters this record.</p></article><article><span className={styles.kicker}>PUBLISHED RECORD</span><h3>{index?index.total.toLocaleString():'—'} checks</h3><p>{index?`Last publication: ${index.updatedAt}`:'No confirmed publication loaded.'}</p></article></div>
  <p className={styles.explain}>All observations collected by this public probe are available below and in the archive. The collector is inspectable deterministic software. A reachable endpoint does not prove AI safety, model transparency or complete coverage. Records are publisher-controlled, not independently attested.</p>
  {message&&<p role="status">{message}</p>}{stale&&<p role="status">No publication within 45 minutes. Treat the interval since the last record as a visibility gap.</p>}
  {index&&<label className={styles.filter}>Archive day<select value={day} onChange={e=>{setDay(e.target.value);setLimit(30);}}><option value="">Latest day</option>{[...index.days].reverse().map(d=><option key={d} value={d}>{d}</option>)}</select></label>}
  <div className={styles.findings}>{[...events].reverse().slice(0,limit).map(e=><article key={e.sequence}><span className={styles.kind}>#{e.sequence}</span><div><small>{e.time} · Infrastructure</small><h3>{e.target} / {e.outcome}</h3><p>HTTP {e.status||'unavailable'} · {e.latencyMs} ms · {e.source}</p><details><summary>Inspect raw observation</summary><pre>{JSON.stringify(e,null,2)}</pre></details></div></article>)}</div>
  {!message&&!events.length&&<p>No observations published for this selection.</p>}
  {events.length>limit&&<div className={styles.controls}><button onClick={()=>setLimit(n=>n+30)}>Show 30 more observations</button></div>}
  <div className={styles.controls}><a className={styles.fundingLink} href="https://github.com/injammed/ABYS/tree/apyoc-observations" rel="noreferrer">Complete public archive ↗</a><a className={styles.fundingLink} href="https://github.com/injammed/ABYS/blob/main/docs/apyoc-observation-foundation.md" rel="noreferrer">Source, protocol & limitations ↗</a></div>
 </section>;
}
