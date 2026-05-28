# Code-Novel Authalien Routing

Authalien is intended for future A2A and M2M coordination, but it can pass through ABYS only as routed work, not as autonomous lore or runtime authority.

## Routing Rule

- ITEM owns Authalien as candidate artifact material.
- ABYS owns validators, task packets, tests, and implementation docs that operate on accepted candidate records.
- SYNTEL owns signed A2A/M2M envelopes or protocol extensions only after ITEM has a candidate record and ABYS has a validator task.

## Current State

Authalien material is candidate-only in ITEM and validator-gated in ABYS. It may be represented as an A2A/M2M payload extension in SYNTEL only when every envelope remains signed, auditable, replayable, and non-autonomous by default.

## ABYS-Allowed Work

ABYS may create:

- task packets for ITEM candidate validation
- schema validators for ITEM records
- tests for route classification
- implementation docs for how a future validator consumes a glyph inventory
- validator tasks proving Authalien routes through ITEM before SYNTEL payload use

ABYS must not create:

- autonomous Authalien runtime behavior
- opaque agent-to-agent execution
- protocol extensions without SYNTEL audit/replay semantics
- canon claims without ITEM judgment

## Validator Gate

An Authalien validator task must require:

1. ITEM candidate record path
2. glyph inventory fixture
3. valid and invalid examples
4. schema validation command
5. route decision proving ITEM handoff rather than SYNTEL auto-routing
