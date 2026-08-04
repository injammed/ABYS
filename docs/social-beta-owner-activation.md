# Social Beta Owner Activation

## Goal

Enable the first real user loop on `aetimm.com`:

```txt
create account
→ set display name
→ upload one AI-made image
→ see it in My Uploads
→ keep it private in quarantine until moderation
```

## One-time Supabase setup

1. Create a dedicated Supabase project for AETIMM / SLOP TROUGH.
2. Open the SQL editor and run:

```txt
supabase/migrations/001_social_beta.sql
```

3. In Supabase Auth settings, add the production site URL:

```txt
https://aetimm.com
```

4. Copy the project URL and browser-safe publishable key from the Supabase dashboard.

Never use a secret key or service-role key in the browser application.

## GitHub repository variables

In `injammed/ABYS`:

```txt
Settings
→ Secrets and variables
→ Actions
→ Variables
```

Create:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

The legacy variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` is supported only as a fallback.

## Activation sequence

1. Apply the migration.
2. Add the two repository variables.
3. Re-run CI on draft PR #28.
4. Mark PR #28 ready only after the controlled test succeeds.
5. Merge PR #28.
6. Run the Pages deployment in `custom-domain-root` mode.
7. Verify the live site.

## Required controlled test

```txt
create account
→ confirm email if enabled
→ sign in
→ edit display name
→ refresh and confirm session persists
→ upload a JPEG, PNG, WebP, or GIF under 10 MB
→ confirm it appears under My Uploads as In private quarantine
→ confirm it is absent from the public feed
```

Do not publish user uploads until a trusted moderation path is in place.
