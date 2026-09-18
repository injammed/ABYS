#!/usr/bin/env python3
"""Portable, model-free scout supervisor. Python stdlib + Node 24; no app install."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parent

def connect(path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=0, isolation_level=None)
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('PRAGMA synchronous=FULL')
    db.executescript('''
    CREATE TABLE IF NOT EXISTS runs (
      sequence INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL,
      payload TEXT NOT NULL, digest TEXT NOT NULL, parent TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY, first_run TEXT NOT NULL, last_run TEXT NOT NULL,
      payload TEXT NOT NULL);
    CREATE TRIGGER IF NOT EXISTS runs_no_update BEFORE UPDATE ON runs
      BEGIN SELECT RAISE(ABORT, 'run history is append-only'); END;
    CREATE TRIGGER IF NOT EXISTS runs_no_delete BEFORE DELETE ON runs
      BEGIN SELECT RAISE(ABORT, 'run history is append-only'); END;
    ''')
    return db

def digest(parent, payload):
    return hashlib.sha256((parent + '\n' + payload).encode()).hexdigest()

def verify(db):
    parent = ''
    expected = 1
    count = 0
    catalog = {}
    for seq, run_id, payload, stored, prior in db.execute('SELECT sequence,id,payload,digest,parent FROM runs ORDER BY sequence'):
        if seq != expected or prior != parent or stored != digest(parent, payload):
            raise ValueError('History integrity check failed')
        report = json.loads(payload)
        if report['id'] != run_id:
            raise ValueError('History identity mismatch')
        for candidate in report['candidates']:
            key = candidate['id']
            first = catalog[key][0] if key in catalog else run_id
            catalog[key] = (first, run_id, candidate)
        parent = stored
        expected += 1
        count += 1
    actual = {row[0]: (row[1], row[2], json.loads(row[3])) for row in db.execute('SELECT id,first_run,last_run,payload FROM candidates')}
    if catalog != actual:
        raise ValueError('Candidate catalog integrity check failed')
    return count, parent

def append(db, report):
    # Called inside the same transaction as the prior-history read.
    _, parent = verify(db)
    payload = json.dumps(report, separators=(',', ':'), ensure_ascii=False)
    db.execute('INSERT INTO runs(id,payload,digest,parent) VALUES(?,?,?,?)',
               (report['id'], payload, digest(parent, payload), parent))
    for candidate in report['candidates']:
        db.execute('''INSERT INTO candidates(id,first_run,last_run,payload) VALUES(?,?,?,?)
          ON CONFLICT(id) DO UPDATE SET last_run=excluded.last_run,payload=excluded.payload''',
          (candidate['id'], report['id'], report['id'], json.dumps(candidate, separators=(',', ':'))))

def run(db, source_commit, collector=None):
    # Reserve the writer before requesting anything. A concurrent invocation fails closed.
    db.execute('BEGIN IMMEDIATE')
    try:
        verify(db)
        previous = db.execute('SELECT payload FROM runs ORDER BY sequence DESC LIMIT 1').fetchone()
        run_id = f'{time.time_ns()}-1'
        with tempfile.TemporaryDirectory(prefix='aetimm-scout-') as tmp:
            previous_dir = '-'
            if previous:
                previous_dir = str(Path(tmp)/'previous')
                Path(previous_dir).mkdir()
                (Path(previous_dir)/'latest.json').write_text(previous[0])
            output = str(Path(tmp)/'output')
            env = dict(os.environ, SCOUT_RUN_ID=run_id, SCOUT_SOURCE_COMMIT=source_commit)
            if collector:
                report = collector(previous and json.loads(previous[0]), run_id)
            else:
                subprocess.run(['node', str(ROOT/'collect.mjs'), previous_dir, output],
                               env=env, check=True, timeout=150, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                path = Path(output)/'report.json'
                if path.stat().st_size > 500000:
                    raise ValueError('Report exceeds budget')
                report = json.loads(path.read_text())
            if report['id'] != run_id or report['sourceCommit'] != source_commit:
                raise ValueError('Collector identity mismatch')
            append(db, report)
        db.execute('COMMIT')
        return report
    except BaseException:
        db.execute('ROLLBACK')
        raise

def export(db, output):
    # Export a consistent snapshot; derived candidates can always be reconstructed from runs.
    db.execute('BEGIN')
    try:
        count, checkpoint = verify(db)
        latest = db.execute('SELECT payload FROM runs ORDER BY sequence DESC LIMIT 1').fetchone()
        records = [dict(id=r[0], firstRun=r[1], lastRun=r[2], candidate=json.loads(r[3]))
                   for r in db.execute('SELECT id,first_run,last_run,payload FROM candidates ORDER BY id')]
        payload = json.dumps({'version':1, 'runCount':count, 'checkpoint':checkpoint,
                              'latest':json.loads(latest[0]) if latest else None, 'catalog':records},indent=2)+'\n'
        db.execute('COMMIT')
    except BaseException:
        db.execute('ROLLBACK')
        raise
    output = Path(output)
    output.parent.mkdir(parents=True,exist_ok=True)
    fd, temp = tempfile.mkstemp(dir=output.parent,prefix='.scout-export-')
    try:
        with os.fdopen(fd,'w') as f:
            f.write(payload);f.flush();os.fsync(f.fileno())
        os.replace(temp,output)
    finally:
        if os.path.exists(temp): os.unlink(temp)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['run','check','export','backup'])
    parser.add_argument('--db',required=True)
    parser.add_argument('--source-commit')
    parser.add_argument('--output')
    args=parser.parse_args()
    if args.command=='run' and not re.fullmatch('[a-f0-9]{40}',args.source_commit or ''):
        parser.error('run requires the installed source revision via --source-commit')
    if args.command in ('export','backup') and not args.output: parser.error('--output is required')
    if args.output and Path(args.output).resolve()==Path(args.db).resolve(): parser.error('output must differ from database')
    if args.command != 'run' and not Path(args.db).is_file(): parser.error('database does not exist')
    db=connect(args.db)
    try:
        if args.command=='run':
            result=run(db,args.source_commit)
            print(json.dumps({'id':result['id'],'state':result['state'],'candidates':len(result['candidates'])}))
            return 0 if result['state']=='completed' else 2
        if args.command=='check':
            count,checkpoint=verify(db)
            print(json.dumps({'runs':count,'checkpoint':checkpoint,'integrity':'valid'}))
        elif args.command=='export': export(db,args.output)
        else:
            # SQLite's backup API includes committed WAL data. Refuse overwriting backups.
            dest=Path(args.output);dest.parent.mkdir(parents=True,exist_ok=True)
            with dest.open('xb'): pass
            target=sqlite3.connect(dest)
            try: db.backup(target)
            finally: target.close()
            print('Backup complete')
        return 0
    finally: db.close()

if __name__=='__main__':
    try: sys.exit(main())
    except Exception as error:
        # Do not expose environment credentials or remote exception bodies.
        print('Scout failed: '+type(error).__name__+'. Prior committed history was retained.',file=sys.stderr)
        sys.exit(1)
