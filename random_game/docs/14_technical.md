# 14 — Technical

## Target Rilis

- 17 Agustus 2026.
- Desktop dan mobile browser landscape.
- Satu cerita lengkap berdurasi maksimal tiga jam.
- Tidak memerlukan akun, server, atau instalasi.
- Save disimpan lokal di browser.

## Keputusan Engine

Tahap pertama adalah spike singkat antara kandidat web-first yang paling cepat digunakan. Engine dipilih berdasarkan hasil nyata untuk movement, collision, dialog data-driven, touch input, build size, dan deployment. Jangan membangun sistem konten sebelum satu kandidat lolos spike.

Kandidat utama tetap Phaser/TypeScript; Godot atau GDevelop hanya dipilih jika prototype lokalnya terbukti lebih cepat dan stabil untuk perangkat target.

## Struktur

```text
random_game/
├── docs/
├── assets/
│   ├── characters/
│   ├── environment/
│   ├── portraits/
│   ├── ui/
│   ├── audio/
│   └── source/
├── data/
│   ├── dialogues/
│   ├── quests/
│   └── game/
├── src/
├── prototype/
└── structure.md
```

## Sistem Wajib

1. Boot, scaling, preload, serta scene transition.
2. Movement empat arah, collision, kamera, dan interaksi.
3. Dialog data-driven dengan choice/flag sederhana.
4. Quest objective dan trigger.
5. Patroli dengan vision state sederhana.
6. Combat satu senjata, melee, HP, perban, dan checkpoint.
7. Cutscene in-engine/still-frame.
8. Autosave/continue menggunakan storage lokal.
9. Keyboard dan touch controls.
10. Audio, settings, content warning, credit, dan historical-fiction notice.

## Tidak Dibangun untuk Rilis

Open-world streaming · party AI · pathfinding squad · inventory umum · equipment · crafting · cooking · reputation · relationship score · skill tree · dedicated cover · grenade · kendaraan · dynamic lighting/weather/day-night · backend · login · cloud save.

## Data Minimum

- 5 quest utama + 2 aktivitas opsional.
- Dialog dan flag callback.
- 4 area + state map.
- 2 archetype musuh berbagi base AI.
- 4 varian visual musuh memakai 2 base AI tersebut; intermediary adalah NPC non-combat.
- Armored car, truck, dan tank dipakai sebagai obstacle atau scripted set-piece, bukan vehicle AI penuh.
- Bangunan modular memakai sel 256×192; interior shell 320×240; vegetation besar 192×192.
- Terrain jalan, sungai, dan sawah memakai atlas 4×4 dengan tile 32×32 dan harus diuji seam di map editor.
- Jembatan adalah overlay transparan di atas river tiles, bukan air yang baked ke sprite jembatan.
- Save schema berversi.

## Asset Contract — Dikunci Sebelum Generasi Produksi

- **Resolusi internal:** 640×360, landscape, integer scaling jika ruang layar memungkinkan.
- **Tile:** 32×32 px.
- **Cell karakter:** 32×48 px.
- **Arah:** down, left, right, up.
- **Walk:** empat frame per arah; idle memakai frame berdiri dari tiap arah.
- **Portrait source:** persegi; diekspor ulang sesuai dialog box.
- **Still-frame:** 16:9.
- **Palet:** target maksimal 32 warna per keluarga scene sebelum efek/overlay.
- **Lighting:** baked/per-scene dengan satu arah cahaya dominan.
- **Naming:** lowercase kebab-case dengan versi untuk source; final runtime memakai ID stabil.
- **Format:** PNG source; atlas PNG + data untuk runtime; audio mengikuti hasil uji browser.

Kontrak dicatat juga dalam `assets/manifest.yaml`. Player placeholder tetap diuji sebelum produksi sprite animasi lengkap; concept sheet boleh dibuat lebih dahulu sebagai sumber identitas.

## Performance Budget Awal

- Gunakan sprite atlas dan audio terkompresi.
- Maksimal 3–5 musuh aktif.
- Lighting berupa overlay/per-scene, bukan lampu dinamis kompleks.
- Map dibagi per scene.
- Profiling dilakukan pada perangkat minimum yang disepakati.
- Asset loading harus memperlihatkan progress dan tidak mengunci layar tanpa umpan balik.

## Release Gate

Prioritas mutlak adalah alur title → Prolog → serangan → pengungsian → final → Epilog → credit tanpa blocker. Jika waktu menipis, potong dialog opsional dan polish visual; jangan memotong ending atau merilis alur yang tidak selesai.
