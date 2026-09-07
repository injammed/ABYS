# AETIMM gallery redesign — September 2026

## Request and evidence

The owner explicitly directed this work in the new aetimm prod thread:

1. Classy, extravagant, mesmerizing, modern and intelligent UI/UX.
2. Preserve UPLOAD · SCROLL · VOTE · SHOP.
3. Evolve the dark-mode machine insanity into its next intelligent style.
4. Add a 3D+ virtual field with 10,000 yards of depth.
5. Keep uploaded material completely uninterrupted in the Trough; design
   Shop and the other pages around natural user flow.
6. Continue using the existing GitHub and site-service connections.

The live site and main at `800adb5a45cd84afc13a7548d7aebd931befdedf`
showed all-word glyph substitution, a six-control mobile dock, and the
literature shop mixed into the Museum. The requested redesign supersedes
those visual choices. It does not supersede release gates.

## Result

- Root and `/slop-trough/` open directly into uploaded work. No hero,
  promotional insert, edition card or sidebar. Full image contents are
  contained rather than cropped. Backend absence no longer fabricates work
  or pretends that local votes were saved.
- A persistent four-action dock invokes the existing upload component,
  returns to the field, focuses a Slop/Museum ballot, or opens Shop.
- Shared header keeps the equal Trough/Museum choices, account, About and
  persistent appearance preference. Both themes have stable readable text.
- `/shop/` presents the existing five-page digital Diamond Tesseract paper,
  $10 USD price and unchanged Stripe Payment Link. Generated concept art is
  clearly identified. The sports car remains non-orderable concept work.
- `/aetimm/#shop` remains compatible through a fragment-specific redirect.
  The Museum itself retains Summit, permanent accession and empty/loading/
  error states, with contextual collection and Shop links.
- Obsidian/platinum dark surfaces and crisp light surfaces share typography,
  spacing and focus states. The virtual 9,144-metre projection is an inert
  background, with on-demand pointer/scroll parallax and reduced-motion
  support. It never moves controls or intercepts gestures. The machine
  signature is decorative and opt-in, outside uploaded work.

## Boundaries and classification

This is an explicit owner-directed design change, not autonomous daily
maintenance. It is one coherent interface objective; no dependencies,
authentication persistence paths, RLS, RPCs, storage permissions, moderation
rules, financial settings or service credentials are changed.

Classification: REFINE pending release verification. The requested interface
is implemented, but it must not be merged as AETIMM until the existing
production acceptance gate passes. In particular, a successful static build
is not evidence that an authenticated upload reached the public feed.

## Verification

- Typecheck: PASS with public Supabase environment variables absent.
- Production static export: PASS, including `/shop/` and existing routes.
- All 19 existing interface/behavior contract scripts: PASS. Tests for the
  superseded all-word mutation and old dock location now enforce the owner's
  new readable controls, uninterrupted feed and separate Shop requirements.
- Exported route/link and Shop artwork checks: PASS.
- Dependency installation: network installation was unavailable; validation
  reused the existing local Next 16.3.3/React runtime from prior site work.
- GitHub CI on the final commit: must pass real jobs before merge.
- Real-device visual/browser QA, signed-in one-image and multi-image SEND
  SLOP (sending state plus public-feed receipt): pending.
- Live Stripe purchase: not performed. Existing checkout URL is preserved.
- Service connection checks: GitHub authenticated as injammed with push
  permission; Aetimm Supabase active/healthy; Aetimm live Stripe account
  available; Vercel responds with no teams.

## Risks and rollback

Primary risks are mobile sheet positioning, backdrop/canvas differences
between browsers, auth continuity across the new Shop route, and first-use
upload/vote behavior. Those require the existing real-device acceptance
checks. No database migration or data rewrite is part of this change.

Rollback: revert this single design commit, rebuild the GitHub Pages export,
and redeploy the previously verified main version. The existing Payment Link
and backend require no rollback.

## Asset provenance

`apps/item-web/public/images/diamond-tesseract-concept.webp` is original
human-directed AI concept artwork generated for this redesign. Its 1086 ×
1448 source was converted to WebP without resizing (157,638 bytes). It is
not a photograph of a physical inventory item or a diagram of proven
manufacturing geometry. It appears only in the literature Shop.
