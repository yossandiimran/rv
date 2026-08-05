# 17 — Content and AI Asset Roadmap

## Tujuan

Menghasilkan fondasi konten yang lengkap sebelum masuk ke implementasi game: desain karakter yang terkunci, cerita dari awal sampai akhir, hubungan karakter yang jelas, dialog Indonesia yang kuat, serta aset AI dengan identitas visual khas milik **Sumpah Merdeka**.

Roadmap ini mengatur **urutan produksi**, bukan menambah scope game.

## Urutan Utama

```text
Style Bible Awal
      ↓
Character Bible + Concept Sheet
      ↓
Cerita Awal–Akhir
      ↓
Story–Character Connection Map
      ↓
Dialog Final + Daftar Ekspresi
      ↓
Character Asset Production
      ↓
Environment, Cutscene, UI, dan Audio Asset
      ↓
Kurasi, Cleanup, dan Integrasi
```

## Phase 1 — Character Design

### Sasaran

Mengunci identitas sembilan karakter utama dan lima side character sebelum menulis dialog final atau membuat animasi produksi.

### Karakter

1. Sutrisno — protagonis.
2. Sastro — ayah.
3. Marni — ibu.
4. Pak Darma — mentor.
5. Bima — sahabat.
6. Sari — kekasih.
7. Karso — pengkhianat.
8. Joyo — teman yang gugur.
9. Kapten Hendrik van Leeuwen — antagonis utama.

Side character: Lastri, Mbah Wiryo, Bu Rukmini, Mantri Rahman, dan Aji.

### Character Bible per Karakter

- Nama final dan cara karakter lain memanggilnya.
- Usia, asal, pekerjaan, pendidikan, serta posisi sosial.
- Keinginan, kebutuhan batin, ketakutan, keyakinan, dan kontradiksi.
- Hubungan dengan setiap karakter utama.
- Cara bicara, kosakata, ritme kalimat, gestur, dan kebiasaan.
- Perubahan emosi dari awal sampai akhir.
- Pakaian serta benda pribadi yang masuk akal untuk tahun 1945.
- Detail yang memerlukan verifikasi sejarah.

### Visual Character Sheet

- Siluet dan proporsi tubuh.
- Tampak depan, samping, dan belakang.
- Warna kulit, bentuk wajah, rambut, serta ciri khas.
- Pakaian utama dan palet warna.
- Benda personal.
- Tiga ekspresi utama: netral/hangat, takut/marah, dan sedih/tegas sesuai karakter.
- Perbandingan tinggi seluruh cast.

### Output Phase 1

- 9 character bible utama dan 5 mini-bible side character.
- 9 concept sheet utama serta satu sheet gabungan side character.
- 1 lineup seluruh karakter.
- 1 dokumen aturan konsistensi wajah, proporsi, dan pakaian.

### Definition of Done

Karakter dapat dikenali hanya dari siluet, warna, cara bicara, dan tindakannya. Tidak ada dua karakter yang memiliki fungsi emosi atau suara yang sama.

> Sprite, portrait ekspresi lengkap, dan animasi final belum dibuat pada tahap ini. Concept sheet menjadi sumber kebenaran untuk produksi aset berikutnya.

## Phase 2 — Full Story: Awal sampai Akhir

### Sasaran

Menulis cerita lengkap berdurasi 160–180 menit berdasarkan struktur di `01_story.md`.

### Pekerjaan

- Pecah Q-00 sampai Q-04 dan Epilog menjadi daftar scene.
- Tentukan lokasi, waktu, karakter hadir, objective, konflik, perubahan emosi, dan transisi setiap scene.
- Pisahkan bagian yang dimainkan, dialog interaktif, dan cutscene.
- Tentukan callback dari aktivitas opsional.
- Beri tanda pada fakta sejarah yang belum diverifikasi.
- Ukur durasi melalui table read dan prototype, bukan perkiraan kata semata.

### Output Phase 2

- Scene list lengkap dari title sampai credit.
- Beat sheet setiap quest.
- Draft naskah seluruh cutscene.
- Daftar flag dan callback Epilog.
- Daftar fakta yang perlu riset.

### Definition of Done

Cerita dapat dibaca dari awal sampai akhir tanpa lubang sebab-akibat, subplot yang tidak selesai, atau adegan yang tidak mengubah karakter, situasi, atau pemahaman pemain.

## Phase 3 — Hubungkan Story dengan Character

### Sasaran

Memastikan cerita terjadi karena keputusan karakter, bukan karena penulis membutuhkan plot bergerak.

### Story–Character Connection Map

Setiap scene mencatat:

- karakter yang menginginkan sesuatu;
- hambatan yang dihadapi;
- keputusan yang dibuat;
- harga atau konsekuensi;
- perubahan hubungan;
- emosi sebelum dan sesudah scene;
- callback yang disiapkan atau dibayar.

### Arc Utama

- **Sutrisno:** rumah → kehilangan → dendam → melihat penderitaan lain → memilih melindungi.
- **Ayah:** prinsip tanggung jawab menjadi kompas moral Sutrisno.
- **Ibu:** kehangatan rumah dan selendang menjadi pengingat alasan Sutrisno bertahan.
- **Darma:** mentor yang memberi kepercayaan dan bertahan untuk melihat Sutrisno tumbuh.
- **Bima:** sahabat serta bagian rumah yang masih hidup.
- **Sari:** kekasih yang memperluas pandangan Sutrisno dari duka pribadi menuju kemanusiaan.
- **Karso:** cinta kepada adik → pengkhianatan → penebusan tanpa penghapusan kesalahan.
- **Joyo:** mimpi menjadi guru → gugur melindungi anak-anak → hidup melalui ruang belajar.
- **Hendrik:** kendali lewat ketakutan → gagal membuat Sutrisno meninggalkan kemanusiaannya.

### Output Phase 3

- Character appearance matrix.
- Relationship map.
- Emotional continuity sheet.
- Setup/payoff checklist.
- Daftar ekspresi, pose, dan animasi yang benar-benar diperlukan tiap scene.

### Definition of Done

Setiap karakter utama memiliki fungsi, keputusan, dan perubahan yang terlihat. Jika satu karakter dihapus, ada bagian penting cerita yang benar-benar hilang.

## Phase 4 — Dialog Bahasa Indonesia

### Sasaran

Menghasilkan dialog yang alami, emosional, mudah dibaca, serta memiliki suara berbeda untuk setiap karakter.

### Aturan

- Gunakan bahasa Indonesia yang membumi dengan rasa era 1940-an, tanpa menjadi kaku.
- Hindari gaul modern, exposition berlebihan, slogan kosong, dan semua karakter berbicara dengan gaya yang sama.
- Dahulukan subteks: karakter tidak selalu mengucapkan emosi secara langsung.
- Gunakan keheningan, gerak, ambience, atau tindakan ketika kata-kata justru melemahkan adegan.
- Pilihan pemain maksimal tiga dan harus menghasilkan respons yang relevan.
- Baris dibuat nyaman untuk dialog box mobile.

### Proses

1. Draft berdasarkan scene goal dan voice guide.
2. Cek konsistensi fakta serta hubungan.
3. Table read dengan suara keras.
4. Potong kalimat yang mengulang visual atau informasi.
5. Uji di dialog box.
6. Tandai ekspresi portrait, gesture, musik, ambience, dan jeda.

### Output Phase 4

- Naskah dialog lengkap Q-00 sampai Epilog.
- Data dialog dengan ID, choice, flag, dan callback.
- Voice guide final sembilan karakter utama dan panduan ringkas side character.
- Daftar ekspresi dan gesture per node penting.
- Subtitle/caption untuk suara naratif penting.

### Definition of Done

Nama pembicara dapat disembunyikan dan pembaca tetap dapat menebak karakter dari pilihan kata, ritme, serta cara merespons konflik.

## Phase 5 — AI Asset Production

### Sasaran

Menghasilkan seluruh aset visual dan audio dengan AI, kemudian mengkurasi serta membersihkannya agar terasa sebagai satu karya, bukan kumpulan output acak.

### Working Art Style — Garis Merdeka

Gaya orisinal proyek yang memadukan:

- kehangatan dan ekspresi animasi 2D Indonesia;
- bentuk wajah membumi dan tidak terlalu anime;
- garis tinta digital sedikit patah, bersudut lembut, dan memiliki tebal-tipis;
- siluet sederhana yang mudah dibaca;
- warna tanah, indigo kusam, hijau daun, cokelat tembakau, merah bata, dan emas fajar;
- ritme bentuk yang terinspirasi kerajinan serta tekstil Nusantara secara halus, bukan menempelkan motif budaya secara acak;
- komposisi sinematik tetapi intim, dengan fokus pada tangan, tatapan, rumah, dan jarak antar manusia.

Pada sprite top-down, garis disederhanakan menjadi pixel cluster bersih. Ciri garis **Garis Merdeka** paling terlihat pada portrait, still-frame, UI frame, dan key art.

### Larangan Visual

- Meniru studio, film, seri, atau seniman tertentu.
- Anime generik, mata berlebihan, chibi, photorealism, atau kilau AI yang plastik.
- Detail modern, fantasy, steampunk, dan simbol militer hasil karangan.
- Motif batik/wayang/ornamen yang ditempel tanpa konteks daerah dan fungsi.
- Tekstur serta garis terlalu ramai hingga melelahkan dilihat.

### Urutan Aset

1. Style reference board dan palette.
2. Character concept sheet.
3. Character lineup.
4. Portrait dan ekspresi berdasarkan kebutuhan dialog final.
5. Sprite idle/walk/action berdasarkan kebutuhan gameplay.
6. NPC dan musuh dari base design terkunci.
7. Tileset, environment state, dan prop.
8. Still-frame cutscene.
9. UI, icon, title art, serta credit art.
10. Musik, ambience, dan SFX.

### Anggaran Aset

- 9 character concept utama.
- 5 side character dari 3–4 base body.
- 9 portrait utama dengan 1–3 ekspresi sesuai kebutuhan scene.
- 4–6 base sprite NPC tambahan jika diperlukan.
- 4 visual archetype musuh yang berbagi 2 base AI + variasi Hendrik + 1 intermediary non-combat.
- 5 varian medan protagonis/companion + 1 walk sprite Kolonel Sutrisno untuk Epilog.
- 1 armored car core akhir 1945, 1 cargo truck, dan 1 Stuart-inspired light tank opsional 1946+.
- 1 atlas pickup senjata, 1 atlas combat equipment, serta action sheet bersama untuk rifle combat.
- 4 terrain atlas 32×32: base pedesaan, jalan, sungai, serta sawah/teras; semuanya wajib seam test.
- 2 atlas bangunan eksterior, 4 interior shell, 16 interior prop, 12 river crossing overlay.
- 12 pohon/tanaman besar, 16 ground vegetation, 16 obstacle/utilitas, dan 16 ground decals.
- Maksimal 6 still-frame.
- 3 track, 5 ambience, dan 20–25 SFX.

### Pipeline per Aset

```text
Brief + Canon + Reference
        ↓
AI Draft Variants
        ↓
Director Selection
        ↓
Revision / Inpainting
        ↓
Pixel Cleanup / Color Match
        ↓
Technical Export
        ↓
In-Game Test
        ↓
Approve + Provenance Record
```

### Definition of Done

- Konsisten dengan character sheet dan style bible.
- Akurat terhadap konteks sejarah yang telah diverifikasi.
- Bersih pada resolusi permainan dan tidak membosankan saat dilihat lama.
- Memiliki hak penggunaan serta provenance yang jelas.
- Sudah diuji di dalam game, bukan hanya terlihat bagus sebagai gambar terpisah.

## Gate Produksi

| Gate | Syarat sebelum lanjut |
|---|---|
| Character Lock | Bible, concept sheet, lineup, dan palet disetujui |
| Story Lock | Scene list, sebab-akibat, ending, dan durasi lengkap |
| Dialogue Lock | Voice guide, table read, flag, serta callback lulus |
| Asset Lock | Style, sejarah, ukuran teknis, dan provenance lulus |
| Integration Lock | Aset terbaca, konsisten, ringan, dan berfungsi di game |

## Prinsip Akhir

Sedikit aset yang sangat konsisten lebih berharga daripada banyak aset yang menarik sendiri-sendiri. Semua keputusan visual harus memperkuat keluarga, emosi, dan penghormatan kepada Indonesia.
