import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "schemas" / "task-packet.schema.json"
EXAMPLE_DIR = ROOT / "examples" / "task-packets"


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def validator() -> Draft202012Validator:
    schema = load_json(SCHEMA_PATH)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(schema)


def example_packets() -> list[Path]:
    return sorted(EXAMPLE_DIR.glob("*.json"))


def test_all_example_task_packets_validate() -> None:
    paths = example_packets()
    assert paths, "expected at least one task packet example"

    packet_validator = validator()
    for path in paths:
        errors = sorted(packet_validator.iter_errors(load_json(path)), key=lambda error: error.path)
        assert errors == [], f"{path} failed validation: {errors}"


def test_unknown_route_is_rejected() -> None:
    example = load_json(example_packets()[0])
    example["routing_decision"]["route"] = "UNKNOWN"

    errors = list(validator().iter_errors(example))

    assert errors
    assert any("UNKNOWN" in str(error.message) for error in errors)


def test_unknown_target_repo_is_rejected() -> None:
    example = load_json(example_packets()[0])
    example["routing_decision"]["target_repo"] = "UNKNOWN"

    errors = list(validator().iter_errors(example))

    assert errors
    assert any("UNKNOWN" in str(error.message) for error in errors)


@pytest.mark.parametrize("field", ["assumptions", "files", "implementation_steps", "validation", "risks_blockers"])
def test_required_execution_lists_cannot_be_empty(field: str) -> None:
    example = load_json(example_packets()[0])
    example[field] = []

    errors = list(validator().iter_errors(example))

    assert errors
    assert any("should be non-empty" in str(error.message) or "too short" in str(error.message) for error in errors)


def test_terminal_output_rejects_opaque_execution() -> None:
    example = load_json(example_packets()[0])
    example["terminal_output"] = "opaque_a2a_execution"

    errors = list(validator().iter_errors(example))

    assert errors
    assert any("opaque_a2a_execution" in str(error.message) for error in errors)
