# STEEL

> Fold the steel. Do not build sideways.

## North Star

Every change must strengthen one or more of these verbs:

1. Throw Into Trough
2. Scroll Foam
3. Judge
4. Watch History
5. Museum Builds Itself

If a proposed feature does not make one of these objectively better, it waits.

---

## Core Loop

Throw Into Trough
→ Scroll Through Foam
→ Preserve / Refine / Slop
→ Watch the Artifact Change
→ Watch the Museum Build Itself

---

## Release Order

- Upload
- Feed
- Voting
- Artifact Journey
- Foam
- Museum
- Traits
- Lineage
- Foundry

Never skip ahead.

---

## No Sideways Rule

Do not build because an idea is exciting.

Build because the previous fold naturally demands the next one.

---

## Built by Slop

The software is built publicly, iteratively, and with AI assistance.

The engineering must become more rigorous as the culture becomes more playful.

Professional engineering.
Deliberately ridiculous culture.

Built by slop does not mean built sloppily.

The joke only works when the system survives contact with reality.

---

## Anti-Vibe-Code Gates

Every production fold must measurably overcome the common failure modes of AI-generated software.

### Gate 1 — Secret Boundary

No pull request may expose:

- service-role credentials;
- OAuth secrets;
- SMTP credentials;
- private API keys;
- signed private media URLs;
- private user records;
- secret ranking weights or abuse thresholds.

Required proof:

- automated secret-pattern scan;
- review of public environment examples;
- confirmation that browser bundles contain only publishable values;
- immediate credential rotation if exposure is suspected.

### Gate 2 — Authorization Boundary

Authentication is not authorization.

Required proof:

- ordinary users cannot promote themselves;
- creators cannot publish their own artifacts;
- private media remains private;
- privileged transitions execute through database-enforced or server-enforced authority;
- every security-sensitive transition has a negative test for unauthorized callers.

### Gate 3 — Input and Abuse Boundary

Every public input is hostile until validated.

Required proof:

- media type and byte limits;
- normalized text lengths;
- rate or quota enforcement outside the UI;
- safe error messages;
- duplicate, burst, and abuse controls appropriate to the feature;
- emergency intake or feature shutdown path.

### Gate 4 — Dependency Boundary

No hallucinated or casually added package enters production.

Required proof:

- package exists and is maintained;
- necessity is documented;
- lockfile changes are reviewed;
- dependency audit runs;
- avoid a package when the platform or existing dependency already provides the capability.

### Gate 5 — Functional UI Boundary

A visually present control must work.

Required proof for every changed primary flow:

- loading state;
- success state;
- empty state;
- recoverable error state;
- disabled state when action is unavailable;
- keyboard and mobile reachability;
- exact-device production verification for critical flows.

No fake buttons, fake testimonials, fake counters, or decorative controls posing as functionality.

### Gate 6 — Performance Boundary

A polished first frame does not excuse a slow product.

Required proof:

- bundle and route-size changes are inspected;
- media is loaded at an appropriate size and time;
- feed requests are paginated and bounded;
- interaction does not require full-page reloads;
- mobile and constrained-network behavior are tested;
- regressions must have an explicit reason or be rejected.

### Gate 7 — Architecture Boundary

Do not hide complexity inside giant components or opaque generated code.

Required proof:

- security-sensitive logic has a named module or database function;
- UI, data access, scoring, and authorization boundaries remain separable;
- repeated logic is consolidated only after real repetition appears;
- migrations include activation and rollback notes;
- every new state transition is documented.

### Gate 8 — Reality Boundary

No fold is complete because it compiled.

A fold completes only after:

```txt
requirement
→ implementation
→ automated checks
→ deployment
→ production observation
→ human verification
→ evidence recorded
```

The real device, real account, real network, and real database outrank the imagined architecture.

---

## Vibe-Code Scorecard

Each major pull request records:

```txt
Primary strengthened: Upload / Scroll / Vote / History / Museum
Secrets scan: PASS / FAIL
Authorization tests: PASS / FAIL / N-A
Input and abuse controls: PASS / FAIL / N-A
Dependency review: PASS / FAIL / N-A
UI states verified: PASS / FAIL
Typecheck: PASS / FAIL
Build: PASS / FAIL
Bundle impact: improved / neutral / justified regression
Mobile verification: PASS / FAIL / pending
Production verification: PASS / FAIL / pending
Rollback defined: YES / NO
```

A pending production verification may permit a staged merge only when the dormant code cannot weaken current behavior. It does not permit a claim of production completion.

---

## Bug Metabolism

Never waste a bug.

Every meaningful defect must produce at least one durable improvement:

- regression test;
- stronger authorization rule;
- clearer error message;
- simplified component;
- documented invariant;
- monitoring signal;
- safer rollback;
- improved production-verification card.

```txt
bug
→ evidence
→ root cause
→ bounded repair
→ regression protection
→ stronger steel
```

The repository must preserve enough evidence to show how the system learned without exposing private user information.

---

## Orchard Principle

Slop fertilizes the orchard.

The Trough accepts abundance.
The Foam reveals conversation.
The Orchard cultivates signal.
The Museum preserves what endures.

---

## Final Test

A stranger should understand the product within thirty seconds:

Throw something in.
See what everyone else threw in.
Judge it.
Watch what survives.

Everything else is a refinement of those five verbs.
