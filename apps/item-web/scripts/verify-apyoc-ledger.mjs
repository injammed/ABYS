import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {parseLedgerIndex,parseProbeEvents} from '../lib/apyoc-ledger.ts';
const event={sequence:1,time:'2026-09-13T12:00:00.000Z',source:'aetimm-probe',kind:'infrastructure',target:'home',outcome:'reachable',status:200,latencyMs:10};
assert.deepEqual(parseProbeEvents([event]),[event]);
for(const change of [{prompt:'private'},{target:'https://private.invalid'},{source:'human'},{kind:'ai'},{status:0},{latencyMs:-1},{sequence:0},{time:'invalid'}])assert.throws(()=>parseProbeEvents([{...event,...change}]));
assert.throws(()=>parseProbeEvents([event,event]));
assert.throws(()=>parseLedgerIndex({version:1,updatedAt:event.time,total:1,days:['../../secret']}));
assert.throws(()=>parseLedgerIndex({version:1,updatedAt:event.time,total:1,days:[],private:'no'}));
const directory=await mkdtemp(`${tmpdir()}/apyoc-test-`),originalFetch=globalThis.fetch,originalArgs=process.argv;
let n=0;
try{
 globalThis.fetch=async(url,options)=>{assert.ok(['https://aetimm.com/','https://aetimm.com/apyoc/','https://aetimm.com/shop/'].includes(url));assert.equal(options.method,'HEAD');assert.equal(options.redirect,'manual');n++;if(n===3)throw Error('private error content');return {status:n===1?200:503,ok:n===1,body:null};};
 process.argv=['node','collect',directory];
 await import('../../../scripts/apyoc/collect.mjs');
 const index=parseLedgerIndex(JSON.parse(await readFile(`${directory}/index.json`,'utf8')));
 const text=await readFile(`${directory}/days/${index.days[0]}.json`,'utf8'),events=parseProbeEvents(JSON.parse(text));
 assert.equal(index.total,3);assert.deepEqual(events.map(e=>e.outcome),['reachable','http-error','network-error']);assert.doesNotMatch(text,/private error content/);
}finally{globalThis.fetch=originalFetch;process.argv=originalArgs;await rm(directory,{recursive:true,force:true});}
console.log('Apyoc public ledger PASS: strict schema, fixed scope, rejection, failure privacy and collector archive.');
