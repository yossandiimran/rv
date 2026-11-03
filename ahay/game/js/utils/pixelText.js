// Pixel-style text without a font file: render small, hard-threshold the antialiasing, upscale with no smoothing.
const cache = new Map();

function layer(text, font, w, h, color, thr, offsets) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = font; g.textBaseline = 'top'; g.fillStyle = color;
  for (const [dx, dy] of offsets) g.fillText(text, 2 + dx, 2 + dy);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 3; i < p.length; i += 4) p[i] = p[i] > thr ? 255 : 0; // hard edge = pixel look
  g.putImageData(d, 0, 0);
  return c;
}

function build(text, size, color, outline) {
  const font = `900 ${size}px 'Arial Black', Impact, Arial, sans-serif`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const w = Math.ceil(probe.measureText(text).width) + 6, h = size + 7;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  if (outline) g.drawImage(layer(text, font, w, h, outline, 40, [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [0, 2], [1, 2], [-1, 2]]), 0, 0);
  g.drawImage(layer(text, font, w, h, color, 150, [[0, 0]]), 0, 0);
  return c;
}

// y is the top of the text. px = screen pixels per art pixel.
export function pixelText(ctx, text, x, y, { px = 3, size = 10, color = "#fff", outline = "#000", align = "center", alpha = 1 } = {}) {
  const key = `${text}|${size}|${color}|${outline}`;
  let c = cache.get(key);
  if (!c) { c = build(text, size, color, outline); if (cache.size > 400) cache.clear(); cache.set(key, c); }
  const w = c.width * px;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  const prev = ctx.imageSmoothingEnabled, pa = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false; ctx.globalAlpha = alpha;
  ctx.drawImage(c, Math.round(left), Math.round(y), w, c.height * px);
  ctx.imageSmoothingEnabled = prev; ctx.globalAlpha = pa;
}
