// Campaign order follows the revised roster. Satire only: attacks are arcade metaphors, not factual claims.
// ai: reaction = frames of delay before blocking, aggression 0..1, block = block chance when threatened,
// specialEvery = min frames between specials, dmg = damage multiplier, hp/speed override base stats.
import { M } from "./moves.js";
import { FIT_FULL_PANEL } from "./config.js";
const S = "assets/sheets/enemy-", E = "assets/thumbs/";
const b = (id, name, theme, taunt, thumb, color, stats, ai, specialType = "projectile") =>
  ({ id, name, theme, taunt, thumb: E + thumb, sheet: S + id + "-combat-v1.png", color, stats, ai, specialType });

// intro line: real viral quote when `tauntQuote` is true (see ../QUOTES.md), otherwise just a tagline.
const QUOTED = new Set(["dody-hanggodo","nusron-wahid","natalius-pigai","rudy-masud","bahlil-lahadalia","hashim-djojohadikusumo","teddy-indra-wijaya","prabowo-subianto"]);
export const BOSSES = [
  b("buzzer", "Buzzer", "Arc I · Noise", "Opini dibeli, fakta menyusul.", "01-buzzer-v3.png", "#6ec1ff",
    { hp: 70, attack: 6, defense: 3, speed: 5 }, { reaction: 30, aggression: 0.35, block: 0.15, specialEvery: 260, dmg: 1 }),
  b("dody-hanggodo", "Dody Hanggodo", "Arc II · Birokrasi", "Kalau teknis, baru saya serius!", "02-dody-hanggodo-v3.png", "#c9a227",
    { hp: 85, attack: 7, defense: 5, speed: 5 }, { reaction: 26, aggression: 0.4, block: 0.25, specialEvery: 240, dmg: 1 }),
  b("nusron-wahid", "Nusron Wahid", "Arc II · Birokrasi", "Semua tanah milik negara!", "03-nusron-wahid-v3.png", "#8a6d3b",
    { hp: 100, attack: 8, defense: 6, speed: 5 }, { reaction: 24, aggression: 0.45, block: 0.3, specialEvery: 230, dmg: 1 }),
  b("natalius-pigai", "Natalius Pigai", "Arc II · Birokrasi", "Saya mau bangun Sekolah HAM!", "04-natalius-pigai-v3.png", "#e07b39",
    { hp: 105, attack: 8, defense: 6, speed: 6 }, { reaction: 22, aggression: 0.5, block: 0.3, specialEvery: 200, dmg: 1.05 }, "projectile"),
  b("rudy-masud", "Rudy Mas'ud", "Arc III · Privilege", "Gubernur Konten!", "05-rudy-masud-v3.png", "#3b8ea5",
    { hp: 115, attack: 9, defense: 7, speed: 6 }, { reaction: 20, aggression: 0.55, block: 0.35, specialEvery: 200, dmg: 1.05 }),
  b("syarifah-suraidah", "Syarifah Suraidah", "Arc III · Privilege", "Panggung selangit, rakyat di barisan belakang.", "05b-syarifah-suraidah-v3.png", "#e8b923",
    { hp: 110, attack: 9, defense: 6, speed: 7 }, { reaction: 18, aggression: 0.6, block: 0.35, specialEvery: 180, dmg: 1.1 }),
  b("bahlil-lahadalia", "Bahlil Lahadalia", "Arc IV · Resources", "You larang, tapi minta!", "06-bahlil-lahadalia-v3.png", "#d9534f",
    { hp: 135, attack: 10, defense: 8, speed: 6 }, { reaction: 16, aggression: 0.6, block: 0.4, specialEvery: 170, dmg: 1.15 }),
  b("hashim-djojohadikusumo", "Hashim Djojohadikusumo", "Arc V · Influence", "Akun medsos? Saya tidak punya.", "07-hashim-djojohadikusumo-v3.png", "#7d5ba6",
    { hp: 140, attack: 10, defense: 9, speed: 6 }, { reaction: 14, aggression: 0.65, block: 0.45, specialEvery: 160, dmg: 1.2 }),
  b("teddy-indra-wijaya", "Teddy Indra Wijaya", "Arc VI · Inner Circle", "Kuch kuch hota hai...", "08a-teddy-indra-wijaya-v3.png", "#e8e8e8",
    { hp: 130, attack: 9, defense: 9, speed: 8 }, { reaction: 10, aggression: 0.7, block: 0.55, specialEvery: 150, dmg: 1.2 }),
  b("prabowo-subianto", "Prabowo Subianto", "Arc VII · The Last Stand", "Kelapa sawit itu pohon, ada daunnya kan?", "08b-prabowo-subianto-v3.png", "#b32d2d",
    { hp: 180, attack: 11, defense: 10, speed: 6 }, { reaction: 8, aggression: 0.8, block: 0.5, specialEvery: 130, dmg: 1.25 }),
];

// Boss combos. "quote" = what the boss shouts when the finisher lands.
// verified: true -> phrase was widely reported as said by that person (see ../QUOTES.md for sources).
// verified: false -> generic arcade shout describing the move, NOT a claim about what the person said.
// Each boss mixes finisher styles (slam / launch / multi / wave) so fights stay varied.
const K = (seq, name, quote, verified, move) => ({ seq, name, quote, verified, move });
const COMBOS = {
  "buzzer": [K("AAB", "Ratio Beruntun", "RATIO! FIX NO DEBAT!", false, M.slam(1, 11)), K("BBA", "Spam Komentar", "GASKEUN, YANG PENTING VIRAL!", false, M.launch(5, 12)), K("AAA", "Spam Notifikasi", "NOTIFIKASI BERTUBI-TUBI!", false, M.wave(11))],
  "dody-hanggodo": [K("AAB", "Berkas Beruntun", "KALAU TEKNIS, BARU SAYA SERIUS!", true, M.slam(1, 12)), K("BBA", "Disposisi Berlapis", "ULANG DARI AWAL!", false, M.launch(5, 13)), K("BBB", "Tumpukan Berkas", "BERKAS BERTUMPUK!", false, M.multi(5, 5, 6, 3))],
  "nusron-wahid": [K("AAB", "Sita Lahan", "SEMUA TANAH MILIK NEGARA!", true, M.slam(1, 13)), K("BBA", "Tanah Nganggur", "TANAH NGANGGUR DIAMBIL NEGARA!", true, M.launch(5, 14)), K("ABB", "Patok Berlapis", "PATOK DI MANA-MANA!", false, M.multi(5, 5, 6, 3))],
  "natalius-pigai": [K("AAB", "Sekolah HAM", "SAYA MAU BANGUN SEKOLAH HAM!", true, M.slam(1, 14)), K("BBA", "Tambah Anggaran", "TAMBAH ANGGARAN RP20 TRILIUN!", true, M.launch(5, 15)), K("AAA", "Interupsi", "INTERUPSI!", false, M.wave(13)), K("ABB", "Pacar Tiga", "PACAR SAYA 3!", true, M.multi(5, 5, 6, 3))],
  "rudy-masud": [K("AAB", "Gubernur Konten", "GUBERNUR KONTEN!", true, M.slam(1, 14)), K("BBA", "Ketok Anggaran", "PROPOSAL DITERIMA!", false, M.launch(5, 16)), K("ABB", "Live Dulu", "LIVE DULU, KERJA BELAKANGAN!", false, M.multi(5, 5, 6, 3))],
  "syarifah-suraidah": [K("AAB", "Kipas Selangit", "GAYA SELANGIT!", false, M.slam(1, 14)), K("ABA", "Tas Hantam", "MINGGIR, ADA YANG LEWAT!", false, M.launch(5, 15)), K("BBB", "Hujan Perhiasan", "KILAU!", false, M.multi(5, 5, 6, 3))],
  "bahlil-lahadalia": [K("AAB", "Larang Tapi Minta", "YOU LARANG, TAPI MINTA!", true, M.slam(1, 17)), K("BBA", "Transisi Pelan-Pelan", "TRANSISI ENERGI JANGAN BURU-BURU!", true, M.launch(5, 18)), K("AAA", "Semburan Pipa", "TEKANAN NAIK!", false, M.wave(16))],
  "hashim-djojohadikusumo": [K("AAB", "Skakmat Ekonomi", "SEMUA BIDAK DI TEMPATNYA!", false, M.slam(1, 18)), K("BBA", "Akun Hantu", "AKUN MEDSOS? SAYA TIDAK PUNYA!", true, M.launch(5, 19)), K("ABB", "Skak Beruntun", "SKAK!", false, M.multi(5, 6, 6, 3)), K("BAB", "Pajak Digital", "PAJAK DIGITAL MULAI 9 NOVEMBER!", true, M.wave(17))],
  "teddy-indra-wijaya": [K("AAB", "Atur Jadwal", "JADWAL SUDAH SAYA ATUR!", false, M.slam(1, 17)), K("BBA", "Duet India", "KUCH KUCH HOTA HAI!", true, M.launch(5, 18)), K("AAA", "Walkie Berondong", "ROGER!", false, M.wave(15))],
  "prabowo-subianto": [
    K("AAB", "Sawit Itu Pohon", "KELAPA SAWIT ITU POHON, ADA DAUNNYA KAN?", true, M.slam(1, 18)),
    K("BBA", "Serakahnomics", "SERAKAHNOMICS!", true, M.launch(5, 20, 32)),
    K("ABA", "Ndasmu", "NDASMU!", true, M.multi(5, 5, 5, 4)),
    K("BAB", "Nyenyenye", "NYENYENYENYE!", false, M.wave(16)), // generic mocking shout, not a sourced quote
    K("AAA", "Piring Terbang MBG", "PERUT LAPAR LEBIH GENTING!", true, M.wave(17, { speed: 6.5 })),
    K("BBB", "Kopdes Merah Putih", "80 RIBU KOPDES MERAH PUTIH!", true, M.rush(1, 19)),
    K("BAA", "Cabut Saja", "SIAPA PUN KALAU MELANGGAR, CABUT SAJA!", true, M.slam(1, 19)), // on forest-fire concession holders, 22 Oct 2026
    K("ABB", "Sapu Lidi", "LIDI KALAU SENDIRIAN LEMAH!", true, M.multi(5, 5, 5, 4)),
  ],
};
BOSSES.forEach((b) => { b.combos = COMBOS[b.id] ?? []; });

// Barks: short lines the boss says whenever one of its attacks lands on the player (one random line, no immediate repeats).
// Lines marked (V) are phrases publicly reported as said by that person (see ../QUOTES.md); the rest are generic themed
// arcade barks about the character's role, NOT claims about what the person said.
const BARKS = {
  "buzzer": ["VIRAL!", "RATIO!", "GAK ADA DEBAT!", "FYP, BRO!", "SPAM!", "TRENDING!", "NGOMONG APA SIH?", "UNFOLLOW!", "WKWKWK!", "KLIK UMPAN!", "KLARIFIKASI NANTI!", "INI HOAKS, BRO!", "SCREENSHOT AJA!", "HAPUS TWEET!", "AKUN BARU!", "CEK FAKTA? NANTI!", "BOT ON!", "TAG TEMENMU!"],
  "dody-hanggodo": ["KALAU TEKNIS, BARU SAYA SERIUS!" /* V */, "BERKAS DITOLAK!", "BELUM TANDA TANGAN!", "ANTRI DULU!", "REVISI!", "NOMOR ANTRIAN?", "DISPOSISI!", "LENGKAPI DULU!", "SILAKAN ULANG!", "MASA PEGAWAI GUE NGGAK BOLEH MUTASI?" /* V */, "PROSESNYA DI SEKJEN, BUKAN SAYA!" /* V */, "SURAT BELUM DISETUJUI!", "ANGGARAN DIKAJI ULANG!", "PROYEK DIKEBUT!", "JALAN BERLUBANG? ANTRI!", "DEMI ALLAH, BUKAN SAYA!" /* V */],
  "nusron-wahid": ["SEMUA TANAH MILIK NEGARA!" /* V */, "TANAH NGANGGUR DIAMBIL NEGARA!" /* V */, "SERTIFIKAT MANA?", "PATOK!", "BATAS LAHAN!", "SURAT LENGKAP?", "UKUR ULANG!", "STEMPEL!", "SENGKETA!", "ITU CUMA CANDAAN!" /* V */, "HGU ATAU HGB?", "PETA BIDANG!", "BPN TURUN!", "SERTIFIKAT ELEKTRONIK!", "TANAH TELANTAR!", "MENTERI JANGAN BIKIN GADUH!" /* V */, "SAYA MINTA MAAF!" /* V */],
  "natalius-pigai": ["SAYA MAU BANGUN SEKOLAH HAM!" /* V */, "INTERUPSI!", "DENGARKAN DULU!", "RETORIKA!", "ARGUMEN SAYA KUAT!", "TANGGAPAN!", "ITU TIDAK SOPAN!", "HAK SAYA BICARA!", "CATAT BAIK-BAIK!", "PRESIDEN TIDAK ALERGI DEMO!" /* V */, "RUANG DEMO DI HALAMAN DPR!" /* V */, "ITU HOAKS, NAMA SAYA DICATUT!" /* V */, "KRITIK DIPERSILAKAN!", "HAK ASASI!", "SAYA TEGASKAN!", "PACAR SAYA 3!" /* V */, "BUSER GORENG BERITA SAJA!" /* V */],
  "rudy-masud": ["GUBERNUR KONTEN!" /* V */, "LIVE DULU!", "KONTEN DULU!", "PROPOSAL!", "ANGGARAN DIKETOK!", "SIAP LAPOR!", "PROTOKOL!", "ADA ACARA!", "FOTO BERSAMA!", "ITU PUJIAN, LHO!" /* V */, "INSPIRASI KEPALA DAERAH!", "RAPAT KOORDINASI!", "ADA TAMU DARI PUSAT!", "GUNTING PITA DULU!", "SAMBUTAN SINGKAT!", "KURSI PIJAT & AKUARIUM, SAYA BAYAR SENDIRI!" /* V */, "SAYA MINTA MAAF!" /* V */],
  "syarifah-suraidah": ["GAYA SELANGIT!", "MINGGIR, ADA YANG LEWAT!", "KILAU!", "FLAWLESS!", "DARLING!", "KIPAS DULU!", "SPOTLIGHT!", "FOTO DULU!", "ANGGUN, DONG!", "PANGGUNG SAYA!", "BUKAN KELAS BIASA!", "BERKILAU!", "MINGGIR DULU!", "PEMOTRETAN!", "SEMUA MATA KE SINI!"],
  "bahlil-lahadalia": ["YOU LARANG, TAPI MINTA!" /* V */, "TRANSISI ENERGI JANGAN BURU-BURU!" /* V */, "KUOTA HABIS!", "ANTRE DULU!", "SUBSIDI TEPAT SASARAN!", "TEKANAN NAIK!", "GAS DULU!", "ENERGI!", "BLACKOUT!", "KAKANDA!" /* V */, "TIDAK ADA KUOTA YANG DIBATASI!" /* V */, "PANGKALAN ATAU ECERAN?", "KONVERSI KE LISTRIK!", "BBM TEPAT SASARAN!", "TABUNG HIJAU, TABUNG MELON!", "MEMANG DEMOKRASI APA YANG KITA LANGGAR?" /* V */, "PENYAKIT 5 TAHUNAN!" /* V */, "TABRAK ATURAN!" /* V */],
  "hashim-djojohadikusumo": ["AKUN MEDSOS? SAYA TIDAK PUNYA!" /* V */, "SKAK!", "BIDAK!", "SAHAM NAIK!", "INVESTASI!", "TRANSAKSI!", "LANGKAH BERIKUTNYA!", "KALKULASI!", "NEGOSIASI!", "PERNYATAAN SAYA DIPELINTIR!" /* V */, "DANANTARA GAGASAN ORANG TUA KAMI!" /* V */, "LAPORAN KEUANGAN!", "PORTOFOLIO!", "ANGKA TIDAK BOHONG!", "ASET NAIK!", "PAJAK DIGITAL MULAI 9 NOVEMBER!" /* V */, "BANK & MARKETPLACE IKUT MUNGUT!" /* V */, "35 SAMPAI 40 PERSEN EKONOMI TIDAK TERCATAT!" /* V */, "JANGAN DI-FRAMING, JANGAN DIPELINTIR!" /* V */, "SAYA TIDAK JANJIKAN HP GRATIS!" /* V */, "PAJAK WARTEG-PIJAT!" /* V */, "ITU FITNAH DARI PENGUSAHA NAKAL!" /* V */],
  "teddy-indra-wijaya": ["KUCH KUCH HOTA HAI!" /* V */, "SIAP, KOMANDAN!", "ROGER!", "JADWAL!", "AGENDA PENUH!", "MOHON IZIN!", "MEMO!", "KOORDINASI!", "STANDBY!", "SESUAI ARAHAN!", "SAYA CATAT!", "SIAP, LAKSANAKAN!", "LEMBUR LAGI!", "MOHON PETUNJUK!", "ATUR JALUR!", "PAK PRESIDEN FOKUS HAL STRATEGIS!" /* V */, "PENGAMAT BICARA DI LUAR BIDANG!" /* V */],
  "prabowo-subianto": ["KELAPA SAWIT ITU POHON, ADA DAUNNYA KAN?" /* V */, "SERAKAHNOMICS!" /* V */, "NDASMU!" /* V */, "SAYA LIHAT INDONESIA CERAH!" /* V */, "TERIMA INI!", "BELUM CUKUP!", "MASIH BERANI?!", "MAJU TERUS!", "KEMBALI KE BARISAN!", "NYENYENYENYE!", "EMANG GUE PIKIRIN!" /* V */, "SAYA TAHU SIAPA YANG BAYAR-BAYAR DEMO!" /* V */, "NDASMU ETIK!" /* V */, "BISA AJA LU!" /* V */, "TEGAS, NGGAK PAKAI BASA-BASI!", "SAYA YANG PUTUSKAN!", "UANGNYA ADA, BUNG!" /* V */, "PERUT LAPAR LEBIH GENTING!" /* V */, "PINTAR OTAKNYA, TIDAK HATINYA!" /* V */, "PINTAR ATAU BODOH?" /* V */, "20 JUTA SUDAH MERASAKAN MBG!" /* V */, "SAYA MINTA MAAF SOAL MBG!" /* V */, "KUMPULKAN VIDEO EJEKAN MBG!" /* V */, "SAKIT PERUT BIASA SEBETULNYA!" /* V */, "ERROR MANUSIAWI!" /* V */, "INI MASALAH BESAR, KITA ATASI!" /* V */, "JANGAN DIPOLITISASI!" /* V */, "LIDI KALAU SENDIRIAN LEMAH!" /* V */, "80 RIBU KOPDES MERAH PUTIH!" /* V */, "18 RIBU LAPANGAN KERJA BARU!" /* V */, "SUDAH DIPIKIRKAN PULUHAN TAHUN!" /* V */, "PENGAWASAN KETAT DAN TRANSPARAN!" /* V */, "ITU MURNI ATAU BAYARAN?" /* V */, "KALAU TIDAK SUKA SAYA, SILAKAN 2029 BERTARUNG!" /* V */, "YANG DIHARAPKAN BUKAN DEMO, YANG DIHARAPKAN KERUSUHAN!" /* V */, "HATI-HATI LOH!" /* V */, "ITU PASTI ANASIR YANG DIBIAYAI ASING!" /* V */, "KALAU MAU DEMO, SILAKAN!" /* V */, "SIAPA PUN KALAU MELANGGAR, CABUT SAJA!" /* V */, "MASALAH ASAP, KITA MINTA MASUKAN PARA PROFESOR!" /* V */, "POLISI HUTAN 70 RIBU PERSONEL!" /* V */, "KARHUTLA TIDAK SEMATA-MATA FAKTOR ALAM!" /* V */],
};
// Hurt barks: what the boss says when the player lands a hit. Same rule: /* V */ = publicly reported as said by that person.
const HURT = {
  "prabowo-subianto": ["ITU MURNI ATAU BAYARAN?" /* V */, "KALAU TIDAK SUKA SAYA, SILAKAN 2029 BERTARUNG!" /* V */, "SAYA TAHU SIAPA YANG BAYAR-BAYAR DEMO!" /* V */, "HATI-HATI LOH!" /* V */, "EMANG GUE PIKIRIN!" /* V */, "NDASMU!" /* V */, "ITU PASTI ANASIR YANG DIBIAYAI ASING!" /* V */, "MASALAH ASAP, KITA MINTA MASUKAN PARA PROFESOR!" /* V */],
  "bahlil-lahadalia": ["MEMANG DEMOKRASI APA YANG KITA LANGGAR?" /* V */, "PENYAKIT 5 TAHUNAN!" /* V */, "YOU LARANG, TAPI MINTA!" /* V */, "TIDAK ADA KUOTA YANG DIBATASI!" /* V */],
  "natalius-pigai": ["PACAR SAYA 3!" /* V */, "BUSER GORENG BERITA SAJA!" /* V */, "ITU HOAKS, NAMA SAYA DICATUT!" /* V */, "PRESIDEN TIDAK ALERGI DEMO!" /* V */],
  "nusron-wahid": ["ITU CUMA CANDAAN!" /* V */, "SAYA MINTA MAAF!" /* V */, "MENTERI JANGAN BIKIN GADUH!" /* V */],
  "rudy-masud": ["SAYA MINTA MAAF!" /* V */, "KURSI PIJAT & AKUARIUM, SAYA BAYAR SENDIRI!" /* V */, "ITU PUJIAN, LHO!" /* V */],
  "dody-hanggodo": ["DEMI ALLAH, BUKAN SAYA!" /* V */, "SAYA ENGGAK NGERTI!" /* V */, "PROSESNYA DI SEKJEN, BUKAN SAYA!" /* V */],
  "hashim-djojohadikusumo": ["PERNYATAAN SAYA DIPELINTIR!" /* V */, "ITU FITNAH DARI PENGUSAHA NAKAL!" /* V */, "JANGAN DI-FRAMING, JANGAN DIPELINTIR!" /* V */],
  "teddy-indra-wijaya": ["PAK PRESIDEN FOKUS HAL STRATEGIS!" /* V */, "PENGAMAT BICARA DI LUAR BIDANG!" /* V */],
};
BOSSES.forEach((b) => { b.barks = BARKS[b.id] ?? []; b.hurt = HURT[b.id] ?? []; });

// Training dummy: same art as the first boss, never attacks, can't be KO'd (the scene refills it).
export const TRAINING_DUMMY = {
  ...BOSSES[0], id: "buzzer", name: "Karung Latihan", taunt: "Latihan bebas. Coba semua kombo!", tauntQuote: false,
  stats: { hp: 99999, attack: 1, defense: 0, speed: 5 }, combos: [], barks: [], hurt: [],
  ai: { passive: true, reaction: 999, aggression: 0, block: 0, specialEvery: 999999, dmg: 0 },
};

// ---- Arcade-only fighters (not part of the campaign order). Selectable and fightable in Arcade / Training. ----
// pending: true = art not delivered yet; main.js shows "SEGERA HADIR" until the PNGs exist (see ../ASSET_PROMPTS.md).
// stage = which arena (1..10) their fights use.
export const ARCADE_BOSSES = [
  { ...b("jokowi", "Jokowi", "Arcade · Mantan Presiden", "Ya ndak tahu, kok tanya saya!", "11-jokowi-v3.png", "#e8e8e8",
      { hp: 150, attack: 9, defense: 8, speed: 6 }, { reaction: 14, aggression: 0.55, block: 0.45, specialEvery: 170, dmg: 1.1 }),
    sheet: "assets/sheets/enemy-jokowi-combat-v3.png", pending: true, stage: 10, tauntQuote: true, fit: FIT_FULL_PANEL },
  { ...b("dedi-mulyadi", "Kang Dedi Mulyadi", "Arcade · Gubernur", "Barak, bansos, dan konten.", "12-dedi-mulyadi-v3.png", "#4a6fa5",
      { hp: 120, attack: 8, defense: 7, speed: 8 }, { reaction: 16, aggression: 0.6, block: 0.35, specialEvery: 160, dmg: 1.05 }, "melee"),
    sheet: "assets/sheets/enemy-dedi-mulyadi-combat-v3.png", pending: true, stage: 1, tauntQuote: false, fit: FIT_FULL_PANEL },
];
const ARCADE_COMBOS = {
  "jokowi": [
    K("AAB", "Ndak Tahu", "YA NDAK TAHU, KOK TANYA SAYA!", true, M.slam(1, 16)),
    K("BBA", "Jawab Nanti", "SAYA JAWAB DI LAIN WAKTU!", true, M.launch(5, 17)),
    K("ABB", "Klemar-Klemer", "KLEMAR-KLEMER, PLONGA-PLONGO, OTORITER!", true, M.multi(5, 6, 6, 3)),
    K("AAA", "Kritik Boleh", "KRITIK ITU YA BOLEH-BOLEH SAJA!", true, M.wave(15)),
  ],
  "dedi-mulyadi": [
    K("AAB", "Kirim ke Barak", "KIRIM KE BARAK!", false, M.slam(1, 14)),
    K("BBA", "Syarat Bansos", "KB DULU, BARU BANSOS!", true, M.launch(5, 15)),
    K("ABB", "Hemat Iklan", "HEMAT IKLAN RP47 MILIAR!", true, M.multi(5, 5, 6, 3)),
    K("AAA", "Bukan Kebijakan", "ITU BUKAN KEBIJAKAN, CUMA WACANA!", true, M.wave(13)),
  ],
};
const ARCADE_BARKS = {
  "jokowi": ["YA NDAK TAHU, KOK TANYA SAYA!" /* V */, "SAYA JAWAB DI LAIN WAKTU!" /* V */, "YA NDA APA, SAYA TERIMA SAJA!" /* V */, "KRITIK ITU BOLEH-BOLEH SAJA!" /* V */, "KLEMAR-KLEMER!" /* V */, "PLONGA-PLONGO!" /* V */, "OTORITER?" /* V */, "BLUSUKAN DULU!", "SAYA TINJAU LANGSUNG!", "NANTI KITA LIHAT!"],
  "dedi-mulyadi": ["KIRIM KE BARAK!", "KB DULU, BARU BANSOS!" /* V */, "ITU CUMA WACANA!" /* V */, "HEMAT IKLAN RP47 MILIAR!" /* V */, "REKAM DULU!", "KONTEN DULU!", "LIVE DARI LOKASI!", "TURUN LANGSUNG KE WARGA!", "NGOBROL SAMA RAKYAT!"],
};
const ARCADE_HURT = {
  "jokowi": ["YA NDA APA!" /* V */, "SAYA TERIMA SAJA!" /* V */, "KRITIK ITU BOLEH-BOLEH SAJA!" /* V */, "SAYA JAWAB DI LAIN WAKTU!" /* V */],
  "dedi-mulyadi": ["ITU BUKAN KEBIJAKAN!" /* V */, "CUMA WACANA!" /* V */, "AKH, JANGAN DIREKAM!", "INI KONTEN, BUKAN KEBIJAKAN!"],
};
ARCADE_BOSSES.forEach((b) => {
  b.combos = ARCADE_COMBOS[b.id] ?? []; b.barks = ARCADE_BARKS[b.id] ?? []; b.hurt = ARCADE_HURT[b.id] ?? [];
});
