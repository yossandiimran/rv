# Demo Kombat — Serbuan Kampung

Demo ini memperlihatkan Sutrisno menahan tiga gelombang pasukan musuh agar Darma dapat membuka jalur evakuasi warga. Tidak ada audio pada versi ini.

## Menjalankan demo

Dari folder `random_game`, jalankan:

```powershell
python -m http.server 4173
```

Lalu buka `http://localhost:4173` di browser. Demo juga dapat dibuka langsung melalui `index.html`, tetapi server lokal lebih konsisten untuk memuat aset.

## Kontrol desktop

- `WASD` atau tombol panah: bergerak
- Mouse: membidik
- Klik kiri atau `Spasi`: menembak
- `E`: serangan jarak dekat
- `R`: mengisi peluru
- `F`: memakai perban
- `Shift`: menghindar
- `Esc`: jeda

Pada layar sentuh, gerakkan analog virtual dengan jempol kiri. Jempol kanan digunakan untuk menembak, memukul, mengisi peluru, memakai perban, atau menghindar. Tombol tembak dapat ditahan dan otomatis membidik musuh terdekat.

## Alur demo

1. Sutrisno bertahan dari pasukan yang masuk melalui jalan timur.
2. Pemain menghadapi tiga gelombang dengan tipe musuh dan tempo serangan berbeda.
3. Musuh dapat menjatuhkan peluru atau perban.
4. Setelah gelombang terakhir, pemain harus mundur melalui jembatan selatan untuk menyelesaikan demo.

Semua visual permainan memakai aset AI yang sudah ada di folder `assets`. Implementasi demo menggunakan Canvas 2D tanpa dependensi tambahan.
