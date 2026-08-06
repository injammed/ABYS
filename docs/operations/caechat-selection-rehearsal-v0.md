# Caechat Selection Rehearsal V0

## Purpose

Prove one real artifact can travel through the complete selection lifecycle:

```txt
private quarantine
→ revision request
→ creator revision
→ resubmission
→ public Unjudged
→ judgments
→ top-decile nomination
→ candidate
→ Museum admission
```

The algorithm nominates. It does not publish, canonize, or admit an artifact to the Museum by itself.

## Prerequisites

Do not activate this fold until all are true:

- migrations `001_social_beta.sql`, `002_curator_submission_loop.sql`, and `003_public_intake_hardening.sql` are confirmed active;
- one trusted account has `profiles.role` set to `curator` or `admin`;
- GitHub OAuth works for the creator account;
- the artifact-media bucket is private;
- the current production commit and database rollback window are recorded;
- the selection contract, typecheck, and static build pass.

## Activation order

1. Apply `supabase/migrations/005_caechat_selection_rehearsal.sql` in the production Supabase SQL editor.
2. Apply `supabase/migrations/006_selection_active_queue_guard.sql` immediately afterward.
3. Confirm both transactions complete without error.
4. Deploy the matching web commit.
5. Open `/curator/` with the trusted curator account.
6. Keep issue #72 open until every step below is verified on a real device.

Migration `006` blocks a second nomination run while any selection remains in `nominated`, `candidate`, or `refinement`. Resolve the active queue before starting another run.

## Rehearsal artifact

The existing `Jesus Angel’s Spine` fixture may be used when it remains private and owned by the creator account. A new safe fixture may be substituted.

Do not use production user content without the creator's permission for a test.

## Exact rehearsal

### 1. Quarantine

Creator:

- submit the artifact;
- confirm it appears as `UNJUDGED · PRIVATE PREVIEW` only while signed into the owning account;
- confirm anonymous and second-account views cannot see it.

Database expectation:

```txt
status = quarantine
lane = null
published_at = null
```

### 2. Revision request

Curator:

- open `/curator/`;
- write a specific note;
- choose `Request revision`.

Creator:

- confirm the note appears in lifecycle history;
- confirm the artifact remains private;
- revise at least one descriptive field;
- resubmit.

Database expectation:

```txt
quarantine
→ needs_revision
→ quarantine
```

Events must include:

```txt
submitted
request_revision
resubmitted
```

### 3. Public Unjudged publication

Curator:

- review the resubmission;
- choose `Approve → publish Unjudged`.

Expected:

```txt
status = approved
lane = unjudged
published_at != null
```

The first-pass curator interface must not offer direct AETIMM publication.

Anonymous device:

- confirm the artifact appears in the Slop Feed;
- confirm voting is unlocked.

### 4. Judgment evidence

Use at least one real signed-in account for the production rehearsal. For serious calibration, use independent accounts and substantially more judgments.

Record Preserve, Refine, or Slop. Choosing again must replace the prior judgment rather than stacking another vote.

The v0 selection cohort requires the configured minimum judgment count. For the first production rehearsal, the curator may set the minimum to `1`. This does not establish production-quality ranking.

### 5. Top-decile nomination

Curator:

- open the Caechat selection section on `/curator/`;
- set the minimum judgment count;
- run `Top-decile nomination`.

The function considers only artifacts that are:

- approved;
- in `unjudged`;
- fully attested for AI origin, safety, and rights;
- at or above the minimum judgment count.

The run snapshots:

- cohort identity;
- cohort size;
- top-decile count;
- rank;
- Preserve, Refine, and Slop totals;
- total judgments;
- Wilson lower-bound score;
- algorithm version;
- curator identity and timestamp.

The deterministic contract proves that a cohort of ten nominates exactly one artifact and that 8,000 Preserve judgments out of 10,000 outrank 2 out of 2 under the confidence estimate.

Attempting another nomination while the queue is active must fail with `ACTIVE_SELECTION_REVIEWS_EXIST`.

### 6. Candidate review

Curator:

- inspect the nomination evidence;
- write a note;
- choose `Mark candidate`.

Expected event:

```txt
selection_candidate
```

The artifact remains publicly Unjudged. Candidate status alone does not change its lane.

### 7. Museum admission

Curator:

- inspect the candidate again;
- write a second explicit admission note;
- choose `Admit to Museum`.

The database rejects Museum admission unless the selection review is already in `candidate` state.

Expected:

```txt
artifact lane: unjudged → aetimm
selection status: candidate → museum_admitted
event: museum_admit
```

### 8. Museum proof

Device:

- open the Museum;
- confirm the admitted artifact appears in the finite sideways registry;
- select it;
- open the inspection surface;
- close it;
- return to the same room position;
- return to the Slop Feed in one tap.

The Museum registry is capped at 24 immediate room positions in this fold. It is not an infinite vertical feed.

## Read-only verification queries

Use known IDs and do not paste user emails, tokens, signed URLs, or private media paths into public issues.

Artifact state:

```sql
select id, title, status, lane, published_at
from public.artifacts
where id = '<artifact-id>'::uuid;
```

Lifecycle history:

```sql
select event_type, lane, note, created_at
from public.artifact_events
where artifact_id = '<artifact-id>'::uuid
order by created_at, id;
```

Selection receipt:

```sql
select
  reviews.id,
  reviews.status,
  reviews.cohort_rank,
  reviews.cohort_size,
  reviews.selection_score,
  reviews.preserve_count,
  reviews.refine_count,
  reviews.slop_count,
  reviews.total_judgments,
  reviews.algorithm_version,
  reviews.created_at,
  reviews.updated_at
from public.artifact_selection_reviews reviews
where reviews.artifact_id = '<artifact-id>'::uuid
order by reviews.created_at, reviews.id;
```

Run denominator:

```sql
select id, cohort_key, min_judgments, cohort_size, top_count, algorithm_version, created_at
from public.selection_runs
where id = '<selection-run-id>'::uuid;
```

Active queue check:

```sql
select id, artifact_id, status, created_at
from public.artifact_selection_reviews
where status in ('nominated', 'candidate', 'refinement')
order by created_at, id;
```

## Rollback

Prefer a forward repair. The migrations add evidence tables, guard repeated runs, and narrow first publication to Unjudged; they do not delete artifact or vote data.

For an emergency web rollback:

- restore the prior web commit;
- do not delete selection evidence;
- understand that the older curator UI may attempt direct lane choices that the new database function rejects.

For a database rollback, create a reviewed compensating migration. Do not drop selection tables or event history ad hoc from the dashboard.

## Residual limitations

This fold does not establish a mature top-10% or top-1% product. It intentionally omits:

- exposure counts;
- similarity and duplicate adjustment;
- anti-collusion weighting;
- provenance weighting beyond eligibility;
- refinement-response scoring;
- category diversity;
- expert review;
- external benchmark coverage;
- top-percentile selection.

Its purpose is to prove the lifecycle architecture and create real evidence for the next folds.
