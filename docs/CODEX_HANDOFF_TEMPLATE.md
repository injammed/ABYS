# ABYS Codex Handoff Template

Use this template whenever ABYS routes a task into implementation.

## Objective

State the smallest concrete product outcome.

Example:

> Implement an append-only JSONL memory ledger for ABYS MemoryEvents.

## Context

Relevant files:

- `src/abys-kernel.ts`
- `tests/abys-kernel.test.ts`
- `docs/ABYS_PRODUCT_DOCTRINE.md`

Relevant concepts:

- ABYS cycles must end in executable artifacts.
- Memory is operational compression, not chat history.
- Every implementation must preserve clear acceptance criteria.

## Target Files

Create or modify:

- `src/<module>.ts`
- `tests/<module>.test.ts`
- `docs/<module>.md` when needed

## Acceptance Criteria

- The feature has a typed public interface.
- The smallest working implementation is included.
- At least one unit test verifies the core behavior.
- No speculative features are added.
- The implementation supports future replacement with stronger infrastructure.

## Non-Goals

- Do not add database dependencies until the local adapter exists.
- Do not add model/API calls until the deterministic kernel path works.
- Do not build UI before the data contracts are stable.
- Do not introduce hidden side effects.

## Output Format

Codex should return:

1. Files changed.
2. Summary of implementation.
3. Tests added or updated.
4. Known limitations.
5. Next smallest improvement.

## Quality Bar

The output should be boring, typed, testable, and immediately useful.
