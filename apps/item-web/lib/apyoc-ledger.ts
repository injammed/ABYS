// SPDX-License-Identifier: MIT — see public/apyoc/LICENSE.txt
export const ledgerOrigin = 'https://raw.githubusercontent.com/injammed/ABYS/apyoc-observations';
export type ProbeEvent = { sequence:number; time:string; source:'aetimm-probe'; kind:'infrastructure'; target:'home'|'eye'|'shop'; outcome:'reachable'|'http-error'|'network-error'; status:number; latencyMs:number };
export type LedgerIndex = {version:1; updatedAt:string; total:number; days:string[]};
const date=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T.*Z$/.test(v)&&Number.isFinite(Date.parse(v));
const exact=(x:Record<string,unknown>,keys:string[])=>Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
export function parseLedgerIndex(value:unknown):LedgerIndex{
 if(!value||typeof value!=='object')throw Error('Invalid observation index');
 const x=value as Record<string,unknown>;
 if(!exact(x,['version','updatedAt','total','days'])||x.version!==1||!date(x.updatedAt)||!Number.isSafeInteger(x.total)||Number(x.total)<0||!Array.isArray(x.days)||x.days.length>36525||!x.days.every(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d)))||new Set(x.days).size!==x.days.length)throw Error('Invalid observation index');
 return x as LedgerIndex;
}
export function parseProbeEvents(value:unknown):ProbeEvent[]{
 if(!Array.isArray(value)||value.length>10000)throw Error('Invalid observation archive');
 let previous=0;
 return value.map(v=>{
  if(!v||typeof v!=='object')throw Error('Invalid observation');
  const x=v as Record<string,unknown>;
  if(!exact(x,['sequence','time','source','kind','target','outcome','status','latencyMs'])||!Number.isSafeInteger(x.sequence)||Number(x.sequence)<=previous||!date(x.time)||x.source!=='aetimm-probe'||x.kind!=='infrastructure'||!['home','eye','shop'].includes(String(x.target))||!['reachable','http-error','network-error'].includes(String(x.outcome))||!Number.isInteger(x.status)||Number(x.status)<0||Number(x.status)>599||!Number.isInteger(x.latencyMs)||Number(x.latencyMs)<0||Number(x.latencyMs)>120000)throw Error('Invalid observation');
  if((x.outcome==='network-error'&&x.status!==0)||(x.outcome==='reachable'&&(Number(x.status)<200||Number(x.status)>299))||(x.outcome==='http-error'&&(Number(x.status)<100||(Number(x.status)>=200&&Number(x.status)<=299))))throw Error('Invalid outcome');
  previous=Number(x.sequence);
  return {...x} as ProbeEvent;
 });
}
