// SPDX-License-Identifier: MIT — see apps/item-web/public/apyoc/LICENSE.txt
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseLedgerIndex,parseProbeEvents} from '../../apps/item-web/lib/apyoc-ledger.ts';
const directory=resolve(process.argv[2]??'observation-data');
await mkdir(`${directory}/days`,{recursive:true});
async function read(path,fallback){try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}}
const started=new Date().toISOString(),day=started.slice(0,10);
const index=parseLedgerIndex(await read(`${directory}/index.json`,{version:1,updatedAt:started,total:0,days:[]}));
const events=parseProbeEvents(await read(`${directory}/days/${day}.json`,[]));
if(events.length&&events.at(-1).sequence!==index.total)throw Error('Archive continuity mismatch');
// Fixed, operator-owned endpoints. Never ingest response bodies, headers, logs or visitor traffic.
for(const [target,url] of [['home','https://aetimm.com/'],['eye','https://aetimm.com/apyoc/'],['shop','https://aetimm.com/shop/']]){
 const time=started,begin=performance.now();let status=0,outcome='network-error';
 try{const response=await fetch(url,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});status=response.status;outcome=response.ok?'reachable':'http-error';await response.body?.cancel();}catch{/* Store a fixed outcome only, never the error message. */}
 events.push({sequence:++index.total,time,source:'aetimm-probe',kind:'infrastructure',target,outcome,status,latencyMs:Math.min(120000,Math.round(performance.now()-begin))});
}
parseProbeEvents(events);
index.updatedAt=new Date().toISOString();if(!index.days.includes(day))index.days.push(day);index.days.sort();
await writeFile(`${directory}/days/${day}.json`,JSON.stringify(events,null,2)+'\n');
await writeFile(`${directory}/index.json`,JSON.stringify(index,null,2)+'\n');
console.log(`Recorded ${events.length} infrastructure checks for ${day}; ${index.total} total. No AI systems connected.`);
