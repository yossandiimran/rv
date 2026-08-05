# Audio generation brief

Status: **prompt-ready, belum dirender**. Tool dalam sesi produksi ini hanya mendukung gambar. Jangan memasukkan audio generik bebas konteks hanya agar folder terlihat lengkap.

## Arah suara

- Musik memakai warna akustik Indonesia yang sederhana: suling bambu, rebab lembut, petikan kacapi/siter, kendang sangat tipis, dengung rendah non-elektronik.
- Hindari musik patriotik bombastis, gamelan upacara yang terlalu megah, trailer percussion, synth modern, dan kutipan lagu nasional.
- Leitmotif keluarga terdiri dari empat nada sederhana. Versi damai terasa lengkap; versi duka kehilangan nada ketiga; versi fajar menyelesaikannya dengan instrumen baru, bukan volume lebih besar.
- SFX harus dekat, kering, dan manusiawi. Perang terdengar dari dampaknya pada kampung, bukan rentetan tembakan konstan.

## Cue musik

| ID | Durasi loop | Pemakaian | Prompt ringkas |
|---|---:|---|---|
| MUS-01 Rumah Sebelum Senja | 90 dtk | kampung damai | intimate rural Java 1940s, four-note family motif, bamboo flute and soft plucked strings, warm but fragile, seamless loop, no anthem |
| MUS-02 Rumah yang Hilang | 75 dtk | serangan/puing | same motif missing its third note, low rebab, distant wood creaks, restrained pulse, grief not horror, seamless loop |
| MUS-03 Nama-Nama | 100 dtk | pengungsian/Joyo | quiet hopeful chamber texture, pencil-like wood taps, sparse flute, human warmth under rain, seamless loop |
| MUS-04 Retak | 80 dtk | pengkhianatan | muted skin drum heartbeat, tense plucked string harmonics, no villain sting, conflicted family emotion, seamless loop |
| MUS-05 Penyeberangan | 70 dtk | finale | urgent but restrained acoustic pulse, river rhythm, family motif fragmented, no heroic brass, seamless loop |
| MUS-06 Sumpah Saat Fajar | 110 dtk | akhir/epilog | family motif completed softly by flute, rebab and plucked strings, grief carried into hope, dignified, no anthem, clean ending plus loopable edit |

## Ambience

- `AMB-01`: kampung sore—serangga, ayam jauh, angin sawah, kayu dikerjakan.
- `AMB-02`: kampung terbakar—api, bambu retak, langkah jauh, tanpa jeritan eksplisit.
- `AMB-03`: hutan hujan—daun basah, tetes, serangga malam, aliran irigasi.
- `AMB-04`: pos pengungsi—hujan di atap anyaman, panci, batuk jauh, percakapan tak terbaca.
- `AMB-05`: sungai—arus deras, bambu menegang, angin fajar.
- `AMB-06`: makam—angin sawah, burung pagi, daun muda.

## SFX minimum

Langkah tanah/rumput/kayu/air, buka-tutup pintu bambu, ambil/taruh item, kertas dan buku, ikat kain, pahat kayu, lampu minyak, UI confirm/cancel, quest update, stealth alert, napas terluka, api kecil, runtuh bambu, tali tegang, jembatan patah, cipratan sungai, dan transisi cutscene.

Render target: WAV 48 kHz/24-bit untuk master; OGG Vorbis untuk web. Simpan sumber generator dan lisensi pada manifest audio ketika dirender.
