# Benteng Enam Bendera — Demo Multiplayer 2v2

Demo terpisah untuk mode dua Pejuang Republik melawan dua Pasukan Kolonial. Demo lama di `random_game/demo` tidak digunakan atau diubah.

## Fitur

- Tombol **Auto Matchmaking** mempertemukan semua pemain publik yang menekan tombol tersebut.
- Auto matchmaking menunggu 15 detik, lalu setiap slot kosong diisi bot.
- Room privat dengan kode enam karakter tetap tersedia.
- Satu pemain mendapat tiga bot, dua pemain mendapat dua bot, dan tiga pemain mendapat satu bot.
- Dua slot Pejuang dan dua slot Kolonial.
- Anonymous Authentication untuk identitas pemain sementara.
- Browser pembuat room bertindak sebagai host/wasit pertandingan.
- Sinkronisasi input 15 kali per detik dan snapshot dunia 10 kali per detik.
- Combat mengikuti demo pertama: projectile berwaktu tempuh, tembak, pukul popor, reload, perban, dodge dengan invulnerability singkat, serta drop amunisi/perban.
- HP, respawn lima detik, dan spawn protection tetap disesuaikan untuk pertandingan multiplayer.
- Arena memakai langsung atlas utama di `random_game/assets`: petak sawah, kampung Republik, rumah terbakar dengan api/asap animasi, jembatan irigasi, dan markas kolonial.
- Walk cycle bersenjata, action tembak/popor/hit, muzzle flash, impact, debu langkah, serta pickup semuanya memakai aset utama; tidak ada aset visual baru khusus demo ini.
- Kamera HP mengikuti pemain di tengah dengan sabuk hutan di luar batas arena dan minimap benteng di kanan atas.
- Tombol fullscreen mencoba mengunci orientasi landscape; floating analog dan tombol aksi tetap menjadi screen-space UI.
- Magasin kosong otomatis memulai reload selama amunisi cadangan masih tersedia, dan pemain tetap dapat bergerak saat reload.
- Enam titik bendera dengan neutralize, capture, contested state, dan percepatan ketika dua rekan berada di titik.
- Target 200 poin, batas tujuh menit, overtime, dan kemenangan langsung jika enam titik dikuasai selama 12 detik.
- Kontrol desktop dengan mouse serta analog gerak + auto aim untuk browser HP.
- Input aksi dikirim segera, snapshot host dipublikasikan pada 20 Hz tanpa menunggu ACK write sebelumnya, dan pemain remote memakai interpolasi/extrapolasi ringan.
- Pemain non-host mendapat prediksi lokal untuk gerak, tembakan, peluru, muzzle flash, pukulan, dodge, amunisi, dan status reload; hasil damage tetap divalidasi host.

## Alur auto matchmaking

Tekan **Auto Matchmaking** untuk mencari room publik aktif atau membuat antrean publik baru. Manusia diprioritaskan mengisi dua slot Pejuang Republik terlebih dahulu, baru dua slot Kolonial. Jika empat manusia belum terkumpul dalam 15 detik, host mengunci lineup dan mengisi slot kosong:

- 1 manusia + 3 bot
- 2 manusia + 2 bot
- 3 manusia + 1 bot
- 4 manusia tanpa bot dan pertandingan langsung dimulai

Bot memilih capture point, mencari jalur mengitari collision, menembak dan memukul lawan, memakai perban, reload, dodge, respawn, mengambil drop, dan ikut memasang bendera. Room privat masih menyediakan tombol **Mulai sekarang + bot**; auto matchmaking selalu memakai timer 15 detik.

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

Dari folder `random_game` agar path aset utama ikut tersedia:

```powershell
cd random_game
python -m http.server 4173
```

Buka `http://localhost:4173/multiplayer-demo/`.

Untuk menguji empat pemain pada satu komputer, gunakan empat profil browser atau kombinasi browser normal dan incognito. Beberapa tab dalam profil yang sama memakai Anonymous UID yang sama dan akan dianggap sebagai satu pemain.

## Kontrol

### Desktop

- `WASD` atau tombol panah: bergerak
- Mouse: membidik
- Klik kiri atau `Spasi`: menembak
- `E`: memukul dengan popor
- `R`: mengisi peluru
- `F`: memakai perban
- `Shift`: dodge
- Tahan `C`: menetralkan atau memasang bendera

### HP

- Sentuh lalu geser area kosong permainan: memunculkan floating analog untuk bergerak
- Smart auto aim mengunci lawan terlihat dalam jarak senjata dan memprioritaskan ancaman atau perebut titik
- Tombol **Fullscreen**: memperbesar frame dan mencoba mengunci orientasi mendatar
- Minimap kanan atas: posisi pemain, titik bendera, bangunan, dan area kamera
- Tombol **Tembak**: menembak
- Tombol **Pukul**: memukul dengan popor
- Tombol **Perban**: memulihkan HP
- Tahan **Bendera**: menetralkan atau memasang bendera
- Tombol **Isi** dan **Dodge**: reload dan menghindar

## GitHub Pages

Demo membaca aset melalui path `../assets`, sehingga folder `random_game/assets` dan `random_game/multiplayer-demo` harus tetap berada dalam struktur yang sama. Upload seluruh folder `random_game`, lalu aktifkan **Settings → Pages → Deploy from a branch → main → /(root)**. URL demo tetap:

```text
https://yossandiimran.github.io/rv/random_game/multiplayer-demo/
```

## Batasan demo

Host pertandingan masih berjalan di browser pemain pertama, bukan server authoritative. Security Rules mencegah pemain biasa menulis state pertandingan, tetapi host yang memodifikasi JavaScript masih dapat berlaku curang. Arsitektur ini cocok untuk demo bersama teman, bukan pertandingan kompetitif publik.

Jika host menutup browser atau kehilangan koneksi, room ditandai `abandoned` dan pertandingan berakhir. Host migration sengaja belum dimasukkan agar scope demo tetap kecil.
