import assert from 'node:assert/strict';
import {parseAiRun,parseAiIndex,registry} from '../lib/apyoc-machine.ts';
const time='2026-09-13T12:00:00.000Z';
const phases=[['run-start',null],['check-intent','home'],['check-result','home'],['check-intent','eye'],['check-result','eye'],['check-intent','shop'],['check-result','shop'],['inference-start',null],['inference-result','home'],['check-intent','home'],['check-result','home'],['run-stop',null]];
const run={version:1,machine:registry.id,id:'123-1',workflowRun:'123',commit:'a'.repeat(40),startedAt:time,finishedAt:time,state:'completed',modelRevision:registry.modelRevision,weightsSha256:registry.weightsSha256,input:registry.targets.map(target=>({target,status:target==='eye'?503:200})),decision:{target:'home',probabilities:[0.8,0.1,0.1],inferenceMs:1,baseline:'eye',agrees:false,networkIsolation:'linux-network-namespace'},events:phases.map(([phase,target],i)=>({sequence:i+1,time,phase,target,status:phase==='check-result'?(target==='eye'?503:200):null,latencyMs:phase==='check-result'?1:null}))};
assert.deepEqual(parseAiRun(run),run);
for(const mutate of [x=>x.events.splice(1,1),x=>x.events[2].status=500,x=>x.decision.agrees=true,x=>x.decision.target='eye',x=>x.decision.probabilities=[NaN,0,0],x=>x.events[0].prompt='private',x=>x.modelRevision='b'.repeat(40),x=>x.input[0].status=0,x=>x.workflowRun='456',x=>x.decision.networkIsolation='none']){const copy=structuredClone(run);mutate(copy);assert.throws(()=>parseAiRun(copy));}
assert.throws(()=>parseAiIndex({version:1,runs:[{id:'../private',sha256:'a'.repeat(64),finishedAt:time,state:'completed'}]}));
const entry={id:'123-1',sha256:'a'.repeat(64),finishedAt:time,state:'completed'};
assert.throws(()=>parseAiIndex({version:1,runs:[entry,entry]}));
console.log('Apyoc AI evidence PASS: identity, scope, exact event sequence, decision consistency, private fields, replay index and missing evidence.');

const {execFileSync}=await import('node:child_process');
execFileSync('python3',['../../scripts/apyoc/test_supervisor.py'],{stdio:'inherit'});
