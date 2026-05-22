import json
from pathlib import Path

import jsonschema


ROOT = Path(__file__).resolve().parents[1]


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def test_routing_rule_examples_validate():
    schema = load_json(ROOT / "schemas" / "repo-routing-rule.schema.json")
    rule_paths = sorted((ROOT / "examples" / "routing-rules").glob("*.rules.json"))

    assert rule_paths

    for path in rule_paths:
        jsonschema.validate(load_json(path), schema)


def test_repo_roles_are_fixed():
    expected_roles = {
        "injammed/ITEM": "artifact_canon",
        "injammed/ABYS": "execution_machine",
        "injammed/SYNTEL": "m2m_protocol",
    }

    for path in sorted((ROOT / "examples" / "routing-rules").glob("*.rules.json")):
        rule = load_json(path)
        assert rule["role"] == expected_roles[rule["repo"]]
