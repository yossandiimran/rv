import { W, H, ROUND_SECONDS, PX, FEET, MOVES, DODGE } from "../data/config.js";
import { Fighter } from "../entities/Fighter.js";
import { BossAI } from "../systems/AI.js";
import { Projectile, meleeCheck, updateProjectiles, damageFor } from "../systems/Combat.js";
import { attackName } from "../core/Assets.js";
import { pixelText } from "../utils/pixelText.js";

// Combat-sheet pose per state. Dedicated idle/walk frames don't exist yet, so pose 0 is reused with bob.
const POSE = { idle: 0, walk: 0, block: 2, dodge: 3, hit: 7, ko: 7, victory: 0 };
const INTRO = 150;
const KO_SLOWMO = 80;

export class Battle {
  constructor(playerDef, bossDef, playerPoses, bossPoses, input, { stageNo, onEnd }) {
    this.input = input; this.onEnd = onEnd; this.stageNo = stageNo;
    this.player = new Fighter(playerDef, { x: 300, y: 430, facing: 1, poses: playerPoses });
    this.boss = new Fighter(bossDef, { x: 660, y: 430, facing: -1, poses: bossPoses, isBoss: true });
    this.fighters = [this.player, this.boss];
    this.ai = new BossAI(this.boss);
    this.projectiles = []; this.sparks = []; this.bursts = []; this.floaters = [];
    this.phase = "intro"; this.t = 0; this.paused = false;
    this.timeLeft = ROUND_SECONDS * 60;
    this.shakeT = 0; this.shakeAmp = 0; this.stop = 0;
    this.zoom = 0; this.flashA = 0; this.slow = 0;
    this.combo = { n: 0, t: 0 };
    this.callout = { text: "", t: 0, color: "#fff" };
    this.bg = makeBackground(stageNo);
    this.fx = {
      spark: (x, y, color, n) => this.spawnSparks(x, y, color, n),
      shake: (a) => { this.shakeAmp = Math.max(this.shakeAmp, a); this.shakeT = 12; },
      hitstop: (f) => { this.stop = Math.max(this.stop, f + 2); },
      hit: (att, def, dmg, result, move) => this.onHit(att, def, dmg, result, move),
    };
    this.events = {
      onStart: (f, name) => {
        if (name === "punch") return;
        const text = attackName(f.def.id, name === "kick" ? 1 : 4);
        if (text) this.callout = { text, t: 80, color: f.def.color ?? "#fff" };
      },
      onActive: (f) => {
        // Projectile specials spawn once at the start of the active window.
        if (f.moveName === "special" && f.def.specialType === "projectile") {
          const target = f === this.player ? this.boss : this.player;
          this.projectiles.push(new Projectile(f, damageFor(f, target, MOVES.special), f.def.color ?? "#fff"));
        }
      },
    };
  }

  setPaused(p) { this.paused = p; }

  // Game-feel reactions to a connected hit (all cosmetic except combo counter).
  onHit(att, def, dmg, result, move) {
    const dir = att.x <= def.x ? 1 : -1;
    if (result === "block") {
      this.floaters.push({ x: def.x, y: def.y - 160, text: "BLOK", t: 0, color: "#9ad1ff", px: 3 });
      return;
    }
    const big = move.knock > 8;
    this.bursts.push({ x: def.x - dir * 14, y: def.y - 100, t: 0, big });
    this.floaters.push({ x: def.x + (Math.random() - 0.5) * 30, y: def.y - 170, t: 0, text: String(Math.round(dmg)),
      color: att === this.player ? "#ffe66b" : "#ff6b6b", px: big ? 4 : 3 });
    this.zoom = Math.max(this.zoom, big ? 0.05 : 0.022);
    if (big) this.flashA = Math.max(this.flashA, 0.28);
    if (att === this.player) { this.combo.n++; this.combo.t = 110; } else this.combo.n = 0;
    if (!def.alive) this.flashA = 0.85;
  }

  update() {
    if (this.paused) { this.input.endTick(); return; }
    this.t++;
    if (this.shakeT > 0) this.shakeT--;
    if (this.callout.t > 0) this.callout.t--;
    if (this.combo.t > 0 && --this.combo.t === 0) this.combo.n = 0;
    this.zoom *= 0.86; this.flashA *= 0.84;
    this.updateFx();
    if (this.stop > 0) { this.stop--; this.input.endTick(); return; } // hit-stop freezes gameplay
    if (this.slow > 0 && this.slow-- % 3) { this.input.endTick(); return; } // KO slow-mo: sim runs at 1/3 speed

    const { player, boss } = this;
    if (this.phase === "intro") {
      if (this.t >= INTRO) { this.phase = "fight"; this.t = 0; }
    } else if (this.phase === "fight") {
      player.update(this.input.intent(), boss, this.events);
      boss.update(this.ai.intent(player), player, this.events);
      this.separate();
      meleeCheck(player, boss, this.fx);
      meleeCheck(boss, player, this.fx);
      updateProjectiles(this.projectiles, this.fighters, this.fx);
      this.walkDust();
      if (--this.timeLeft <= 0) this.finish(player.hp / player.maxHp >= boss.hp / boss.maxHp ? "win" : "lose");
      else if (!boss.alive) this.finish("win");
      else if (!player.alive) this.finish("lose");
    } else if (this.phase === "end") {
      const idle = { mx: 0, my: 0 };
      player.update(idle, boss, this.events); boss.update(idle, player, this.events);
      if (++this.t === 90) this.onEnd(this.result, { hpLeft: player.hp / player.maxHp });
    }
    this.input.endTick();
  }

  finish(result) {
    this.phase = "end"; this.t = 0; this.result = result;
    this.projectiles.length = 0;
    const winner = result === "win" ? this.player : this.boss;
    const loser = result === "win" ? this.boss : this.player;
    if (!loser.alive) this.slow = KO_SLOWMO; // slow-mo only for a real KO
    if (winner.alive) winner.state = "victory";
    loser.state = "ko"; // also covers a timeout loss
  }

  // Keeps fighters from standing inside each other when depth overlaps.
  separate() {
    const { player: a, boss: b } = this;
    if (Math.abs(a.y - b.y) > 26) return;
    const gap = 64 - Math.abs(a.x - b.x);
    if (gap > 0) {
      const s = a.x <= b.x ? 1 : -1;
      a.x -= s * gap / 2; b.x += s * gap / 2; a.clamp(); b.clamp();
    }
  }

  walkDust() {
    if (this.t % 9) return;
    for (const f of this.fighters) {
      if (f.state === "walk" || f.state === "dodge") this.spawnSparks(f.x - f.facing * 20, f.y - 4, "#9a9a9a", 2, 0.5);
    }
  }

  spawnSparks(x, y, color, n, speed = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = (2 + Math.random() * 5) * speed;
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5 * speed, life: 18 + Math.random() * 14,
        color, size: Math.random() < 0.4 ? 8 : 4 });
    }
  }
  updateFx() {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.22;
      if (--p.life <= 0) this.sparks.splice(i, 1);
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) if (++this.bursts[i].t > 10) this.bursts.splice(i, 1);
    for (let i = this.floaters.length - 1; i >= 0; i--) if (++this.floaters[i].t > 40) this.floaters.splice(i, 1);
  }

  // ---------- render (read-only; shake uses Math.random but never touches game state) ----------
  render(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (this.zoom > 0.002) { // impact zoom, anchored near the fighters' feet
      const z = 1 + this.zoom;
      ctx.translate(W / 2, H * 0.78); ctx.scale(z, z); ctx.translate(-W / 2, -H * 0.78);
    }
    if (this.shakeT > 0) {
      const a = this.shakeAmp * (this.shakeT / 12);
      ctx.translate(Math.round((Math.random() - 0.5) * a * 2), Math.round((Math.random() - 0.5) * a * 2));
    }
    ctx.drawImage(this.bg, 0, 0);
    this.fighters.forEach((f) => this.drawShadow(ctx, f));
    const list = [
      ...this.fighters.map((f) => ({ y: f.y, d: () => this.drawFighter(ctx, f) })),
      ...this.projectiles.map((p) => ({ y: p.y, d: () => this.drawProjectile(ctx, p) })),
    ];
    list.sort((a, b) => a.y - b.y).forEach((o) => o.d()); // depth sort by ground Y
    for (const p of this.sparks) {
      ctx.globalAlpha = Math.min(1, p.life / 10);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const b of this.bursts) this.drawBurst(ctx, b);
    for (const f of this.floaters) {
      const rise = f.t * 1.6;
      pixelText(ctx, f.text, f.x, f.y - rise, { px: f.px, color: f.color, alpha: Math.min(1, (40 - f.t) / 12) });
    }
    ctx.restore();
    if (this.flashA > 0.02) { ctx.fillStyle = `rgba(255,255,255,${this.flashA})`; ctx.fillRect(0, 0, W, H); }
    this.drawHud(ctx);
  }

  drawShadow(ctx, f) {
    const s = f.scale;
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.fillRect(Math.round(f.x - 60 * s), Math.round(f.y - 8), Math.round(120 * s), 12);
    ctx.fillRect(Math.round(f.x - 48 * s), Math.round(f.y - 12), Math.round(96 * s), 20);
  }

  poseFor(f) {
    if (f.state === "attack") {
      const m = f.move;
      return f.t >= m.startup && m.activePose !== undefined ? m.activePose : m.pose;
    }
    return POSE[f.state] ?? 0;
  }

  drawFighter(ctx, f) {
    const img = f.poses[this.poseFor(f)];
    const w = img.width * PX, h = img.height * PX; // integer scale: pixels stay square
    let bob = 0, back = 0;
    if (f.state === "walk") bob = -(Math.floor(Math.abs(Math.sin(f.walkClock)) * 2)) * PX;
    else if (f.state === "idle") bob = Math.sin(this.t / 16) > 0 ? -PX : 0;
    else if (f.state === "dodge") bob = -Math.round(Math.sin((f.t / DODGE.frames) * Math.PI) * 12 / PX) * PX;
    else if (f.state === "attack" && f.inStartup && f.moveName !== "punch") back = -f.facing * 6; // wind-up
    ctx.save();
    ctx.translate(Math.round(f.x + back), Math.round(f.y + bob));
    ctx.scale(f.facing, 1); // sheets are drawn facing right
    ctx.drawImage(img, -Math.round(w / 2), -Math.round(h * FEET), w, h);
    if (f.state === "hit" && f.flash > 4) ctx.drawImage(img.flash, -Math.round(w / 2), -Math.round(h * FEET), w, h);
    ctx.restore();
    // Telegraph: heavy boss moves flash a warning while winding up.
    if (f.isBoss && f.inStartup && f.moveName !== "punch") {
      pixelText(ctx, "!", f.x, f.y - h * 0.95, { size: 14, px: 4, color: Math.floor(this.t / 3) % 2 ? "#ff3b30" : "#ffd60a" });
    }
  }

  drawProjectile(ctx, p) {
    const x = Math.round(p.x / 4) * 4, y = Math.round((p.y - 80) / 4) * 4;
    for (let i = 3; i >= 1; i--) { // blocky trail
      ctx.globalAlpha = 0.25 * (4 - i); ctx.fillStyle = p.color;
      ctx.fillRect(x - Math.sign(p.vx) * i * 20 - 10, y - 10, 20, 20);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#111"; ctx.fillRect(x - 20, y - 20, 40, 40);
    ctx.fillStyle = p.color; ctx.fillRect(x - 16, y - 16, 32, 32);
    ctx.fillStyle = "#fff"; ctx.fillRect(x - 12, y - 12, 10, 10);
  }

  // Pixel impact star: 8 squares flying outward + bright core.
  drawBurst(ctx, b) {
    const r = 10 + b.t * (b.big ? 8 : 5), s = (b.big ? 14 : 10) - Math.floor(b.t / 3) * 2;
    ctx.fillStyle = b.t < 3 ? "#fff" : "#ffe66b";
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, rr = k % 2 ? r * 0.7 : r;
      ctx.fillRect(Math.round((b.x + Math.cos(a) * rr) / 2) * 2 - s / 2, Math.round((b.y + Math.sin(a) * rr) / 2) * 2 - s / 2, s, s);
    }
    if (b.t < 5) { ctx.fillStyle = "#fff"; ctx.fillRect(b.x - 16, b.y - 16, 32, 32); }
  }

  drawHud(ctx) {
    const { player: p, boss: b } = this;
    // Chunky segmented bar with a hard border.
    const bar = (x, y, w, h, frac, color, right, segs = true) => {
      ctx.fillStyle = "#000"; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = "#2a1020"; ctx.fillRect(x, y, w, h);
      const fw = Math.round(w * Math.max(0, Math.min(1, frac)) / 4) * 4;
      ctx.fillStyle = color; ctx.fillRect(right ? x + w - fw : x, y, fw, h);
      if (segs) {
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(right ? x + w - fw : x, y, fw, 4); // highlight row
        ctx.fillStyle = "#000";
        for (let sx = 24; sx < w; sx += 24) ctx.fillRect(x + sx, y, 2, h);
      }
    };
    const bw = 360, low = (f) => f.hp / f.maxHp < 0.3 && Math.floor(this.t / 8) % 2;
    bar(28, 40, bw, 24, p.hp / p.maxHp, low(p) ? "#ff5a4f" : "#4cd964", false);
    bar(W - 28 - bw, 40, bw, 24, b.hp / b.maxHp, low(b) ? "#ffd60a" : "#ff5a4f", true);
    bar(28, 76, 190, 8, p.stamina / 100, "#4aa8ff", false, false);
    bar(28, 94, 190, 8, p.meter / 100, p.meter >= 40 ? "#ffd60a" : "#a07a00", false, false);
    pixelText(ctx, p.def.name.toUpperCase(), 28, 12, { px: 2, align: "left" });
    pixelText(ctx, b.def.name.toUpperCase(), W - 28, 12, { px: 2, align: "right" });
    pixelText(ctx, String(Math.ceil(this.timeLeft / 60)).padStart(2, "0"), W / 2, 22, { px: 3, color: "#ffd60a" });
    pixelText(ctx, `STAGE ${this.stageNo}`, W / 2, 66, { px: 2, color: "#cfcfcf" });

    if (this.combo.n >= 2) {
      pixelText(ctx, `${this.combo.n} HIT!`, 28, 130, { px: 3, align: "left", color: "#ffd60a", alpha: Math.min(1, this.combo.t / 20) });
    }
    if (this.callout.t > 0) {
      const a = Math.min(1, this.callout.t / 16);
      ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`; ctx.fillRect(0, 118, W, 44);
      pixelText(ctx, this.callout.text.toUpperCase(), W / 2, 126, { px: 2, color: this.callout.color, alpha: a });
    }
    if (this.phase === "intro") {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 170, W, 130);
      ctx.fillStyle = "#b32d2d"; ctx.fillRect(0, 166, W, 4); ctx.fillRect(0, 300, W, 4);
      const late = this.t > 100;
      pixelText(ctx, late ? "FIGHT!" : b.def.name.toUpperCase(), W / 2, 200, { size: 14, px: late ? 5 : 3, color: late ? "#ffd60a" : "#fff" });
      if (!late) pixelText(ctx, `"${b.def.taunt}"`, W / 2, 262, { px: 2, color: "#ffd60a" });
    }
    if (this.phase === "end") {
      const win = this.result === "win";
      pixelText(ctx, win ? "K.O.!" : "KALAH...", W / 2, 190, { size: 14, px: 6, color: win ? "#ffd60a" : "#ff5a4f" });
    }
  }
}

// Code-drawn urban street, built at 1/4 resolution then upscaled with no smoothing = chunky pixel art.
function makeBackground(stageNo) {
  const S = 4, w = W / S, h = H / S;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  const hue = (stageNo * 37 + 200) % 360;
  const hsl = (hh, s, l) => `hsl(${hh},${s}%,${l}%)`;
  let seed = stageNo * 9301 + 49297;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  // sky: hard bands with a dither row between them
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const y0 = Math.round(i * 76 / bands), y1 = Math.round((i + 1) * 76 / bands);
    g.fillStyle = hsl((hue + i * 4) % 360, 50, 16 + i * 3.4); g.fillRect(0, y0, w, y1 - y0);
    if (i < bands - 1) {
      g.fillStyle = hsl((hue + (i + 1) * 4) % 360, 50, 16 + (i + 1) * 3.4);
      for (let x = (i % 2); x < w; x += 2) g.fillRect(x, y1 - 1, 1, 1);
    }
  }
  g.fillStyle = "#fff"; for (let i = 0; i < 30; i++) g.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * 40), 1, 1);
  g.fillStyle = "#f5e9b8"; g.fillRect(190, 10, 12, 12); g.fillStyle = "#fff8d8"; g.fillRect(192, 12, 6, 6); // moon

  for (let layer = 0; layer < 2; layer++) { // city silhouettes
    const col = hsl(hue, 30, layer ? 9 : 14);
    for (let x = -4; x < w; ) {
      const bw = 12 + Math.floor(rnd() * 18), bh = 22 + Math.floor(rnd() * (layer ? 26 : 40));
      g.fillStyle = col; g.fillRect(x, 78 - bh, bw, bh);
      g.fillStyle = "#ffd980";
      for (let wy = 78 - bh + 3; wy < 74; wy += 5) for (let wx = x + 2; wx < x + bw - 2; wx += 4) if (rnd() > 0.65) g.fillRect(wx, wy, 2, 2);
      x += bw + 1;
    }
  }
  g.fillStyle = "#4a4a56"; g.fillRect(0, 75, w, 11);               // wall
  g.fillStyle = "#3a3a46"; for (let x = 0; x < w; x += 20) g.fillRect(x, 75, 1, 11);
  g.fillStyle = "#33333f"; g.fillRect(0, 75, w, 1);
  g.fillStyle = "#8a8a96"; g.fillRect(0, 84, w, 2);               // curb
  const rows = [["#34343e", 86, 100], ["#2c2c36", 100, 114], ["#24242d", 114, h]];
  rows.forEach(([col, a, b]) => { g.fillStyle = col; g.fillRect(0, a, w, b - a); });
  g.fillStyle = "#4b4b57"; // perspective lines drawn pixel by pixel
  for (let i = -9; i <= 9; i++) for (let y = 87; y < h; y++) {
    const t = (y - 86) / (h - 86);
    g.fillRect(Math.round(w / 2 + i * 8 + i * 22 * t), y, 1, 1);
  }
  g.fillStyle = "#d9b840"; // lane dashes
  [96, 108, 122].forEach((y) => { for (let x = 6; x < w; x += 14) g.fillRect(x, y, 8, 1); });

  // satire signs (tiny pixel text, upscaled with the rest)
  const signs = [["DENGAR", "RAKYAT"], ["TURUNKAN", "HARGA"], ["BUBAR", "BUZZER"], ["KAMI BUKAN", "DATA"]];
  const cols = ["#f5f0e1", "#ffd60a", "#ff8a80", "#9ad1ff"];
  [26, 88, 150, 212].forEach((x, i) => {
    g.fillStyle = "#6b4a2b"; g.fillRect(x - 1, 70, 2, 16);
    g.fillStyle = "#111"; g.fillRect(x - 17, 58, 34, 16);
    g.fillStyle = cols[i]; g.fillRect(x - 16, 59, 32, 14);
    const [l1, l2] = signs[(i + stageNo) % 4];
    g.fillStyle = "#111"; g.font = "bold 6px monospace"; g.textBaseline = "top"; g.textAlign = "center";
    g.fillText(l1, x, 59); g.fillText(l2, x, 66);
  });

  const out = document.createElement("canvas"); out.width = W; out.height = H;
  const o = out.getContext("2d");
  o.imageSmoothingEnabled = false;
  o.drawImage(c, 0, 0, W, H);
  // stepped vignette (bands, not a smooth gradient)
  for (let i = 0; i < 5; i++) {
    o.fillStyle = "rgba(0,0,0,.09)";
    o.fillRect(0, 0, 24 * (5 - i), H); o.fillRect(W - 24 * (5 - i), 0, 24 * (5 - i), H);
  }
  return out;
}
