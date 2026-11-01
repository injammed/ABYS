# Summers

An original regular face modeled from the supplied handwritten alphabet. The sample informs the angular capitals and small, slanted lowercase. Numerals, punctuation and Latin diacritics are designed additions. Crossed-out marks are excluded. Bold and italic are synthesized by the editor.

Regenerate with Python 3, fonttools, shapely and brotli: `python apps/aetimm-writer/design/summers.py`. Outputs are committed so neither browser nor desktop needs Python.

The web/desktop face is bundled locally. HTML embeds WOFF2; Word exports embed the full editable TTF using the zero-key OOXML representation documented in MS-OE376 §2.1.29.4. Font embedding support varies by word processor; the TTF is also available at `/writer/fonts/Summers-Regular.ttf`.
