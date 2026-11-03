// Campaign order follows the revised roster. Satire only: attacks are arcade metaphors, not factual claims.
// ai: reaction = frames of delay before blocking, aggression 0..1, block = block chance when threatened,
// specialEvery = min frames between specials, dmg = damage multiplier, hp/speed override base stats.
const S = "assets/sheets/enemy-", E = "assets/thumbs/";
const b = (id, name, theme, taunt, thumb, color, stats, ai, specialType = "projectile") =>
  ({ id, name, theme, taunt, thumb: E + thumb, sheet: S + id + "-combat-v1.png", color, stats, ai, specialType });

export const BOSSES = [
  b("buzzer", "Buzzer", "Arc I · Noise", "Trending dulu, faktanya belakangan!", "01-buzzer-v3.png", "#6ec1ff",
    { hp: 70, attack: 6, defense: 3, speed: 5 }, { reaction: 30, aggression: 0.35, block: 0.15, specialEvery: 260, dmg: 1 }),
  b("dody-hanggodo", "Dody Hanggodo", "Arc II · Birokrasi", "Berkas Anda belum lengkap. Silakan ulang dari awal.", "02-dody-hanggodo-v3.png", "#c9a227",
    { hp: 85, attack: 7, defense: 5, speed: 5 }, { reaction: 26, aggression: 0.4, block: 0.25, specialEvery: 240, dmg: 1 }),
  b("nusron-wahid", "Nusron Wahid", "Arc II · Birokrasi", "Sertifikatnya ada... di lapis ketujuh.", "03-nusron-wahid-v3.png", "#8a6d3b",
    { hp: 100, attack: 8, defense: 6, speed: 5 }, { reaction: 24, aggression: 0.45, block: 0.3, specialEvery: 230, dmg: 1 }),
  b("natalius-pigai", "Natalius Pigai", "Arc II · Birokrasi", "Saya belum selesai bicara!", "04-natalius-pigai-v3.png", "#e07b39",
    { hp: 105, attack: 8, defense: 6, speed: 6 }, { reaction: 22, aggression: 0.5, block: 0.3, specialEvery: 200, dmg: 1.05 }, "projectile"),
  b("rudy-masud", "Rudy Mas'ud", "Arc III · Privilege", "Anggaran sudah diketok. Tinggal mundur teratur.", "05-rudy-masud-v3.png", "#3b8ea5",
    { hp: 115, attack: 9, defense: 7, speed: 6 }, { reaction: 20, aggression: 0.55, block: 0.35, specialEvery: 200, dmg: 1.05 }),
  b("syarifah-suraidah", "Syarifah Suraidah", "Arc III · Privilege", "Kamu pikir ini panggung siapa, sayang?", "05b-syarifah-suraidah-v3.png", "#e8b923",
    { hp: 110, attack: 9, defense: 6, speed: 7 }, { reaction: 18, aggression: 0.6, block: 0.35, specialEvery: 180, dmg: 1.1 }),
  b("bahlil-lahadalia", "Bahlil Lahadalia", "Arc IV · Resources", "Kuota energi kamu habis. Antri lagi besok.", "06-bahlil-lahadalia-v3.png", "#d9534f",
    { hp: 135, attack: 10, defense: 8, speed: 6 }, { reaction: 16, aggression: 0.6, block: 0.4, specialEvery: 170, dmg: 1.15 }),
  b("hashim-djojohadikusumo", "Hashim Djojohadikusumo", "Arc V · Influence", "Semua bidak sudah di tempatnya.", "07-hashim-djojohadikusumo-v3.png", "#7d5ba6",
    { hp: 140, attack: 10, defense: 9, speed: 6 }, { reaction: 14, aggression: 0.65, block: 0.45, specialEvery: 160, dmg: 1.2 }),
  b("teddy-indra-wijaya", "Teddy Indra Wijaya", "Arc VI · Inner Circle", "Jadwal Anda sudah saya atur. Jadwal kalah juga.", "08a-teddy-indra-wijaya-v3.png", "#e8e8e8",
    { hp: 130, attack: 9, defense: 9, speed: 8 }, { reaction: 10, aggression: 0.7, block: 0.55, specialEvery: 150, dmg: 1.2 }),
  b("prabowo-subianto", "Prabowo Subianto", "Arc VII · The Last Stand", "Ini baru permulaan, rakyat.", "08b-prabowo-subianto-v3.png", "#b32d2d",
    { hp: 180, attack: 11, defense: 10, speed: 6 }, { reaction: 8, aggression: 0.8, block: 0.5, specialEvery: 130, dmg: 1.25 }),
];
