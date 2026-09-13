// SPDX-License-Identifier: MIT
import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseAiRun,parseAiIndex} from '../../apps/item-web/lib/apyoc-machine.ts';
const [directory,recordPath,bundlePath]=process.argv.slice(2);
const text=await readFile(recordPath,'utf8'),run=parseAiRun(JSON.parse(text));
if(run.workflowRun==='0')throw Error('Local tests cannot be published');
const path=`${directory}/ai/runs/${run.id}.json`;
await mkdir(`${directory}/ai/runs`,{recursive:true});await mkdir(`${directory}/ai/attestations`,{recursive:true});
let index;try{index=parseAiIndex(JSON.parse(await readFile(`${directory}/ai/index.json`,'utf8')));}catch(e){if(e.code!=='ENOENT')throw e;index={version:1,runs:[]};}
if(index.runs.some(e=>e.id===run.id))throw Error('Refusing duplicate execution identity');
try{await access(path);throw Error('Refusing to overwrite evidence');}catch(e){if(e.code!=='ENOENT')throw e;}
await copyFile(bundlePath,`${directory}/ai/attestations/${run.id}.jsonl`);
await writeFile(path,text,{flag:'wx'});
index.runs.push({id:run.id,sha256:createHash('sha256').update(text).digest('hex'),finishedAt:run.finishedAt,state:run.state});
parseAiIndex(index);await writeFile(`${directory}/ai/index.json`,JSON.stringify(index,null,2)+'\n');
console.log(`Published ${run.id}: ${run.state}`);
