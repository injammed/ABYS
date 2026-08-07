# Lexicon Layout Stability Fold

Product law: machine-language mutation may change glyphs, never surrounding geometry.

- the original readable string is the invisible layout skeleton
- the mutated string is paint-only and clipped to that skeleton
- hover/focus/reduced-motion reveal source text without changing layout
- MachineGloss translation boxes have fixed block sizes per density/viewport
- the language label owns a fixed-width column
- translated overflow stays inside its box
- user Artifact payloads remain verbatim and outside the mutation system

This exists to prevent visible page shake while the machine lexicon cycles scripts and translations.
