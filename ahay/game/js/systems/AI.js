// Boss brain: produces the same intent object a player would. Tuned only by data (boss.def.ai).
export class BossAI {
  constructor(boss) {
    this.boss = boss;
    this.cfg = boss.def.ai;
    this.think = 45;      // frames until next decision
    this.specialCd = this.cfg.specialEvery * 0.6;
    this.blockT = 0;
    this.seen = 0;        // frames the player has been attacking nearby
    this.strafe = 0;
    this.seq = [];        // scripted combo inputs still to press, e.g. ["punch", "punch", "kick"]
  }

  intent(player) {
    const b = this.boss, c = this.cfg;
    const i = { mx: 0, my: 0, punch: false, kick: false, special: false, dodge: false, block: false };
    if (!player.alive || c.passive) return i;
    this.specialCd--; this.think--;
    const dx = player.x - b.x, dy = player.y - b.y, dist = Math.abs(dx);
    const dir = Math.sign(dx) || 1;

    // Reactive guard, delayed by `reaction` frames so attacks stay punishable.
    if (player.state === "attack" && dist < 170) {
      if (++this.seen === c.reaction && Math.random() < c.block) this.blockT = 24;
    } else this.seen = 0;
    if (this.blockT > 0) { this.blockT--; i.block = true; return i; }
    if (b.state === "hit" || b.state === "ko") this.seq.length = 0; // interrupted: combo dropped

    // Feed the next combo input once the previous one was consumed (Fighter cancels on hit / late recovery).
    if (this.seq.length) {
      const ready = b.canAct || (b.state === "attack" && b.queued === null && b.t >= b.move.startup && b.moveName !== "combo");
      if (ready) i[this.seq.shift()] = true;
      return i;
    }
    if (!b.canAct) return i;

    // Line up on the depth axis.
    if (Math.abs(dy) > 14) i.my = Math.sign(dy);

    const reach = 92;
    if (dist > reach + 15) i.mx = dir * (0.55 + c.aggression * 0.45);
    else if (dist < 55) i.mx = -dir * 0.6;
    else if (this.strafe > 0) { this.strafe--; i.mx = -dir * 0.4; }

    // The boss takes initiative: punish the player's recovery / hit-stun with a combo, not only on a timer.
    const punish = player.state === "hit" || (player.state === "attack" && player.t > player.move.startup + player.move.active);
    if (punish && this.think > 8 && dist < reach + 35 && Math.abs(dy) < 30 && b.combos.length && Math.random() < 0.04 + c.aggression * 0.05) this.think = 0;

    if (this.think <= 0 && Math.abs(dy) < 30) {
      const far = dist > 230, ranged = b.def.specialType === "projectile";
      if (this.specialCd <= 0 && ((ranged && far) || (!ranged && dist < 140))) {
        i.special = true; this.specialCd = c.specialEvery + Math.random() * 60;
      } else if (dist < reach + 35 && b.combos.length && (punish || Math.random() < 0.3 + c.aggression * 0.35)) {
        // start a combo; the quote shows when the finisher lands, so the opening jabs are the tell
        const k = b.combos[Math.floor(Math.random() * b.combos.length)];
        this.seq = k.seq.split("").map((ch) => (ch === "A" ? "punch" : "kick"));
        this.think = 120;
      } else if (dist < reach + 35) {
        const r = Math.random();
        if (r < 0.5) i.punch = true;
        else if (r < 0.8) i.kick = true;
        else if (r < 0.9) i.dodge = true;
        else this.strafe = 25;
      }
      this.think = 20 + Math.random() * 90 * (1.1 - c.aggression);
    }
    return i;
  }
}
