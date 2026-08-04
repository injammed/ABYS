# AETIMM / SLATRA Feed MVP

This is the smallest deployable expression of the ITEM Museum / Slop Trough product:

- AI-made or materially AI-transformed submissions only
- creator attestation and provenance notes
- infinite-scroll synthetic media feed
- AETIMM / Refine / SLATRA judgment controls
- twin-door product identity
- installable web-app manifest
- health endpoint

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run typecheck
npm run build
```

## Current prototype boundaries

The feed, upload form, and judgments are local UI state. Supabase persistence, authentication, moderation, provenance verification, and ITEM canon synchronization are the next implementation layer.

AI-origin classification cannot rely on a perfect detector. The production policy combines creator attestation, generation records, metadata, source review, and enforcement against deceptive submissions.
