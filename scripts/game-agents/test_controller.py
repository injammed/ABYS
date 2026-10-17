import json
import subprocess
import unittest
from unittest.mock import patch
import controller as c

class ControllerTests(unittest.TestCase):
    def setUp(self):
        self.db = c.connect(':memory:')
        self.job = c.enqueue(self.db, 'AETIMM', 'Test material coupon', 'revision-sha', 'source context')
    def tearDown(self):
        self.db.close()
    def worker(self, argv, **kwargs):
        req = json.loads(kwargs['input'])
        self.assertFalse(req['delegation'])
        self.assertEqual(req['tools'], [])
        self.assertEqual(req['allowed_agents'], ['AETIMM', 'APY0C'])
        result = dict(agent=req['agent'], stage=req['stage'], summary='Proposal', patch='',
                      evidence=['source context'], verdict='proposed' if req['stage']=='author' else 'accept')
        return subprocess.CompletedProcess(argv, 0, json.dumps(result), '')
    @patch('controller.subprocess.run')
    def test_two_stage_persistent_review(self, run):
        run.side_effect = self.worker
        self.assertEqual(c.run_one(self.db,self.job,['trusted-adapter']), 'review_pending')
        self.assertEqual(c.run_one(self.db,self.job,['trusted-adapter']), 'ready_for_verification')
        with self.assertRaises(ValueError): c.run_one(self.db,self.job,['trusted-adapter'])
        self.assertEqual(run.call_count, 2)
        self.assertEqual(self.db.execute('SELECT count(*) FROM worker_lock').fetchone()[0],0)
    def test_third_identity_rejected(self):
        with self.assertRaises(ValueError): c.enqueue(self.db,'planner','task','rev','')
    def test_spoof_and_extra_fields_rejected(self):
        r=dict(agent='APY0C',stage='author',summary='',patch='',evidence=[],verdict='proposed')
        with self.assertRaises(ValueError): c.validate_result(r,'AETIMM','author')
        r['agent']='AETIMM';r['delegate']='third'
        with self.assertRaises(ValueError): c.validate_result(r,'AETIMM','author')
    def test_self_approval_and_missing_evidence_rejected(self):
        r=dict(agent='AETIMM',stage='author',summary='',patch='',evidence=[],verdict='accept')
        with self.assertRaises(ValueError): c.validate_result(r,'AETIMM','author')
        r.update(agent='APY0C',stage='review')
        with self.assertRaises(ValueError): c.validate_result(r,'APY0C','review')
    @patch('controller.subprocess.run', side_effect=RuntimeError('provider failed'))
    def test_failure_blocks_without_retry(self, run):
        with self.assertRaises(RuntimeError): c.run_one(self.db,self.job,['adapter'])
        self.assertEqual(self.db.execute('SELECT state FROM jobs').fetchone()[0],'blocked')
        self.assertEqual(run.call_count,1)
    def test_lock_prevents_second_worker(self):
        self.db.execute('INSERT INTO worker_lock VALUES(1,?)',(self.job,));self.db.commit()
        with self.assertRaises(Exception): c.run_one(self.db,self.job,['adapter'])
        self.assertEqual(self.db.execute('SELECT count(*) FROM worker_lock').fetchone()[0],1)

if __name__=='__main__': unittest.main()
