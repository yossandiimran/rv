import { W, H } from "../data/config.js";

// Stage -> venue. Each venue is drawn in code at 1/4 resolution (240x135) and upscaled with no smoothing.
// The fighting floor always lies between lowres y 86..122 (ARENA.minY/maxY / 4), so every venue paints its ground there.
export const VENUES = [
  { id: "street", name: "JALAN RAYA", stages: [1, 2, 3] },
  { id: "hi", name: "BUNDARAN HI", stages: [4, 5, 6] },
  { id: "mpr", name: "GEDUNG MPR/DPR", stages: [7, 8, 9] },
  { id: "palace", name: "ISTANA PRESIDEN", stages: [10] },
];
export const venueFor = (stageNo) => VENUES.find((v) => v.stages.includes(stageNo)) ?? VENUES[0];

// Venues are designed on a 240x135 grid. For wider worlds the design is centred (translate by X) and every full-width
// layer (sky, skyline, ground, fences) is extended to cover the extra width on both sides.
const S = 4, LH = H / S, DESIGN_W = 240, CX = DESIGN_W / 2;
let LW = DESIGN_W, X = 0;
const hsl = (h, s, l) => `hsl(${h},${s}%,${l}%)`;
const lerp = (a, b, t) => a + (b - a) * t;

function ctxTools(g, seed0) {
  let seed = seed0;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  // vertical gradient in hard bands with a dither row between neighbours
  const sky = (yEnd, top, bot, bands = 9) => {
    const col = (i) => hsl(Math.round(lerp(top[0], bot[0], i / (bands - 1))) % 360, Math.round(lerp(top[1], bot[1], i / (bands - 1))), Math.round(lerp(top[2], bot[2], i / (bands - 1))));
    for (let i = 0; i < bands; i++) {
      const y0 = Math.round((i * yEnd) / bands), y1 = Math.round(((i + 1) * yEnd) / bands);
      R(-X, y0, LW, y1 - y0, col(i));
      if (i < bands - 1) { g.fillStyle = col(i + 1); for (let x = -X + (i % 2); x < LW - X; x += 2) g.fillRect(x, y1 - 1, 1, 1); }
    }
  };
  // filled half-ellipse (dome) with banded shading; cx,baseY centre of the flat bottom
  const dome = (cx, baseY, rx, ry, cols) => {
    for (let y = baseY - ry; y < baseY; y++) {
      const t = (baseY - y) / ry, half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))));
      for (let x = cx - half; x < cx + half; x++) {
        const band = Math.floor((x - cx + rx) / 5 + (baseY - y) / 4) % cols.length;
        g.fillStyle = cols[band]; g.fillRect(x, y, 1, 1);
      }
    }
  };
  // buildings silhouette row
  const skyline = (base, minH, maxH, color, lit = "#ffd980", seedAdd = 0) => {
    for (let x = -X - 4; x < LW - X; ) {
      const bw = 10 + Math.floor(rnd() * 16), bh = minH + Math.floor(rnd() * (maxH - minH));
      R(x, base - bh, bw, bh, color);
      g.fillStyle = lit;
      for (let wy = base - bh + 3; wy < base - 4; wy += 5) for (let wx = x + 2; wx < x + bw - 2; wx += 4) if (rnd() > 0.62) g.fillRect(wx, wy, 2, 2);
      x += bw + 1;
    }
  };
  // perspective ground lines converging to the horizon centre
  const perspective = (y0, color, spread = 22, step = 8) => {
    g.fillStyle = color;
    for (let i = -9; i <= 9; i++) for (let y = y0 + 1; y < LH; y++) {
      const t = (y - y0) / (LH - y0);
      g.fillRect(Math.round(CX + i * step + i * spread * t), y, 1, 1);
    }
  };
  const flag = (x, top, len = 12) => { R(x, top, 1, 60, "#d8d8d8"); R(x + 1, top, len, 3, "#d32f2f"); R(x + 1, top + 3, len, 3, "#ffffff"); };
  return { rnd, R, sky, dome, skyline, perspective, flag };
}

// ---- 1. Jalan raya (stages 1-3): night street with satire signs ----
function drawStreet(g, stageNo) {
  const { rnd, R, sky, skyline, perspective } = ctxTools(g, stageNo * 9301 + 49297);
  const hue = (stageNo * 37 + 200) % 360;
  sky(76, [hue, 50, 16], [(hue + 32) % 360, 50, 44]);
  g.fillStyle = "#fff"; for (let i = 0; i < 30; i++) g.fillRect(Math.floor(rnd() * LW - X), Math.floor(rnd() * 40), 1, 1);
  R(190, 10, 12, 12, "#f5e9b8"); R(192, 12, 6, 6, "#fff8d8");
  skyline(78, 22, 62, hsl(hue, 30, 14));
  skyline(78, 22, 48, hsl(hue, 30, 9));
  R(-X, 75, LW, 11, "#4a4a56"); g.fillStyle = "#3a3a46"; for (let x = 0 - Math.ceil((X + 0) / 20) * 20; x < LW - X; x += 20) g.fillRect(x, 75, 1, 11);
  R(-X, 75, LW, 1, "#33333f"); R(-X, 84, LW, 2, "#8a8a96");
  [["#34343e", 86, 100], ["#2c2c36", 100, 114], ["#24242d", 114, LH]].forEach(([c, a, b]) => R(-X, a, LW, b - a, c));
  perspective(86, "#4b4b57");
  g.fillStyle = "#d9b840"; [96, 108, 122].forEach((y) => { for (let x = 6 - Math.ceil((X + 6) / 14) * 14; x < LW - X; x += 14) g.fillRect(x, y, 8, 1); });
  const signs = [["DENGAR", "RAKYAT"], ["TURUNKAN", "HARGA"], ["BUBAR", "BUZZER"], ["KAMI BUKAN", "DATA"]];
  const cols = ["#f5f0e1", "#ffd60a", "#ff8a80", "#9ad1ff"];
  [26, 88, 150, 212].forEach((x, i) => {
    R(x - 1, 70, 2, 16, "#6b4a2b"); R(x - 17, 58, 34, 16, "#111"); R(x - 16, 59, 32, 14, cols[i]);
    const [l1, l2] = signs[(i + stageNo) % 4];
    g.fillStyle = "#111"; g.font = "bold 6px monospace"; g.textBaseline = "top"; g.textAlign = "center"; g.fillText(l1, x, 59); g.fillText(l2, x, 66);
  });
}

// ---- 2. Bundaran HI (stages 4-6): fountain circle, welcome monument, Hotel Indonesia, towers ----
function drawHI(g, stageNo) {
  const { rnd, R, sky, skyline, perspective } = ctxTools(g, 777 + stageNo);
  sky(78, [265, 42, 20], [378, 78, 56]);                        // dusk: violet to orange
  R(24, 52, 12, 12, "#ffcf70"); R(26, 54, 8, 8, "#ffe9a8");     // low sun
  skyline(80, 30, 66, "#3a2a52", "#ffcf70");
  skyline(80, 24, 48, "#241a38", "#ffe9a8");
  // Hotel Indonesia (left slab with window bands)
  R(6, 36, 58, 44, "#d9d2c4"); R(6, 34, 58, 2, "#b0a898");
  for (let y = 39; y < 78; y += 3) R(8, y, 54, 1, "#6f7fa0");
  for (let x = 8; x < 62; x += 6) R(x, 38, 1, 40, "#c4bba8");
  // right tower
  R(176, 14, 22, 66, "#3b3d57"); for (let y = 18; y < 76; y += 4) for (let x = 179; x < 196; x += 4) if (rnd() > 0.35) R(x, y, 2, 2, "#ffe9a8");
  R(186, 6, 2, 8, "#aaa");
  // Monumen Selamat Datang: tall pedestal, two figures waving
  R(114, 26, 12, 3, "#e0d8c6"); R(116, 29, 8, 46, "#cfc6b4"); R(118, 29, 1, 46, "#e6dfcf"); R(112, 68, 16, 10, "#b8ae9a"); R(108, 75, 24, 4, "#a39a86");
  R(116, 14, 3, 12, "#8b5a2b"); R(121, 14, 3, 12, "#a8693a"); R(115, 10, 1, 8, "#8b5a2b"); R(124, 10, 1, 8, "#a8693a"); R(116, 11, 3, 3, "#e2b48a"); R(121, 11, 3, 3, "#e2b48a");
  // fountain basin
  for (let y = 77; y <= 86; y++) {
    const dy = (y - 82) / 4.5, half = Math.round(70 * Math.sqrt(Math.max(0, 1 - dy * dy)));
    R(120 - half, y, half * 2, 1, y === 77 || y === 86 ? "#cfc6b4" : (y % 2 ? "#4a86c4" : "#7fb8ea"));
  }
  g.fillStyle = "#fff"; for (let i = 0; i < 40; i++) g.fillRect(70 + Math.floor(rnd() * 100), 79 + Math.floor(rnd() * 6), 2, 1);
  [66, 86, 154, 174].forEach((x) => { for (let y = 62; y < 78; y += 2) R(x, y, 1, 1, "#e8f4ff"); R(x - 2, 60, 5, 1, "#e8f4ff"); R(x - 3, 61, 1, 1, "#e8f4ff"); R(x + 3, 61, 1, 1, "#e8f4ff"); }); // spray
  // road + zebra crossing
  [["#34343e", 86, 100], ["#2c2c36", 100, 114], ["#24242d", 114, LH]].forEach(([c, a, b]) => R(-X, a, LW, b - a, c));
  perspective(86, "#4b4b57", 22, 10);
  for (let x = 4 - Math.ceil((X + 4) / 10) * 10; x < LW - X; x += 10) R(x, 125, 6, 8, "#e8e8e8");
  g.fillStyle = "#d9b840"; for (let x = 8 - Math.ceil((X + 8) / 18) * 18; x < LW - X; x += 18) g.fillRect(x, 106, 8, 1);
  // street lamps with glow
  [34, 206].forEach((x) => { R(x, 44, 1, 42, "#1a1a22"); R(x - 3, 43, 8, 2, "#1a1a22"); R(x - 2, 45, 6, 2, "#ffe9a8"); g.fillStyle = "rgba(255,233,168,.15)"; g.fillRect(x - 8, 47, 18, 10); });
}

// ---- 3. Gedung MPR/DPR (stages 7-9): green dome, long white wings, protest barricade ----
function drawMPR(g, stageNo) {
  const { rnd, R, sky, dome, perspective, flag } = ctxTools(g, 4242 + stageNo);
  sky(78, [212, 22, 36], [205, 24, 70]);                      // hazy overcast
  g.fillStyle = "rgba(255,255,255,.22)"; for (let i = 0; i < 7; i++) g.fillRect(Math.floor(rnd() * LW - X), 10 + Math.floor(rnd() * 30), 24 + Math.floor(rnd() * 30), 3);
  // long white wings with window rows
  R(4, 48, 232, 30, "#e9e7e0"); R(4, 46, 232, 2, "#b9b6ae"); R(4, 76, 232, 2, "#a8a59c");
  for (let x = 8; x < 232; x += 6) { R(x, 53, 3, 6, "#4a5b6e"); R(x, 64, 3, 6, "#4a5b6e"); }
  // side domes + big green dome
  dome(52, 48, 18, 14, ["#1f6b3a", "#2a8a4c", "#18552e"]);
  dome(188, 48, 18, 14, ["#1f6b3a", "#2a8a4c", "#18552e"]);
  dome(120, 50, 38, 32, ["#1f6b3a", "#2e9a56", "#18552e", "#3cb06a"]);
  R(119, 8, 2, 12, "#cfcfcf"); R(120, 8, 10, 3, "#d32f2f"); R(120, 11, 10, 3, "#fff");
  // portico
  R(96, 52, 48, 26, "#f4f2ec"); for (let x = 98; x < 142; x += 6) { R(x, 55, 3, 21, "#ffffff"); R(x + 3, 55, 1, 21, "#cfccc2"); }
  R(94, 76, 52, 2, "#b9b6ae"); R(90, 78, 60, 2, "#a8a59c");
  flag(14, 16); flag(220, 16);
  // plaza + barricade + protest banner
  R(-X, 80, LW, 6, "#8d8a84");
  R(-X, 86, LW, LH - 86, "#77746f");
  for (let y = 100; y < LH; y += 14) R(-X, y, LW, 1, "#8b8883");
  perspective(86, "#8b8883", 26, 10);
  for (let x = 0 - Math.ceil((X + 0) / 10) * 10; x < LW - X; x += 10) { R(x, 79, 5, 4, "#ff8a1f"); R(x + 5, 79, 5, 4, "#f5f5f5"); }
  R(-X, 83, LW, 1, "#444");
  [30, 80, 160, 210].forEach((x) => R(x, 83, 1, 3, "#444"));
  R(56, 72, 128, 9, "#111"); R(57, 73, 126, 7, "#f5f0e1");
  g.fillStyle = "#b32d2d"; g.font = "bold 6px monospace"; g.textBaseline = "top"; g.textAlign = "center"; g.fillText("DENGARKAN RAKYAT!", 120, 74);
}

// ---- 4. Istana Presiden (stage 10): white neoclassical palace, flag, fence, red carpet ----
function drawPalace(g, stageNo) {
  const { rnd, R, sky, flag } = ctxTools(g, 9001 + stageNo);
  sky(78, [215, 58, 36], [392, 88, 66]);                       // golden hour
  R(176, 44, 14, 14, "#ffd980"); R(179, 47, 8, 8, "#fff1c4");
  // trees (palms) on both sides
  [[14, 30], [32, 38], [208, 30], [226, 38]].forEach(([x, top]) => {
    R(x, top + 6, 2, 60, "#4a3a22");
    for (let k = -6; k <= 6; k += 3) { R(x + k - 3, top + Math.abs(k) / 2, 8, 2, "#1f6b2a"); R(x + k - 2, top + 2 + Math.abs(k) / 2, 6, 1, "#2f8a3a"); }
  });
  // lawn
  R(-X, 66, LW, 20, "#3f7f3f"); for (let y = 66; y < 86; y += 4) R(-X, y, LW, 2, "#46893f");
  // palace body, wings and roof
  R(34, 46, 172, 28, "#f4f1e8"); R(32, 44, 176, 3, "#8d8a85"); R(34, 72, 172, 3, "#cfc9b8");
  for (let x = 38; x < 206; x += 7) { if (x > 90 && x < 150) continue; R(x, 52, 3, 8, "#566b86"); R(x, 63, 3, 8, "#566b86"); }
  // central portico: pediment (stepped triangle), columns, steps
  for (let i = 0; i < 12; i++) R(96 + i * 2, 30 + (11 - i), 48 - i * 4, 1, i % 4 === 0 ? "#cfc9b8" : "#f4f1e8");
  R(94, 42, 52, 4, "#e4dfd0");
  for (let x = 98; x < 142; x += 7) { R(x, 47, 3, 27, "#ffffff"); R(x + 3, 47, 1, 27, "#cfc9b8"); }
  R(92, 74, 56, 2, "#cfc9b8"); R(88, 76, 64, 2, "#bdb6a2"); R(84, 78, 72, 2, "#a8a18c");
  flag(120, 4, 16);
  // iron fence with gold tips
  R(-X, 83, LW, 1, "#111"); R(-X, 85, LW, 1, "#111");
  for (let x = 1 - Math.ceil((X + 1) / 4) * 4; x < LW - X; x += 4) { R(x, 77, 1, 9, "#111"); R(x, 76, 1, 1, "#e6c34a"); }
  // ground: pavers + red carpet in perspective
  R(-X, 86, LW, LH - 86, "#b9a98d");
  for (let y = 94; y < LH; y += 8) R(-X, y, LW, 1, "#a1906f");
  for (let i = -9; i <= 9; i++) for (let y = 87; y < LH; y++) { const t = (y - 86) / (LH - 86); R(CX + i * 8 + i * 22 * t, y, 1, 1, "#a1906f"); }
  for (let y = 86; y < LH; y++) { const t = (y - 86) / (LH - 86), half = 12 + t * 34; R(CX - half, y, half * 2, 1, y % 6 < 1 ? "#7d1f1f" : "#a32b2b"); }
  R(CX - 14, 86, 1, LH - 86, "#d9b840");
}

const DRAW = { street: drawStreet, hi: drawHI, mpr: drawMPR, palace: drawPalace };

export function makeBackground(stageNo) {
  LW = W / S; X = Math.round((LW - DESIGN_W) / 2);
  const c = document.createElement("canvas"); c.width = LW; c.height = LH;
  const g = c.getContext("2d");
  g.translate(X, 0);
  DRAW[venueFor(stageNo).id](g, stageNo);
  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const o = out.getContext("2d");
  o.imageSmoothingEnabled = false;
  o.drawImage(c, 0, 0, W, H);
  for (let i = 0; i < 5; i++) { // stepped vignette (bands, not a smooth gradient)
    o.fillStyle = "rgba(0,0,0,.09)";
    o.fillRect(0, 0, 24 * (5 - i), H); o.fillRect(W - 24 * (5 - i), 0, 24 * (5 - i), H);
  }
  return out;
}
