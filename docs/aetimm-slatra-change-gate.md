# AETIMM / SLOP TROUGH Change Gate

## Purpose

The product must apply its own judgment system to its own development.

Every proposed website or application change is classified before implementation or merge:

```txt
AETIMM
REFINE
SLOP
```

## AETIMM Change

A change may be classified AETIMM only when all of the following are true:

- solves a confirmed user-visible defect or unlocks a required product capability
- has clear evidence and a narrow objective
- preserves the current product identity and hierarchy
- is reversible
- has a bounded diff
- passes typecheck, build, and relevant tests
- introduces no hidden privacy, safety, moderation, or provenance regression
- is more valuable than leaving the current system unchanged

Examples:

- broken authentication fixed
- upload quarantine enforced correctly
- persistent voting repaired
- mobile overflow removed
- inaccessible control corrected
- incorrect metadata or manifest repaired
- confirmed performance defect reduced

## REFINE Change

A change is REFINE when it may be useful but is not sufficiently proven, scoped, tested, or necessary.

REFINE changes are not merged.

They may become:

- an issue
- a prototype branch
- a test case
- a measurement plan
- a later candidate after evidence appears

Examples:

- promising feed ranking idea without real data
- copy change based only on taste
- new feature lacking a clear user need
- architecture improvement without a present bottleneck
- visual polish that may disturb an already coherent design

## SLOP Change

A change is SLOP when it creates churn without durable product value.

SLOP changes are rejected, closed, or removed.

Examples:

- redesigning a screen that already works
- broad copy rewriting for novelty
- adding dependencies for convenience
- duplicating existing functionality
- speculative backend complexity
- feature expansion outside the current milestone
- engagement mechanics that reward mindless activity
- hiding weak provenance behind confident labels
- changing routes, names, or identity without explicit user instruction
- multiple unrelated edits bundled into one PR

## Required Evidence

Every candidate change must record:

```txt
problem observed
user impact
evidence
smallest viable fix
files changed
risk
rollback path
verification result
classification
```

## Merge Law

```txt
AETIMM → may merge after verification
REFINE → document, test, or defer
SLOP → reject or delete
```

No-change is always valid.

When the current experience is coherent and healthy, preservation outranks activity.

## Daily Change Limit

For autonomous website maintenance:

- at most one candidate change per 24 hours
- at most 3 files
- at most 120 net changed lines
- no new dependencies
- no redesign
- no route restructuring
- no rebranding
- no speculative feature expansion

Confirmed security, data-loss, moderation, deployment, or authentication defects may exceed these limits only when the exception is explicitly documented.

## Social Beta Exception

The accounts, uploads, persistent votes, moderation quarantine, and real infinite-feed milestone is a deliberate product capability expansion tracked separately in ABYS issue #27 and draft PR #28.

That work must still pass this gate before merge:

- security model reviewed
- Supabase migration applied in a controlled project
- test account completes sign-up, upload, approval, feed, and vote replacement
- anonymous access behaves correctly
- no service-role key reaches browser code
- current ST root and AETIMM museum identity remain intact

## Final Rule

The system does not improve by changing constantly.

It improves by preserving AETIMM-class changes, refining uncertain changes, and refusing its own slop.
