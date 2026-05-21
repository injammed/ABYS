# ABYS Memory Ledger

The ABYS memory ledger is the first persistence layer for the organism.

It stores operational memory as append-only JSONL so ABYS can preserve decisions, artifacts, failures, signals, and reusable patterns across runs without requiring a database.

## Why JSONL First

JSONL is intentionally boring:

- easy to inspect
- easy to diff
- easy to back up
- easy to migrate into SQLite, Postgres, object storage, or a vector database later
- safe enough for local founder-ops workflows

## Default Path

```text
.abys/memory.jsonl
```

Each line is one serialized `MemoryEvent` from `src/abys-kernel.ts`.

## Public Interface

```ts
createJsonlMemoryLedger(path?: string): MemoryLedger
```

```ts
ledger.write(event)
ledger.read()
ledger.query(filter)
```

## Query Filters

```ts
kind?: MemoryEvent["kind"]
minImportance?: number
tag?: string
text?: string
limit?: number
```

## Product Use

The ledger lets ABYS convert isolated AI sessions into retained product intelligence.

Examples:

- Remember that memory persistence was selected as the highest leverage next build.
- Preserve Codex implementation packets.
- Record failed product hypotheses.
- Retain reusable market patterns.
- Feed the future dashboard memory stream.

## Next Upgrade Path

1. Add a deterministic memory compactor.
2. Add a SQLite adapter.
3. Add embeddings only after the deterministic ledger is stable.
4. Expose memory streams in the operator dashboard.
5. Attach MemoryEvents to tasks, Codex packets, PRs, and simulations.
