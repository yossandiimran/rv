# 10 — Enemy and Antagonist

> Afiliasi, unit, pangkat, seragam, dan perlengkapan antagonis adalah placeholder sampai riset sejarah mengunci konteks akhir 1945 yang masuk akal.

## Antagonis Utama — Kapten Hendrik van Leeuwen

- Komandan operasi yang ingin memutus jaringan pejuang dan bantuan warga.
- Meyakini ketertiban melalui kekuatan akan mengakhiri konflik lebih cepat.
- Memperlakukan keluarga sebagai alat tekanan: Lastri ditahan untuk memaksa Karso memberikan jalur.
- Tenang, terukur, dan jarang meninggikan suara; kuasa serta keputusannya menjadi sumber ancaman.
- Tidak diberi monolog panjang atau masa lalu yang meminta pemain memaafkannya.
- Hadir pada tiga titik: perintah serangan Prolog, tekanan terhadap Karso, dan finale.
- Mundur pada akhir. Sutrisno memilih warga daripada mengejarnya.
- Tidak menjadi boss dan tidak memerlukan AI unik; ia menggunakan variasi sprite serta scripting.

## Prinsip Representasi

- Musuh adalah kombatan manusia, bukan bangsa atau etnis.
- Menghindar selalu valid; jumlah musuh yang dikalahkan tidak menjadi skor.
- Motif Hendrik membuatnya dapat dipahami sebagai karakter, tetapi tidak membenarkan kekerasan atau pemerasannya.
- Kekerasan terhadap warga disampaikan melalui dampak, bukan perilaku acak untuk membuat pasukan terlihat jahat.

## Archetype Gameplay

### Patroli

Berjalan mengikuti rute; mempunyai jarak pandang, status curiga, alarm, mengejar, mencari, lalu kembali.

### Penjaga Bersenapan

Menjaga satu posisi atau area kecil dan menembak jika pemain terlihat. Digunakan dalam dua encounter pendek.

Keduanya memakai dasar AI dan sprite yang sama. Hendrik memakai scripting scene dan tidak ikut combat langsung.

## Perilaku Minimum

Idle/patrol → suspicious → alert → chase/shoot → search → return.

Tidak ada flanking kompleks, grenade AI, sniper, morale simulation, atau squad tactics pada rilis pertama. Kendaraan hanya menjadi obstacle, scripted threat, atau set-piece; bukan AI kendaraan penuh.

## Anggaran

- Satu base sprite pasukan.
- Satu variasi visual Hendrik.
- Maksimal 3–5 musuh aktif dalam satu scene.
- Animasi minimum: idle, walk, aim/shoot, hit/death.

## Visual Archetype Expansion

Empat kombatan tetap berbagi dua dasar AI di atas; perbedaannya terutama siluet, equipment, parameter pandangan, dan penempatan:

1. **Regular rifle patrol** — patroli dasar dengan senapan panjang.
2. **Stationary sentry** — penjaga lebih berat dengan webbing; area gerak sempit.
3. **Light scout/tracker** — siluet ringan, carbine, dan jarak curiga sedikit lebih panjang.
4. **Veteran sergeant/alarm leader** — visual pemimpin; dapat memicu alarm scripted, tetapi bukan AI squad baru.
5. **Plainclothes intermediary** — NPC non-combat yang menghubungi Karso.

Semua karakter musuh dibuat berbeda usia, bentuk tubuh, dan latar visual. Mereka tidak memakai simbol bangsa sebagai shorthand kejahatan dan tidak menggunakan insignia unit nyata sebelum riset sejarah dikunci.

## Kendaraan

- **Armored reconnaissance car:** kendaraan inti yang lebih aman untuk set-piece akhir 1945.
- **Cargo truck:** transportasi pasukan/barikade bergerak; tidak mempunyai combat AI.
- **Stuart-inspired light tank:** aset opsional untuk konten 1946+, bukan otomatis ditempatkan pada cerita inti akhir 1945.
- State runtime kendaraan: empat arah; kendaraan tempur memiliki kondisi normal dan rusak.

Foto arsip menunjukkan pasukan Inggris/India berada di Jawa pada akhir 1945, sedangkan dokumentasi Stuart KNIL yang dipakai sebagai batas visual tank bertanggal Agustus 1946. Karena itu kendaraan dan afiliasi final harus mengikuti lokasi/tanggal scene, bukan sekadar memakai semua aset yang tersedia.

## Template Data

```yaml
id:
role:
chapter:
patrol_path:
vision_range:
weapon:
hp:
damage:
historical_unit:
historical_sources:
```
