# SPDX-License-Identifier: MIT
import hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('supervise',Path(__file__).with_name('supervise.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class SupervisionTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.original=module.ROOT;module.ROOT=self.root
        (self.root/'apps/item-web/public/apyoc').mkdir(parents=True);(self.root/'scripts/apyoc').mkdir(parents=True);(self.root/'model').mkdir()
        (self.root/'model/model.safetensors').write_bytes(b'test data only')
        digest=hashlib.sha256(b'test data only').hexdigest()
        self.machine={'enabled':True,'id':'apyoc-selector-001','modelRevision':'1'*40,'weightsSha256':digest,'model':'test-model','targets':['home','eye','shop'],'policy':'fixed-head-selection-v1','maximumRequestsPerRun':4}
        self.write_machine()
        (self.root/'scripts/apyoc/model-lock.json').write_text(json.dumps({'model':'test-model','revision':'1'*40,'files':{'model.safetensors':digest}}))
        self.calls=[]
    def tearDown(self):module.ROOT=self.original;self.temp.cleanup()
    def write_machine(self):(self.root/'apps/item-web/public/apyoc/machine.json').write_text(json.dumps(self.machine))
    def probe(self,target):self.calls.append(target);return 503 if target=='eye' else 200
    def run_worker(self,infer):return module.supervisor(self.root/'run',self.root/'model','python',probe=self.probe,infer=infer)
    def test_complete_and_visible_disagreement(self):
        record=self.run_worker(lambda rows:{'target':'home','probabilities':[0.8,0.1,0.1],'inferenceMs':1})
        self.assertEqual(record['state'],'completed');self.assertEqual(self.calls,['home','eye','shop','home']);self.assertFalse(record['decision']['agrees'])
        self.assertEqual([e['sequence'] for e in record['events']],list(range(1,13)))
        self.assertEqual(len([e for e in record['events'] if e['phase']=='check-intent']),4)
    def test_reject_unknown_fields_and_targets(self):
        for bad in [{'target':'https://private.invalid','probabilities':[1,0,0],'inferenceMs':1},{'target':'home','probabilities':[1,0,0],'inferenceMs':1,'prompt':'PRIVATE'}]:
            self.calls=[];record=self.run_worker(lambda rows:bad)
            self.assertEqual(record['state'],'inference-failed');self.assertEqual(len(self.calls),3);self.assertIsNone(record['decision']);self.assertNotIn('PRIVATE',json.dumps(record))
    def test_inference_error_is_fail_closed(self):
        def fail(rows):raise RuntimeError('PRIVATE diagnostic')
        record=self.run_worker(fail);self.assertEqual(len(self.calls),3);self.assertEqual(record['state'],'inference-failed');self.assertNotIn('PRIVATE',json.dumps(record))
    def test_revoked_registration_makes_no_requests(self):
        self.machine['enabled']=False;self.write_machine();record=self.run_worker(lambda rows:None)
        self.assertEqual(record['state'],'disabled');self.assertEqual(self.calls,[])
    def test_missing_model_makes_no_selected_request(self):
        (self.root/'model/model.safetensors').unlink();record=self.run_worker(lambda rows:None)
        self.assertEqual(len(self.calls),3);self.assertEqual(record['state'],'inference-failed')
    def test_journal_failure_prevents_requests(self):
        (self.root/'run/journal.jsonl').mkdir(parents=True)
        with self.assertRaises(IsADirectoryError):self.run_worker(lambda rows:None)
        self.assertEqual(self.calls,[])
if __name__=='__main__':unittest.main()
