# AETIMM SHOP Commerce Contract v1

## Public law

**UPLOAD · SCROLL · VOTE · SHOP**

SHOP is the only public commerce verb. MAKE is what happens underneath it.

## Customer journey

`SELECT DESIGN → PREFLIGHT → REAL QUOTE → PURCHASE → FABRICATION → QC → DELIVERY`

A customer must always be able to tell the current state in seconds.

Allowed customer-visible states:

- `CONCEPT` — design only; no checkout.
- `CONFIGURABLE` — bounded manufacturing options exist.
- `QUOTABLE` — enough verified inputs exist to request/calculate a real quote.
- `ORDERABLE` — accepted quote + manufacturable configuration + rights/moderation clearance.
- `IN FABRICATION` — paid order accepted for manufacture.
- `DELIVERED` — fabrication, QC, and delivery completed.

A successful payment is never represented as successful fabrication.

## First product-family rule

AETIMM does not claim it can manufacture anything. Commerce activates one bounded product family at a time only after materials, dimensions, fabrication process, supplier path, tolerances, finishing, packaging, shipping, and QC are known.

The one-of-one hybrid hydrogen-electric sports car remains a North Star concept, not an orderable launch product.

## Rights + moderation

A design may enter commerce only when AETIMM has a defensible right to commercialize it. Counterfeit, prohibited, unsafe, or rights-unclear designs do not become orderable. Missing rights information remains missing; it is never inferred into permission.

## Quote law

AI may organize verified cost inputs; it may not invent a sale price.

A real quote must derive from known inputs such as:

`fabrication + material + finishing + packaging + shipping + applicable tax handling + platform margin`

Every quote must state what is included, currency, expiry, expected manufacturing window, and cancellation/refund terms.

## Order state machine

Consequential states are factual and append-only:

`QUOTE_ACCEPTED → PAYMENT_CONFIRMED → SUPPLIER_ACCEPTED → FABRICATION → QC → SHIPPED → DELIVERED`

Failure paths must remain explicit, including `QUOTE_EXPIRED`, `PAYMENT_FAILED`, `SUPPLIER_REJECTED`, `FABRICATION_FAILED`, `QC_FAILED`, `CANCELLED`, and `REFUNDED` where applicable.

## Stripe boundary

Stripe is the payment rail, not the source of manufacturing truth.

- No live Stripe Product/Price/Payment Link is created until a real orderable configuration and quote exist.
- Browser code never receives Stripe secret/admin credentials or Supabase service-role credentials.
- Artifact, configuration, quote, Stripe payment, and order identifiers remain linked for auditability.
- Buying never changes Slop/Museum voting, ranking, accession, or provenance.

## Product law

`PRODUCT` is earned only after successful fabrication + QC.

Before that point the object is a concept, configuration, quote, or order. After successful delivery, a proven configuration may become orderable again if its manufacturing path remains valid.

## Interface law

Machine face, human bones.

- Dark: strange, expressive, machine-made.
- Light: sterile, white/blue, maximally concise.
- One dominant action per screen.
- Prices, dimensions, permissions, deadlines, refund terms, and manufacturing state are never hidden or cosmetically mutated.
- No fifth top-level navigation verb.
