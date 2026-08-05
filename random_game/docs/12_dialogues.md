# 12 — Dialogues

## Prinsip

- Bahasa Indonesia membumi dengan rasa era 1940-an tanpa menjadi kaku.
- Hindari gaul modern, exposition, slogan kosong, dan semua karakter berbicara dengan pola sama.
- Dahulukan subteks; rasa cinta, takut, bersalah, dan duka tidak selalu disebut langsung.
- Setelah tragedi, hening serta tindakan dapat menggantikan kalimat.
- Pilihan maksimal tiga dan mengubah nada, callback, atau respons—bukan alur sejarah utama.

## Voice Guide

- **Sutrisno:** langsung dan impulsif; kalimatnya memendek ketika marah, lalu menjadi tenang di finale.
- **Sastro:** hemat kata, memakai perumpamaan dari pekerjaan kayu dan tanggung jawab.
- **Marni:** hangat, tegas, jenaka, serta cepat membaca perasaan Sutrisno.
- **Darma:** instruktif dan pendek; tidak menganggap perang sebagai petualangan.
- **Bima:** bercanda untuk menutupi takut; humor menghilang sesaat setelah serangan.
- **Sari:** tajam dan empatik; berani menyebut ketika tindakan Sutrisno egois.
- **Karso:** praktis, defensif, dan banyak menahan kalimat; setelah terungkap, ia berbicara tanpa mencari alasan indah.
- **Joyo:** tenang, suka bertanya, dan sering berbicara tentang nama serta masa depan anak-anak.
- **Hendrik:** formal, dingin, sopan sebagai alat kuasa, dan tidak pernah menganggap warga setara.

## Dialog Gema

### Keluarga

- **Sastro:** “Berani itu bukan maju paling depan. Berani itu tahu siapa yang menjadi tanggunganmu.”
- **Sutrisno:** “Kalau pagarnya roboh lagi, berarti paku ini yang tidak bertanggung jawab.”
- **Marni:** “Pakunya tidak salah. Tukangnya yang terlalu banyak bicara.”

### Sutrisno dan Sari

- **Sari:** “Kau terus bicara tentang mereka yang pergi. Sekali saja, lihat siapa yang masih menunggumu.”
- **Sutrisno:** “Kalau aku berhenti marah, apa yang tersisa?”
- **Sari:** “Kami.”

### Pengkhianatan

- **Bima:** “Berapa nyawa yang kau tukar untuk satu nama?”
- **Karso:** “Nama itu adikku.”
- **Sari:** “Dan mereka yang diserang juga keluarga seseorang.”
- **Karso:** “Aku tahu. Itu yang akan kubawa kalau aku masih hidup besok.”

### Joyo

- **Joyo:** “Kalau perang selesai, aku mau mengajar.”
- **Sutrisno:** “Mengajar apa?”
- **Joyo:** “Nama mereka sendiri. Supaya kelak tidak ada yang mudah menghapusnya.”

### Antagonis

- **Hendrik:** “Berikan jalurnya. Adikmu pulang.”
- **Karso:** “Dan warga?”
- **Hendrik:** “Mereka memilih berada di jalan yang salah.”

### Klimaks

- **Darma:** “Jangan kejar dia. Lihat belakangmu.”
- **Sutrisno:** “Kalau kulepas, dia akan pergi.”
- **Darma:** “Yang di belakangmu juga akan pergi—kalau kau tinggalkan.”

## Format Data

```json
{
  "id": "DLG-Q00-001",
  "speaker": "Marni",
  "portrait": "marni_hangat",
  "text": "Pulang sebelum lampu minyak dinyalakan. Ayahmu menunggu makan bersama.",
  "choices": [
    {
      "text": "Iya, Bu. Aku tidak lama.",
      "next": "DLG-Q00-002",
      "effects": [{ "type": "set_flag", "key": "promised_to_return", "value": true }]
    }
  ]
}
```

## Proses Finalisasi

1. Tulis berdasarkan tujuan scene dan voice guide.
2. Cek setup/payoff serta fakta.
3. Baca keras melalui table read.
4. Potong pengulangan visual dan exposition.
5. Uji panjang baris pada mobile.
6. Tandai ekspresi, gesture, musik, ambience, dan jeda.

## Batas Scope

Tidak ada relationship score, romance tree, banyak ending, atau percakapan camp berulang. Romance, pengkhianatan, kematian Joyo, dan antagonis berada langsung di jalur cerita utama.
