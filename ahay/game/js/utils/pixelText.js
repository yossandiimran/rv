// Pixel-style text without a font file: render, thicken, hard-threshold the antialiasing, upscale with no smoothing.
// Safari draws canvas text thinner than Chrome and has no "Arial Black" on iOS, so glyphs are thickened with a stroke
// and the font stack falls back to Helvetica Neue / Arial at weight 900 (otherwise thin strokes vanish at the threshold).
const cache = new Map();
// Pick the font once: a naturally heavy face (Arial Black / Impact) if installed, otherwise Helvetica Neue / Arial,
// which is lighter and needs the faux-bold below (that is the iPhone case).
let fontInfo = null;
function pickFont() {
  if (fontInfo) return fontInfo;
  const g = document.createElement("canvas").getContext("2d");
  const width = (fam) => { g.font = `900 40px ${fam}`; return g.measureText("mmmmWWW").width; };
  const base = width("monospace");
  for (const f of ["'Arial Black'", "Impact"]) if (Math.abs(width(f + ", monospace") - base) > 1) return (fontInfo = { family: f + ", Arial, sans-serif", heavy: true });
  return (fontInfo = { family: "'Helvetica Neue', Helvetica, Arial, sans-serif", heavy: false });
}

function layer(text, font, size, w, h, color, thr, offsets, bold = 0) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.font = font; g.textBaseline = "top"; g.fillStyle = color; g.strokeStyle = color;
  g.lineJoin = "round"; g.lineWidth = Math.max(0.5, bold); // light faux-bold: same weight on every browser
  for (const [dx, dy] of offsets) { g.fillText(text, 3 + dx, 3 + dy); if (bold) g.strokeText(text, 3 + dx, 3 + dy); }
  const d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 3; i < p.length; i += 4) p[i] = p[i] > thr ? 255 : 0; // hard edge = pixel look
  g.putImageData(d, 0, 0);
  return c;
}

export function buildPixelText(text, size, color, outline) {
  const { family, heavy } = pickFont();
  const font = `900 ${size}px ${family}`;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = font;
  const w = Math.ceil(probe.measureText(text).width) + 10, h = size + 9;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  if (outline) g.drawImage(layer(text, font, size, w, h, outline, 40, [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [0, 2], [1, 2], [-1, 2]]), 0, 0);
  g.drawImage(layer(text, font, size, w, h, color, heavy ? 150 : 120, [[0, 0]], heavy ? 0 : size * 0.07), 0, 0);
  return c;
}

// y is the top of the text. px = screen pixels per art pixel.
export function pixelText(ctx, text, x, y, { px = 3, size = 10, color = "#fff", outline = "#000", align = "center", alpha = 1 } = {}) {
  const key = `${text}|${size}|${color}|${outline}`;
  let c = cache.get(key);
  if (!c) { c = buildPixelText(text, size, color, outline); if (cache.size > 400) cache.clear(); cache.set(key, c); }
  const w = c.width * px;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  const prev = ctx.imageSmoothingEnabled, pa = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false; ctx.globalAlpha = alpha;
  ctx.drawImage(c, Math.round(left), Math.round(y), w, c.height * px);
  ctx.imageSmoothingEnabled = prev; ctx.globalAlpha = pa;
}
