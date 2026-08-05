# Military, enemy, vehicle and weapon expansion provenance

- Tool: built-in image generation
- Date: 2026-08-05
- Mode: reference-guided generation plus local chroma cleanup
- Style anchor: `source/style/garis-merdeka-styleboard-v1.png`
- Runtime exporters: `tools/export-sprite-sheet.ps1`

## Republican field and epilogue variants

`republican-field-lineup-v1.png` preserves the original identities and assigns five distinct late-1945 functions: Sutrisno armed courier, Bima volunteer rifleman, Sari field medic, Karso scout, and Darma field leader. Equipment is deliberately mixed/improvised rather than a later standardized uniform.

`epilogue-veterans-lineup-v1.png` ages them 8–12 years: Sutrisno is a restrained early-Republic colonel; Bima and Darma are veterans; Sari is an experienced doctor/partner; Karso rebuilds as a carpenter rather than being rewritten as a soldier.

Walk template:

> Strict 4x4 HD-pixel walk cycle. Rows down/left/right/up; columns contact/passing/opposite-contact/passing. Preserve exact face, signature palette and equipment. One full-body sprite per cell, 32x48 target, identical anchor, pure #ff00ff background, no overlap, text, modern gear, real insignia or watermark.

## Enemy lineup

Five grounded human archetypes: regular patrol, sentry, local scout, veteran sergeant, and unarmed plainclothes intermediary. They vary in age/build/background, avoid ethnic caricature, use no real unit badge, and are not copies of Hendrik.

Four combat variants received full walk sheets. The intermediary received four static directions. Shared action sheet rows are aim, fire, hit and down; columns are down/left/right/up.

## Vehicles

Concept lineup: compact armored reconnaissance car, canvas cargo truck, and M5A1 Stuart-inspired light tank. No real serials, flags, stars or unit markings.

- Armored car: four directions × operational/disabled, intended for core late 1945.
- Cargo truck: four static directions.
- Light tank: four directions × operational/disabled, marked optional 1946+.

Historical boundary references:

- Imperial War Museums documents British forces in Java in late 1945: https://www.iwm.org.uk/collections/item/object/205208500
- Nationaal Archief documents KNIL Stuart tanks in Batavia on 31 August 1946: https://www.nationaalarchief.nl/onderzoeken/photo-collection/72410191-72d8-fae7-4ba2-cb80119c17aa

The assets remain insignia-free placeholders until location, force and exact date are locked.

## Weapon and equipment atlases

`world-weapons-source-v1.png` is a strict 4x4 3/4-top-down pickup sheet: bamboo spear, golok, chisel, baton; rifle, carbine, submachine gun, pistol; light machine gun, grenade, two ammunition types; bandolier, binoculars, cleaning roll and ammunition crate.

`combat-equipment-icons-source-v1.png` is a strict 4x4 inventory sheet: helmet, cap, webbing, boots; canteen, ration, medical pouch, bandage; radio, handset, map case, whistle; fuel can, wrench, track link and signal lamp.

Shared constraints: period-appropriate silhouette, no modern optics/rails/plastic, no text or serials, pure #ff00ff background, one isolated asset per cell.
