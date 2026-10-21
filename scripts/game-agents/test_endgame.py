import json
import unittest
from endgame import Encounter, advance, CHOICES
import controller

class EndgameTests(unittest.TestCase):
    def test_every_choice_and_boss_survives_miss_and_reload(self):
        for boss in ('AETIMM', 'APY0C'):
            for weapon in CHOICES:
                with self.subTest(boss=boss, weapon=weapon):
                    s = advance(Encounter('run',boss),'breach',weapon)
                    s = Encounter.load(s.save())
                    self.assertTrue(s.launcher)
                    self.assertEqual(s.selected, weapon)
                    with self.assertRaises(ValueError): advance(s,'breach',CHOICES[-1])
                    s = advance(advance(s,'enter'),'fire')
                    s = Encounter.load(s.save())
                    self.assertEqual(s.warhead,0)
                    with self.assertRaises(ValueError): advance(s,'fire')
                    s = advance(s,'miss')
                    self.assertEqual(s.outcome,'si_victory_player_spared')
                    self.assertEqual(s.squad_alive,3)
                    self.assertFalse(s.run_over)
                    with self.assertRaises(ValueError): advance(s,'core_hit')

    def test_invalid_choice_and_early_entry(self):
        s=Encounter('run','APY0C')
        for event,choice in [('enter',None),('fire',None),('miss',None),('breach','severer'),('breach','unknown')]:
            with self.assertRaises(ValueError): advance(s,event,choice)
        self.assertEqual(s.breach_charge,1)

    def test_hit_and_actual_deaths_are_separate(self):
        s=advance(Encounter('run','AETIMM'),'breach','null_twins')
        s=advance(advance(advance(s,'enter'),'fire'),'core_hit')
        self.assertEqual(s.outcome,'core_hit')
        for _ in range(3): s=advance(s,'squad_death')
        self.assertTrue(s.run_over)
        with self.assertRaises(ValueError): advance(s,'squad_death')

    def test_reject_malformed_save(self):
        original=json.loads(Encounter('run','APY0C').save())
        for field,value in [('selected','discord'),('launcher',True),('warhead',1),('version',2),('squad_alive',-1),('phase','victory')]:
            data=dict(original);data[field]=value
            with self.assertRaises(ValueError): Encounter.load(json.dumps(data))

    def test_both_agents_receive_loadout_contract(self):
        for agent in controller.AGENTS:
            prompt=controller.instructions(agent)
            self.assertIn('Endgame implementation contract:',prompt)
            for weapon in CHOICES: self.assertIn('"'+weapon+'"',prompt)
            self.assertIn('"warheads": 1',prompt)
