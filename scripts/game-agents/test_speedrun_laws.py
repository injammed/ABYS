"""Run with python3 scripts/game-agents/test_speedrun_laws.py."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import controller as c


class SpeedrunLawsTests(unittest.TestCase):
    def setUp(self):
        self.base = json.loads((c.ROOT / 'agents/game/SPEEDRUN_LAWS.json').read_text())

    def validate(self, data):
        with tempfile.TemporaryDirectory() as tmp:
            directory = Path(tmp)
            (directory / 'SPEEDRUN_LAWS.json').write_text(json.dumps(data))
            return c.speedrun_contract(directory)

    def test_valid_and_missing_contract(self):
        self.assertEqual(json.loads(self.validate(self.base)), self.base)
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                c.speedrun_contract(Path(tmp))

    def test_every_invariant_cannot_be_disabled_or_removed(self):
        for key in c.SPEEDRUN_INVARIANTS:
            for invalid in (False, 1, 'true', None):
                data = copy.deepcopy(self.base)
                data['invariants'][key] = invalid
                with self.subTest(key=key, invalid=invalid):
                    with self.assertRaises(ValueError):
                        self.validate(data)
            data = copy.deepcopy(self.base)
            del data['invariants'][key]
            with self.assertRaises(ValueError):
                self.validate(data)

    def test_identity_schema_and_empty_laws(self):
        mutations = [('agents', ['AETIMM', 'APY0C', 'third']),
                     ('schema_version', True), ('schema_version', 3),
                     ('laws', []), ('acceptance', ['']),
                     ('assignments', {'AETIMM': ['alone']}),
                     ('release_notes', ''), ('status', 'live')]
        for key, value in mutations:
            data = copy.deepcopy(self.base)
            data[key] = value
            with self.subTest(key=key):
                with self.assertRaises(ValueError):
                    self.validate(data)
        data = copy.deepcopy(self.base)
        data['hidden_override'] = True
        with self.assertRaises(ValueError):
            self.validate(data)

    def test_only_two_difficulty_profiles(self):
        self.assertEqual(set(self.base['difficulties']), {'theatrical', 'hardcore'})
        self.assertIs(self.base['difficulties']['theatrical']['scoreboard'], False)
        self.assertIs(self.base['difficulties']['hardcore']['scoreboard'], True)
        for mode, replacement in [('theatrical', True), ('hardcore', False),
                                  ('hardcore', 1)]:
            data = copy.deepcopy(self.base)
            data['difficulties'][mode]['scoreboard'] = replacement
            with self.assertRaises(ValueError):
                self.validate(data)
        data = copy.deepcopy(self.base)
        data['difficulties']['normal'] = data['difficulties']['theatrical']
        with self.assertRaises(ValueError):
            self.validate(data)
        data = copy.deepcopy(self.base)
        del data['difficulties']['theatrical']
        with self.assertRaises(ValueError):
            self.validate(data)

    def test_both_instruction_bundles_receive_laws(self):
        for agent in c.AGENTS:
            instructions = c.instructions(agent)
            self.assertIn('"freeze_ranked_rules_at_start": true', instructions)
            self.assertIn('Every major traversal', instructions)
            self.assertIn('# ' + agent, instructions)
        with self.assertRaises(ValueError):
            c.instructions('SINGHUL')

    def test_author_and_review_requests_receive_contract(self):
        db = c.connect(':memory:')
        self.addCleanup(db.close)
        job = c.enqueue(db, 'AETIMM', 'bounded prototype', 'pinned-sha', 'context')
        seen = []
        def adapter(*args, **kwargs):
            request = json.loads(kwargs['input'])
            seen.append(request)
            result = dict(agent=request['agent'], stage=request['stage'],
                          summary='test adapter only', patch='',
                          evidence=['test-fixture'],
                          verdict='proposed' if request['stage']=='author' else 'accept')
            return SimpleNamespace(stdout=json.dumps(result))
        with patch.object(c.subprocess, 'run', side_effect=adapter):
            self.assertEqual(c.run_one(db, job, ['fixture']), 'review_pending')
            self.assertEqual(c.run_one(db, job, ['fixture']), 'ready_for_verification')
        self.assertEqual([(r['agent'], r['stage']) for r in seen],
                         [('AETIMM', 'author'), ('APY0C', 'review')])
        self.assertTrue(all('bounded_score_credit' in r['instruction'] for r in seen))
        self.assertEqual(db.execute('SELECT count(*) FROM worker_lock').fetchone()[0], 0)

    def test_invalid_contract_prevents_inference_and_releases_lock(self):
        db = c.connect(':memory:')
        self.addCleanup(db.close)
        job = c.enqueue(db, 'APY0C', 'test', 'revision', '')
        with patch.object(c, 'speedrun_contract', side_effect=ValueError('bad laws')):
            with patch.object(c.subprocess, 'run') as adapter:
                with self.assertRaises(ValueError):
                    c.run_one(db, job, ['fixture'])
                adapter.assert_not_called()
        self.assertEqual(db.execute('SELECT count(*) FROM worker_lock').fetchone()[0], 0)
        self.assertEqual(db.execute('SELECT state FROM jobs').fetchone()[0], 'queued')

    def test_score_rounding_cap_and_terminal_time(self):
        f = c.adjusted_time_ms
        self.assertEqual(f(1620000, 1800000, 1000, 10000, 300000), 1440000)
        self.assertEqual(f(1000, 1, 1, 3, 1000), 1000)
        self.assertEqual(f(1000, 3, 1, 3, 1000), 999)
        self.assertEqual(f(600000, 10**20, 1000, 10000, 300000), 300000)
        self.assertEqual(f(100, 10**20, 1000, 10000, 300000), 0)
        # Once capped, another second spent reaching the terminal costs one second.
        self.assertEqual(f(601000, 10**20, 1000, 10000, 300000) -
                         f(600000, 10**20, 1000, 10000, 300000), 1000)

    def test_score_rejects_invalid_inputs(self):
        for index in range(5):
            for invalid in (-1, True, 1.5, '100', None):
                args = [1000, 10, 1000, 10000, 300000]
                args[index] = invalid
                with self.subTest(index=index, invalid=invalid):
                    with self.assertRaises(ValueError):
                        c.adjusted_time_ms(*args)
        with self.assertRaises(ValueError):
            c.adjusted_time_ms(1000, 10, 1, 0, 500)


if __name__ == '__main__':
    unittest.main()
