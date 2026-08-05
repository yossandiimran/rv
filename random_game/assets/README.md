# Sumpah Merdeka — Visual Asset Pack v1

Paket ini adalah fondasi visual AI untuk vertical slice game berdurasi 2,5–3 jam. Semua gambar sumber dibuat dengan built-in image generation pada 5 Agustus 2026, kemudian diproses lokal menjadi aset runtime tanpa mengganti identitas visual `Garis Merdeka`.

## Kontrak runtime

| Jenis | Ukuran | Susunan |
|---|---:|---|
| Background dan cutscene | 640×360 | opaque, 16:9 |
| Walk sprite utama/patrol | 128×192 | 4 kolom × 4 baris; sel 32×48 |
| Side character | 160×192 | 5 kolom × 4 baris; sel 32×48 |
| Portrait expression | 512×512 | 2 kolom × 2 baris; sel 256×256 |
| Terrain | 128×128 | 4 kolom × 4 baris; tile 32×32 |
| World prop | 512×512 | 4 kolom × 4 baris; sel 128×128 |
| Inventory icon | 256×256 | 4 kolom × 4 baris; sel 64×64 |
| UI icon | 128×128 | 4 kolom × 4 baris; sel 32×32 |
| Environmental VFX | 256×256 | 4 kolom × 4 baris; sel 64×64 |
| Armed/veteran walk variant | 128×192 | 4 kolom × 4 baris; sel 32×48 |
| Combat action | 192×192 | 4 arah × 4 action; sel 48×48 |
| Enemy walk archetype | 128×192 | 4 kolom × 4 baris; sel 32×48 |
| Combat vehicle | 512×192 | 4 arah × 2 state; sel 128×96 |
| Cargo truck | 512×96 | 4 arah; sel 128×96 |
| World weapon pickup | 512×384 | 4 kolom × 4 baris; sel 128×96 |
| Combat equipment icon | 256×256 | 4 kolom × 4 baris; sel 64×64 |
| Village/camp buildings | 768×384 | 3 kolom × 2 baris; sel 256×192 |
| Interior shells | 640×480 | 2 kolom × 2 baris; sel 320×240 |
| Interior/natural props | 512×512 | 4 kolom × 4 baris; sel 128×128 |
| Large trees | 768×576 | 4 kolom × 3 baris; sel 192×192 |
| Ground vegetation/decals | 256×256 | 4 kolom × 4 baris; sel 64×64 |
| River crossings | 1024×384 | 4 kolom × 3 baris; sel 256×128 |

Gunakan file runtime dengan versi paling tinggi. File `v1` yang superseded tetap disimpan agar prosesnya dapat diaudit.

## Peta atlas

### Walk sprite karakter utama dan patrol

- Baris: `down`, `left`, `right`, `up`.
- Kolom: `contact`, `passing`, `opposite-contact`, `passing`.
- Folder: `characters/sprites/`.

### Side character

- Kolom: `Lastri`, `Mbah Wiryo`, `Bu Rukmini`, `Mantri Rahman`, `Aji`.
- Baris: `down`, `left`, `right`, `up`.
- Sheet ini berisi pose arah, belum walk cycle empat frame.

### Portrait expression

| Karakter | Kiri atas | Kanan atas | Kiri bawah | Kanan bawah |
|---|---|---|---|---|
| Sutrisno | hangat | marah tertahan | berduka | bertekad |
| Sastro | senyum tipis | geli | menasihati | khawatir |
| Marni | hangat | geli mengetahui | tegas melindungi | takut tertahan |
| Darma | tenang | memimpin | terluka/khawatir | bangga diam-diam |
| Bima | bercanda | takut | marah melindungi | berduka |
| Sari | menggoda hangat | fokus tegas | duka tertahan | bertekad |
| Karso | menjaga jarak | cemas | malu | menebus kesalahan |
| Joyo | geli lembut | ingin tahu | takut | tekad sedih |
| Hendrik | sopan berjarak | marah terkendali | ragu sesaat | dingin bertekad |

### Terrain

- Baris 1: tanah kering, tanah lembap, rumput pendek, transisi rumput-tanah.
- Baris 2: jalan vertikal, jalan horizontal, serasah hutan, akar terbuka.
- Baris 3: air tenang, air mengalir, tepian lumpur, batu sungai.
- Baris 4: sawah, lantai anyaman bambu, lantai kayu, tanah terbakar.

### World props

- Baris 1: tempayan, panci, ember, bakul bertutup.
- Baris 2: meja tukang kayu, perkakas, tikar, lampu minyak.
- Baris 3: pagar bambu, pohon pisang, pangkal kelapa, karung beras.
- Baris 4: keranjang obat, tali dan papan jembatan, batu makam, bunga.

### Inventory icons

- Baris 1: selendang, pahat, buku Joyo, pesan tersegel.
- Baris 2: perban, burung kayu Aji, jimat Lastri, ketam Sastro.
- Baris 3: lampu minyak, bekal nasi, ramuan, peta rute.
- Baris 4: tali, wadah air bambu, benih, foto keluarga.

### Environmental VFX

- Baris: api kecil, asap, debu langkah, cipratan hujan.
- Kolom: frame animasi 1–4.

### Armed and veteran variants

- `sutrisno-armed`, `bima-rifleman`, `sari-medic`, `karso-scout`, dan `darma-leader` adalah varian medan akhir 1945.
- `sutrisno-colonel` hanya untuk epilog 8–12 tahun kemudian.
- Walk sheet tetap memakai baris `down/left/right/up` dan empat gait frame.
- Combat action Sutrisno: kolom `down/left/right/up`; baris `aim/fire/rifle-butt/hit`.

### Enemy expansion

- Walk archetype: rifle patrol, sentry, scout, dan sergeant.
- Intermediary memakai atlas empat arah statis dan tidak ikut combat.
- Shared rifle action: kolom `down/left/right/up`; baris `aim/fire/hit/down`.
- Empat visual kombatan tetap dapat memakai dua base AI agar scope tidak membesar.

### Vehicles

- Kolom: `down/front`, `left`, `right`, `up/back`.
- Baris kendaraan tempur: `operational`, `disabled`.
- Armored car diprioritaskan untuk core akhir 1945.
- Stuart-inspired light tank ditandai sebagai konten opsional 1946+.

### World weapons

- Baris 1: bambu runcing, golok, pahat, baton.
- Baris 2: bolt-action rifle, carbine, submachine gun, pistol.
- Baris 3: light machine gun, grenade, rifle clips, pistol magazines.
- Baris 4: bandolier, binoculars, cleaning roll, ammunition crate.

### Combat equipment

- Baris 1: helmet, field cap, webbing, boots.
- Baris 2: canteen, ration, medical pouch, bandage.
- Baris 3: field radio, handset, map case, whistle.
- Baris 4: fuel can, wrench, spare track link, signal lamp.

### Village buildings

- Baris 1: rumah keluarga utuh, rumah keluarga runtuh, rumah warga kecil.
- Baris 2: lumbung, surau, bengkel tukang kayu.

### Camp structures

- Baris 1: shelter tidur, shelter medis, dapur komunal.
- Baris 2: pos jaga, menara bambu, barricade rendah.

### Interior shells

- Kiri atas: rumah keluarga.
- Kanan atas: bengkel.
- Kiri bawah: surau.
- Kanan bawah: shelter pengungsi/medis.

### Large trees

- Baris 1: kelapa dewasa, kelapa muda, pisang, bambu.
- Baris 2: jati, beringin, pohon buah, pohon terbakar.
- Baris 3: batang tumbang, tunggul, pakis besar, shrub.

### Ground vegetation

- Baris 1: empat variasi rumput.
- Baris 2: bibit padi, padi dewasa, ikat panen, reeds sawah.
- Baris 3: reeds sungai, water lily, water hyacinth, pakis tepian.
- Baris 4: tanaman obat, vine, bibit pisang, hedge.

### River crossings

- Baris 1: jembatan bambu horizontal utuh/rusak, vertikal utuh/rusak.
- Baris 2: plank horizontal/vertikal, rope-handline horizontal/vertikal.
- Baris 3: stepping stone horizontal/vertikal, penanda ford horizontal/vertikal.

### Ground decals

- Baris 1: puddle, jejak kaki, roda gerobak, mud splatter.
- Baris 2: abu, bara, genteng pecah, bambu pecah.
- Baris 3: daun, bunga, beras tumpah, kain robek.
- Baris 4: soot, scorch, scrape, tanah retak.

## Aset utama

- `source/style/garis-merdeka-styleboard-v1.png`: sumber gaya yang disetujui.
- `characters/sprites/*-32x48-v1.png`: sprite runtime.
- `characters/portraits/*-256-v1.png`: portrait runtime.
- `environments/backgrounds/*-640x360-v2.png`: enam lokasi runtime opaque.
- `cutscenes/*-640x360-v2.png`: enam still utama runtime opaque.
- `ui/dialogue-overlay-640x360-v2.png`: overlay transparan bersih.
- `ui/title-keyart-640x360-v2.png`: title background tanpa teks.
- `tilesets/terrain-atlas-32-v2.png`: terrain runtime opaque.
- `tilesets/world-props-128-v1.png`: prop transparan.
- `items/inventory-icons-64-v1.png`: item transparan.
- `effects/environment-vfx-64-v1.png`: VFX transparan.
- `characters/variants/*-32x48-v1.png`: enam walk variant medan/epilog.
- `characters/variants/sutrisno-combat-actions-48-v1.png`: action Sutrisno.
- `enemies/sprites/*-32x48-v1.png`: empat walk musuh dan intermediary.
- `enemies/sprites/enemy-rifle-actions-48-v1.png`: base action musuh.
- `vehicles/*-128x96-v1.png`: armored car, truck, dan tank.
- `weapons/world-weapons-128x96-v1.png`: pickup senjata dunia.
- `weapons/combat-equipment-icons-64-v1.png`: equipment HUD/inventory.
- `environment/buildings/*-256x192-v1.png`: dua atlas bangunan modular.
- `environment/interiors/interior-shells-320x240-v1.png`: empat shell interior.
- `environment/interiors/home-interior-props-128-v1.png`: 16 furniture/prop.
- `environment/vegetation/trees-large-192-v1.png`: 12 pohon/tanaman besar.
- `environment/vegetation/ground-vegetation-64-v1.png`: 16 tanaman kecil.
- `environment/vegetation/natural-obstacles-128-v1.png`: 16 obstacle/utilitas.
- `environment/bridges/river-crossings-256x128-v1.png`: 12 crossing overlay.
- `environment/decals/ground-decals-64-v1.png`: 16 ground decals.
- `tilesets/dirt-road-autotile-32-v1.png`, `riverbank-autotile-32-v1.png`, dan `rice-terrace-atlas-32-v1.png`: terrain modular.

## Batas produksi yang disengaja

- Sprite utama baru memiliki walk cycle. Interaksi, luka, dan aksi khusus masih perlu dibuat ketika blocking gameplay sudah final.
- Side character baru memiliki empat arah pose, belum empat frame per arah.
- Terrain AI layak untuk prototype/vertical slice, tetapi seam tiap tile perlu dites di map editor dan dibersihkan manual bila tampak berulang.
- Seragam dan perlengkapan sejarah masih sengaja tanpa insignia nyata sampai riset historis selesai.
- Audio belum dibuat karena sesi ini tidak menyediakan generator audio. Cue sheet siap-generasi ada di `audio/README.md`.
- Tank Stuart-inspired disediakan untuk 1946+; penempatannya di core akhir 1945 memerlukan keputusan perubahan sejarah.
- Semua terrain 32×32 harus menjalani seam test di map editor; hasil AI adalah base produksi, bukan jaminan matematis seamless.

## Reproduksi

Prompt dan referensi tersimpan di `source/prompts/`. Transparansi dibuat dengan helper resmi `remove_chroma_key.py`; atlas runtime diekspor memakai `tools/export-sprite-sheet.ps1`, dan still 16:9 memakai `tools/export-background.ps1`.
