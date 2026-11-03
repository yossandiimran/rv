// Playable roster. Stats are balancing placeholders (brief section 4).
// Combos: A = punch, B = kick. A chain ending in `seq` turns that last hit into the finisher (own frame data/damage).
// fxShape/fxColors theme the hit particles (paper, star, ember).
import { M } from "./moves.js";
const C = (seq, name, quote, move) => ({ seq, name, quote, move });
const S = "assets/sheets/", P = "assets/thumbs/";
export const CHARACTERS = [
  { id: "office-worker", combos: [
      C("AAB", "Lembur Berantai", "KABUR AJA DULU!", M.slam(1, 22)),
      C("BBA", "Tutup Buku", "RESIGN SEKARANG JUGA!", M.launch(5, 24, 30)),
      C("ABB", "Rapat Dadakan", "RAPAT LAGI, RAPAT LAGI!", M.multi(5, 7, 5, 4)),
      C("AAA", "Reply All", "REPLY ALL!", M.wave(18)),
    ], name: "Pegawai Kantoran", archetype: "Balanced", special: "Deadline Rage",
    stats: { hp: 100, attack: 8, defense: 6, speed: 7 }, specialType: "melee",
    sheet: S + "playable-office-worker-combat-v1.png", thumb: P + "01-office-worker-v1.png", color: "#e8423a",
    fxShape: "paper", fxColors: ["#ffffff", "#e8e3d0", "#e8423a"] },
  { id: "university-student", combos: [
      C("AAB", "Orasi Beruntun", "HIDUP MAHASISWA!", M.multi(5, 5, 4, 5)),
      C("ABA", "Tuntutan Rakyat", "TURUNKAN HARGA!", M.launch(1, 18, 28)),
      C("BBB", "Long March", "INDONESIA GELAP!", M.rush(1, 21)),
      C("AAA", "Toa Berondong", "BUBARKAN DPR!", M.wave(14)),
    ], name: "Mahasiswi", archetype: "Combo", special: "Mimbar Bebas",
    stats: { hp: 85, attack: 7, defense: 4, speed: 10 }, specialType: "projectile",
    sheet: S + "playable-university-student-combat-v1.png", thumb: P + "02-university-student-v1.png", color: "#f1c232",
    fxShape: "star", fxColors: ["#ffd60a", "#ffffff", "#f1c232"] },
  { id: "mother", combos: [
      C("BAB", "Sandal Beruntun", "GAS MELON LANGKA!", M.slam(1, 34, { startup: 14, recovery: 30, knock: 20 })),
      C("BBA", "Omelan Emak", "HARGA NAIK TERUS!", M.launch(5, 30, 34, { startup: 13, recovery: 32 })),
      C("AAB", "Cubitan Maut", "KATANYA DISKON, MANA?!", M.multi(5, 9, 6, 4)),
      C("BBB", "Sandal Massal", "HARGA CABAI NAIK!", M.wave(28, { startup: 16, speed: 6.5 })),
    ], name: "Emak-Emak", archetype: "Heavy", special: "Sandal Terbang",
    stats: { hp: 110, attack: 10, defense: 7, speed: 5 }, specialType: "projectile",
    sheet: S + "playable-mother-combat-v1.png", thumb: P + "03-mother-v1.png", color: "#d77ad0",
    fxShape: "star", fxColors: ["#ff9ad7", "#ffffff", "#d77ad0"] },
  { id: "street-vendor", combos: [
      C("ABB", "Wajan Berantai", "ANTRE GAS LAGI?!", M.slam(1, 24, { range: 140 })),
      C("AAB", "Dagangan Habis", "DAGANGAN GUE HABIS!", M.launch(5, 22, 30)),
      C("BAA", "Siram Minyak", "MINYAK GORENG MAHAL!", M.multi(5, 6, 5, 4)),
      C("AAA", "Lempar Gorengan", "GORENGAN PANAS!", M.wave(16)),
    ], name: "Pedagang Kaki Lima", archetype: "Defensive", special: "Wajan Strike",
    stats: { hp: 120, attack: 7, defense: 9, speed: 5 }, specialType: "melee",
    sheet: S + "playable-street-vendor-combat-v1.png", thumb: P + "04-street-vendor-v1.png", color: "#4fb36a",
    fxShape: "ember", fxColors: ["#ff9d3b", "#ffd60a", "#ffffff"] },
];
