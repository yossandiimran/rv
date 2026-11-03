import { ARENA, MOVES, DODGE, SPECIAL_COST } from "../data/config.js";

// Shared by player and bosses. Gameplay state only; drawing lives in the scene.
export class Fighter {
  constructor(def, { x, y, facing, poses, isBoss = false }) {
    this.def = def;
    this.poses = poses;
    this.isBoss = isBoss;
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
    this.move = null; this.moveName = null; this.hitDone = false;
    this.flash = 0;
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

  startAttack(name) {
    if (name === "special") {
      if (!this.isBoss && this.meter < SPECIAL_COST) return false;
      if (!this.isBoss) this.meter -= SPECIAL_COST;
    }
    this.state = "attack"; this.moveName = name; this.move = MOVES[name];
    this.t = 0; this.hitDone = false; this.specialFired = false;
    return true;
  }

  // intent: {mx,my,punch,kick,special,dodge,block}; foe used for auto-facing.
  update(intent, foe, events) {
    this.flash = Math.max(0, this.flash - 1);
    this.stamina = Math.min(100, this.stamina + 0.35);
    this.x += this.vx;
    this.vx *= 0.82;
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    switch (this.state) {
      case "ko": case "victory": break;
      case "hit":
        if (--this.t <= 0) this.state = "idle";
        break;
      case "attack": {
        this.t++;
        const m = this.move;
        if (this.t < m.startup + m.active) this.x += this.facing * m.lunge * (this.t < m.startup ? 0.4 : 1);
        if (this.t === m.startup) events.onActive(this);
        if (this.t >= m.startup + m.active + m.recovery) { this.state = "idle"; this.move = null; }
        break;
      }
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
    if (act && this.startAttack(act)) { events.onStart(this, act); return; }
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

  // Depth-based scale: nearer to camera = bigger.
  get scale() {
    const k = (this.y - ARENA.minY) / (ARENA.maxY - ARENA.minY);
    return ARENA.scaleFar + (ARENA.scaleNear - ARENA.scaleFar) * k;
  }
}
