// Playable roster. Stats are balancing placeholders (brief section 4).
// Combos: A = punch, B = kick. A chain ending in `seq` turns that last hit into the finisher (own frame data/damage).
// fxShape/fxColors theme the hit particles (paper, star, ember).
import { M } from "./moves.js";
import { FIT_FULL_PANEL } from "./config.js";
const C = (seq, name, quote, move) => ({ seq, name, quote, move });
const S = "assets/sheets/", P = "assets/thumbs/";
export const CHARACTERS = [
  { id: "office-worker", combos: [
      C("AAB", "Lembur Berantai", "KABUR AJA DULU!", M.slam(1, 22)),
      C("BBA", "Tutup Buku", "RESIGN SEKARANG JUGA!", M.launch(5, 24, 30)),
      C("ABB", "Rapat Dadakan", "RAPAT LAGI, RAPAT LAGI!", M.multi(5, 7, 5, 4)),
      C("AAA", "Reply All", "REPLY ALL!", M.wave(18)),
      C("BAB", "Hidup Makin Susah", "HIDUP MAKIN SUSAH, APA KERJA PEMERINTAH?", M.slam(1, 23)), // Greenpeace banner, Bundaran HI, 20 Oct 2026
      C("BBB", "Bencana Nasional", "TETAPKAN BENCANA NASIONAL!", M.rush(1, 22)), // #IndonesiaSadar demand, 28 Oct 2026
    ], name: "Pegawai Kantoran", archetype: "Balanced", special: "Deadline Rage",
    stats: { hp: 100, attack: 8, defense: 6, speed: 7 }, specialType: "melee",
    sheet: S + "playable-office-worker-combat-v1.png", thumb: P + "01-office-worker-v1.png", color: "#e8423a",
    fxShape: "paper", fxColors: ["#ffffff", "#e8e3d0", "#e8423a"] },
  { id: "university-student", combos: [
      C("AAB", "Orasi Beruntun", "HIDUP MAHASISWA!", M.multi(5, 5, 4, 5)),
      C("ABA", "Tuntutan Rakyat", "TURUNKAN HARGA!", M.launch(1, 18, 28)),
      C("BBB", "Long March", "INDONESIA GELAP!", M.rush(1, 21)),
      C("AAA", "Toa Berondong", "BUBARKAN DPR!", M.wave(14)),
      C("BAB", "Indonesia Sadar", "INDONESIA SADAR!", M.slam(1, 19)), // BEM UI action, 28 Oct 2026
      C("BAA", "Kuliah Murah", "TURUNKAN BIAYA KULIAH!", M.slam(1, 20)), // demand: lower education costs
    ], name: "Mahasiswi", archetype: "Combo", special: "Mimbar Bebas",
    stats: { hp: 85, attack: 7, defense: 4, speed: 10 }, specialType: "projectile",
    sheet: S + "playable-university-student-combat-v1.png", thumb: P + "02-university-student-v1.png", color: "#f1c232",
    fxShape: "star", fxColors: ["#ffd60a", "#ffffff", "#f1c232"] },
  { id: "mother", combos: [
      C("BAB", "Sandal Beruntun", "GAS MELON LANGKA!", M.slam(1, 34, { startup: 14, recovery: 30, knock: 20 })),
      C("BBA", "Omelan Emak", "HARGA NAIK TERUS!", M.launch(5, 30, 34, { startup: 13, recovery: 32 })),
      C("AAB", "Cubitan Maut", "KATANYA DISKON, MANA?!", M.multi(5, 9, 6, 4)),
      C("BBB", "Sandal Massal", "HARGA CABAI NAIK!", M.wave(28, { startup: 16, speed: 6.5 })),
      C("ABB", "Bendera Bajak Laut", "KIBARKAN BENDERANYA!", M.multi(5, 8, 6, 4)), // the One Piece flag of the 2025 protests
      C("AAA", "Turunkan Biaya Hidup", "TURUNKAN BIAYA HIDUP!", M.wave(26, { speed: 6.5 })), // cost of living: the most-cited issue
    ], name: "Emak-Emak", archetype: "Heavy", special: "Sandal Terbang",
    stats: { hp: 110, attack: 10, defense: 7, speed: 5 }, specialType: "projectile",
    sheet: S + "playable-mother-combat-v1.png", thumb: P + "03-mother-v1.png", color: "#d77ad0",
    fxShape: "star", fxColors: ["#ff9ad7", "#ffffff", "#d77ad0"] },
  { id: "street-vendor", combos: [
      C("ABB", "Wajan Berantai", "ANTRE GAS LAGI?!", M.slam(1, 24, { range: 140 })),
      C("AAB", "Dagangan Habis", "DAGANGAN GUE HABIS!", M.launch(5, 22, 30)),
      C("BAA", "Siram Minyak", "MINYAK GORENG MAHAL!", M.multi(5, 6, 5, 4)),
      C("AAA", "Lempar Gorengan", "GORENGAN PANAS!", M.wave(16)),
      C("BBB", "Hero Green", "SOLIDARITAS RAKYAT KECIL!", M.rush(1, 22)), // Hero Green = ojol green, solidarity
      C("BAB", "Padamkan Api", "PADAMKAN KEBAKARAN HUTAN!", M.launch(5, 22, 32)), // karhutla
    ], name: "Pedagang Kaki Lima", archetype: "Defensive", special: "Wajan Strike",
    stats: { hp: 120, attack: 7, defense: 9, speed: 5 }, specialType: "melee",
    sheet: S + "playable-street-vendor-combat-v1.png", thumb: P + "04-street-vendor-v1.png", color: "#4fb36a",
    fxShape: "ember", fxColors: ["#ff9d3b", "#ffd60a", "#ffffff"] },
  // New playable fighters. `pending: true` = art not delivered yet: main.js probes the PNGs at startup and shows a
  // "SEGERA HADIR" card until the files exist (see ../ASSET_PROMPTS.md).
  { id: "windah-basudara", pending: true, combos: [
      C("AAB", "Headshot", "BOCIL KEMATIAN!", M.slam(1, 20)),
      C("BBA", "Lag Spike", "NGE-LAG, WOI!", M.launch(5, 22, 30)),
      C("ABB", "Spam Skill", "SPAM SKILL!", M.multi(5, 6, 5, 4)),
      C("AAA", "Donasi Masuk", "TERIMA KASIH DONASINYA!", M.wave(16)),
      // from his Instagram Story of 14 Oct 2026 (answering accusations after he spoke about forest fires) — see ../QUOTES.md
      C("BAB", "Buzzer Research", "BUZZER-BUZZER INI LUMAYAN RESEARCH!", M.slam(1, 21)),
      C("BBB", "Distribusi Uang", "INI DISTRIBUSI UANGNYA DARI MANA YAH?", M.rush(1, 20)),
      C("BAA", "Comment Template", "COMMENT TEMPLATE, NGAKU PENONTON LAMA!", M.multi(5, 5, 6, 4)),
      C("ABA", "Bela Hutan", "BELA HUTAN KOK DIBILANG DIBAYAR?", M.launch(5, 22, 32)), // his 14 Oct 2026 story about the forest fires
    ], barks: [
      "BOCIL KEMATIAN!" /* V */, "BUZZER-BUZZER INI LUMAYAN RESEARCH!" /* V */, "GUE NGGAK BUKA SAWERIA!" /* V */, "COMMENT TEMPLATE!" /* V */,
      "DISTRIBUSI UANGNYA DARI MANA YAH?" /* V */, "JANGAN BILANG DARI PAJAK YANG KITA BAYAR!" /* V */,
      "RAKYAT KECIL BELUM TENTU CUKUP MAKAN!" /* V */, "BELA HUTAN KOK DIBILANG DIBAYAR?" /* V */, "GG!", "NGE-LAG, WOI!", "EZ!", "AFK DULU!",
    ], hurt: [
      "BELA HUTAN KOK DIBILANG DIBAYAR?" /* V */, "BUZZER LAGI, BUZZER LAGI!", "AUH, LAG!", "GUE NGGAK BUKA SAWERIA!" /* V */,
    ], name: "Windah Basudara", archetype: "Streamer", special: "Bocil Kematian",
    stats: { hp: 90, attack: 7, defense: 5, speed: 9 }, specialType: "projectile",
    fit: FIT_FULL_PANEL, sheet: S + "playable-windah-basudara-combat-v3.png", thumb: P + "05-windah-basudara-v3.png", color: "#3aa0ff",
    fxShape: "star", fxColors: ["#7fd0ff", "#ffffff", "#3aa0ff"] },
  { id: "ferry-irwandi", pending: true, combos: [
      C("AAB", "Rombak Semua", "ROMBAK SEMUA, YANG PENTING ADA PERUBAHAN!", M.slam(1, 22)),
      C("BBA", "Bunga di Kuburan", "BUNGA-BUNGA DI KUBURAN AJA MASIH WANGI!", M.launch(5, 24, 30)),
      C("ABB", "Tuntutan 17+8", "17+8 TUNTUTAN RAKYAT!", M.multi(5, 7, 5, 4)),
      C("AAA", "Ide Tak Bisa Dibunuh", "IDE TIDAK BISA DIBUNUH ATAU DIPENJARA!", M.wave(17)),
      C("BAB", "Status Bencana", "TETAPKAN STATUS BENCANA NASIONAL!", M.slam(1, 23)),
      C("BBB", "Rangkap Jabatan", "HAPUS RANGKAP JABATAN!", M.rush(1, 21)), // Trisakti's Tritura, 29 Oct 2026
    ], name: "Ferry Irwandi", archetype: "Orator", special: "Reformasi Total",
    stats: { hp: 100, attack: 8, defense: 7, speed: 6 }, specialType: "melee",
    fit: FIT_FULL_PANEL, sheet: S + "playable-ferry-irwandi-combat-v3.png", thumb: P + "06-ferry-irwandi-v3.png", color: "#2fb7a3",
    fxShape: "paper", fxColors: ["#ffffff", "#9fe8dc", "#2fb7a3"] },
];
