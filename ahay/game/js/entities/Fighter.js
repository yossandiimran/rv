import { ARENA, MOVES, DODGE, SPECIAL_COST, ULTIMATE_COST, CHAIN_WINDOW } from "../data/config.js";

// Shared by player and bosses. Gameplay state only; drawing lives in the scene.
export class Fighter {
  constructor(def, { x, y, facing, poses, isBoss = false }) {
    this.def = def;
    this.poses = poses;
    this.isBoss = isBoss;
    this.combos = def.combos ?? [];
    this.maxHp = def.stats.hp;
    this.hp = this.maxHp;
    this.attack = def.stats.attack;
    this.defense = def.stats.defense;
    this.speed = 1.2 + def.stats.speed * 0.28; // px per tick
    this.dmgMul = def.ai?.dmg ?? 1;
    this.x = x; this.y = y; this.vx = 0;
    this.facing = facing;
    this.stamina = 100;
    this.meter = isBoss ? 100 : 0;
    this.state = "idle";
    this.t = 0;
    this.move = null; this.moveName = null; this.comboDef = null; this.hitDone = false;
    this.chain = ""; this.chainT = 0; this.queued = null; // A/B input chain for combos
    this.flash = 0;
    this.air = 0; this.airMax = 0; // launcher hits lift the target for a few frames (visual + longer stun)
    this.walkClock = 0;
  }

  get canAct() { return this.state === "idle" || this.state === "walk" || this.state === "block"; }
  get alive() { return this.hp > 0; }
  get invulnerable() {
    return this.state === "dodge" && this.t >= DODGE.iFrom && this.t <= DODGE.iTo;
  }
  get inStartup() { return this.state === "attack" && this.t < this.move.startup; }
  get inActive() {
    return this.state === "attack" && this.t >= this.move.startup && this.t < this.move.startup + this.move.active;
  }

  // act: "punch" | "kick" | "special". Resolves ultimate (full meter) and combo finishers.
  beginAttack(act) {
    let name = act, move = MOVES[act], combo = null;
    if (act === "special") {
      if (!this.isBoss) {
        if (this.meter >= ULTIMATE_COST) { name = "ultimate"; move = MOVES.ultimate; this.meter = 0; }
        else if (this.meter < SPECIAL_COST) return false;
        else this.meter -= SPECIAL_COST;
      }
      this.chain = "";
    } else {
      this.chain = (this.chain + (act === "punch" ? "A" : "B")).slice(-6);
      combo = this.combos.find((c) => this.chain.endsWith(c.seq)) ?? null;
      if (combo) { name = "combo"; move = { ...move, ...combo.move }; this.chain = ""; }
    }
    this.state = "attack"; this.moveName = name; this.move = move; this.comboDef = combo;
    this.t = 0; this.hitDone = false; this.queued = null;
    this.chainT = CHAIN_WINDOW;
    return true;
  }

  // intent: {mx,my,punch,kick,special,dodge,block}; foe used for auto-facing.
  update(intent, foe, events) {
    this.flash = Math.max(0, this.flash - 1);
    if (this.air > 0) this.air--;
    this.stamina = Math.min(100, this.stamina + 0.35);
    if (this.state !== "attack" && this.chainT > 0 && --this.chainT === 0) this.chain = "";
    this.x += this.vx;
    this.vx *= 0.82;
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    switch (this.state) {
      case "ko": this.t++; break;
      case "victory": this.t++; break;
      case "hit":
        if (--this.t <= 0) this.state = "idle";
        break;
      case "attack": this.attackTick(intent, events); break;
      case "dodge": {
        this.t++;
        this.x += this.dodgeDir.x * DODGE.speed * (1 - this.t / DODGE.frames);
        this.y += this.dodgeDir.y * DODGE.speed * 0.6 * (1 - this.t / DODGE.frames);
        if (this.t >= DODGE.frames) this.state = "idle";
        break;
      }
      default: this.control(intent, foe, events);
    }
    this.clamp();
  }

  attackTick(i, events) {
    this.t++;
    const m = this.move, end = m.startup + m.active;
    // buffer the next input so chains feel responsive (the boss AI feeds scripted combo inputs the same way)
    if (i.punch) this.queued = "punch"; else if (i.kick) this.queued = "kick"; else if (i.special && !this.isBoss) this.queued = "special";
    if (this.t < end) this.x += this.facing * m.lunge * (this.t < m.startup ? 0.4 : 1);
    if (this.t === m.startup) events.onActive(this);
    // multi-hit finishers re-arm the hit every `multi` frames while active
    if (m.multi && this.t > m.startup && this.t < end && (this.t - m.startup) % m.multi === 0) { this.hitDone = false; events.onMultiHit?.(this); }

    // Cancel into the next input: on hit, or late in recovery. Finishers/special/ultimate can't be cancelled.
    const cancellable = this.moveName === "punch" || this.moveName === "kick";
    if (this.queued && cancellable && this.t >= end && (this.hitDone || this.t >= end + m.recovery * 0.55)) {
      const q = this.queued; this.queued = null;
      if (this.beginAttack(q)) { events.onStart(this, this.moveName, this.comboDef); return; }
    }
    if (this.t >= end + m.recovery) { this.state = "idle"; this.move = null; this.queued = null; }
  }

  control(i, foe, events) {
    if (foe && foe.alive) this.facing = foe.x >= this.x ? 1 : -1;
    if (i.dodge && this.stamina >= DODGE.stamina) {
      this.stamina -= DODGE.stamina;
      this.state = "dodge"; this.t = 0;
      // dodge away from the opponent unless a direction is held
      const away = -this.facing;
      this.dodgeDir = (i.mx || i.my) ? { x: i.mx, y: i.my } : { x: away, y: 0 };
      return;
    }
    const act = i.special ? "special" : i.kick ? "kick" : i.punch ? "punch" : null;
    if (act && this.beginAttack(act)) { events.onStart(this, this.moveName, this.comboDef); return; }
    if (i.block) { this.state = "block"; return; }
    this.state = (i.mx || i.my) ? "walk" : "idle";
    if (this.state === "walk") {
      this.x += i.mx * this.speed;
      this.y += i.my * this.speed * 0.7; // depth axis is visually compressed
      this.walkClock += 0.25;
    }
  }

  clamp() {
    this.x = Math.max(ARENA.minX, Math.min(ARENA.maxX, this.x));
    this.y = Math.max(ARENA.minY, Math.min(ARENA.maxY, this.y));
  }

  // Depth-based scale: used for shadows (sprites stay at an integer pixel scale).
  get scale() {
    const k = (this.y - ARENA.minY) / (ARENA.maxY - ARENA.minY);
    return ARENA.scaleFar + (ARENA.scaleNear - ARENA.scaleFar) * k;
  }
}
