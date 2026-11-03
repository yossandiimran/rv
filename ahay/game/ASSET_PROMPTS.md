# Prompt aset: 4 karakter baru

Karakter yang butuh gambar (kode, data, kombo, dan kalimatnya sudah siap; tinggal PNG-nya):

| Karakter | Peran | File thumbnail | File sheet combat |
|---|---|---|---|
| Windah Basudara | playable (tab RAKYAT) | `windah-basudara-thumb.png` | `windah-basudara-combat.png` |
| Ferry Irwandi | playable (tab RAKYAT) | `ferry-irwandi-thumb.png` | `ferry-irwandi-combat.png` |
| Jokowi | arcade (dipilih & dilawan) | `jokowi-thumb.png` | `jokowi-combat.png` |
| Kang Dedi Mulyadi | arcade (dipilih & dilawan) | `dedi-mulyadi-thumb.png` | `dedi-mulyadi-combat.png` |

## Cara pakai (3 langkah)
1. Generate 2 gambar per karakter di Codex/imagegen pakai prompt di bawah. **Lampirkan referensi gaya** + **foto referensi wajah** tokohnya (sama seperti pas bikin Bahlil, Hashim, Prabowo).
2. Taruh hasilnya di `game/assets/incoming/` dengan nama persis seperti tabel.
3. Jalankan dari folder `game`:
   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/import-assets.ps1
   ```
   Skrip mengecilkan gambar (sheet jadi 1024x512, thumbnail tinggi 320) dan menaruhnya di `assets/sheets` dan `assets/thumbs` dengan nama yang dibaca game. Buka game: kartu "SEGERA HADIR" otomatis berubah jadi karakter yang bisa dipilih. Tidak perlu ubah kode.

(Boleh juga langsung menaruh PNG ke `assets/sheets` dan `assets/thumbs` dengan nama akhir di skrip; ukuran apa pun terbaca, hanya lebih berat dimuat.)

## Lampiran referensi gaya (wajib di tiap generate)
- Thumbnail: `assets/playable/01-office-worker-v1.png` atau `assets/enemies/08b-prabowo-subianto-v3.png`
- Sheet combat: `assets/skills/playable-office-worker-combat-v1.png` dan `assets/skills/enemy-prabowo-subianto-combat-v1.png`

## Blok gaya (tempel di awal SEMUA prompt)
```
STRICTLY match the attached RAKYAT: LAST STAND roster references: Indonesian editorial caricature mixed with a
late-1990s arcade beat-em-up illustration. Use a huge expressive head on a very short stocky body, oversized hands
and shoes, thick irregular hand-inked near-black contours, hard angular cel shading, and visible newspaper halftone,
stipple, crosshatch, dry-brush scratches, and printed-paper grain. Use muted earthy midtones with hard saturated
accent colours. It must look handmade and imperfect, NOT like polished mobile-game vector art, glossy 3D, smooth
airbrush, anime, or photorealism. Preserve a recognizable likeness of the person. Side view, character faces RIGHT.
One character only, full body with both feet visible, transparent PNG background (no scene, no floor, no shadow plate).
No text, no logos, no party symbols. Props are comedic metaphors, never factual accusations. Respectful satire.
```

## Spesifikasi sheet combat (tempel di prompt sheet)
```
Single image 1774x887, transparent background, a 4 columns x 2 rows grid of 8 separate poses of the SAME character,
reading left-to-right, top row then bottom row. Same character scale and the same feet baseline in every panel.
Keep all effects fully inside their own panel with a clear margin (nothing touching the panel edge); no panel borders,
no labels. Panel order:
1 light attack (quick jab, small impact burst)
2 heavy attack (big wind-up swing, arc trail)
3 guard / counter (defensive stance with a shield-like effect)
4 dodge (fast dash with speed lines and dust)
5 special startup (charging, aura gathering)
6 special active (the signature move released, big projectile/effect to the right)
7 ultimate (huge dramatic power pose, screen-filling energy, theme props exploding around)
8 hit / KO (knocked back, dazed, props scattered)
```

---

## 1. Windah Basudara (playable)
Tema: streamer gamer. Serangan = metafora gaming.

**Thumbnail** (pose berdiri siap bertarung, ukuran sekitar 1312x1199):
```
[Blok gaya] A young male gaming streamer in a casual hoodie with a headset around his neck, confident cheeky grin,
holding a mechanical keyboard like a weapon, glowing donation notification pop-ups and "GG" chat bubbles floating
around him. Dominant colours: electric blue and white.
```
**Sheet combat** (tempel Blok gaya + Spesifikasi sheet, lalu):
```
Character: same Windah Basudara streamer. Attack themes: 1 "Klik Cepat" mouse click burst; 2 "Smash Keyboard" keyboard
slam; 3 "Headset Guard" headset shield; 4 "Alt-Tab Dash"; 5 "Charge Mic" mic charging; 6 "Bocil Kematian" a wave of
chat bubbles and emotes blasted forward; 7 "Rage Quit Besar" giant monitor, keyboard and chat bubbles explosion;
8 "Disconnect" disconnected wifi icon above his head, controller dropped.
```

## 2. Ferry Irwandi (playable)
Tema: orator / juru bicara tuntutan rakyat (17+8).

**Thumbnail:**
```
[Blok gaya] A composed activist-orator in a casual jacket holding a megaphone in one hand and a rolled protest banner
in the other, calm but fierce expression, a clipboard of demands tucked under his arm, small paper sheets flying.
Dominant colours: teal and warm white.
```
**Sheet combat:**
```
Character: same Ferry Irwandi orator. Attack themes: 1 "Interupsi Tajam" sharp pointing finger, white speech-burst;
2 "Lempar Spanduk" thrown banner; 3 "Megafon Guard" megaphone held up as a shield; 4 "Mundur Teratur" orderly backstep
dash; 5 "Tarik Napas Panjang" deep breath, paper sheets swirling; 6 "Reformasi Total" a wave of flying pages and sound
rings from the megaphone; 7 "17+8 Tuntutan" giant glowing list of demands exploding outward; 8 "Dibungkam" megaphone
knocked away, papers scattered.
```

## 3. Jokowi (arcade)
Tema: mantan presiden, gaya blusukan, jawaban ikoniknya.

**Thumbnail:**
```
[Blok gaya] A slim, mild-mannered man in a white long-sleeve shirt with rolled-up sleeves and plain dark trousers,
gentle composed smile with a slightly puzzled look, a shrugging pose with one open palm, a swarm of reporter
microphones and floating question marks around him. Dominant colours: white, soft grey, and warm skin tones.
```
**Sheet combat:**
```
Character: same Jokowi caricature. Attack themes: 1 "Telunjuk Blusukan" pointing forward; 2 "Gebrakan Kerja" hand slam
on a desk of folders; 3 "Senyum Defensif" polite smile with a folder shield; 4 "Ngeles Dash" side-step shrug dash;
5 "Wartawan Berkerumun" microphones gathering; 6 "Jawab Nanti" a pile of "NANTI" memo notes shot forward; 7 "Reshuffle
Massal" a storm of swapping name cards and folders; 8 "Mic Terlepas" microphones scattered, dazed shrug.
```

## 4. Kang Dedi Mulyadi (arcade)
Tema: gubernur konten, barak, dan bansos.

**Thumbnail:**
```
[Blok gaya] A Sundanese-styled man wearing a traditional head-wrap (iket) and a dark traditional outfit, energetic
expression, holding a smartphone on a gimbal as if live-streaming, red "REC" icons and camera flashes around him.
Dominant colours: dark indigo, white, and a red accent.
```
**Sheet combat:**
```
Character: same Kang Dedi Mulyadi caricature. Attack themes: 1 "Tunjuk Konten" pointing at the camera; 2 "Tendangan
Barak" boot kick with a small tent silhouette; 3 "Iket Guard" head-wrap flaring as a shield; 4 "Geser Gimbal" gimbal
dash; 5 "Rekam Dulu" phone screen charging; 6 "Konten Viral" a wave of REC icons, likes and flashes forward; 7 "Barak
Massal" a barracks-tent stampede of icons and flashes; 8 "Baterai Habis" phone with a dead battery icon, dazed.
```

---

## Checklist sebelum impor
- Background benar-benar transparan (cek di viewer; tidak ada kotak abu-abu/putih).
- Sheet 4x2 rata, tiap pose di dalam panelnya (efek tidak menyentuh tepi panel). Efek yang terpotong tepi akan terlihat sebagai kotak di game.
- Karakter menghadap **kanan** di semua pose (game membalik sendiri untuk sisi kanan layar).
- Kalau hasil kurang pas, ulangi hanya gambar yang jelek; thumbnail dan sheet boleh digenerate terpisah.

---

## Framing (supaya ukuran sama dengan karakter lama)
- Sheet lama: karakter setinggi sekitar **65% panel**, kaki di sekitar **83% dari atas**, ada margin di semua sisi. Sheet v3 (Windah, Ferry, Jokowi, Dedi) mengisi sekitar 90% panel dengan kaki di sekitar 96%.
- Itu sudah ditangani di kode lewat `fit` di data karakter (`FIT_FULL_PANEL` di `js/data/config.js`): tanpa crop bawah, kaki ditaruh lebih rendah, skala 0.74, dan tepi panel dipudarkan hanya di pose efek besar.
- Kalau generate berikutnya mau langsung seukuran karakter lama (tanpa `fit`), tambahkan ke prompt sheet: `Character height about 65% of the panel height, feet at about 83% of the panel height, generous empty margin on all sides.`
- Kalau ada karakter yang masih kelihatan terlalu besar/kecil, ubah `scale` di `fit` karakter itu (0.74 = default untuk sheet v3; makin kecil = karakter makin kecil).
