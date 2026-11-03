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
  }

  intent(player) {
    const b = this.boss, c = this.cfg;
    const i = { mx: 0, my: 0, punch: false, kick: false, special: false, dodge: false, block: false };
    if (!player.alive) return i;
    this.specialCd--; this.think--;
    const dx = player.x - b.x, dy = player.y - b.y, dist = Math.abs(dx);
    const dir = Math.sign(dx) || 1;

    // Reactive guard, delayed by `reaction` frames so attacks stay punishable.
    if (player.state === "attack" && dist < 170) {
      if (++this.seen === c.reaction && Math.random() < c.block) this.blockT = 24;
    } else this.seen = 0;
    if (this.blockT > 0) { this.blockT--; i.block = true; return i; }
    if (!b.canAct) return i;

    // Line up on the depth axis.
    if (Math.abs(dy) > 14) i.my = Math.sign(dy);

    const reach = 92;
    if (dist > reach + 15) i.mx = dir * (0.55 + c.aggression * 0.45);
    else if (dist < 55) i.mx = -dir * 0.6;
    else if (this.strafe > 0) { this.strafe--; i.mx = -dir * 0.4; }

    if (this.think <= 0 && Math.abs(dy) < 30) {
      const far = dist > 230, ranged = b.def.specialType === "projectile";
      if (this.specialCd <= 0 && ((ranged && far) || (!ranged && dist < 140))) {
        i.special = true; this.specialCd = c.specialEvery + Math.random() * 60;
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
