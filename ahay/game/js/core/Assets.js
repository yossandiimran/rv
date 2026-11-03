// Loads combat sheets and slices them into per-pose canvases (4x2 grid, see skills/combat-manifest.json).
// Sheets are ~1774px wide; slicing to small canvases keeps mobile GPU memory low.
const CELL = 256;
export const CROP = 0.9; // drop the bottom 10% of each cell: VFX from the row below bleeds in there
const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat " + src));
    img.src = src;
  });
}

export async function loadPoses(src) {
  if (cache.has(src)) return cache.get(src);
  const img = await loadImage(src);
  const cw = img.width / 4, ch = img.height / 2;
  const poses = [];
  for (let i = 0; i < 8; i++) {
    const c = document.createElement("canvas");
    c.width = CELL; c.height = Math.round(CELL * ch * CROP / cw);
    const g = c.getContext("2d");
    g.imageSmoothingQuality = "high"; // painted art, downscaled once here
    g.drawImage(img, (i % 4) * cw, Math.floor(i / 4) * ch, cw, ch * CROP, 0, 0, c.width, c.height);
    poses.push(c);
  }
  cache.set(src, poses);
  return poses;
}

let manifest = null;
export async function loadManifest() {
  if (manifest) return manifest;
  try {
    manifest = await (await fetch("assets/combat-manifest.json")).json();
  } catch { manifest = { playable: [], enemies: [] }; }
  return manifest;
}
export function attackName(id, stateIndex) {
  const all = [...(manifest?.playable ?? []), ...(manifest?.enemies ?? [])];
  return all.find((c) => c.id === id)?.states?.[stateIndex]?.attackName ?? "";
}
