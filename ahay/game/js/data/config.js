// The world is 540 tall; its width follows the screen aspect (960 = 16:9 up to 1280 = ~21:9) so fullscreen on tall phones
// has no black bars. `W` is a live binding: setWorldWidth() updates it for every importing module.
export let W = 960;
export const H = 540;
export const WORLD_MIN_W = 960, WORLD_MAX_W = 1280;
export function setWorldWidth(w) { W = w; ARENA.maxX = w - 70; }
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
  // Ultimate: needs a full meter (special button at 100). Pierces blocking, long cinematic wind-up.
  ultimate: { pose: 4, activePose: 6, startup: 46, active: 8, recovery: 44, dmg: 38, range: 240, knock: 22, stun: 50, lunge: 0, meter: 0, pierce: 0.6, ultimate: true },
};
export const DODGE = { frames: 20, iFrom: 2, iTo: 13, speed: 7, stamina: 25 };
export const BLOCK_CHIP = 0.2;
export const SPECIAL_COST = 40;
export const ULTIMATE_COST = 100;
export const CHAIN_WINDOW = 45;  // frames to continue an A/B chain after an attack starts
export const DEPTH_TOLERANCE = 42; // attacks only connect when depth (Y) lines up

// Framing of a combat sheet. The first 14 sheets leave margin: character ~65% of the panel, feet at ~83%, so the loader
// drops the bottom 10% (VFX from the row below bleeds in there). The v3 sheets (Windah, Ferry, Jokowi, Dedi) fill ~90% of
// the panel with feet at ~96%: no crop, feet anchor lower, art scaled down so characters match the others on screen,
// and a gentle border-only fade for the big-VFX poses (the elliptical mask would erase their feet/limbs). Per-character override: `fit` in the data files.
export const FIT_FULL_PANEL = { crop: 1, feet: 0.955, scale: 0.74, mask: "edge" };
