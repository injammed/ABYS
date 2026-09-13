# SPDX-License-Identifier: MIT
"""Offline constrained next-token inference; no tools, user input or free text output."""
import json,sys,time
from pathlib import Path
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM
model_path,input_path,output_path=sys.argv[1:]
rows=json.loads(Path(input_path).read_text())
if len(rows)!=3 or [r['target'] for r in rows]!=['home','eye','shop']:raise ValueError('Invalid input')
if any(set(r)!= {'target','status'} or type(r['status']) is not int or not 0<=r['status']<=599 for r in rows):raise ValueError('Invalid input')
torch.set_num_threads(2);torch.manual_seed(0)
tokenizer=AutoTokenizer.from_pretrained(model_path,local_files_only=True,trust_remote_code=False)
model=AutoModelForCausalLM.from_pretrained(model_path,local_files_only=True,trust_remote_code=False,use_safetensors=True).eval()
prompt='Choose the endpoint that most needs a follow-up availability check. Prefer a failed endpoint. If all succeeded, choose A. Reply with one letter: A=home, B=eye, C=shop. HTTP status 0 means network failure. Observations: '+json.dumps(rows,separators=(',',':'))
inputs=tokenizer.apply_chat_template([{'role':'user','content':prompt}],add_generation_prompt=True,return_tensors='pt')
letters=[tokenizer.encode(x,add_special_tokens=False) for x in ['A','B','C']]
if any(len(x)!=1 for x in letters):raise ValueError('Choice token is not atomic')
start=time.monotonic()
with torch.inference_mode():
    logits=model(inputs).logits[0,-1,[x[0] for x in letters]]
    probabilities=torch.softmax(logits,dim=0).tolist()
choice=max(range(3),key=lambda i:probabilities[i])
Path(output_path).write_text(json.dumps({'target':rows[choice]['target'],'probabilities':probabilities,'inferenceMs':round((time.monotonic()-start)*1000)},allow_nan=False))
