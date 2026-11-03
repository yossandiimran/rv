export const W = 960, H = 540;
export const ARENA = { minX: 70, maxX: 890, minY: 345, maxY: 490, scaleNear: 1.12, scaleFar: 0.86 };
export const ROUND_SECONDS = 60;
export const PX = 3; // screen pixels per art pixel (integer keeps pixels square)
export const FEET = 0.83 / 0.9; // feet position inside a cropped pose canvas (fraction of height)

// Frame data @60 Hz. pose = index into the 8-state combat sheet.
// dmg is multiplied by fighter attack/8, reduced by target defense.
export const MOVES = {
  punch:   { pose: 0, startup: 5,  active: 4, recovery: 11, dmg: 6,  range: 105, knock: 3,  stun: 15, lunge: 2.5, meter: 6 },
  kick:    { pose: 1, startup: 13, active: 5, recovery: 22, dmg: 13, range: 125, knock: 10, stun: 26, lunge: 1.5, meter: 10 },
  special: { pose: 4, activePose: 5, startup: 20, active: 6, recovery: 24, dmg: 16, range: 140, knock: 12, stun: 30, lunge: 0, meter: 0 },
};
export const DODGE = { frames: 20, iFrom: 2, iTo: 13, speed: 7, stamina: 25 };
export const BLOCK_CHIP = 0.2;
export const SPECIAL_COST = 40;
export const DEPTH_TOLERANCE = 42; // attacks only connect when depth (Y) lines up
