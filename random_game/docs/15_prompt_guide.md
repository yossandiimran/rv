# 15 — AI Prompt and Asset Guide

## Canon Anchor

```text
PROJECT: Sumpah Merdeka, a compact 2.5–3 hour browser game for 17 August 2026.
CANON: Sutrisno, a young Javanese villager, loses Sastro and Marni when their village is attacked in late 1945. He becomes a volunteer courier. His arc moves from revenge toward protecting surviving families. Gameplay spans several days; his later promotion to Colonel appears only in the epilogue.
CORE CAST: Sutrisno, Sastro, Marni, Pak Darma, Bima, Sari, Karso, Joyo, and Captain Hendrik van Leeuwen.
CORE ROLES: Bima is the best friend; Sari is the restrained love interest; Karso betrays the evacuation route under coercion to save his sister Lastri; Joyo is the friend who dies saving civilians; Hendrik is the colonial antagonist; Darma survives the finale with an injury.
ENDING: Sutrisno protects an evacuation instead of chasing Hendrik; Joyo sacrifices himself; Karso helps free Lastri but is not instantly forgiven; years later Colonel Sutrisno visits the graves of his parents and Joyo.
NO: additional betrayal layers, branching romance tree, party management, rank progression during gameplay, fantasy, monsters, modern objects, graphic gore, interchangeable historical factions.
```

## Visual Style Anchor

```text
HOUSE STYLE: "Garis Merdeka", an original visual identity for this project.
STYLE: consistent HD pixel art for gameplay; expressive hand-inked 2D animation sensibility for portraits and still frames; grounded Indonesian historical drama.
SETTING: a fictional East Java village and refugee route, late 1945.
PALETTE: warm earth tones for home; smoke gray, muted brown/green, restrained red for attack; gentle gold for final dawn.
MOOD: intimate, human, melancholic, ultimately hopeful.
LINEWORK: slightly broken digital-ink strokes, gently angular curves, intentional thick-thin variation, clean silhouettes, restrained detail, never visually noisy.
INDONESIAN CHARACTER: warm expressive faces, grounded body proportions, subtle shape rhythm informed by relevant Nusantara crafts and textiles without pasting random motifs.
NO: imitation of a named artist/studio/show, generic anime, chibi, photorealism, plastic AI gloss, fantasy, glossy sci-fi light, modern objects, exaggerated anatomy, graphic gore, unreadable detail, invented military insignia.
ASSET CONTRACT: [approved resolution, tile size, sprite size, directions, frame count, palette, lighting, and format].
```

Jangan membuat aset produksi sebelum `ASSET CONTRACT` terisi dari hasil prototype.

## Aturan Konsistensi

1. Gunakan style anchor dan reference board yang sama.
2. Kunci character sheet sebelum portrait atau animasi turunan.
3. Catat versi setiap reference.
4. Aset rusak memakai aset damai sebagai dasar agar bentuk kampung tetap dikenali.
5. Sprite sheet AI diperiksa serta dibersihkan frame per frame.
6. Seragam, senjata, simbol, kendaraan, dan arsitektur memerlukan sumber sejarah.
7. Jangan menambah karakter, lokasi, senjata, atau cutscene di luar anggaran tanpa persetujuan Director.
8. Gunakan `17_content_asset_roadmap.md` sebagai urutan produksi dan gate persetujuan.

## Anggaran Produksi

- 9 karakter utama.
- 5 side character dari 3–4 base body.
- 4–6 base NPC tambahan jika diperlukan.
- 1 base musuh + 1 variasi.
- 1 tileset pedesaan + extension hutan + state rusak.
- Maksimal 9 portrait utama dengan 1–3 ekspresi sesuai kebutuhan.
- Maksimal 6 still-frame.
- 3 track, 5 ambience, dan 20–25 SFX.

## Template Karakter

```text
[VISUAL STYLE ANCHOR]
CHARACTER: [name, age, role, personality, social background].
CANON FEATURES: [skin, face, hair, body, clothing, distinctive object].
TASK: reference sheet, front/side/back, neutral pose, readable silhouette.
CONSISTENCY: preserve exact proportions, palette, face, and clothing construction.
```

## Template Sprite

```text
[VISUAL STYLE ANCHOR]
APPROVED CHARACTER SHEET: [reference].
TASK: [idle/walk/aim/action], [directions], [frames per direction].
OUTPUT: transparent background, fixed frame canvas, feet on one baseline, no cropped pixels.
```

## Template Environment

```text
[VISUAL STYLE ANCHOR]
LOCATION: [LOC ID].
STATE: [peaceful/burning/refugee/final dawn].
HISTORICAL REFERENCES: [approved references].
TASK: [tileset/prop/still-frame].
CONSISTENCY: approved grid, scale, perspective, palette, and light direction.
```

## Template Dialog

```text
[CANON ANCHOR]
VOICE GUIDE: [relevant excerpts from 12_dialogues.md].
SCENE PURPOSE: [plot and emotion].
KNOWN FLAGS: [player callbacks].
CONSTRAINTS: grounded Indonesian, short lines, period-appropriate wording, subtext, no speechifying.
OUTPUT: draft nodes plus facts requiring verification.
```

## Template Code

```text
CONTEXT: [approved engine/version], browser-first, data-driven.
TASK: [one release-scope feature].
INPUT/OUTPUT: [contract].
CONSTRAINTS: desktop + touch, no unrelated dependencies, no out-of-scope system.
ACCEPTANCE TESTS: [observable behavior and edge cases].
OUTPUT: implementation, integration notes, and tests.
```

## Provenance

```yaml
asset_id:
filename:
tool_and_version:
created_at:
prompt_file:
reference_files:
human_edits:
license_or_terms:
historical_sources:
approved_by:
status: draft
```

## Checklist

- [ ] Sesuai canon tiga jam?
- [ ] Masuk anggaran aset dan scope rilis?
- [ ] Konsisten dengan sheet/style anchor?
- [ ] Perspektif, skala, palet, dan lighting cocok?
- [ ] Detail sejarah sudah diperiksa?
- [ ] Tidak mengandung stereotip, glorifikasi, atau tiruan artis tertentu?
- [ ] Provenance serta hak penggunaan tercatat?
- [ ] Mendukung keluarga dan cerita, bukan sekadar keren?
