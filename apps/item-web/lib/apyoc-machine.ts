// SPDX-License-Identifier: MIT
import registry from '../public/apyoc/machine.json' with {type:'json'};
export {registry};
export type Target='home'|'eye'|'shop';
type Event={sequence:number;time:string;phase:string;target:Target|null;status:number|null;latencyMs:number|null};
export type AiRun={version:1;machine:string;id:string;workflowRun:string;commit:string;startedAt:string;finishedAt:string;state:'completed'|'inference-failed'|'disabled';modelRevision:string;weightsSha256:string;input:{target:Target;status:number}[];decision:{target:Target;probabilities:number[];inferenceMs:number;baseline:Target;agrees:boolean;networkIsolation:'linux-network-namespace'}|null;events:Event[]};
export type AiEntry={id:string;sha256:string;finishedAt:string;state:AiRun['state']};
export type AiIndex={version:1;runs:AiEntry[]};
const keys=(x:unknown,expected:string[]):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===expected.length&&expected.every(k=>Object.hasOwn(x,k));
const integer=(v:unknown,max=120000)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0&&v<=max;
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const target=(v:unknown):v is Target=>typeof v==='string'&&registry.targets.includes(v);
const state=(v:unknown)=>['completed','inference-failed','disabled'].includes(String(v));
export function parseAiIndex(value:unknown):AiIndex{
 if(!keys(value,['version','runs'])||value.version!==1||!Array.isArray(value.runs)||value.runs.length>100000)throw Error('Invalid AI archive index');
 const ids=new Set();
 for(const r of value.runs){if(!keys(r,['id','sha256','finishedAt','state'])||typeof r.id!=='string'||!/^\d+-[1-9]\d*$/.test(r.id)||ids.has(r.id)||typeof r.sha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sha256)||!date(r.finishedAt)||!state(r.state))throw Error('Invalid AI archive entry');ids.add(r.id);}
 return value as AiIndex;
}
export function parseAiRun(value:unknown):AiRun{
 if(!keys(value,['version','machine','id','workflowRun','commit','startedAt','finishedAt','state','modelRevision','weightsSha256','input','decision','events']))throw Error('Unexpected machine record fields');
 const x=value;
 if(x.version!==1||x.machine!==registry.id||typeof x.workflowRun!=='string'||!/^\d+$/.test(x.workflowRun)||typeof x.id!=='string'||!new RegExp('^'+x.workflowRun+'-[1-9]\\d*$').test(x.id)||typeof x.commit!=='string'||!/^[a-f0-9]{40}$/.test(x.commit)||!date(x.startedAt)||!date(x.finishedAt)||x.finishedAt<x.startedAt||!state(x.state)||x.modelRevision!==registry.modelRevision||x.weightsSha256!==registry.weightsSha256||!Array.isArray(x.input)||!Array.isArray(x.events)||x.events.length>16)throw Error('Invalid machine identity or record');
 const input=x.input;
 if(input.length!==(x.state==='disabled'?0:3)||input.some((r,i)=>!keys(r,['target','status'])||r.target!==registry.targets[i]||!integer(r.status,599)))throw Error('Invalid machine input');
 let chosen:Target|null=null;
 if(x.state==='completed'){
  const d=x.decision;
  if(!keys(d,['target','probabilities','inferenceMs','baseline','agrees','networkIsolation'])||!target(d.target)||!target(d.baseline)||typeof d.agrees!=='boolean'||d.networkIsolation!=='linux-network-namespace'||!integer(d.inferenceMs)||!Array.isArray(d.probabilities)||d.probabilities.length!==3||d.probabilities.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)||Math.abs(d.probabilities.reduce((a,b)=>a+b,0)-1)>1e-5)throw Error('Invalid model decision');
  const p=d.probabilities as number[];const index=p.indexOf(Math.max(...p));const baseline=input.find(r=>r.status<200||r.status>=300)?.target??'home';
  if(registry.targets[index]!==d.target||d.baseline!==baseline||d.agrees!==(d.target===baseline))throw Error('Decision evidence mismatch');chosen=d.target;
 }else if(x.decision!==null)throw Error('Failed run contains a decision');
 const expected:{phase:string;target:Target|null}[]=[{phase:'run-start',target:null}];
 if(x.state!=='disabled'){
  for(const t of registry.targets as Target[])expected.push({phase:'check-intent',target:t},{phase:'check-result',target:t});
  expected.push({phase:'inference-start',target:null});
  if(chosen)expected.push({phase:'inference-result',target:chosen},{phase:'check-intent',target:chosen},{phase:'check-result',target:chosen});else expected.push({phase:'inference-failed',target:null});
 }
 expected.push({phase:'run-stop',target:null});
 if(x.events.length!==expected.length)throw Error('Missing execution evidence');
 let previous=x.startedAt;
 for(let i=0;i<expected.length;i++){
  const e=x.events[i],wanted=expected[i];
  if(!keys(e,['sequence','time','phase','target','status','latencyMs'])||e.sequence!==i+1||!date(e.time)||e.time<previous||e.time>x.finishedAt||e.phase!==wanted.phase||e.target!==wanted.target)throw Error('Broken event sequence');
  if(e.phase==='check-result'){if(!integer(e.status,599)||!integer(e.latencyMs))throw Error('Invalid tool result');}else if(e.status!==null||e.latencyMs!==null)throw Error('Unexpected event payload');
  previous=e.time;
 }
 for(let i=0;i<input.length;i++)if(x.events[2+i*2].status!==input[i].status)throw Error('Input does not match observed results');
 return x as AiRun;
}
