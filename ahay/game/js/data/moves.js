// Combo finisher archetypes shared by player and boss combos (frame data @60 Hz).
// style: slam = single heavy hit, launch = pops the target into the air, multi = several quick hits,
//        wave = fires a projectile, rush = long dash into the target.
export const M = {
  slam: (pose, dmg, o = {}) => ({ pose, startup: 9, active: 6, recovery: 24, dmg, range: 128, knock: 13, stun: 32, lunge: 3, meter: 14, style: "slam", ...o }),
  launch: (pose, dmg, launch = 30, o = {}) => ({ pose, startup: 11, active: 6, recovery: 28, dmg, range: 120, knock: 8, stun: launch + 12, launch, lunge: 3, meter: 16, style: "launch", ...o }),
  // `hits` quick hits, one every `gap` frames
  multi: (pose, dmg, gap, hits, o = {}) => ({ pose, startup: 8, active: gap * hits, recovery: 22, dmg, range: 118, knock: 3, stun: gap * 2 + 4, multi: gap, lunge: 2, meter: 5, style: "multi", ...o }),
  wave: (dmg, o = {}) => ({ pose: 4, activePose: 5, startup: 14, active: 2, recovery: 26, dmg, range: 0, knock: 11, stun: 28, lunge: 0, meter: 12, proj: true, speed: 7.5, style: "wave", ...o }),
  rush: (pose, dmg, o = {}) => ({ pose, startup: 6, active: 10, recovery: 26, dmg, range: 112, knock: 14, stun: 30, lunge: 9, meter: 15, style: "rush", ...o }),
};
