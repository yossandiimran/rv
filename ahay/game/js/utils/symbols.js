// Pixel versions of real protest symbols (Feb 2025 - Oct 2026), drawn with fillRect on any 2D context:
// used by the arena backdrops (Backgrounds.js) and by the "Simbol Aksi" screen icons (main.js).
// Sources and meanings: ../../QUOTES.md ("Protest symbols").

export const COL = { pink: "#ff7eb6", green: "#3ddc84" }; // Brave Pink / Hero Green

function paint(g, rows, x, y, pal) {
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const c = pal[r[i]];
      if (c) { g.fillStyle = c; g.fillRect(x + i, y + j, 1, 1); }
    }
  });
}

// Black pirate flag with a skull under a straw hat (the "One Piece" flag flown in the Aug 2025 protests).
const JOLLY = [
  "KKKKKKKKKKKKKKKK",
  "KKKKKKYYYYKKKKKK",
  "KKKKKYYYYYYKKKKK",
  "KKKKYYYYYYYYKKKK",
  "KKKKRRRRRRRRKKKK",
  "KKKKKWWWWWWKKKKK",
  "KKKKKWKWWKWKKKKK",
  "KKKKKWWWWWWKKKKK",
  "KWKKKKWKKWKKKKWK",
  "KKWKKKWWWWKKKWKK",
  "KKKWKKKKKKKKWKKK",
  "KKKKKKKKKKKKKKKK",
];
const JOLLY_PAL = { K: "#141414", W: "#f2f2f2", Y: "#e8c23a", R: "#c0392b" };
export const jollyRoger = (g, x, y) => paint(g, JOLLY, x, y, JOLLY_PAL);

// Flag on a pole: pole at x, flag attached at the top.
export function flagPole(g, x, top, len = 44) {
  g.fillStyle = "#cfcfcf"; g.fillRect(x, top, 1, len);
  jollyRoger(g, x + 1, top);
}

// Pink + green ribbon (Brave Pink / Hero Green), hanging from a point.
export function ribbon(g, x, y, h = 8) {
  g.fillStyle = "#222"; g.fillRect(x, y, 4, 1);
  g.fillStyle = COL.pink; g.fillRect(x, y + 1, 2, h);
  g.fillStyle = COL.green; g.fillRect(x + 2, y + 1, 2, h - 2);
}

// Cloth banner with 1-3 lines of tiny text.
export function banner(g, x, y, w, h, lines, { bg = "#f4f1e8", fg = "#141414", edge = "#141414", font = "bold 6px monospace" } = {}) {
  g.fillStyle = edge; g.fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.fillStyle = fg; g.font = font; g.textBaseline = "top"; g.textAlign = "center";
  const lh = Math.floor((h - 2) / lines.length);
  lines.forEach((l, i) => g.fillText(l, x + w / 2, y + 1 + i * lh));
}

// Tiny hi-vis figures (activists) standing on a ledge.
export function activist(g, x, y, color) {
  g.fillStyle = "#e2b48a"; g.fillRect(x, y, 2, 2);          // head
  g.fillStyle = color; g.fillRect(x - 1, y + 2, 4, 4);      // jacket
  g.fillStyle = "#222"; g.fillRect(x, y + 6, 1, 2); g.fillRect(x + 1, y + 6, 1, 2); // legs
}

// ---- menu icons (24x16 art pixels) ----
export const ICONS = {
  jolly: (g) => { g.fillStyle = "#3a3a46"; g.fillRect(0, 0, 24, 16); jollyRoger(g, 4, 2); },
  pink: (g) => { g.fillStyle = "#2a1a2a"; g.fillRect(0, 0, 24, 16); g.fillStyle = COL.pink; g.fillRect(7, 2, 10, 12); g.fillStyle = "#f7c6dc"; g.fillRect(9, 4, 6, 4); },
  green: (g) => { g.fillStyle = "#12261a"; g.fillRect(0, 0, 24, 16); g.fillStyle = COL.green; g.fillRect(6, 3, 12, 11); g.fillStyle = "#1f8f50"; g.fillRect(11, 3, 2, 11); g.fillStyle = "#f0f0f0"; g.fillRect(8, 5, 2, 2); g.fillRect(14, 5, 2, 2); },
  plus: (g) => { g.fillStyle = "#222"; g.fillRect(0, 0, 24, 16); banner(g, 3, 3, 18, 10, ["17+8"], { bg: "#ffd60a", font: "bold 8px monospace" }); },
  gelap: (g) => { g.fillStyle = "#050507"; g.fillRect(0, 0, 24, 16); g.fillStyle = "#222233"; g.fillRect(4, 3, 16, 10); banner(g, 3, 4, 18, 8, ["GELAP"], { bg: "#1a1a24", fg: "#e8e8e8", edge: "#555566", font: "bold 6px monospace" }); },
  greenpeace: (g) => { g.fillStyle = "#cfc6b4"; g.fillRect(0, 0, 24, 16); g.fillStyle = "#a39a86"; g.fillRect(10, 0, 4, 16); banner(g, 2, 3, 20, 9, ["APA", "KERJA?"], { font: "bold 4px monospace", edge: "#2faa4a" }); },
  sadar: (g) => { g.fillStyle = "#222a44"; g.fillRect(0, 0, 24, 16); banner(g, 2, 3, 20, 9, ["SADAR"], { bg: "#f1c232", font: "bold 6px monospace" }); },
};

// ---- icons for the current demands (late Oct 2026) ----
const FIRE = [
  "......O.........", ".....OOO........", ".....OOOO...O...", "...O.OOOOO.OO...", "..OOOOOYOOOOOO..", "..OOOOYYYOOOOO..",
  ".OOOOYYYYYOOOOO.", ".OOOYYYYYYYOOOO.", ".OOOYYWWYYYOOOO.", ".OOOOYWWYYYOOOO.", "..OOOOYYYYOOOO..", "..OOOOOYYOOOO...",
  "...OOOOOOOOO....", ".....OOOOO......",
];
const FIRE_PAL = { O: "#e8561a", Y: "#ffc23a", W: "#fff3b0" };
Object.assign(ICONS, {
  fire: (g) => { g.fillStyle = "#2a1208"; g.fillRect(0, 0, 24, 16); paint(g, FIRE, 4, 1, FIRE_PAL); },
  coin: (g) => {
    g.fillStyle = "#1c1a10"; g.fillRect(0, 0, 24, 16);
    g.fillStyle = "#b8860b"; g.fillRect(7, 2, 10, 12); g.fillRect(5, 4, 14, 8);
    g.fillStyle = "#ffd54a"; g.fillRect(8, 3, 8, 10); g.fillRect(6, 5, 12, 6);
    g.fillStyle = "#6b4a08"; g.font = "bold 6px monospace"; g.textBaseline = "top"; g.textAlign = "center"; g.fillText("Rp", 12, 5);
  },
  book: (g) => {
    g.fillStyle = "#1a2030"; g.fillRect(0, 0, 24, 16);
    g.fillStyle = "#f2f2f2"; g.fillRect(3, 3, 9, 10); g.fillRect(13, 3, 9, 10);
    g.fillStyle = "#3b5ba5"; g.fillRect(11, 2, 2, 12);
    g.fillStyle = "#9aa4b8"; for (let y = 5; y < 12; y += 2) { g.fillRect(4, y, 6, 1); g.fillRect(14, y, 6, 1); }
  },
  civic: (g) => { g.fillStyle = "#1a1a24"; g.fillRect(0, 0, 24, 16); g.fillStyle = "#f2f2f2"; g.fillRect(4, 2, 16, 9); g.fillRect(6, 11, 3, 3); g.fillStyle = "#c0392b"; g.fillRect(11, 4, 2, 4); g.fillRect(11, 9, 2, 1); },
  gavel: (g) => {
    g.fillStyle = "#1c1a16"; g.fillRect(0, 0, 24, 16);
    g.fillStyle = "#8b5a2b"; g.fillRect(5, 2, 10, 5); g.fillStyle = "#b07a3c"; g.fillRect(5, 2, 10, 1);
    g.fillStyle = "#6b4a2b"; for (let i = 0; i < 7; i++) g.fillRect(9 + i, 7 + i, 2, 2);
    g.fillStyle = "#555"; g.fillRect(3, 14, 12, 2);
  },
  chart: (g) => { g.fillStyle = "#14201a"; g.fillRect(0, 0, 24, 16); [[4, 9, "#e74c3c"], [9, 6, "#f1c232"], [14, 11, "#e74c3c"], [19, 3, "#2ecc71"]].forEach(([x, y, c]) => { g.fillStyle = c; g.fillRect(x, y, 3, 14 - y); }); g.fillStyle = "#cfcfcf"; g.fillRect(2, 14, 20, 1); },
  tritura: (g) => { g.fillStyle = "#222"; g.fillRect(0, 0, 24, 16); banner(g, 2, 3, 20, 10, ["TRITURA"], { bg: "#111", fg: "#f2f2f2", edge: "#f2f2f2", font: "bold 5px monospace" }); },
  salute3: (g) => {
    g.fillStyle = "#1a1a24"; g.fillRect(0, 0, 24, 16);
    g.fillStyle = "#e2b48a"; g.fillRect(9, 9, 8, 6); g.fillRect(9, 3, 2, 7); g.fillRect(12, 2, 2, 8); g.fillRect(15, 3, 2, 7); g.fillRect(6, 10, 3, 3); g.fillRect(17, 11, 2, 3);
    g.fillStyle = "#c79a6e"; g.fillRect(9, 9, 8, 1);
  },
});
