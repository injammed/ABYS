# Steel-Folding Product Loop

## Objective

Turn the AETIMM / SLOP TROUGH website from a conceptually complete prototype into a reliable human-interaction product without derailing its identity, scope, or architecture.

The governing method is repeated bounded refinement:

```txt
observe one failure
→ reproduce it
→ isolate the smallest cause
→ repair one layer
→ verify locally
→ deploy
→ verify on the real device
→ record the result
→ repeat
```

## Core Rule

Do not improve the whole website at once.

Every fold must have:

- one primary observed failure;
- one owner issue;
- one focused branch and PR;
- explicit files and non-goals;
- a rollback path;
- automated checks;
- production-device verification.

A fold is not complete when code is merged. It is complete when the original user-observed failure no longer reproduces on `aetimm.com`.

## Roles

### Human field tester

The human tester supplies reality:

- device and browser;
- exact page;
- exact action attempted;
- expected result;
- observed result;
- screenshot or short screen recording;
- whether private browsing changes the result;
- timestamp of the test.

The tester does not need to diagnose the code.

### GPT product/debug lead

GPT:

- classifies the failure layer;
- checks current repository truth;
- prevents duplicate or cross-scope work;
- writes one bounded issue;
- prepares Codex instructions;
- reviews the resulting diff and tests;
- keeps the product sequence coherent.

### Codex implementer

Codex:

- reproduces the issue from the task packet;
- changes only the bounded surface;
- adds or updates a regression test;
- runs required checks;
- opens a focused PR;
- records activation and rollback steps.

### Merge gate

A change may merge only when:

- the failure is reproduced or strongly evidenced;
- the proposed repair addresses the cause rather than hiding the symptom;
- typecheck and build pass;
- the diff does not include unrelated visual, doctrinal, or architectural churn;
- the rollback is understood;
- the production verification step is written before merge.

## Failure Classification

### Layer 0 — Domain / deployment

Symptoms:

- wrong site;
- certificate or DNS failure;
- old deployment;
- missing assets;
- root-domain versus `/ABYS` path mismatch.

### Layer 1 — Client runtime / hydration

Symptoms:

- page renders but all buttons are inert;
- links may work while React controls do not;
- browser console reports chunk, hydration, or runtime errors;
- static HTML is visible but state never changes.

### Layer 2 — configuration

Symptoms:

- controls show `Accounts soon` or `Uploads soon`;
- Supabase client is disabled;
- redirects fail;
- production variables were absent during build.

### Layer 3 — authentication

Symptoms:

- form opens but account creation/sign-in fails;
- confirmation email or redirect does not complete;
- session disappears on refresh.

### Layer 4 — database / storage / RLS

Symptoms:

- upload begins but insert fails;
- media upload succeeds but artifact row fails;
- creator cannot read their own quarantine record;
- policy errors appear.

### Layer 5 — interaction state

Symptoms:

- vote appears but does not persist;
- account state leaks across users;
- duplicate submit;
- stale loading state;
- UI reports the wrong lifecycle state.

### Layer 6 — usability

Symptoms:

- technically functional but hard to discover;
- mobile panel overflow;
- ambiguous labels;
- inadequate progress, success, or error feedback.

Never start at Layer 6 while Layers 0–5 are failing.

## One-Fold Issue Template

```md
## Observed failure
Device/browser:
Page:
Action:
Expected:
Observed:
Evidence:

## Suspected layer
Domain / hydration / configuration / auth / data / state / usability

## Reproduction
1.
2.
3.

## Bounded repair
Files:
Behavior to change:
Behavior to preserve:

## Regression proof
Automated:
Production-device:

## Non-goals
- no redesign
- no new doctrine
- no unrelated dependency changes

## Rollback
Exact revert or feature-disable path.
```

## Production Verification Card

Each deployed fold ends with:

```txt
commit SHA:
deployment time:
device/browser:
original reproduction:
result after deployment:
console/network errors:
pass / fail / partial:
next issue:
```

## Current Product Sequence

```txt
1. restore reliable client interaction/hydration
2. prove account creation and persistent session
3. prove private upload and creator-visible quarantine
4. implement secure curator publication
5. prove public artifact voting and vote replacement
6. repair pagination and account-state edge cases
7. refine mobile interface and feedback
8. repeat with real users
```

## Compression

The concept is already strong enough.

The next value comes from boring repetition:

```txt
one failure
one repair
one proof
```

Fold the steel without changing the sword every time.
