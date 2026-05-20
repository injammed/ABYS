# ABYS Product Doctrine

ABYS is a founder-ops intelligence system: a persistent software organism for converting intent into executable product infrastructure.

It should not optimize for myth, vibes, or abstract intelligence theater. It should optimize for shipped artifacts, retained memory, reusable workflows, revenue discovery, and accelerated implementation.

## Core Loop

```text
intent
  -> world signals
  -> council decomposition
  -> scored task graph
  -> Codex handoff packet
  -> implementation artifact
  -> evaluation
  -> memory ledger
  -> next cycle
```

## System Primitives

### 1. WorldSignal
A normalized observation from the user, repository, market, product telemetry, model output, or external system.

Examples:
- A GitHub repo exists and can receive code.
- A competitor launched a feature.
- A user repeatedly asks for a workflow.
- A dashboard metric regressed.

### 2. MemoryEvent
An append-only record of decisions, artifacts, failures, reusable patterns, and strategic observations.

Memory is not chat history. Memory is operational compression.

### 3. ProductTask
A unit of executable leverage. Every task must terminate in one of:
- code
- architecture
- schema
- file
- workflow
- dashboard
- test
- deployment
- monetizable process

### 4. CouncilRole
A bounded reasoning lens used to prevent generic AI output.

Initial roles:
- architect: system shape and interfaces
- operator: execution sequencing and constraints
- market: monetization and demand signals
- ux: interface and user flow
- memory: persistence and retrieval
- critic: failure modes and quality bar
- codex: implementation handoff

### 5. CodexPacket
A structured implementation prompt containing objective, target files, acceptance criteria, tests, and non-goals.

## Near-Term Product Surface

The first monetizable ABYS surface should be a **Founder Ops Cockpit**:

- Task graph ranked by leverage/effort.
- Memory ledger of decisions and artifacts.
- Codex packet generator.
- Market radar inbox.
- Simulation dashboard for product bets.
- Workflow templates for repeatable execution.

## Leverage Rules

ABYS prioritizes work that:

1. Converts unstructured founder intent into executable tasks.
2. Creates reusable memory or schema.
3. Reduces repeated prompting.
4. Produces visible artifacts quickly.
5. Can become a paid workflow, SaaS module, consulting deliverable, or creator tool.

ABYS rejects work that:

1. Produces only grand language.
2. Cannot be tested or shipped.
3. Requires speculative future infrastructure.
4. Adds autonomy without observability.
5. Hides uncertainty behind style.

## First Deployment Architecture

```text
/apps/web                  Next.js dashboard
/packages/kernel           ABYS orchestration engine
/packages/memory           JSONL -> SQLite/Postgres memory adapters
/packages/codex            Codex packet and PR generation
/packages/market-radar     External signal adapters
/packages/sim              Lightweight scenario simulator
```

## Revenue Paths

### Solo Founder Subscription
Persistent AI product operator that remembers decisions, generates tasks, and routes work into code.

### Agency/Consulting Mode
ABYS creates client-specific execution maps, implementation briefs, and artifact trails.

### Creator Tooling
Turn worldbuilding, product concepts, and research archives into structured apps, dashboards, and monetizable IP packages.

### Enterprise Workflow Layer
Memory + task orchestration + model handoffs for teams that want operational continuity across AI sessions.

## Non-Negotiable Product Truth

A successful ABYS cycle ends with a changed repository, a changed dashboard, a saved artifact, a generated workflow, a tested module, or a clearer revenue path.
