import { W, H, ROUND_SECONDS, SPRITE_SIZE, FEET, MOVES, DODGE } from "../data/config.js";
import { Fighter } from "../entities/Fighter.js";
import { BossAI } from "../systems/AI.js";
import { Projectile, meleeCheck, updateProjectiles, damageFor } from "../systems/Combat.js";
import { attackName } from "../core/Assets.js";

// Combat-sheet pose per state. Dedicated idle/walk frames don't exist yet, so pose 0 is reused with bob/squash.
const POSE = { idle: 0, walk: 0, block: 2, dodge: 3, hit: 7, ko: 7, victory: 0 };
const INTRO = 150;

export class Battle {
  constructor(playerDef, bossDef, playerPoses, bossPoses, input, { stageNo, onEnd }) {
    this.input = input; this.onEnd = onEnd; this.stageNo = stageNo;
    this.player = new Fighter(playerDef, { x: 300, y: 430, facing: 1, poses: playerPoses });
    this.boss = new Fighter(bossDef, { x: 660, y: 430, facing: -1, poses: bossPoses, isBoss: true });
    this.fighters = [this.player, this.boss];
    this.ai = new BossAI(this.boss);
    this.projectiles = []; this.sparks = [];
    this.phase = "intro"; this.t = 0; this.paused = false;
    this.timeLeft = ROUND_SECONDS * 60;
    this.shakeT = 0; this.shakeAmp = 0; this.stop = 0;
    this.callout = { text: "", t: 0, color: "#fff" };
    this.bg = makeBackground(stageNo);
    this.fx = {
      spark: (x, y, color, n) => this.spawnSparks(x, y, color, n),
      shake: (a) => { this.shakeAmp = Math.max(this.shakeAmp, a); this.shakeT = 10; },
      hitstop: (f) => { this.stop = Math.max(this.stop, f); },
    };
    this.events = {
      onStart: (f, name) => {
        if (name === "punch") return;
        const text = attackName(f.def.id, name === "kick" ? 1 : 4);
        if (text) this.callout = { text, t: 70, color: f.def.color ?? "#fff" };
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

  update() {
    if (this.paused) { this.input.endTick(); return; }
    this.t++;
    if (this.shakeT > 0) this.shakeT--;
    if (this.callout.t > 0) this.callout.t--;
    this.updateSparks();
    if (this.stop > 0) { this.stop--; this.input.endTick(); return; } // hit-stop freezes gameplay

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
      if (--this.timeLeft <= 0) this.finish(player.hp / player.maxHp >= boss.hp / boss.maxHp ? "win" : "lose");
      else if (!boss.alive) this.finish("win");
      else if (!player.alive) this.finish("lose");
    } else if (this.phase === "end") {
      const idle = { mx: 0, my: 0 };
      player.update(idle, boss, this.events); boss.update(idle, player, this.events);
      if (++this.t === 150) this.onEnd(this.result, { hpLeft: player.hp / player.maxHp });
    }
    this.input.endTick();
  }

  finish(result) {
    this.phase = "end"; this.t = 0; this.result = result;
    this.projectiles.length = 0;
    const winner = result === "win" ? this.player : this.boss;
    if (winner.alive) winner.state = "victory";
    const loser = result === "win" ? this.boss : this.player;
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

  spawnSparks(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 4;
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 20 + Math.random() * 10, color });
    }
  }
  updateSparks() {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.18;
      if (--p.life <= 0) this.sparks.splice(i, 1);
    }
  }

  // ---------- render (read-only; shake uses Math.random but never touches game state) ----------
  render(ctx) {
    ctx.save();
    if (this.shakeT > 0) ctx.translate((Math.random() - 0.5) * this.shakeAmp, (Math.random() - 0.5) * this.shakeAmp);
    ctx.drawImage(this.bg, 0, 0);
    this.fighters.forEach((f) => this.drawShadow(ctx, f));
    const list = [
      ...this.fighters.map((f) => ({ y: f.y, d: () => this.drawFighter(ctx, f) })),
      ...this.projectiles.map((p) => ({ y: p.y, d: () => this.drawProjectile(ctx, p) })),
    ];
    list.sort((a, b) => a.y - b.y).forEach((o) => o.d()); // depth sort by ground Y
    for (const p of this.sparks) {
      ctx.globalAlpha = Math.min(1, p.life / 15);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 5, 5);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    this.drawHud(ctx);
  }

  drawShadow(ctx, f) {
    const s = f.scale;
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(f.x, f.y, 62 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
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
    const s = f.scale, size = SPRITE_SIZE * s;
    const h = size * img.height / img.width;
    let bob = 0, squash = 1;
    if (f.state === "walk") bob = -Math.abs(Math.sin(f.walkClock)) * 5 * s;
    else if (f.state === "idle") squash = 1 + Math.sin(this.t / 14) * 0.012;
    else if (f.state === "dodge") bob = -Math.sin((f.t / DODGE.frames) * Math.PI) * 10;
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.scale(f.facing, 1); // sheets are drawn facing right
    if (f.state === "hit") ctx.globalAlpha = 0.65 + 0.35 * Math.sin(f.flash * 2);
    ctx.drawImage(img, -size / 2, -h * FEET * squash, size, h * squash);
    ctx.restore();
    // Telegraph: heavy boss moves flash a warning while winding up.
    if (f.isBoss && f.inStartup && f.moveName !== "punch") {
      ctx.fillStyle = Math.floor(this.t / 4) % 2 ? "#ff3b30" : "#ffd60a";
      ctx.font = "bold 40px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", f.x, f.y - h * 0.85);
    }
  }

  drawProjectile(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y - 80);
    ctx.fillStyle = p.color; ctx.strokeStyle = "#111"; ctx.lineWidth = 4;
    for (let i = 3; i >= 1; i--) { // trail
      ctx.globalAlpha = 0.2 * (4 - i);
      ctx.beginPath(); ctx.arc(-p.vx * i * 3, 0, 18 - i * 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-5, -6, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawHud(ctx) {
    const { player: p, boss: b } = this;
    const bar = (x, y, w, h, frac, color, right) => {
      ctx.fillStyle = "rgba(0,0,0,.65)"; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.fillStyle = "#3a1a1a"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color;
      const fw = w * Math.max(0, frac);
      ctx.fillRect(right ? x + w - fw : x, y, fw, h);
    };
    const bw = 360;
    bar(24, 34, bw, 22, p.hp / p.maxHp, "#4cd964", false);
    bar(W - 24 - bw, 34, bw, 22, b.hp / b.maxHp, "#ff5a4f", true);
    bar(24, 66, 200, 8, p.stamina / 100, "#4aa8ff", false);
    bar(24, 80, 200, 8, p.meter / 100, p.meter >= 40 ? "#ffd60a" : "#b58a00", false);
    ctx.font = "bold 18px system-ui, sans-serif"; ctx.fillStyle = "#fff";
    ctx.textAlign = "left"; ctx.fillText(p.def.name, 24, 24);
    ctx.textAlign = "right"; ctx.fillText(b.def.name, W - 24, 24);
    ctx.textAlign = "center";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.fillText(String(Math.ceil(this.timeLeft / 60)), W / 2, 56);
    ctx.font = "12px system-ui, sans-serif"; ctx.fillStyle = "#ddd";
    ctx.fillText(`STAGE ${this.stageNo}`, W / 2, 74);

    if (this.callout.t > 0) {
      ctx.globalAlpha = Math.min(1, this.callout.t / 20);
      ctx.font = "bold 26px system-ui, sans-serif"; ctx.fillStyle = this.callout.color;
      ctx.strokeStyle = "#000"; ctx.lineWidth = 5; ctx.textAlign = "center";
      ctx.strokeText(this.callout.text, W / 2, 130); ctx.fillText(this.callout.text, W / 2, 130);
      ctx.globalAlpha = 1;
    }
    if (this.phase === "intro") {
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 170, W, 130);
      ctx.fillStyle = "#fff"; ctx.font = "bold 44px system-ui, sans-serif";
      const late = this.t > 100;
      ctx.fillText(late ? "FIGHT!" : b.def.name.toUpperCase(), W / 2, 232);
      if (!late) {
        ctx.font = "italic 20px system-ui, sans-serif"; ctx.fillStyle = "#ffd60a";
        ctx.fillText(`“${b.def.taunt}”`, W / 2, 268);
      }
    }
    if (this.phase === "end") {
      ctx.fillStyle = "#fff"; ctx.font = "bold 64px system-ui, sans-serif";
      ctx.strokeStyle = "#000"; ctx.lineWidth = 8;
      const txt = this.result === "win" ? "K.O.!" : "KALAH...";
      ctx.strokeText(txt, W / 2, 250); ctx.fillText(txt, W / 2, 250);
    }
  }
}

// Code-drawn urban street (brief: placeholder arena). Built once per stage, then blitted.
function makeBackground(stageNo) {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  const hue = (stageNo * 37 + 200) % 360;
  const sky = g.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, `hsl(${hue},45%,18%)`); sky.addColorStop(1, `hsl(${(hue + 30) % 360},50%,42%)`);
  g.fillStyle = sky; g.fillRect(0, 0, W, 320);
  let seed = stageNo * 9301 + 49297;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let layer = 0; layer < 2; layer++) { // city silhouettes
    const col = `hsl(${hue},30%,${layer ? 10 : 16}%)`;
    for (let x = -20; x < W; ) {
      const w = 50 + rnd() * 70, h = 90 + rnd() * (layer ? 120 : 170);
      g.fillStyle = col; g.fillRect(x, 310 - h, w, h + 20);
      g.fillStyle = "rgba(255,220,120,.35)";
      for (let wy = 310 - h + 10; wy < 300; wy += 18) {
        for (let wx = x + 8; wx < x + w - 8; wx += 14) if (rnd() > 0.6) g.fillRect(wx, wy, 6, 8);
      }
      x += w + 4;
    }
  }
  g.fillStyle = "#4a4a52"; g.fillRect(0, 300, W, 50);
  g.fillStyle = "#3a3a42"; for (let x = 0; x < W; x += 80) g.fillRect(x, 300, 3, 50);
  const road = g.createLinearGradient(0, 340, 0, H);
  road.addColorStop(0, "#2c2c33"); road.addColorStop(1, "#1b1b20");
  g.fillStyle = road; g.fillRect(0, 340, W, H - 340);
  g.fillStyle = "#6b6b73"; g.fillRect(0, 336, W, 8);
  g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 2; // perspective lines
  for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(W / 2 + i * 40, 344); g.lineTo(W / 2 + i * 150, H); g.stroke(); }
  g.fillStyle = "rgba(255,220,80,.5)";
  for (let k = 0; k < 4; k++) g.fillRect(40, 372 + k * k * 12 + k * 22, 880, 3 + k);
  const signs = ["DENGARKAN RAKYAT", "TURUNKAN HARGA", "BUBARKAN BUZZER", "KAMI BUKAN DATA"]; // satire signage
  g.font = "bold 14px system-ui, sans-serif"; g.textAlign = "center";
  [120, 360, 600, 840].forEach((x, i) => {
    g.fillStyle = "#6b4a2b"; g.fillRect(x - 2, 290, 4, 60);
    g.fillStyle = ["#f5f0e1", "#ffd60a", "#ff8a80", "#9ad1ff"][i]; g.fillRect(x - 70, 262, 140, 36);
    g.strokeStyle = "#111"; g.lineWidth = 3; g.strokeRect(x - 70, 262, 140, 36);
    g.fillStyle = "#111"; g.fillText(signs[(i + stageNo) % 4], x, 285);
  });
  const v = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 620);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.5)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  return c;
}
