import { W, H, ROUND_SECONDS, PX, FEET, MOVES, DODGE, SPECIAL_COST, ULTIMATE_COST } from "../data/config.js";
import { Fighter } from "../entities/Fighter.js";
import { BossAI } from "../systems/AI.js";
import { Projectile, meleeCheck, updateProjectiles, damageFor } from "../systems/Combat.js";
import { attackName } from "../core/Assets.js";
import { pixelText } from "../utils/pixelText.js";
import { makeBackground, venueFor } from "./Backgrounds.js";

// Combat-sheet pose per state. Dedicated idle/walk frames don't exist yet, so pose 0 is reused with bob.
const POSE = { idle: 0, walk: 0, block: 2, dodge: 3, hit: 7, ko: 7, victory: 0 };
const INTRO = 150;
// Generic reactions shared by every boss (hit barks live in each boss's data).
const REACT = {
  block: ["COBA BLOK TERUS!", "KUAT JUGA, YA!", "BLOK DOANG?", "NGUMPET AJA!"],
  hurt: ["AKH!", "BERANI JUGA!", "SAKIT, WOI!", "LUMAYAN!", "HEH!"],
  desperate: ["BELUM KALAH!", "INI BARU PEMANASAN!", "JANGAN SENANG DULU!"],
  win: ["SELESAI!", "COBA LAGI NANTI!", "BELAJAR DULU!"],
};
const KO_SLOWMO = 80;
const END_DELAY = 170; // ticks after the final blow before the result screen (slow-mo included)

export class Battle {
  constructor(playerDef, bossDef, playerPoses, bossPoses, input, { stageNo, onEnd, touch = false, training = false }) {
    this.input = input; this.onEnd = onEnd; this.stageNo = stageNo; this.touch = touch; this.training = training;
    this.player = new Fighter(playerDef, { x: W / 2 - 180, y: 430, facing: 1, poses: playerPoses });
    this.boss = new Fighter(bossDef, { x: W / 2 + 180, y: 430, facing: -1, poses: bossPoses, isBoss: true });
    this.fighters = [this.player, this.boss];
    this.ai = new BossAI(this.boss);
    this.barkCd = 0; this.desperate = false;
    this.words = []; this.lines = []; this.confetti = []; this.tint = null; this.letterbox = 0; this.invertT = 0;
    this.bubbles = []; this.projectiles = []; this.sparks = []; this.bursts = []; this.floaters = []; this.rings = [];
    this.trails = [[], []]; // afterimages per fighter
    this.phase = "intro"; this.t = 0; this.endT = 0; this.ended = false; this.paused = false;
    this.timeLeft = training ? Infinity : ROUND_SECONDS * 60;
    this.shakeT = 0; this.shakeAmp = 0; this.stop = 0;
    this.zoom = 0; this.flashA = 0; this.slow = 0; this.cineA = 0; this.cine = null;
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
      onStart: (f, name, combo) => this.onAttackStart(f, name, combo),
      onActive: (f) => this.onAttackActive(f),
      onMultiHit: (f) => this.onMultiHit(f),
    };
  }

  setPaused(p) { this.paused = p; }

  // Screen aspect changed (fullscreen, rotation): keep the fight centred and redraw the backdrop at the new width.
  onWorldResize(oldW, newW) {
    const dx = (newW - oldW) / 2;
    for (const f of this.fighters) { f.x += dx; f.clamp(); }
    for (const p of this.projectiles) p.x += dx;
    this.bg = makeBackground(this.stageNo);
  }

  onAttackStart(f, name, combo) {
    const color = f.def.color ?? "#fff";
    if (name === "combo") {
      const n = f.combos.indexOf(combo) + 1;
      this.zoom = Math.max(this.zoom, 0.03);
      this.callout = { text: `COMBO ${n}: ${combo.name}`, t: 90, color };
      if (combo.quote) this.bubbles = this.bubbles.filter((b) => b.f !== f).concat({ f, text: combo.quote, t: 0, life: 100, color });
    } else if (name === "ultimate") {
      this.cine = { t: 0, f, name: attackName(f.def.id, 6) || "ULTIMATE", color };
      this.callout = { text: "", t: 0, color };
    } else if (name !== "punch") {
      const text = attackName(f.def.id, name === "kick" ? 1 : 4);
      if (text) this.callout = { text, t: 80, color };
    }
  }

  onAttackActive(f) {
    const color = f.def.color ?? "#fff";
    // Projectile specials spawn once at the start of the active window.
    if (f.moveName === "special" && f.def.specialType === "projectile") {
      const target = f === this.player ? this.boss : this.player;
      this.projectiles.push(new Projectile(f, damageFor(f, target, MOVES.special), color));
    }
    if (f.moveName === "combo") {
      const st = f.move.style;
      if (f.move.proj) { // wave finisher
        const target = f === this.player ? this.boss : this.player;
        this.projectiles.push(new Projectile(f, damageFor(f, target, f.move), color, f.move));
        this.spawnSparks(f.x + f.facing * 60, f.y - 90, color, 10, 1.2);
      }
      if (st === "slam" || st === "launch") { // ground shock in front of the attacker
        this.rings.push({ x: f.x + f.facing * 70, y: f.y - 6, t: 0, color, flat: true });
        this.spawnSparks(f.x + f.facing * 70, f.y - 8, "#9a9a9a", 8, 1);
      }
      if (st === "rush") this.spawnSparks(f.x - f.facing * 30, f.y - 20, "#ffffff", 10, 1.3);
      this.fx.shake(st === "launch" ? 8 : 5);
    }
    if (f.moveName === "ultimate") { // big shockwave when the ultimate lands
      this.invertT = 3;
      this.rings.push({ x: f.x, y: f.y - 50, t: 0, color });
      this.rings.push({ x: f.x, y: f.y - 6, t: 0, color: "#fff", flat: true });
      this.flashA = 0.9; this.zoom = 0.1;
      this.fx.shake(18); this.fx.hitstop(8);
    }
  }

  // Boss speech bubble: a random line from the pool, no immediate repeats, never talking over a combo shout.
  bark(f, kind, force = false) {
    const pool = kind === "hit" ? f.def.barks : REACT[kind];
    if (!pool || !pool.length) return;
    if (!force && this.barkCd > 0) return;
    if (this.bubbles.some((b) => b.f === f && b.life - b.t > 25 && b.life > 70)) return; // a combo quote is still on screen
    let text;
    do { text = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && text === f.lastBark);
    f.lastBark = text; this.barkCd = 26;
    this.bubbles = this.bubbles.filter((b) => b.f !== f).concat({ f, text, t: 0, life: 64, color: f.def.color ?? "#fff" });
  }

  onMultiHit(f) { /* each extra hit of a multi finisher re-triggers onHit through meleeCheck */ }

  // Game-feel reactions to a connected hit (all cosmetic except combo counter).
  onHit(att, def, dmg, result, move) {
    const dir = att.x <= def.x ? 1 : -1;
    // the boss talks: when its attack lands (jabs, kicks, specials; combo finishers already shout their quote), gets blocked, or gets hurt
    if (att.isBoss) {
      if (result === "hit" && att.moveName !== "combo") this.bark(att, "hit");
      else if (result === "block") this.bark(att, "block");
    } else if (def.isBoss && result === "hit" && def.alive && Math.random() < 0.3) this.bark(def, "hurt");
    if (result === "block") {
      this.floaters.push({ x: def.x, y: def.y - 160, text: "BLOK", t: 0, color: "#9ad1ff", px: 3 });
      this.rings.push({ x: def.x - dir * 30, y: def.y - 90, t: 0, color: "#9ad1ff", small: true });
      this.spawnSparks(def.x - dir * 24, def.y - 90, "#9ad1ff", 8, 1.1);
      return;
    }
    const big = move.knock > 8 || !!move.launch;
    const finisher = att.moveName === "combo" || att.moveName === "ultimate";
    const quick = !!move.multi; // multi finishers hit many times: keep each hit light
    const color = att.def.color ?? "#ffe66b";
    const px = def.x - dir * 14, py = def.y - 100;
    this.bursts.push({ x: px, y: py, t: 0, big });
    this.floaters.push({ x: def.x + (Math.random() - 0.5) * 30, y: def.y - 170, t: 0, text: String(Math.round(dmg)),
      color: att === this.player ? "#ffe66b" : "#ff6b6b", px: big ? 4 : 3 });
    // comic-book impact word
    const pool = finisher ? ["KRAAK!", "BOOM!", "DUARR!", "WHAMM!"] : big ? ["BAM!", "WHAM!", "DUAK!"] : ["POW!", "TAK!", "PAK!"];
    if (!quick || Math.random() < 0.4) {
      this.words.push({ x: px + dir * 34, y: py - 46, t: 0, text: pool[Math.floor(Math.random() * pool.length)],
        color: finisher ? color : "#ffffff", px: finisher ? 5 : big ? 4 : 3 });
    }
    this.lines.push({ x: px, y: py, t: 0, big: big || finisher, color });
    this.themeFx(att, px, py, finisher && !quick ? 24 : big ? 12 : 5);
    if (def.vx && Math.abs(def.vx) > 8) this.spawnSparks(def.x, def.y - 6, "#9a9a9a", 6, 0.9);
    this.zoom = Math.max(this.zoom, finisher && !quick ? 0.09 : big ? 0.05 : 0.022);
    if (big) this.flashA = Math.max(this.flashA, 0.28);
    if (finisher && !quick) { // finisher: colour flash, slow-mo, ground ring
      this.tint = { c: color, a: 0.5 };
      this.slow = Math.max(this.slow, 18);
      this.rings.push({ x: def.x, y: def.y - 6, t: 0, color, flat: true });
      this.fx.shake(10);
    }
    if (att === this.player) { this.combo.n++; this.combo.t = 110; } else this.combo.n = 0;
    if (!def.alive) { // finishing blow: extra bursts, big flash and zoom
      this.flashA = 0.95; this.zoom = 0.13;
      this.words.push({ x: def.x, y: def.y - 200, t: 0, text: "K.O.!!", color: "#ffd60a", px: 7 });
      for (let i = 0; i < 3; i++) this.bursts.push({ x: def.x + (Math.random() - 0.5) * 120, y: def.y - 60 - Math.random() * 90, t: -i * 2, big: true });
      this.spawnSparks(def.x, def.y - 90, "#ffe66b", 36, 1.6);
      this.spawnSparks(def.x, def.y - 90, "#ffffff", 20, 1.2);
      this.themeFx(att, def.x, def.y - 90, 30);
    }
  }

  // Themed particles: office papers, student stars, vendor embers...
  themeFx(att, x, y, n) {
    const shape = att.def.fxShape ?? "square", cols = att.def.fxColors ?? [att.def.color ?? "#ffe66b", "#ffffff"];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 5;
      this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 26 + Math.random() * 22, color: cols[i % cols.length],
        size: Math.random() < 0.4 ? 8 : 4, shape, g: shape === "ember" ? -0.04 : shape === "paper" ? 0.08 : 0.22, ph: Math.random() * 6 });
    }
  }

  update() {
    if (this.paused) { this.input.endTick(); return; }
    this.t++;
    if (this.phase === "end") { // own timer: must keep counting through hit-stop and slow-mo
      this.endT++;
      if (!this.ended && this.endT >= END_DELAY) { this.ended = true; this.onEnd(this.result, { hpLeft: this.player.hp / this.player.maxHp }); }
    }
    if (this.shakeT > 0) this.shakeT--;
    if (this.barkCd > 0) this.barkCd--;
    if (this.callout.t > 0) this.callout.t--;
    if (this.combo.t > 0 && --this.combo.t === 0) this.combo.n = 0;
    this.zoom *= 0.86; this.flashA *= 0.84;
    if (this.tint) { this.tint.a *= 0.86; if (this.tint.a < 0.02) this.tint = null; }
    if (this.invertT > 0) this.invertT--;
    if (this.phase === "end" && this.result === "win" && this.endT > 16 && this.endT % 2 === 0) { // victory confetti
      const cols = ["#ffd60a", "#ff5a4f", "#ffffff", "#4cd964", "#4aa8ff"];
      for (let i = 0; i < 3; i++) this.confetti.push({ x: Math.random() * W, y: -10, vy: 2 + Math.random() * 2, vx: (Math.random() - 0.5) * 1.5, c: cols[Math.floor(Math.random() * cols.length)], ph: Math.random() * 6 });
    }
    const cineNow = this.cine && this.cine.f.state === "attack" && this.cine.f.moveName === "ultimate" && this.cine.f.inStartup;
    const lbTarget = (cineNow || (this.phase === "end" && this.endT < 150)) ? 1 : 0;
    this.letterbox += (lbTarget - this.letterbox) * 0.15;
    const cineOn = this.cine && this.cine.f.state === "attack" && this.cine.f.moveName === "ultimate" && this.cine.f.inStartup;
    if (cineOn) this.cine.t++;
    this.cineA += ((cineOn ? 0.6 : 0) - this.cineA) * 0.2;
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
      if (this.training) { // dummy never dies; free energy to practise special/ultimate
        if (boss.hp < boss.maxHp * 0.5) boss.hp = boss.maxHp;
        player.meter = Math.min(100, player.meter + 0.25); player.stamina = 100;
      }
      if (!this.desperate && boss.alive && boss.hp / boss.maxHp < 0.25 && !this.training) { this.desperate = true; this.bark(boss, "desperate", true); }
      if (--this.timeLeft <= 0) this.finish(player.hp / player.maxHp >= boss.hp / boss.maxHp ? "win" : "lose");
      else if (!boss.alive) this.finish("win");
      else if (!player.alive) this.finish("lose");
    } else if (this.phase === "end") {
      const idle = { mx: 0, my: 0 };
      player.update(idle, boss, this.events); boss.update(idle, player, this.events);
    }
    this.recordTrails();
    this.groundFx();
    this.input.endTick();
  }

  finish(result) {
    this.phase = "end"; this.endT = 0; this.result = result;
    this.projectiles.length = 0;
    const winner = result === "win" ? this.player : this.boss;
    const loser = result === "win" ? this.boss : this.player;
    if (result === "lose" && this.boss.alive) this.bark(this.boss, "win", true);
    if (!loser.alive) this.slow = KO_SLOWMO; // slow-mo only for a real KO
    if (winner.alive) { winner.state = "victory"; winner.t = 0; winner.move = null; }
    if (loser.state !== "ko") { loser.state = "ko"; loser.t = 0; loser.move = null; } // timeout loss
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

  // Dust behind fast knockback, and the two ground impacts of a KO bounce.
  groundFx() {
    for (const f of this.fighters) {
      if (Math.abs(f.vx) > 3 && this.t % 3 === 0) this.spawnSparks(f.x, f.y - 4, "#9a9a9a", 1, 0.6);
      if (f.state !== "ko") continue;
      if (!f.k1 && f.t >= 26) { f.k1 = true; this.rings.push({ x: f.x, y: f.y - 6, t: 0, color: "#ffffff", flat: true }); this.spawnSparks(f.x, f.y - 6, "#9a9a9a", 14, 1.3); this.fx.shake(10); }
      else if (!f.k2 && f.t >= 42) { f.k2 = true; this.spawnSparks(f.x, f.y - 6, "#9a9a9a", 8, 1); this.fx.shake(4); }
    }
  }

  recordTrails() {
    this.fighters.forEach((f, i) => {
      const t = this.trails[i];
      const fast = f.state === "dodge" || (f.state === "attack" && f.moveName !== "punch" && !f.inStartup);
      if (fast) t.push({ x: f.x, y: f.y, pose: this.poseFor(f), facing: f.facing });
      if (t.length > (fast ? 5 : 0)) t.shift();
    });
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
      p.x += p.vx + (p.shape === "paper" ? Math.sin(p.life / 3 + p.ph) * 1.2 : 0); p.y += p.vy; p.vy += p.g ?? 0.22;
      if (--p.life <= 0) this.sparks.splice(i, 1);
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) if (++this.bursts[i].t > 10) this.bursts.splice(i, 1);
    for (let i = this.floaters.length - 1; i >= 0; i--) if (++this.floaters[i].t > 40) this.floaters.splice(i, 1);
    for (let i = this.bubbles.length - 1; i >= 0; i--) if (++this.bubbles[i].t > this.bubbles[i].life) this.bubbles.splice(i, 1);
    for (let i = this.rings.length - 1; i >= 0; i--) if (++this.rings[i].t > 16) this.rings.splice(i, 1);
    for (let i = this.words.length - 1; i >= 0; i--) if (++this.words[i].t > 30) this.words.splice(i, 1);
    for (let i = this.lines.length - 1; i >= 0; i--) if (++this.lines[i].t > 9) this.lines.splice(i, 1);
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.y += c.vy; c.x += c.vx + Math.sin(c.y / 20 + c.ph) * 0.8;
      if (c.y > H + 10) this.confetti.splice(i, 1);
    }
  }

  // ---------- render (read-only; shake/lines use Math.random but never touch game state) ----------
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
    if (this.cineA > 0.02) this.drawCineBackdrop(ctx);
    this.fighters.forEach((f) => this.drawShadow(ctx, f));
    const list = [
      ...this.fighters.map((f, i) => ({ y: f.y, d: () => this.drawFighter(ctx, f, i) })),
      ...this.projectiles.map((p) => ({ y: p.y, d: () => this.drawProjectile(ctx, p) })),
    ];
    list.sort((a, b) => a.y - b.y).forEach((o) => o.d()); // depth sort by ground Y
    for (const f of this.fighters) this.drawSwoosh(ctx, f);
    for (const r of this.rings) this.drawRing(ctx, r);
    for (const b of this.bubbles) this.drawBubble(ctx, b);
    for (const p of this.sparks) {
      ctx.globalAlpha = Math.min(1, p.life / 10);
      ctx.fillStyle = p.color;
      const sx = Math.round(p.x / 4) * 4, sy = Math.round(p.y / 4) * 4;
      if (p.shape === "star") { ctx.fillRect(sx - 2, sy - 8, 4, 16); ctx.fillRect(sx - 8, sy - 2, 16, 4); }
      else if (p.shape === "paper") { ctx.fillRect(sx - 4, sy - 6, 8, 12); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(sx - 4, sy - 2, 8, 2); }
      else ctx.fillRect(sx, sy, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    for (const l of this.lines) this.drawLines(ctx, l);
    for (const b of this.bursts) if (b.t >= 0) this.drawBurst(ctx, b);
    for (const w of this.words) this.drawWord(ctx, w);
    for (const c of this.confetti) { ctx.fillStyle = c.c; ctx.fillRect(Math.round(c.x / 4) * 4, Math.round(c.y / 4) * 4, 8, 8); }
    for (const f of this.floaters) {
      pixelText(ctx, f.text, f.x, f.y - f.t * 1.6, { px: f.px, color: f.color, alpha: Math.min(1, (40 - f.t) / 12) });
    }
    ctx.restore();
    if (this.tint) { ctx.fillStyle = hexA(this.tint.c, this.tint.a * 0.55); ctx.fillRect(0, 0, W, H); }
    if (this.invertT > 0) { ctx.globalCompositeOperation = "difference"; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over"; }
    this.drawLowHp(ctx);
    if (this.flashA > 0.02) { ctx.fillStyle = `rgba(255,255,255,${this.flashA})`; ctx.fillRect(0, 0, W, H); }
    this.drawHud(ctx);
    if (this.letterbox > 0.02) { // cinematic bars for ultimates and the KO
      const h = Math.round(26 * this.letterbox);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
    }
  }

  drawLowHp(ctx) {
    const p = this.player;
    if (this.phase !== "fight" || p.hp / p.maxHp >= 0.3) return;
    ctx.fillStyle = `rgba(200,0,20,${0.1 + 0.07 * Math.sin(this.t / 6)})`;
    for (let i = 0; i < 4; i++) { const k = 10 + i * 10; ctx.fillRect(0, 0, k, H); ctx.fillRect(W - k, 0, k, H); }
  }

  // Manga-style radial speed lines at the impact point.
  drawLines(ctx, l) {
    const r0 = 24 + l.t * 12, len = (l.big ? 100 : 64) - l.t * 5, n = l.big ? 16 : 10;
    ctx.globalAlpha = 1 - l.t / 9;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + 0.2;
      for (let j = 0; j < 4; j++) {
        const d = r0 + (j * len) / 3, size = Math.max(2, Math.round(7 - j * 1.6));
        ctx.fillStyle = l.t < 3 ? "#fff" : l.color;
        ctx.fillRect(Math.round(l.x + Math.cos(a) * d) - size / 2, Math.round(l.y + Math.sin(a) * d) - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Comic onomatopoeia that pops in big then settles.
  drawWord(ctx, w) {
    const pop = w.t < 5 ? 1.7 - w.t * 0.14 : 1;
    const jx = w.t < 10 ? (Math.random() - 0.5) * 6 : 0;
    pixelText(ctx, w.text, w.x + jx, w.y - w.t * 0.8, { size: 12, px: w.px * pop, color: w.color, alpha: Math.min(1, (30 - w.t) / 8) });
  }

  // Ultimate wind-up: darken the street and streak speed lines behind the fighters.
  drawCineBackdrop(ctx) {
    ctx.fillStyle = `rgba(0,0,0,${this.cineA})`;
    ctx.fillRect(0, 0, W, H);
    let s = Math.floor(this.t / 2) * 7919 + 13;
    const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    ctx.fillStyle = this.cine ? this.cine.color : "#fff";
    ctx.globalAlpha = Math.min(0.5, this.cineA);
    for (let i = 0; i < 26; i++) {
      const y = Math.round(rnd() * H / 8) * 8, len = 120 + rnd() * 380, x = rnd() * W;
      ctx.fillRect(Math.round(x), y, Math.round(len), 4);
    }
    ctx.globalAlpha = 1;
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
      if (m.multi && f.t >= m.startup) return Math.floor((f.t - m.startup) / m.multi) % 2 ? 1 : 5; // alternate arms on multi-hit finishers
      return f.t >= m.startup && m.activePose !== undefined ? m.activePose : m.pose;
    }
    return POSE[f.state] ?? 0;
  }

  drawSprite(ctx, poses, facing, x, y, pose, alpha = 1, white = false) {
    const img = poses[pose];
    const w = img.width * PX, h = img.height * PX; // integer scale: pixels stay square
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(facing, 1); // sheets are drawn facing right
    ctx.drawImage(white ? img.flash : img, -Math.round(w / 2), -Math.round(h * FEET), w, h);
    ctx.restore();
    return h;
  }

  drawFighter(ctx, f, idx) {
    // afterimages for fast moves and dodges
    const tr = this.trails[idx];
    for (let k = 0; k < tr.length - 1; k++) {
      const g = tr[k];
      this.drawSprite(ctx, f.poses, g.facing, g.x, g.y, g.pose, 0.1 + 0.07 * k);
    }
    const pose = this.poseFor(f);
    let x = f.x, bob = 0;
    const lift = f.air > 0 && f.airMax ? Math.round(Math.sin(Math.PI * (1 - f.air / f.airMax)) * 90 / PX) * PX : 0; // launcher hit: target floats up
    if (f.state === "walk") bob = -(Math.floor(Math.abs(Math.sin(f.walkClock)) * 2)) * PX;
    else if (f.state === "idle") bob = Math.sin(this.t / 16) > 0 ? -PX : 0;
    else if (f.state === "dodge") bob = -Math.round(Math.sin((f.t / DODGE.frames) * Math.PI) * 12 / PX) * PX;
    else if (f.state === "attack" && f.inStartup && f.moveName !== "punch") x -= f.facing * (f.moveName === "ultimate" ? 0 : 6); // wind-up
    else if (f.state === "victory") bob = -Math.round(Math.abs(Math.sin(f.t / 9)) * 22 / PX) * PX; // celebration hops
    else if (f.state === "hit") x += (f.flash % 2 ? 1 : -1) * Math.min(f.flash, 4) * 1.5; // judder
    else if (f.state === "ko") {
      // launched up, bounces twice while sliding, then lies still
      const t = f.t, a = Math.max(0, Math.sin(Math.min(t, 26) / 26 * Math.PI)) * 70;
      const b = t > 26 ? Math.max(0, Math.sin(Math.min(t - 26, 16) / 16 * Math.PI)) * 18 : 0;
      bob = -Math.round((a + b) / PX) * PX;
    }
    // ultimate charge aura: white silhouette pulsing around the fighter
    if (f.state === "attack" && f.moveName === "ultimate" && f.inStartup) {
      const a = 0.25 + 0.2 * Math.sin(f.t / 2);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) this.drawSprite(ctx, f.poses, f.facing, x + dx * PX * 2, f.y + bob + dy * PX * 2, pose, a, true);
    }
    bob -= lift;
    const h = this.drawSprite(ctx, f.poses, f.facing, x, f.y + bob, pose);
    if (f.state === "hit" && f.flash > 4) this.drawSprite(ctx, f.poses, f.facing, x, f.y + bob, pose, 1, true);
    if (f.state === "ko" && f.t < 4) this.drawSprite(ctx, f.poses, f.facing, x, f.y + bob, pose, 1, true); // white flash on the final blow
    // Telegraph: heavy boss moves flash a warning while winding up.
    if (f.isBoss && f.inStartup && f.moveName !== "punch") {
      pixelText(ctx, "!", f.x, f.y - h * 0.95, { size: 14, px: 4, color: Math.floor(this.t / 3) % 2 ? "#ff3b30" : "#ffd60a" });
    }
  }

  // Pixel slash arc swept in front of the attacker during active frames.
  drawSwoosh(ctx, f) {
    if (!f.inActive || (f.moveName === "special" && f.def.specialType === "projectile")) return;
    const m = f.move, name = f.moveName;
    const p = (f.t - m.startup) / m.active;
    const heavy = name !== "punch", col = name === "punch" ? "#ffe66b" : name === "kick" ? "#ff9d3b" : (f.def.color ?? "#fff");
    const R = name === "ultimate" ? 150 : m.range * (heavy ? 0.7 : 0.55);
    const sweep = name === "punch" ? 1.5 : 2.5;
    const cx = f.x + f.facing * 26, cy = f.y - (name === "kick" ? 55 : 100);
    const n = 12;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1), a = -1.15 + sweep * u * Math.min(1, 0.35 + p * 1.1);
      const sx = cx + f.facing * Math.cos(a) * R, sy = cy + Math.sin(a) * R * 0.75;
      const size = Math.round((4 + u * (heavy ? 12 : 8)) / 2) * 2;
      ctx.globalAlpha = 0.25 + 0.75 * u * (1 - p * 0.5);
      ctx.fillStyle = u > 0.7 ? "#fff" : col;
      ctx.fillRect(Math.round(sx / 2) * 2 - size / 2, Math.round(sy / 2) * 2 - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  }

  // Pixel speech bubble above a fighter: shouts the combo's quote.
  drawBubble(ctx, b) {
    const { f } = b;
    const words = b.text.split(" "), lines = []; let cur = "";
    for (const w of words) { if (cur && (cur + " " + w).length > 17) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
    lines.push(cur);
    const lh = 24, w = Math.max(...lines.map((l) => l.length)) * 17 + 28, h = lines.length * lh + 22;
    const pop = Math.min(1, b.t / 5); // quick pop-in
    const side = f.isBoss ? f.x - 40 : f.x + 40 - w; // player bubble leans left, boss bubble leans right (no overlap)
    const x = Math.max(8, Math.min(W - w - 8, Math.round(side))), y = Math.max(104, Math.round(f.y - 292 - h * pop + 30));
    ctx.globalAlpha = Math.min(1, (b.life - b.t) / 12);
    ctx.fillStyle = "#000"; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
    ctx.fillStyle = "#fff"; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = b.color; ctx.fillRect(x, y, w, 6);
    const tx = Math.max(x + 20, Math.min(x + w - 20, Math.round(f.x / 4) * 4));                       // stepped tail pointing at the speaker
    ctx.fillStyle = "#000"; ctx.fillRect(tx - 12, y + h + 4, 24, 8); ctx.fillRect(tx - 8, y + h + 12, 16, 8); ctx.fillRect(tx - 4, y + h + 20, 8, 6);
    ctx.fillStyle = "#fff"; ctx.fillRect(tx - 8, y + h, 16, 4); ctx.fillRect(tx - 4, y + h + 4, 8, 8); ctx.fillRect(tx - 4, y + h + 12, 8, 4);
    lines.forEach((l, i) => pixelText(ctx, l, x + w / 2, y + 12 + i * lh, { px: 2, size: 10, color: "#111", outline: "" }));
    ctx.globalAlpha = 1;
  }

  drawRing(ctx, r) {
    const rad = (20 + r.t * 26) * (r.small ? 0.5 : 1), n = 28;
    ctx.globalAlpha = 1 - r.t / 16;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      ctx.fillStyle = k % 2 ? "#fff" : r.color;
      ctx.fillRect(Math.round((r.x + Math.cos(a) * rad) / 4) * 4 - 6, Math.round((r.y + Math.sin(a) * rad * 0.35) / 4) * 4 - 6, 12, 12);
    }
    ctx.globalAlpha = 1;
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
    const T = this.touch; // phones get chunkier bars
    // Chunky segmented bar with a hard border.
    const bar = (x, y, w, h, frac, color, right, segs = true) => {
      ctx.fillStyle = "#000"; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.fillStyle = "#2a1020"; ctx.fillRect(x, y, w, h);
      const fw = Math.round(w * Math.max(0, Math.min(1, frac)) / 4) * 4;
      ctx.fillStyle = color; ctx.fillRect(right ? x + w - fw : x, y, fw, h);
      if (segs) {
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(right ? x + w - fw : x, y, fw, 4);
        ctx.fillStyle = "#000";
        for (let sx = 24; sx < w; sx += 24) ctx.fillRect(x + sx, y, 2, h);
      }
    };
    const bw = 360, hh = T ? 30 : 24, low = (f) => f.hp / f.maxHp < 0.3 && Math.floor(this.t / 8) % 2;
    bar(28, 40, bw, hh, p.hp / p.maxHp, low(p) ? "#ff5a4f" : "#4cd964", false);
    bar(W - 28 - bw, 40, bw, hh, b.hp / b.maxHp, low(b) ? "#ffd60a" : "#ff5a4f", true);
    pixelText(ctx, p.def.name.toUpperCase(), 28, 10, { px: 2, align: "left" });
    pixelText(ctx, b.def.name.toUpperCase(), W - 28, 10, { px: 2, align: "right" });

    // stamina + meter, with labels and "ready" cues
    const sy = 40 + hh + 14, my = sy + (T ? 24 : 20), sh = T ? 12 : 8, sw = T ? 230 : 190;
    bar(28, sy, sw, sh, p.stamina / 100, "#4aa8ff", false, false);
    const full = p.meter >= ULTIMATE_COST, sp = p.meter >= SPECIAL_COST;
    const blink = Math.floor(this.t / 4) % 2;
    bar(28, my, sw, sh, p.meter / 100, full ? (blink ? "#fff" : "#ffd60a") : sp ? "#ffd60a" : "#a07a00", false, false);
    pixelText(ctx, "STAMINA", 28 + sw + 14, sy - 6, { size: 9, px: 2, align: "left", color: "#9ad1ff" });
    if (full) pixelText(ctx, "ULTI SIAP!", 28 + sw + 14, my - 6, { size: 9, px: 2, align: "left", color: blink ? "#fff" : "#ffd60a" });
    else pixelText(ctx, sp ? "SPESIAL SIAP" : "ENERGI", 28 + sw + 14, my - 6, { size: 9, px: 2, align: "left", color: sp ? "#ffd60a" : "#c9a227" });

    pixelText(ctx, this.training ? "--" : String(Math.ceil(this.timeLeft / 60)).padStart(2, "0"), W / 2, 22, { px: 3, color: "#ffd60a" });
    pixelText(ctx, this.training ? "LATIHAN" : `STAGE ${this.stageNo}`, W / 2, 66, { px: 2, color: "#cfcfcf" });

    // combo hit counter + current A/B chain (so players can see the combo they're building)
    const cy = my + 30;
    if (this.combo.n >= 2) {
      pixelText(ctx, `${this.combo.n} HIT!`, 28, cy, { px: 3, align: "left", color: "#ffd60a", alpha: Math.min(1, this.combo.t / 20) });
    }
    if (this.combo.n >= 5) {
      const tier = this.combo.n >= 12 ? "RAKYAT MENGAMUK!" : this.combo.n >= 8 ? "AMAZING!" : "GREAT!";
      pixelText(ctx, tier, 28, cy + 28, { px: 2, align: "left", color: this.combo.n >= 12 ? "#ff5a4f" : "#ffffff", alpha: Math.min(1, this.combo.t / 20) });
    }
    if (p.chain && p.chainT > 0) {
      for (let i = 0; i < p.chain.length; i++) {
        const x = 31 + i * 44, y = cy + 52, a = p.chain[i] === "A";
        ctx.fillStyle = "#000"; ctx.fillRect(x - 3, y - 3, 38, 38);
        ctx.fillStyle = a ? "#c0392b" : "#d2791c"; ctx.fillRect(x, y, 32, 32);
        ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(x, y, 32, 4);
        pixelText(ctx, p.chain[i], x + 16, y + 6, { px: 2, size: 12 });
      }
    }
    if (this.training) { // combo cheat sheet; combos matching the current chain light up
      p.combos.forEach((c, i) => {
        const on = p.chain && p.chainT > 0 && c.seq.startsWith(p.chain);
        const x = W / 2 + (i % 2 ? 190 : -190), y = H - 52 + Math.floor(i / 2) * 22;
        pixelText(ctx, `${c.seq.split("").join(" ")}  ${c.name.toUpperCase()}`, x, y, { size: 9, px: 2, color: on ? "#ffd60a" : "#cfcfcf" });
      });
    }
    if (this.callout.t > 0) {
      const a = Math.min(1, this.callout.t / 16);
      ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`; ctx.fillRect(0, 496, W, 40); // bottom strip, so it never covers the speech bubbles
      pixelText(ctx, this.callout.text.toUpperCase(), W / 2, 504, { px: 2, color: this.callout.color, alpha: a });
    }
    if (this.cine && this.cineA > 0.3) { // ultimate banner slides in from the left
      const k = Math.min(1, this.cine.t / 8), x = -W + k * W;
      ctx.fillStyle = "#000"; ctx.fillRect(x, 188, W, 84);
      ctx.fillStyle = this.cine.color; ctx.fillRect(x, 192, W, 8); ctx.fillRect(x, 260, W, 8);
      pixelText(ctx, this.cine.name.toUpperCase(), x + W / 2, 210, { size: 14, px: 3, color: "#fff", outline: "#000" });
    }
    if (this.phase === "intro") {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 170, W, 130);
      ctx.fillStyle = "#b32d2d"; ctx.fillRect(0, 166, W, 4); ctx.fillRect(0, 300, W, 4);
      const late = this.t > 100;
      if (!late) pixelText(ctx, `LOKASI: ${venueFor(this.stageNo).name}`, W / 2, 132, { size: 9, px: 2, color: "#cfcfcf" });
      pixelText(ctx, late ? "FIGHT!" : b.def.name.toUpperCase(), W / 2, 200, { size: 14, px: late ? 5 : 3, color: late ? "#ffd60a" : "#fff" });
      if (!late) pixelText(ctx, b.def.tauntQuote ? `"${b.def.taunt}"` : b.def.taunt, W / 2, 262, { px: 2, color: b.def.tauntQuote ? "#ffd60a" : "#cfcfcf" });
    }
    if (this.phase === "end") {
      const win = this.result === "win";
      const px = Math.max(6, 16 - this.endT * 0.7); // text slams in from huge to normal size
      pixelText(ctx, win ? "K.O.!" : "KALAH...", W / 2, 190 - (px - 6) * 4, { size: 14, px, color: win ? "#ffd60a" : "#ff5a4f" });
    }
  }
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
