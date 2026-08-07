# Universal Artifact Intake V1 — Production Rehearsal

## Purpose

Prove the full creator journey for one artifact identity containing one or many modes:

```txt
one intake
→ one Artifact ID
→ one or many ordered parts
→ private quarantine
→ complete curator inspection
→ public Unjudged
→ Slop Feed
→ judgment
```

This runbook tests the artifact envelope. It does not claim that every mode already has a rich native renderer.

## Activation gate

Do not activate until:

- migrations `002_curator_submission_loop.sql` and `003_public_intake_hardening.sql` are confirmed active;
- PR #75 contracts, typecheck, and static build pass;
- the current production web commit is recorded;
- a trusted curator account is available;
- the `artifact-media` bucket is private;
- a rollback window is available.

## Activation order

1. Apply `008_universal_artifact_intake.sql` in production Supabase.
2. Confirm the transaction completes without error.
3. Apply `009_universal_artifact_review.sql`.
4. Confirm the transaction completes without error.
5. Deploy the exact matching PR #75 web head.
6. Open aetimm.com on the real device and verify `Submit artifact` appears.
7. Keep issue #74 open until the complete matrix below passes.

Do not deploy the new web intake before the RPC exists. Do not leave the new RPC active for an extended period while the live client still assumes image-only intake.

## Test matrix

Use test content that the uploader owns or has permission to submit.

### A — Image only

Use one USD ITEM image.

Expected:

- one Artifact ID;
- one `image` part;
- creator private preview appears immediately;
- image remains private to creator/curator before publication.

### B — Multiple images as one work

Use two or more related USD ITEM images and describe why they form one artifact.

Expected:

- one Artifact ID, not one ID per image;
- ordered image parts;
- first image becomes the current lead preview;
- curator sees every image part.

### C — Image + text

Upload one image and include a text component explaining an aspect of the work.

Expected modes:

```txt
image · text
```

Expected:

- image preview works;
- text remains escaped text and is never interpreted as markup/code;
- curator sees both components as one artifact.

### D — Text only

Supply only a text component.

Expected:

- no broken image request;
- feed/private preview uses the standard non-image visual field;
- the artifact can still be reviewed and published.

### E — PDF + reference

Upload a safe PDF and provide an HTTPS reference URL.

Expected:

- PDF is stored privately;
- URL is recorded but is not fetched during intake;
- curator receives a signed private file link and a plaintext reference;
- artifact can publish without an image.

### F — Code + data

Upload harmless source code plus a small data/JSON/CSV component.

Expected:

- both files are stored as inert originals;
- no code executes in browser, CI, database, or server as a consequence of upload;
- curator sees file metadata and private links;
- artifact can publish as an ordinary feed object.

## Quarantine proof

For every test artifact before approval:

```txt
status = quarantine
lane = null
published_at = null
```

Anonymous browser:

- cannot discover the artifact row through the public feed;
- cannot read private file objects.

Creator browser:

- sees the private preview;
- sees its Artifact ID;
- cannot vote until publication.

Curator:

- sees the whole-artifact description;
- sees detected modes;
- sees every ordered part;
- can safely inspect evidence without automatic execution or URL fetching.

## Revision proof

Choose at least one artifact and request revision.

Expected:

```txt
quarantine
→ needs_revision
→ creator edit/resubmit
→ quarantine
```

The whole-artifact description and provenance remain attached to the same artifact identity.

Part replacement/versioning is intentionally not implemented in V1; if a file itself must change, record that as a follow-up lineage fold rather than silently replacing evidence.

## Publication proof

For one test artifact, curator chooses:

```txt
Approve → publish Unjudged
```

Database must reject direct first-pass AETIMM/Museum publication.

Expected:

```txt
status = approved
lane = unjudged
published_at != null
```

Anonymous real device:

- artifact appears in the Slop Feed;
- its mode lead is visible;
- if it has an image lead, the image renders;
- if it has no image, no broken image placeholder appears;
- Preserve / Refine / Slop judgment is available.

## Judgment proof

Using a signed-in non-owner account when available:

- cast one judgment;
- refresh;
- confirm the judgment persists;
- choose another judgment;
- confirm it replaces rather than stacks the previous vote.

## Read-only verification queries

Artifact envelope:

```sql
select
  id,
  title,
  artifact_description,
  artifact_modes,
  media_type,
  media_path,
  status,
  lane,
  created_at,
  published_at
from public.artifacts
where id = '<artifact-id>'::uuid;
```

Part manifest:

```sql
select
  position,
  part_kind,
  mode,
  label,
  original_filename,
  mime_type,
  byte_size,
  reference_url,
  created_at
from public.artifact_parts
where artifact_id = '<artifact-id>'::uuid
order by position;
```

Do not paste signed URLs, private storage paths, account IDs, or sensitive submitted text into public GitHub issues.

## Rollback

Prefer a forward repair.

If the web deployment fails after both migrations are applied:

- restore the previous known-good web commit;
- temporarily close intake with `intake_control.intake_open = false` if the old client is incompatible;
- preserve all artifact and part rows;
- repair forward and reopen intake.

Do not drop `artifact_parts`, delete lifecycle evidence, or bulk-delete uploaded originals as an ad hoc rollback.

Any database reversal should be a reviewed compensating migration.

## Pass condition

V1 is complete only when the real production system proves:

```txt
image-only
multi-image
image+text
text-only
PDF+reference
code+data
```

all enter through the same intake, retain one artifact identity, remain private in quarantine, can be completely reviewed, and can publish into Unjudged without an image-only assumption.
