# Benteng Enam Bendera — Demo Multiplayer 2v2

Demo terpisah untuk mode dua Pejuang Republik melawan dua Pasukan Kolonial. Demo lama di `random_game/demo` tidak digunakan atau diubah.

## Fitur

- Lobby Firebase dengan kode room enam karakter.
- Matchmaking otomatis selama sepuluh detik, lalu setiap slot kosong diisi bot.
- Satu pemain mendapat tiga bot, dua pemain mendapat dua bot, dan tiga pemain mendapat satu bot.
- Dua slot Pejuang dan dua slot Kolonial.
- Anonymous Authentication untuk identitas pemain sementara.
- Browser pembuat room bertindak sebagai host/wasit pertandingan.
- Sinkronisasi input 15 kali per detik dan snapshot dunia 10 kali per detik.
- Combat, peluru, reload, dodge, HP, respawn lima detik, dan spawn protection.
- Enam titik bendera dengan neutralize, capture, contested state, dan percepatan ketika dua rekan berada di titik.
- Target 200 poin, batas tujuh menit, overtime, dan kemenangan langsung jika enam titik dikuasai selama 12 detik.
- Kontrol desktop serta dual analog untuk browser HP.

## Alur matchmaking bot

Timer dimulai saat host membuat room. Jika empat manusia belum terkumpul dalam sepuluh detik, host mengunci lineup dan mengisi slot kosong:

- 1 manusia + 3 bot
- 2 manusia + 2 bot
- 3 manusia + 1 bot
- 4 manusia tanpa bot dan pertandingan langsung dimulai

Bot memilih capture point, mencari jalur mengitari collision, menembak lawan, reload, dodge, respawn, dan ikut memasang bendera. Tombol **Mulai sekarang + bot** memungkinkan host melewati sisa timer.

## Menyiapkan Firebase

Konfigurasi Firebase Web sudah disalin dari aplikasi chat di root project. Sebelum demo dapat membuat room:

1. Buka Firebase Console untuk project `chat-random-cfc2c`.
2. Buka **Authentication → Sign-in method** dan aktifkan **Anonymous**.
3. Di **Authentication → Settings → Authorized domains**, tambahkan domain GitHub Pages, misalnya `username.github.io`.
4. Buka **Realtime Database → Rules**.
5. Gabungkan node `gameMatches` dari `firebase-game-rules-snippet.json` ke dalam object `rules` yang sudah ada.

Jangan mengganti seluruh rules database dengan file snippet jika aplikasi chat masih memakai database yang sama. Snippet hanya berisi node `gameMatches`; pertahankan rules `rooms` milik chat.

Contoh bentuk penggabungan:

```json
{
  "rules": {
    "rooms": {
      "...rules chat yang sudah ada...": "..."
    },
    "gameMatches": {
      "...salin isi gameMatches dari snippet...": "..."
    }
  }
}
```

Firebase config bukan mekanisme otorisasi. Jangan membuka root database dengan `.write: true`; akses game harus dibatasi oleh Anonymous Auth dan rules per pemain.

## Menjalankan lokal

Dari folder demo:

```powershell
cd random_game\multiplayer-demo
python -m http.server 4173
```

Buka `http://localhost:4173`.

Untuk menguji empat pemain pada satu komputer, gunakan empat profil browser atau kombinasi browser normal dan incognito. Beberapa tab dalam profil yang sama memakai Anonymous UID yang sama dan akan dianggap sebagai satu pemain.

## Kontrol

### Desktop

- `WASD` atau tombol panah: bergerak
- Mouse: membidik
- Klik kiri atau `Spasi`: menembak
- Tahan `E`: menetralkan atau memasang bendera
- `R`: mengisi peluru
- `Shift`: dodge

### HP

- Analog kiri: bergerak
- Analog kanan: membidik
- Tombol **Tembak**: menembak
- Tahan **Bendera**: menetralkan atau memasang bendera
- Tombol **Isi** dan **Dodge**: reload dan menghindar

## GitHub Pages

Folder ini self-contained, termasuk aset runtime. Untuk repository khusus demo, upload seluruh isi folder ini ke root repository, lalu aktifkan **Settings → Pages → Deploy from a branch → main → /(root)**.

## Batasan demo

Host pertandingan masih berjalan di browser pemain pertama, bukan server authoritative. Security Rules mencegah pemain biasa menulis state pertandingan, tetapi host yang memodifikasi JavaScript masih dapat berlaku curang. Arsitektur ini cocok untuk demo bersama teman, bukan pertandingan kompetitif publik.

Jika host menutup browser atau kehilangan koneksi, room ditandai `abandoned` dan pertandingan berakhir. Host migration sengaja belum dimasukkan agar scope demo tetap kecil.
