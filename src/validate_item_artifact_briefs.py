#!/usr/bin/env python3
"""Validate ITEM artifact brief JSON files.

This validator is intentionally dependency-light. It checks the required fields,
VMS class membership, and anti-slop constraints that plain JSON Schema cannot
fully express without extra tooling.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

REQUIRED_FIELDS = [
    "unit_name",
    "vms_class",
    "denomination_relation",
    "substrate",
    "issuance_logic",
    "anti_entropy_claim",
    "use_case",
    "visual_grammar",
    "provenance",
    "veto_risks",
]

VALID_VMS_CLASSES = {"Vacuo", "Mute", "Singulus"}
GENERIC_VISUAL_PHRASES = {
    "cool coin",
    "sci fi coin",
    "sci-fi coin",
    "glowing coin",
    "gold token",
    "crypto token",
    "fantasy coin",
}


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"{path}: invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError(f"{path}: top-level JSON value must be an object")
    return data


def nonempty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate_brief(path: Path) -> list[str]:
    data = load_json(path)
    errors: list[str] = []

    for field in REQUIRED_FIELDS:
        if field not in data:
            errors.append(f"missing required field: {field}")
        elif field != "veto_risks" and not nonempty_string(data[field]):
            errors.append(f"field must be a non-empty string: {field}")

    vms_class = data.get("vms_class")
    if vms_class not in VALID_VMS_CLASSES:
        errors.append(f"vms_class must be one of {sorted(VALID_VMS_CLASSES)}")

    veto_risks = data.get("veto_risks")
    if not isinstance(veto_risks, list) or not veto_risks:
        errors.append("veto_risks must be a non-empty list")
    elif not all(nonempty_string(item) for item in veto_risks):
        errors.append("every veto_risks item must be a non-empty string")

    visual = str(data.get("visual_grammar", "")).lower()
    if visual.strip() in GENERIC_VISUAL_PHRASES:
        errors.append("visual_grammar is generic slop; specify substrate, geometry, hierarchy, and VMS meaning")

    explanation_parts = [
        str(data.get("denomination_relation", "")),
        str(data.get("issuance_logic", "")),
        str(data.get("anti_entropy_claim", "")),
    ]
    explanation = " ".join(explanation_parts).lower()
    if not any(term.lower() in explanation for term in VALID_VMS_CLASSES):
        if not any(term in explanation for term in ["scarcity", "memory", "exchange", "reserve", "relay", "issuance"]):
            errors.append("brief does not explain itself as a VMS value transformation")

    return errors


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Validate ITEM artifact brief JSON files.")
    parser.add_argument("paths", nargs="+", type=Path, help="JSON files or directories to validate")
    args = parser.parse_args(argv)

    files: list[Path] = []
    for path in args.paths:
        if path.is_dir():
            files.extend(sorted(path.glob("*.json")))
        else:
            files.append(path)

    if not files:
        print("No JSON files found.", file=sys.stderr)
        return 2

    failed = False
    for file_path in files:
        try:
            errors = validate_brief(file_path)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            failed = True
            continue

        if errors:
            failed = True
            print(f"FAIL {file_path}", file=sys.stderr)
            for error in errors:
                print(f"  - {error}", file=sys.stderr)
        else:
            print(f"PASS {file_path}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
