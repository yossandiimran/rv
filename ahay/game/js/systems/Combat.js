import { DEPTH_TOLERANCE, BLOCK_CHIP, MOVES } from "../data/config.js";

const HALF_BODY = 38;

export class Projectile {
  constructor(owner, dmg, color, move = MOVES.special) {
    this.owner = owner; this.dmg = dmg; this.color = color;
    this.x = owner.x + owner.facing * 70; this.y = owner.y; this.vx = owner.facing * (move.speed ?? 6.5); this.life = 130;
    this.move = move;
  }
}

export function damageFor(att, def, move) {
  return Math.max(1, move.dmg * (att.attack / 8) * att.dmgMul * (1 - def.defense / 30));
}

// Applies a hit. Returns "hit" | "block" | "miss". Mutates fighters and pushes fx events.
export function applyHit(att, def, move, dmg, fx, from = att) {
  if (!def.alive || def.invulnerable) return "miss";
  const dir = from.x <= def.x ? 1 : -1;
  const blocking = def.state === "block" && def.facing === -dir;
  if (blocking) {
    def.hp -= dmg * (move.pierce ?? BLOCK_CHIP);
    def.vx = dir * move.knock * 0.35;
    def.meter = Math.min(100, def.meter + 2);
    fx.spark(def.x - dir * 20, def.y - 90, "#9ad1ff", 6);
    fx.shake(2);
  } else {
    def.hp -= dmg;
    def.vx = dir * move.knock;
    def.state = "hit"; def.t = move.stun; def.move = null; def.flash = 8;
    def.air = move.launch ?? 0; def.airMax = def.air;
    att.meter = Math.min(100, att.meter + move.meter);
    def.meter = Math.min(100, def.meter + dmg * 0.6);
    fx.spark(def.x - dir * 16, def.y - 100, "#ffe66b", 10);
    fx.shake(move.knock > 8 ? 7 : 3);
    fx.hitstop(move.ultimate ? 12 : move.knock > 8 ? 7 : 3);
    def.chain = ""; def.queued = null; def.chainT = 0;
  }
  if (def.hp <= 0) { // KO: launch the loser backwards, long hit-stop for the finishing blow
    def.hp = 0; def.state = "ko"; def.t = 0; def.move = null;
    def.vx = dir * Math.max(move.knock * 1.6, 16);
    fx.shake(14); fx.hitstop(18);
  }
  const result = blocking ? "block" : "hit";
  fx.hit?.(att, def, blocking ? dmg * BLOCK_CHIP : dmg, result, move);
  return result;
}

// Called every tick for fighters in an attack's active frames (melee).
export function meleeCheck(att, def, fx) {
  const m = att.move;
  if (!att.inActive || att.hitDone || !def.alive) return;
  if (att.moveName === "special" && att.def.specialType === "projectile") return;
  if (m.proj) return; // wave finishers hit through their projectile
  if (Math.abs(att.y - def.y) > DEPTH_TOLERANCE) return;
  const dx = (def.x - att.x) * att.facing;
  if (dx < -20 || dx > m.range + HALF_BODY) return;
  const r = applyHit(att, def, m, damageFor(att, def, m), fx);
  if (r !== "miss") att.hitDone = true;
}

export function updateProjectiles(list, fighters, fx) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.x += p.vx; p.life--;
    const foe = fighters.find((f) => f !== p.owner);
    let remove = p.life <= 0 || p.x < 0 || p.x > 960;
    if (foe.alive && Math.abs(p.y - foe.y) <= DEPTH_TOLERANCE && Math.abs(p.x - foe.x) < HALF_BODY + 14) {
      const r = applyHit(p.owner, foe, p.move, p.dmg, fx, p);
      if (r !== "miss") remove = true;
    }
    if (remove) list.splice(i, 1);
  }
}
