# GIA logo

The logo is the hydraulic tile from the site's favicon next to the wordmark **GiA**.
`svg/` holds every variant with its text converted to outlines, so the files need no
fonts; `png/` holds the same variants 2000 px wide. Both are generated: change
`tools/brand/layout.js` (geometry) or `tools/brand/build.py` (palettes, variant list)
and rebuild with

```bash
uv run tools/brand/build.py            # every variant
uv run tools/brand/build.py vertical   # only names containing "vertical"
```

It needs `chromium` (or `google-chrome`) and `rsvg-convert` on the PATH.

## Colours

| Name | Hex | Use |
|---|---|---|
| Indigo | `#22356E` | tile square, GiA, both text lines |
| Light blue | `#3E5BA9` | inner rhombus, corner squares of the vertical tile |
| Bone | `#F1ECE2` | big rhombus, background, GiA and texts on indigo |
| Yellow | `#FFB44C` | the tile's circle and the dot of the i, nothing else |

The yellow is for dots only. As text it contrasts 1.5:1 on bone and 1.8:1 on white;
on indigo it is 6.6:1.

## Rules

- The i always carries a round dot as wide as its stem, and never rises above the G and the A.
- Next to the tile, GiA is exactly as tall as the tile: the G touches its top and bottom edges.
- The tile's circle is fixed relative to the tile; it equals the i's dot when GiA is as tall
  as the tile. When the two are drawn at different sizes, the larger keeps its proportions.
- "Grupo de Inteligencia Artificial y Ciencia de Datos" runs from the first ink pixel on the
  left (the tile, or the G) to the last ink pixel of the A. "Universidad de La Habana" is
  indigo, 80% of that size, aligned right to the same edge. It only appears with the group line.
- Type: Big Shoulders Display Black for GiA, Archivo Bold and Regular for the texts
  (both OFL, in `assets/fonts/`).

## Variants

| File | Use |
|---|---|
| `gia-horizontal-{hueso,blanco}[-textos]` | default lockup on light backgrounds |
| `gia-horizontal-negativo[-textos]` | on indigo or dark backgrounds |
| `gia-horizontal-{bn,grises,azul-blanco}[-textos]` | one-ink printing, grayscale, two-colour |
| `gia-palabra-{hueso,blanco}-textos` | the wordmark alone, with the texts |
| `gia-lateral-hueso` | GiA and the texts beside the tile, within its height |
| `gia-vertical-{hueso,blanco}[-grupo,-textos]` | GiA as a second tile under the first, group line vertical on the left |
| `gia-losa` | the tile alone: avatars, favicons, stamps |
