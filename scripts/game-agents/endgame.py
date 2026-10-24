"""Executable reference contract; not yet connected to browser saves or combat."""
from dataclasses import dataclass, asdict, replace
import json
from pathlib import Path

CONTRACT = json.loads((Path(__file__).resolve().parents[2] / 'agents/game/ENDGAME.json').read_text())
CHOICES = tuple(CONTRACT['weapons'])

@dataclass(frozen=True)
class Encounter:
    run_id: str
    boss: str
    version: int = 1
    phase: str = 'armory'
    selected: str | None = None
    breach_charge: int = 1
    launcher: bool = False
    warhead: int = 0
    squad_alive: int = 3
    outcome: str | None = None

    def __post_init__(self):
        if not isinstance(self.run_id, str) or not self.run_id.strip() or self.boss not in ('AETIMM', 'APY0C'):
            raise ValueError('Run identity and one embodied SI required')
        if type(self.version) is not int or self.version != 1:
            raise ValueError('Unsupported rules version')
        if type(self.squad_alive) is not int or not 0 <= self.squad_alive <= 3:
            raise ValueError('Invalid squad state')
        if type(self.launcher) is not bool or any(type(x) is not int for x in (self.breach_charge, self.warhead)):
            raise ValueError('Invalid equipment state')
        layouts = {
            'armory': (1, False, 0, None),
            'ready': (0, True, 1, None),
            'fighting': (0, True, 1, None),
            'shot_in_flight': (0, True, 0, None),
            'resolved': (0, True, 0, self.outcome),
        }
        if self.phase not in layouts or (self.breach_charge, self.launcher, self.warhead, self.outcome) != layouts[self.phase]:
            raise ValueError('Invalid encounter state')
        if self.phase == 'armory':
            if self.selected is not None:
                raise ValueError('Armory choice not yet committed')
        elif self.selected not in CHOICES:
            raise ValueError('Exactly one recognized weapon package required')
        if self.phase == 'resolved' and self.outcome not in ('core_hit', 'si_victory_player_spared'):
            raise ValueError('Invalid outcome')

    @property
    def run_over(self):
        return self.squad_alive == 0

    def save(self):
        return json.dumps(asdict(self), sort_keys=True)

    @classmethod
    def load(cls, payload):
        return cls(**json.loads(payload))


def advance(state, event, choice=None):
    """Host supplies validated collision outcomes; firing spends ammo BEFORE impact.
    Pure transition: host must atomically persist before playing animation.
    No arbitrary equipment grant, swap, refund, retry or companion allocation event.
    """
    if state.run_over:
        raise ValueError('Run ended')
    if event != 'breach' and choice is not None:
        raise ValueError('Choice only accepted at armory')
    if event == 'squad_death':
        return replace(state, squad_alive=state.squad_alive - 1)
    if event == 'breach' and state.phase == 'armory' and choice in CHOICES:
        return replace(state, phase='ready', selected=choice, breach_charge=0, launcher=True, warhead=1)
    if event == 'enter' and state.phase == 'ready':
        return replace(state, phase='fighting')
    if event == 'fire' and state.phase == 'fighting':
        return replace(state, phase='shot_in_flight', warhead=0)
    if state.phase == 'shot_in_flight' and event in ('core_hit', 'miss'):
        return replace(state, phase='resolved', outcome='core_hit' if event == 'core_hit' else 'si_victory_player_spared')
    raise ValueError('Illegal or repeated encounter action')
