import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from runtime import connect, run, verify, export

COMMIT='a'*40
class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.path=Path(self.temp.name)/'scout.db';self.db=connect(self.path)
    def tearDown(self): self.db.close();self.temp.cleanup()
    def collect(self,previous,run_id):
        return {'id':run_id,'sourceCommit':COMMIT,'state':'completed','candidates':[{'id':42,'repository':'test/object','newlySeen':previous is None}]}
    def test_restart_and_dedup(self):
        first=run(self.db,COMMIT,self.collect);self.db.close();self.db=connect(self.path)
        second=run(self.db,COMMIT,self.collect)
        self.assertFalse(second['candidates'][0]['newlySeen'])
        self.assertEqual(verify(self.db)[0],2)
        self.assertEqual(self.db.execute('SELECT first_run,last_run FROM candidates').fetchone(),(first['id'],second['id']))
    def test_failure_preserves_history(self):
        run(self.db,COMMIT,self.collect);before=verify(self.db)
        def fail(*args):raise RuntimeError('simulated collector crash')
        with self.assertRaises(RuntimeError):run(self.db,COMMIT,fail)
        self.assertEqual(verify(self.db),before)
    def test_overlap_rejected_before_collection(self):
        other=connect(self.path);other.execute('BEGIN IMMEDIATE')
        try:
            with self.assertRaises(sqlite3.OperationalError):run(self.db,COMMIT,lambda *_:self.fail('network must not run'))
        finally:other.execute('ROLLBACK');other.close()
    def test_append_only_and_tamper_detection(self):
        run(self.db,COMMIT,self.collect)
        with self.assertRaises(sqlite3.IntegrityError):self.db.execute("UPDATE runs SET payload='{}'")
        self.db.execute('DROP TRIGGER runs_no_update');self.db.execute("UPDATE runs SET payload='{}'")
        with self.assertRaises(ValueError):verify(self.db)
    def test_catalog_corruption_detected(self):
        run(self.db,COMMIT,self.collect)
        self.db.execute("UPDATE candidates SET last_run='wrong'")
        with self.assertRaises(ValueError):verify(self.db)
    def test_export_and_backup(self):
        run(self.db,COMMIT,self.collect);output=Path(self.temp.name)/'export.json';export(self.db,output)
        self.assertEqual(len(json.loads(output.read_text())['catalog']),1)
        copy=sqlite3.connect(Path(self.temp.name)/'backup.db');self.db.backup(copy)
        self.assertEqual(verify(copy),verify(self.db));copy.close()
    def test_failed_search_is_retained(self):
        def failed(previous,run_id):return {'id':run_id,'sourceCommit':COMMIT,'state':'failed','candidates':[]}
        report=run(self.db,COMMIT,failed);self.assertEqual(report['state'],'failed');self.assertEqual(verify(self.db)[0],1)

if __name__=='__main__':unittest.main()
