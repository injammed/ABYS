# Caechat Selection Rehearsal V0

## Purpose

Prove one real artifact can travel through the complete selection lifecycle:

```txt
private quarantine
→ quarantine revision
→ creator resubmission
→ public Unjudged
→ judgments
→ top-decile nomination
→ selection refinement
→ creator resubmission
→ public Unjudged
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

Apply these migrations in one controlled window:

1. `005_caechat_selection_rehearsal.sql`
2. `006_selection_active_queue_guard.sql`
3. `007_selection_refinement_loop.sql`

Then deploy the matching web commit immediately. Keep issue #72 open until the exact-device rehearsal passes.

Migration `006` serializes nomination starts and blocks another run while any review remains `nominated`, `candidate`, or `refinement`.

Migration `007` makes refinement actionable: the artifact becomes private `needs_revision`, the creator can edit and resubmit it, and the same selection receipt remains open until review concludes.

## Rehearsal artifact

The existing `Jesus Angel’s Spine` fixture may be used while it remains private and owned by the creator account. A new safe fixture may be substituted.

Do not use another creator's production content without permission.

## Exact rehearsal

### 1. Initial quarantine

Creator:

- submit the artifact;
- confirm it appears as `UNJUDGED · PRIVATE PREVIEW` only to the owner;
- confirm anonymous and second-account views cannot see it.

Expected:

```txt
status = quarantine
lane = null
published_at = null
```

### 2. Quarantine revision

Curator:

- open `/curator/`;
- write a specific note;
- choose `Request revision`.

Creator:

- confirm the note appears in lifecycle history;
- edit at least one descriptive field;
- resubmit.

Expected sequence:

```txt
quarantine
→ needs_revision
→ quarantine
```

Expected events:

```txt
submitted
request_revision
resubmitted
```

### 3. First public publication

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

Use at least one real signed-in account for the mechanical rehearsal. Serious calibration requires independent accounts and substantially more judgments.

Record Preserve, Refine, or Slop. Choosing again must replace the prior judgment rather than stacking another vote.

For the first rehearsal, the curator may set the minimum judgment count to `1`. That proves mechanics, not ranking quality.

### 5. Top-decile nomination

Curator:

- open the Caechat selection section on `/curator/`;
- set the minimum judgment count;
- run `Top-decile nomination`.

Eligibility is limited to artifacts that are:

- approved;
- in `unjudged`;
- fully attested for AI origin, safety, and rights;
- at or above the minimum judgment count.

The run snapshots:

- cohort identity and size;
- top-decile count;
- rank;
- Preserve, Refine, and Slop totals;
- total judgments;
- Wilson lower-bound score;
- algorithm version;
- curator identity and timestamp.

A cohort of ten must nominate exactly one artifact. The contract also proves that 8,000 Preserve judgments out of 10,000 outrank 2 out of 2 under the confidence estimate.

Attempting another nomination while this queue remains active must fail with `ACTIVE_SELECTION_REVIEWS_EXIST`.

### 6. Selection refinement

Curator:

- inspect the nomination;
- write a selection-specific note;
- choose `Request refinement`.

Expected:

```txt
artifact status: approved → needs_revision
artifact lane: unjudged → null
published_at: value → null
selection status: nominated → refinement
event: selection_refinement
```

The artifact disappears from the public feed and becomes editable by its creator. The selection queue remains open and shows that creator revision is pending.

Creator:

- confirm the selection-refinement note in history;
- revise the artifact;
- resubmit.

Expected:

```txt
needs_revision → quarantine
```

Curator:

- approve the revised artifact back to Unjudged.

Expected:

```txt
quarantine → approved/unjudged
selection status remains refinement
```

### 7. Candidate review

Curator:

- refresh the selection queue;
- confirm the artifact is again `approved · unjudged`;
- write a new note;
- choose `Mark candidate`.

Expected:

```txt
selection status: refinement → candidate
event: selection_candidate
```

Candidate status alone does not change the artifact lane.

### 8. Museum admission

Curator:

- inspect the candidate again;
- write a second explicit admission note;
- choose `Admit to Museum`.

The database must reject a direct `nominated → museum_admit` attempt.

Expected:

```txt
artifact lane: unjudged → aetimm
selection status: candidate → museum_admitted
event: museum_admit
```

### 9. Museum proof

Device:

- open the Museum;
- confirm the admitted artifact appears in the finite sideways registry;
- slide sideways;
- select the work;
- open the inspection surface;
- close it;
- return to the same room position;
- return to the Slop Feed in one tap.

The immediate registry is capped at 24 positions. It is not an infinite vertical feed.

## Read-only verification queries

Use known IDs. Never paste emails, tokens, signed URLs, or private media paths into public issues.

```sql
select id, title, status, lane, published_at
from public.artifacts
where id = '<artifact-id>'::uuid;
```

```sql
select event_type, lane, note, created_at
from public.artifact_events
where artifact_id = '<artifact-id>'::uuid
order by created_at, id;
```

```sql
select
  id,
  status,
  cohort_rank,
  cohort_size,
  selection_score,
  preserve_count,
  refine_count,
  slop_count,
  total_judgments,
  algorithm_version,
  created_at,
  updated_at
from public.artifact_selection_reviews
where artifact_id = '<artifact-id>'::uuid
order by created_at, id;
```

```sql
select id, cohort_key, min_judgments, cohort_size, top_count, algorithm_version, created_at
from public.selection_runs
where id = '<selection-run-id>'::uuid;
```

```sql
select id, artifact_id, status, created_at
from public.artifact_selection_reviews
where status in ('nominated', 'candidate', 'refinement')
order by created_at, id;
```

## Rollback

Prefer a forward repair. These migrations add evidence tables, serialize selection runs, create an actionable refinement loop, and narrow first publication to Unjudged. They do not delete artifact or vote data.

For an emergency web rollback:

- restore the prior web commit;
- preserve all selection evidence;
- expect the old curator UI's direct lane choices to be rejected by the new database function.

Use a reviewed compensating migration for database rollback. Do not drop selection tables or event history ad hoc.

## Residual limitations

This fold proves lifecycle architecture, not a mature top-10% or top-1% product. It intentionally omits:

- exposure counts;
- similarity and duplicate adjustment;
- anti-collusion weighting;
- provenance weighting beyond eligibility;
- refinement-response scoring;
- category diversity;
- expert review;
- external benchmark coverage;
- top-percentile selection.
