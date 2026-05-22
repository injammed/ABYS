import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "abys-task-packet.schema.json"
EXAMPLE_PATH = ROOT / "examples" / "task-packets" / "abys-task-packet.example.json"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validator() -> Draft202012Validator:
    schema = load_json(SCHEMA_PATH)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def test_example_task_packet_validates() -> None:
    example = load_json(EXAMPLE_PATH)
    errors = sorted(validator().iter_errors(example), key=lambda error: error.path)
    assert errors == []


def test_unknown_target_repo_is_rejected() -> None:
    example = load_json(EXAMPLE_PATH)
    example["routing_decision"]["target_repo"] = "UNKNOWN"

    errors = list(validator().iter_errors(example))

    assert errors
    assert any("UNKNOWN" in str(error.message) for error in errors)


@pytest.mark.parametrize("field", ["deliverables", "codex_actions"])
def test_required_execution_lists_cannot_be_empty(field: str) -> None:
    example = load_json(EXAMPLE_PATH)
    example[field] = []

    errors = list(validator().iter_errors(example))

    assert errors
    assert any("should be non-empty" in str(error.message) or "too short" in str(error.message) for error in errors)
