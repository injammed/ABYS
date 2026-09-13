# SPDX-License-Identifier: MIT
"""Record intent before every permitted action; inference failure permits no follow-up action."""
import hashlib,json,os,subprocess,sys,time,urllib.request,urllib.error
from datetime import datetime,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
TARGETS={'home':'https://aetimm.com/','eye':'https://aetimm.com/apyoc/','shop':'https://aetimm.com/shop/'}
def now():return datetime.now(timezone.utc).isoformat(timespec='milliseconds').replace('+00:00','Z')
def supervisor(directory,model_dir,python,probe=None,infer=None):
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    machine=json.loads((ROOT/'apps/item-web/public/apyoc/machine.json').read_text())
    lock=json.loads((ROOT/'scripts/apyoc/model-lock.json').read_text())
    if type(machine.get('enabled')) is not bool or machine.get('targets')!=list(TARGETS) or machine.get('policy')!='fixed-head-selection-v1' or machine.get('maximumRequestsPerRun')!=4:raise ValueError('Invalid registered authority')
    if lock['model']!=machine['model'] or lock['revision']!=machine['modelRevision'] or lock['files']['model.safetensors']!=machine['weightsSha256']:raise ValueError('Unregistered model')
    run=os.environ.get('GITHUB_RUN_ID','0');attempt=os.environ.get('GITHUB_RUN_ATTEMPT','1');commit=os.environ.get('GITHUB_SHA','0'*40)
    if not run.isdigit() or not attempt.isdigit() or len(commit)!=40 or any(c not in '0123456789abcdef' for c in commit):raise ValueError('Invalid execution identity')
    record={'version':1,'machine':machine['id'],'id':run+'-'+attempt,'workflowRun':run,'commit':commit,'startedAt':now(),'finishedAt':None,'state':'inference-failed','modelRevision':machine['modelRevision'],'weightsSha256':machine['weightsSha256'],'input':[],'decision':None,'events':[]}
    def emit(phase,target=None,status=None,latency=None):
        event={'sequence':len(record['events'])+1,'time':now(),'phase':phase,'target':target,'status':status,'latencyMs':latency}
        # A failed journal write raises before the corresponding request is made.
        with (directory/'journal.jsonl').open('a') as f:f.write(json.dumps(event)+'\n');f.flush();os.fsync(f.fileno())
        record['events'].append(event)
    emit('run-start')
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs):return None
    def head(target):
        if target not in TARGETS:raise ValueError('Unregistered target')
        emit('check-intent',target);start=time.monotonic();status=0
        try:
            if probe is not None:status=probe(target)
            else:
                with urllib.request.build_opener(NoRedirect()).open(urllib.request.Request(TARGETS[target],method='HEAD'),timeout=15) as response:status=response.status
        except urllib.error.HTTPError as e:status=e.code
        except Exception:status=0
        if type(status) is not int or not 0<=status<=599:raise ValueError('Invalid HTTP result')
        emit('check-result',target,status,min(120000,round((time.monotonic()-start)*1000)));return status
    if not machine['enabled']:
        record['state']='disabled'
    else:
        record['input']=[{'target':target,'status':head(target)} for target in TARGETS]
        (directory/'input.json').write_text(json.dumps(record['input']))
        emit('inference-start')
        try:
            for name,digest in lock['files'].items():
                if hashlib.sha256((Path(model_dir)/name).read_bytes()).hexdigest()!=digest:raise ValueError('Model digest mismatch')
            if infer is not None:decision=infer(record['input'])
            else:
                # This namespace has no external network interface. Do not pass workflow credentials.
                subprocess.run(['sudo','-n','unshare','--net','--','env','-i','PATH=/usr/bin:/bin','HF_HUB_OFFLINE=1','TRANSFORMERS_OFFLINE=1',str(Path(python).absolute()),str(ROOT/'scripts/apyoc/infer.py'),str(Path(model_dir).resolve()),str((directory/'input.json').resolve()),str((directory/'decision.json').resolve())],check=True,timeout=120,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
                decision=json.loads((directory/'decision.json').read_text())
            if set(decision)!= {'target','probabilities','inferenceMs'} or decision['target'] not in TARGETS:raise ValueError('Invalid decision')
            p=decision['probabilities']
            if len(p)!=3 or any(type(x) not in (int,float) or not 0<=x<=1 for x in p) or abs(sum(p)-1)>1e-5:raise ValueError('Invalid scores')
            if list(TARGETS)[max(range(3),key=lambda i:p[i])]!=decision['target']:raise ValueError('Choice mismatch')
            if type(decision['inferenceMs']) is not int or not 0<=decision['inferenceMs']<=120000:raise ValueError('Invalid inference time')
            baseline=next((x['target'] for x in record['input'] if not 200<=x['status']<300),'home')
            record['decision']={**decision,'baseline':baseline,'agrees':baseline==decision['target'],'networkIsolation':'linux-network-namespace'}
            emit('inference-result',decision['target'])
        except Exception:
            record['decision']=None;emit('inference-failed')
        if record['decision'] is not None:
            head(record['decision']['target']);record['state']='completed'
    emit('run-stop');record['finishedAt']=now()
    (directory/'record.json').write_text(json.dumps(record,indent=2,allow_nan=False)+'\n')
    return record
if __name__=='__main__':
    result=supervisor(*sys.argv[1:]);print('Supervised run state:',result['state'])
