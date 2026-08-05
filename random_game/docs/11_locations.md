# 11 — Locations

## Scope

Empat area utama dengan beberapa state. Tidak ada world map besar, kota penuh, pelabuhan, kendaraan, atau banyak wilayah Jawa Timur pada rilis 17 Agustus.

## LOC-01 — Rumah dan Kampung

- **State A:** senja damai untuk Q-00.
- **State B:** malam terbakar untuk Q-01.
- **Isi:** rumah keluarga, rumah Bima, sumur, kebun, jalan utama, titik berkumpul, serta jalur keluar.
- **Tujuan emosi:** membangun rumah lalu memperlihatkan kehilangannya.
- **Optimasi:** layout sama; state B mengganti lighting, prop, collision, ambience, dan beberapa tile rusak.

## LOC-02 — Jalur Hutan

- Jalan tanah, pepohonan, sungai kecil, jembatan kayu, dan tempat persembunyian.
- Dipakai untuk pelarian Q-01 serta perjalanan Q-03 dengan rute berbeda.
- Menampung tutorial stealth dan satu encounter combat.

## LOC-03 — Pos Pengungsi

- Tenda, dapur umum, area medis, api unggun, tempat Bima dirawat, serta titik briefing Pak Darma.
- Menjadi hub pendek untuk Q-02 dan persiapan Q-03/Q-04.
- Sari bekerja di area medis, Joyo mencatat nama anak, Karso menyembunyikan hilangnya Lastri, dan NPC yang ditolong berkumpul di sini.

## LOC-04 — Jalur Evakuasi

- Gabungan jalan sempit, rintangan, tempat Karso/Lastri membuka jalur, penyeberangan tempat Joyo gugur, posisi Darma terluka, dan area aman di seberang.
- Dipakai pada Q-04.
- State malam menuju fajar dibuat melalui transisi scene, bukan sistem waktu dinamis.

## Epilog

Makam keluarga menggunakan sebagian aset kampung dan environment sederhana. Hanya satu layar kecil dengan latar fajar/siang.

## Anggaran Tileset dan Prop

- Satu tileset pedesaan utama.
- Satu extension hutan.
- Prop rumah, kampung, medis, dan pengungsian.
- Variasi damai/rusak dibuat dari aset yang sama.
- Maksimal lima background/still-frame unik termasuk Epilog.

## Template

```yaml
id:
name:
state:
related_quest:
spawn_point:
npcs:
interactions:
collision_map:
music:
ambience:
historical_sources:
```
