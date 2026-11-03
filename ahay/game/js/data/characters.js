// Playable roster. Stats are balancing placeholders (brief section 4).
const S = "assets/sheets/", P = "assets/thumbs/";
export const CHARACTERS = [
  { id: "office-worker", name: "Pegawai Kantoran", archetype: "Balanced", special: "Deadline Rage",
    stats: { hp: 100, attack: 8, defense: 6, speed: 7 }, specialType: "melee",
    sheet: S + "playable-office-worker-combat-v1.png", thumb: P + "01-office-worker-v1.png", color: "#e8423a" },
  { id: "university-student", name: "Mahasiswi", archetype: "Combo", special: "Mimbar Bebas",
    stats: { hp: 85, attack: 7, defense: 4, speed: 10 }, specialType: "projectile",
    sheet: S + "playable-university-student-combat-v1.png", thumb: P + "02-university-student-v1.png", color: "#f1c232" },
  { id: "mother", name: "Emak-Emak", archetype: "Heavy", special: "Sandal Terbang",
    stats: { hp: 110, attack: 10, defense: 7, speed: 5 }, specialType: "projectile",
    sheet: S + "playable-mother-combat-v1.png", thumb: P + "03-mother-v1.png", color: "#d77ad0" },
  { id: "street-vendor", name: "Pedagang Kaki Lima", archetype: "Defensive", special: "Wajan Strike",
    stats: { hp: 120, attack: 7, defense: 9, speed: 5 }, specialType: "melee",
    sheet: S + "playable-street-vendor-combat-v1.png", thumb: P + "04-street-vendor-v1.png", color: "#4fb36a" },
];
