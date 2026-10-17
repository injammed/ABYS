#!/usr/bin/env python3
"""Two-identity durable proposal/review controller for the existing ABYS workflow.
No model or worker is started by importing this module. No patch is applied here.
"""
import argparse
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import uuid

AGENTS = ('AETIMM', 'APY0C')
ROOT = Path(__file__).resolve().parents[2]


def identity(value):
    if value not in AGENTS:
        raise ValueError('Exactly AETIMM and APY0C are authorized; no third identity')
    return value


def peer(value):
    return AGENTS[1] if identity(value) == AGENTS[0] else AGENTS[0]


def connect(path):
    db = sqlite3.connect(path, timeout=5)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY, owner TEXT NOT NULL CHECK(owner IN ('AETIMM','APY0C')),
        task TEXT NOT NULL, revision TEXT NOT NULL, context TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'queued', proposal TEXT, review TEXT);
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY, job TEXT, agent TEXT CHECK(agent IN ('AETIMM','APY0C')),
        event TEXT NOT NULL, detail TEXT NOT NULL, at TEXT DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS worker_lock (id INTEGER PRIMARY KEY CHECK(id=1), job TEXT NOT NULL);
    ''')
    return db


def enqueue(db, owner, task, revision, context):
    identity(owner)
    if not task.strip() or not revision.strip():
        raise ValueError('Task and pinned revision required')
    if len(context.encode()) > 200_000:
        raise ValueError('Context exceeds 200 KB task budget')
    job = str(uuid.uuid4())
    with db:
        db.execute('INSERT INTO jobs(id,owner,task,revision,context) VALUES(?,?,?,?,?)',
                   (job, owner, task, revision, context))
        db.execute('INSERT INTO events(job,agent,event,detail) VALUES(?,?,?,?)',
                   (job, owner, 'queued', task))
    return job


def validate_result(result, agent, stage):
    allowed = {'agent', 'stage', 'summary', 'patch', 'evidence', 'verdict'}
    if not isinstance(result, dict) or set(result) != allowed:
        raise ValueError('Worker must return exactly agent, stage, summary, patch, evidence, verdict')
    if result['agent'] != identity(agent) or result['stage'] != stage:
        raise ValueError('Worker identity/stage mismatch')
    if not all(isinstance(result[k], str) for k in ('summary','patch','verdict')):
        raise ValueError('Invalid result fields')
    if not isinstance(result['evidence'], list) or not all(isinstance(x,str) for x in result['evidence']):
        raise ValueError('Evidence must be an array of references, not invented test status')
    if result['verdict'] not in ('proposed','accept','revise','blocked'):
        raise ValueError('Invalid verdict')
    if stage == 'review' and result['verdict'] == 'proposed':
        raise ValueError('Reviewer must accept, revise or block')
    if stage == 'review' and result['patch']:
        raise ValueError('Reviewer reports findings; author owns patch')
    if stage == 'author' and result['verdict'] not in ('proposed','blocked'):
        raise ValueError('An author cannot approve its own work')
    if result['verdict'] == 'accept' and not result['evidence']:
        raise ValueError('Review acceptance requires evidence references')
    return result


def run_one(db, job_id, worker, timeout=300):
    """worker is a trusted, operator-configured argv vector, never model output.
    It must be a one-request inference adapter, not another agent runtime.
    A global lock deliberately serializes inference and protects game benchmarks.
    """
    if not worker or not all(isinstance(x,str) and x for x in worker):
        raise ValueError('Configure a trusted inference adapter argv array')
    with db:
        db.execute('INSERT INTO worker_lock(id,job) VALUES(1,?)', (job_id,))
    try:
        row = db.execute('SELECT * FROM jobs WHERE id=?', (job_id,)).fetchone()
        if not row or row['state'] not in ('queued','review_pending'):
            raise ValueError('Job is absent, completed, blocked, or already running')
        stage = 'author' if row['state'] == 'queued' else 'review'
        agent = row['owner'] if stage == 'author' else peer(row['owner'])
        memory = [dict(r) for r in db.execute('SELECT event,detail,at FROM events WHERE agent=? ORDER BY id DESC LIMIT 8', (agent,))]
        request = {'agent':agent,'stage':stage,'instruction':(ROOT/'agents/game'/f'{agent}.md').read_text(),
                   'task':row['task'],'revision':row['revision'],'context':row['context'],
                   'proposal':json.loads(row['proposal']) if row['proposal'] else None,
                   'memory':memory,'allowed_agents':list(AGENTS),'delegation':False,
                   'tools':[], 'max_output_tokens':8000,
                   'output_contract':{'agent':agent,'stage':stage,'summary':'string','patch':'unified diff or empty',
                                      'evidence':['artifact references; unverified until checked'],
                                      'verdict':'proposed|accept|revise|blocked'}}
        with db:
            db.execute('UPDATE jobs SET state=? WHERE id=?', ('running_'+stage, job_id))
            db.execute('INSERT INTO events(job,agent,event,detail) VALUES(?,?,?,?)', (job_id,agent,'started',stage))
        try:
            # Empty cwd is hygiene, NOT an OS sandbox. Adapter is trusted operator code.
            import tempfile
            with tempfile.TemporaryDirectory(prefix='aetimm-inference-') as cwd:
                proc = subprocess.run(worker,input=json.dumps(request),text=True,capture_output=True,
                                      cwd=cwd,timeout=timeout,check=True)
            if len(proc.stdout.encode()) > 1_000_000:
                raise ValueError('Worker result exceeds output budget')
            result = validate_result(json.loads(proc.stdout), agent, stage)
            state = ('review_pending' if stage=='author' and result['verdict']=='proposed'
                     else 'ready_for_verification' if stage=='review' and result['verdict']=='accept'
                     else 'needs_revision' if result['verdict']=='revise' else 'blocked')
            column = 'proposal' if stage=='author' else 'review'
            with db:
                db.execute(f'UPDATE jobs SET {column}=?,state=? WHERE id=?', (json.dumps(result),state,job_id))
                db.execute('INSERT INTO events(job,agent,event,detail) VALUES(?,?,?,?)',
                           (job_id,agent,state,json.dumps(result)))
            return state
        except Exception:
            with db:
                db.execute('UPDATE jobs SET state=? WHERE id=?', ('blocked',job_id))
                db.execute('INSERT INTO events(job,agent,event,detail) VALUES(?,?,?,?)',
                           (job_id,agent,'blocked','Adapter failed, timed out, or returned invalid output; no automatic retry'))
            raise
    finally:
        with db:
            db.execute('DELETE FROM worker_lock WHERE id=1')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db',required=True,help='Persistent local SQLite path; never commit this database')
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('status')
    add=sub.add_parser('enqueue');add.add_argument('--agent',choices=AGENTS,required=True)
    add.add_argument('--task',required=True);add.add_argument('--revision',required=True)
    add.add_argument('--context',required=True,help='Operator-curated UTF-8 context file')
    run=sub.add_parser('run');run.add_argument('job')
    args=parser.parse_args();db=connect(args.db)
    if args.command=='status':
        print(json.dumps({'agents':AGENTS,'jobs':[dict(r) for r in db.execute('SELECT id,owner,state,revision FROM jobs')],
                          'lock':[dict(r) for r in db.execute('SELECT * FROM worker_lock')]}))
    elif args.command=='enqueue':
        print(enqueue(db,args.agent,args.task,args.revision,Path(args.context).read_text()))
    else:
        adapter=json.loads(os.environ.get('AETIMM_INFERENCE_ADAPTER', json.dumps([sys.executable, str(ROOT/'scripts/game-agents/gateway_adapter.py')])))
        if not isinstance(adapter,list):raise ValueError('Adapter must be a JSON argv array')
        print(run_one(db,args.job,adapter))

if __name__=='__main__':
    main()
