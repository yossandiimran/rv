# 16 — Release Plan: 17 Agustus 2026

## Sasaran

Merilis satu game browser yang pendek, lengkap, stabil, dan emosional. Target konten 2,5–3 jam bersifat batas atas; alur utama yang selesai lebih penting daripada menambah durasi dengan konten pengisi.

## Aturan Produksi

- Setiap hari harus menghasilkan build yang dapat dimainkan.
- Placeholder dipakai sampai sistem terbukti bekerja.
- Aset final dibuat setelah ukuran dan kontrak teknis dikunci.
- Tidak menambah fitur di luar `00_concept.md`.
- Backup build kandidat dilakukan sebelum perubahan besar.

## Jadwal

### 5 Agustus — Kunci Scope dan Spike

- Kunci dokumen 00–16.
- Uji engine dengan movement, collision, dialog, touch, dan build web.
- Putuskan resolusi, tile, serta sprite contract.

### 6 Agustus — Fondasi

- Boot, preload, scaling, input desktop/mobile.
- Movement, collision, kamera, dan interaksi.
- Placeholder map rumah/kampung.

### 7 Agustus — Narasi Data-Driven

- Dialog, pilihan, flag, objective, checkpoint, dan save/continue.
- Implementasi Q-00 dengan placeholder.

### 8 Agustus — Prolog

- Selesaikan rumah, kampung, NPC, dan makan malam.
- Integrasikan character sheet serta aset prioritas keluarga.

### 9 Agustus — Serangan

- State kampung terbakar.
- Patroli, stealth, evakuasi, dan CS-01/CS-02.

### 10 Agustus — Pos Pengungsi

- Q-02, Sari, Bima, Darma, serta callback warga.
- Audio dan portrait prioritas.

### 11 Agustus — Misi Kurir

- Jalur hutan, Q-03, satu combat encounter, pesan, dan checkpoint.

### 12 Agustus — Finale

- Jalur evakuasi, Q-04, pengorbanan Darma, Sumpah, dan fajar.

### 13 Agustus — Epilog dan UI

- Epilog, credit, dedikasi, historical-fiction notice, settings, dan content warning.

### 14 Agustus — Integrasi Aset dan Mobile

- Ganti placeholder penting.
- Perbaiki touch controls, scaling, loading, audio, dan performa.

### 15 Agustus — Full Playtest

- Mainkan dari title sampai credit.
- Perbaiki blocker, save, collision, urutan dialog, serta softlock.
- Potong konten opsional yang belum stabil.

### 16 Agustus — Release Candidate

- Freeze fitur.
- Uji browser/perangkat target.
- Optimasi build, cek lisensi/provenance, buat backup, dan siapkan hosting.

### 17 Agustus — Rilis

- Smoke test build produksi.
- Publikasikan.
- Pantau error fatal dan siapkan hotfix kecil.

## Prioritas Jika Terlambat

1. Pertahankan alur lengkap dan Epilog.
2. Pertahankan keluarga, Q-00, Q-01, serta klimaks evakuasi.
3. Potong aktivitas opsional.
4. Kurangi portrait, animasi, variasi NPC, dan dekorasi.
5. Ubah encounter bermasalah menjadi stealth/dialog.
6. Jangan menambah sistem baru.

## Release Checklist

- [ ] Title sampai credit dapat diselesaikan tanpa blocker.
- [ ] Autosave/continue bekerja.
- [ ] Keyboard dan touch dapat menyelesaikan semua objective.
- [ ] Tidak ada placeholder yang merusak pemahaman cerita.
- [ ] Content warning dan historical-fiction notice tampil.
- [ ] Sumber sejarah, aset, tool AI, musik, font, dan library tercatat.
- [ ] Tidak ada aset tanpa hak penggunaan yang jelas.
- [ ] Build produksi sudah diuji dari hosting, bukan hanya lokal.
