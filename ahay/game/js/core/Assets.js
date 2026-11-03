// Loads combat sheets (4x2 grid, see combat-manifest.json) and turns each pose into real low-res pixel art:
// downscale -> hard alpha edge -> posterize. Drawn later with smoothing off at an integer scale.
export const PIXEL_W = 96;      // pose width in art pixels
const STEP = 32;                // posterize step (~7 levels per channel)
const ALPHA_CUT = 140;          // semi-transparent glow/halo below this is dropped
export const CROP = 0.9;        // drop bottom 10% of each cell: VFX from the row below bleeds in there
const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat " + src));
    img.src = src;
  });
}

function pixelate(img, sx, sy, sw, sh) {
  const w = PIXEL_W, h = Math.round(w * sh / sw);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.imageSmoothingQuality = "high"; // smooth only for the one-time downscale
  g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h), p = data.data;
  const flash = document.createElement("canvas"); flash.width = w; flash.height = h;
  const fg = flash.getContext("2d");
  const fd = fg.createImageData(w, h);
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] < ALPHA_CUT) { p[i + 3] = 0; continue; }
    p[i + 3] = 255;
    for (let k = 0; k < 3; k++) p[i + k] = Math.min(255, Math.round(p[i + k] / STEP) * STEP);
    fd.data[i] = fd.data[i + 1] = fd.data[i + 2] = fd.data[i + 3] = 255;
  }
  // 1px dark outline around the silhouette keeps faces/limbs readable at low res
  const src = new Uint8ClampedArray(p);
  const opaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] === 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (opaque(x, y) || !(opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))) continue;
    const i = (y * w + x) * 4;
    p[i] = 20; p[i + 1] = 12; p[i + 2] = 20; p[i + 3] = 255;
    fd.data[i] = fd.data[i + 1] = fd.data[i + 2] = fd.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  fg.putImageData(fd, 0, 0);
  c.flash = flash; // white silhouette for hit flashes
  return c;
}

export async function loadPoses(src) {
  if (cache.has(src)) return cache.get(src);
  const img = await loadImage(src);
  const cw = img.width / 4, ch = img.height / 2;
  const poses = [];
  for (let i = 0; i < 8; i++) poses.push(pixelate(img, (i % 4) * cw, Math.floor(i / 4) * ch, cw, ch * CROP));
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
