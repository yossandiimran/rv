# World, UI, item and VFX provenance

- Tool: built-in image generation
- Date: 2026-08-05
- Primary reference: `source/style/garis-merdeka-styleboard-v1.png`
- Runtime export: `tools/export-background.ps1` and `tools/export-sprite-sheet.ps1`

## Environments

Shared prompt lock:

> Wide 16:9 cinematic gameplay background for Sumpah Merdeka, rural Java in the 1940s. No foreground people so sprites can be overlaid. Compose readable foreground, walkable midground and deep background. Garis Merdeka Indonesian animation warmth, broken thick-thin ink, earthy ochre/indigo/moss, painterly flat shapes, subtle paper grain. No modern object, text, logo, UI, watermark, photorealism or anime gloss.

| Output | Scene variable |
|---|---|
| `village-peaceful-v1.png` | family carpenter house, late afternoon, rice fields, intimate calm |
| `village-burning-v1.png` | same recognizable layout after raid, indigo night, restrained fire, no bodies |
| `forest-route-v1.png` | teak/bamboo route before dawn, irrigation channel, faint patrol light |
| `refugee-camp-v1.png` | surau/granary camp in rain, dignity and mutual care, period materials |
| `river-crossing-v1.png` | swollen river and damaged bamboo bridge, dark-left to dawn-right composition |
| `cemetery-epilogue-v1.png` | three plain graves, young tree, rebuilt roofs, quiet sunrise |

## Modular atlases

- `terrain-atlas-source-v1.png`: strict 4x4 terrain list documented in `assets/README.md`, top-down, no lighting gradient, tileable intent.
- `world-props-source-v1.png`: strict 4x4 isolated prop list, 3/4 top-down, pure #ff00ff.
- `inventory-icons-source-v1.png`: strict 4x4 story-item list, readable at 64x64, pure #ff00ff.
- `ui-icons-source-v1.png`: strict 4x4 handmade pictograms, readable at 32x32, pure #ff00ff.
- `environment-vfx-source-v1.png`: four 4-frame rows—flame, smoke, dust, rain splash—pure #ff00ff.

## Dialogue overlay

> Wide 16:9 transparent-ready UI. Upper 60 percent uniform #ff00ff. Bottom contains one low indigo-brown/parchment dialogue panel, attached square portrait frame, blank nameplate and three blank choice buttons. Handmade woven-bamboo corner motifs, restrained brick-red accent, no text or icon.

`dialogue-overlay-640x360-v2.png` is the approved soft-matte/despill runtime version.

## Title key art

References: Sutrisno, Sastro and Marni concepts.

> Family grouped on the right at dawn; Sastro's hand on Sutrisno's shoulder and Marni's selendang visually connect them. Village and carpenter house recede into indigo memory on the left with clean title space. Intimate oath, not propaganda. No written title, flag, weapon or text.

Runtime: `ui/title-keyart-640x360-v2.png`.
