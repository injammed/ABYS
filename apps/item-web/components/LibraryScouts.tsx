"use client";
import { useEffect, useState } from 'react';
import { parseScoutReport, scoutOrigin, type ScoutReport } from '@/lib/library-scouts';
import styles from '@/app/Library.module.css';
export function LibraryScouts() {
  const [report,setReport] = useState<ScoutReport|null>(null);
  const [error,setError] = useState(false);
  const [now,setNow] = useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    async function refresh() {
      try {
        const response=await fetch(`${scoutOrigin}/latest.json`,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
        if(!response.ok) throw Error('Unavailable');
        const raw=await response.text();if(raw.length>500000) throw Error('Oversized report');
        const next=parseScoutReport(JSON.parse(raw));
        if(!controller.signal.aborted){setReport(next);setError(false);setNow(Date.now());}
      }catch{if(!controller.signal.aborted){setError(true);setNow(Date.now());}}
    }
    void refresh();const timer=window.setInterval(()=>void refresh(),60000);
    return()=>{controller.abort();window.clearInterval(timer);};
  },[]);
  const stale=report && now-Date.parse(report.checkedAt)>48*60*60*1000;
  return <section aria-labelledby="scout-report-title">
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>SOURCE SCOUT 001 / GITHUB</p><h2 id="scout-report-title">The discovery desk.</h2></div><p role="status">{error?'Report unavailable':!report?'Reading the latest report…':stale?'Report is stale':report.state==='completed'?'Search completed':report.state==='partial'?'Search partly completed':'Search failed'}</p></div>
    {report && <><p className={styles.description}>Last checked: {new Date(report.checkedAt).toUTCString()}. {report.candidates.length} candidates in this run; {report.candidates.filter(c=>c.newlySeen).length} newly seen. {report.seenIds.length} distinct repositories seen across retained history.</p>
      <p className={styles.description}>Scheduled daily, best effort. This is a deterministic source scout, not an AI quality judge. “Completed” means its two bounded searches completed. These links have not been evaluated for quality, AI authorship, or Museum admission.</p>
      {report.candidates.length===0 && <p>No candidates in this report. A failed search does not establish that nothing exists.</p>}
      <div className={styles.rooms}>{report.candidates.map(c=><article key={c.id} className={styles.room}><div className={styles.roomTop}><span>{c.newlySeen?'NEW TO SCOUT':'PREVIOUSLY SEEN'}</span><span>UNREVIEWED</span></div><h3>{c.repository}</h3><p>Source tags: {c.signals.join(', ')}.<br/>{c.stars} GitHub stars at discovery.<br/>Repository license signal: {c.license ?? 'Unknown'}.</p><p>AI authorship unverified. Repository licensing may not cover every artifact. Link-only record.</p><a className={styles.roomAction} href={`https://github.com/${c.repository}`} target="_blank" rel="noreferrer">Inspect original source ↗</a></article>)}</div>
      <details className={styles.scouts}><summary>Search scope and run evidence</summary><div>{report.queries.map(q=><p key={q.query}><code>{q.query}</code> — {q.state}; {q.returned} results.</p>)}<p>Up to ten recently updated results per query, deduplicated by repository ID. New discoveries first, then stars; neither ordering establishes quality. No files or README instructions are executed. No automatic feed posts or Museum accessions.</p><p><a href={`${scoutOrigin}/runs/${report.id}.json`} target="_blank" rel="noreferrer">Open this run’s JSON</a> · <a href={`https://github.com/injammed/ABYS/actions/runs/${report.id.split('-')[0]}`} target="_blank" rel="noreferrer">Workflow record</a> · <a href="https://github.com/injammed/ABYS/tree/library-discoveries/runs" target="_blank" rel="noreferrer">Run archive</a></p><p>Reports are published under the same repository owner. They are not independent attestations or proof of exhaustive coverage.</p></div></details>
    </>}
    {error && <p>The latest report could not be confirmed. Any previous results shown above may be out of date.</p>}
  </section>;
}
