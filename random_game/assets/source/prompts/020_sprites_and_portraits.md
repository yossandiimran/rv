# Sprite and portrait provenance

- Tool: built-in image generation
- Date: 2026-08-05
- References: styleboard plus the matching character concept sheet
- Chroma: flat `#ff00ff`
- Alpha cleanup: official `remove_chroma_key.py`
- Runtime export: `tools/export-sprite-sheet.ps1`

## Walk sprite prompt template

> Create a strict 4-column by 4-row HD-pixel walk-cycle sprite sheet for the exact referenced character. Rows top-to-bottom: down/front, left, right, up/back. Columns: contact, passing, opposite contact, passing. One full-body sprite per cell, identical scale and ground point. Preserve face cues, clothing palette and signature props. Translate Garis Merdeka into crisp pixel clusters readable at 32x48. Pure flat #ff00ff background; no grid, border, label, text, cell overlap, extra figure, watermark or anti-aliased blur.

Applied to Sutrisno, Sastro, Marni, Darma, Bima, Sari, Karso, Joyo and Hendrik. Hendrik and Darma were explicitly prohibited from using real insignia. Weapons were kept slung or contained within cells.

## Side character direction atlas

> Create a strict 5-column by 4-row direction atlas. Columns: Lastri, Mbah Wiryo, Bu Rukmini, Mantri Rahman, Aji. Rows: down, left, right, up. One neutral standing pose per cell, 32x48 target, exact lineup identity, period props, pure #ff00ff background, no overlap or text.

## Patrol walk atlas

> Create a 4x4 walk sheet for one generic gray-olive 1940s patrol soldier subordinate to Hendrik, but not Hendrik. No real insignia or Nazi/SS styling. Rows down/left/right/up, four gait frames, rifle slung within the cell, pure #ff00ff background.

## Portrait expression template

> Create a production-ready 2x2 bust portrait atlas for the exact referenced character. Four equal square cells, generous safe margins, identical camera and scale, perfectly consistent identity/clothing. Garis Merdeka broken thick-thin ink, earthy flat colors, subtle cel shading. Pure #ff00ff background; no borders, labels, text, watermark, extra figure or cell overlap.

Expression assignments are documented in `assets/README.md`. Source files use `*-expressions-source-v1.png`; alpha masters use `*-expressions-v1.png`; runtime files use `*-expressions-256-v1.png`.
