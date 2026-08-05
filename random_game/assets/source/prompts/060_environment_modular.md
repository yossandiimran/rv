# Modular environment expansion provenance

- Tool: built-in image generation
- Date: 2026-08-05
- Mode: reference-guided raster generation
- Style reference: `source/style/garis-merdeka-styleboard-v1.png`
- Scene references: peaceful/burning village, forest, camp, and river-crossing sources
- Transparency: flat `#ff00ff`, official chroma helper, local sprite-sheet exporter
- Opaque terrain export: `tools/export-background.ps1 -Opaque`

## Runtime contract

| Family | Cell | Atlas |
|---|---:|---:|
| Village/camp buildings | 256×192 | 3×2 |
| Interior shells | 320×240 | 2×2 |
| Interior/natural props | 128×128 | 4×4 |
| Large trees | 192×192 | 4×3 |
| Ground vegetation/decals | 64×64 | 4×4 |
| River crossings | 256×128 | 4×3 |
| Terrain/autotile | 32×32 | 4×4 |

## Building prompts

All structures use a consistent 3/4 top-down camera, grounded late-1945 rural Javanese materials, no people, no modern objects, and no baked ground plane.

- Village buildings: family house intact, the same house collapsed, small village house; lumbung, surau, carpenter workshop.
- Camp structures: refugee shelter, medical shelter, cook shelter; checkpoint hut, watch platform, low barricade.
- Interior shells: empty cutaway family room, workshop, surau, and refugee/medical shelter.
- Interior props: low dining table, sleeping mat, cupboard, hearth; rice baskets, loom, stool, shelf; water stand, workbench, medicine shelf, lamp; partition, door, window, curtain.

## Terrain prompts

Terrain source is generated as strict 4×4 edge-to-edge atlases with exact orthographic top-down view, neutral lighting, and low detail intended for 32×32 runtime.

- Dirt road: grass/earth bases, straight segments, four corners, four T-junctions, cross, two dead ends, clearing.
- Riverbank: water center, four shores, convex and concave corners, two fords, current tile.
- Rice terrace: dry/wet grass, flooded/harvested paddy, four terrace edges, four corners, two steps, two irrigation ditches.

AI terrain is a prototype-quality source. Seam repetition must still be tested in the actual map editor before a tile is marked final.

## Vegetation and environment props

- Large plants: two coconut palms, banana, bamboo; teak, banyan, fruit tree, burned tree; log, stump, fern, shrub.
- Small plants: four grass types; rice seedlings/mature/harvested/reeds; river reeds, water lily, water hyacinth, fern; herbs, vine, banana sapling, hedge.
- Natural obstacles/utilities: rocks/boulders/pebbles; earth mound/roots/branches/driftwood; anthill/hollow log/firewood/haystack; fence corner/broken fence/sluice/well.
- Crossings: bamboo, plank, rope-handline, stepping-stone, and ford-marker variants in both orientations plus damaged states.
- Decals: puddle/footprints/ruts/mud; ash/embers/tiles/bamboo; leaves/petals/rice/cloth; soot/scorch/scrape/cracked earth.

Shared avoid list: text, labels, logos, watermark, modern material, electricity, people, vehicles, baked cast shadows, grid borders, cell overlap, and magenta inside the subject.
