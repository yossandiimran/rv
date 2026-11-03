import { W, H } from "./data/config.js";
import { CHARACTERS } from "./data/characters.js";
import { BOSSES, TRAINING_DUMMY } from "./data/bosses.js";
import { GameLoop } from "./core/GameLoop.js";
import { Input } from "./core/Input.js";
import { loadPoses, loadPixelImage, loadManifest } from "./core/Assets.js";
import { Battle } from "./scenes/Battle.js";
import { makeBackground } from "./scenes/Backgrounds.js";
import { buildPixelText } from "./utils/pixelText.js";

const $ = (id) => document.getElementById(id);
const canvas = $("game");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas 2D tidak tersedia");
ctx.imageSmoothingQuality = "high";

const input = new Input();
input.bindTouch($("touch"));

// ---- save (localStorage may be blocked, so every access is guarded) ----
const SAVE_KEY = "rakyat-last-stand-v1";
const save = {
  read() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) ?? {}; } catch { return {}; } },
  write(d) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch { /* ignore */ } },
};

// ---- state ----
const screens = ["menu", "select", "opponents", "result", "pause", "loading", "tutorial", "about"];
let mode = "campaign";       // campaign | arcade | training
let chosen = null;           // playable def
let stageIdx = 0;
let battle = null;
const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window || location.hash.includes("touch");

function show(...ids) { screens.forEach((s) => $(s).classList.toggle("hidden", !ids.includes(s))); }
function showMenu() {
  battle = null;
  $("touch").classList.add("hidden");
  const cleared = save.read().cleared ?? 0;
  $("btn-continue").classList.toggle("hidden", !(cleared > 0 && cleared < BOSSES.length));
  show("menu");
}

// ---- layout: --u = 1% of stage width so HTML UI scales with the canvas ----
function layout() {
  const st = $("stage");
  document.documentElement.style.setProperty("--u", st.clientWidth / 100 + "px");
  const portrait = innerHeight > innerWidth && isTouch;
  $("rotate").classList.toggle("hidden", !portrait);
}
// ---- fullscreen (not available on iPhone Safari: shows an "add to home screen" hint instead) ----
const fsRoot = document.documentElement;
const fsRequest = fsRoot.requestFullscreen || fsRoot.webkitRequestFullscreen;
const fsExit = document.exitFullscreen || document.webkitExitFullscreen;
const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
const standalone = matchMedia("(display-mode: fullscreen)").matches || matchMedia("(display-mode: standalone)").matches || navigator.standalone;
async function toggleFullscreen() {
  try {
    if (isFs()) await fsExit.call(document);
    else {
      await fsRequest.call(fsRoot);
      try { await screen.orientation?.lock?.("landscape"); } catch { /* not supported / not allowed */ }
    }
  } catch { /* user denied or unsupported */ }
}
function setupFullscreenUi() {
  const can = !!fsRequest && !standalone;
  $("btn-fs").classList.toggle("hidden", !can);
  $("btn-fs2").classList.toggle("hidden", !can);
  $("fs-hint").classList.toggle("hidden", can || standalone || !isTouch);
  $("btn-fs").onclick = toggleFullscreen;
  $("btn-fs2").onclick = toggleFullscreen;
}
for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(ev, layout);
addEventListener("resize", layout);
addEventListener("orientationchange", layout);

// ---- pixel UI: elements with data-px become pixel-text canvases; [data-thumb] become pixelated art ----
function wrapText(text, n) {
  const lines = []; let cur = "";
  for (const w of text.split(" ")) {
    if (cur && (cur + " " + w).length > n) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
const PIXEL_TEXT_MIN = 0.19; // data-px below this renders as real HTML text: pixel canvases scaled to fractional sizes blur on phones
function htmlText(el, text) {
  const px = +el.dataset.px, wrap = +el.dataset.wrap;
  el.classList.add("ht");
  el.textContent = text;
  el.style.color = el.dataset.color || "#fff";
  el.style.fontSize = `max(11px, calc(var(--u) * ${(px * 11).toFixed(3)}))`;
  if (wrap) el.style.maxWidth = `${Math.round(wrap * 0.8)}ch`;
}
function pixelize(el) {
  const text = el.dataset.text ?? el.textContent.trim();
  el.dataset.text = text; el.setAttribute("aria-label", text);
  if (+el.dataset.px < PIXEL_TEXT_MIN) { htmlText(el, text); return; }
  el.classList.remove("ht");
  const color = el.dataset.color || "#fff", outline = el.dataset.outline || "#000";
  const parts = wrapText(text, +el.dataset.wrap || 999).map((l) => buildPixelText(l, 14, color, outline)); // 14px source = more detail, so big titles keep their letter gaps
  const w = Math.max(...parts.map((c) => c.width)), lh = parts[0].height - 2;
  const c = document.createElement("canvas");
  c.width = w; c.height = lh * parts.length + 2;
  const g = c.getContext("2d");
  parts.forEach((p, i) => g.drawImage(p, Math.round((w - p.width) / 2), i * lh));
  c.className = "pxt";
  c.style.width = `calc(var(--u) * ${(el.dataset.px * 10 / 14).toFixed(4)} * ${w})`; // data-px was tuned for a 10px source
  el.replaceChildren(c);
}
function setPx(el, text) { el.dataset.text = text; pixelize(el); }
function hydrate(root = document) {
  root.querySelectorAll("[data-px]").forEach(pixelize);
  root.querySelectorAll("[data-thumb]").forEach(async (el) => {
    try {
      const src = await loadPixelImage(el.dataset.thumb, 72);
      const c = document.createElement("canvas");
      c.width = src.width; c.height = src.height;
      c.getContext("2d").drawImage(src, 0, 0);
      el.replaceChildren(c);
    } catch { /* thumbnail is cosmetic */ }
  });
}

// ---- menus ----
const stat = (label, v, max) =>
  `<span data-px="0.09" data-color="#bdb5d8">${label}</span><span class="pipbar"><i style="width:${(v / max) * 100}%"></i></span>`;
function buildCharGrid() {
  $("char-grid").innerHTML = CHARACTERS.map((c, i) => `
    <button class="card" data-i="${i}">
      <span class="thumb" data-thumb="${c.thumb}"></span>
      <b data-px="0.13" data-wrap="12">${c.name.toUpperCase()}</b>
      <span data-px="0.1" data-color="#ffd60a">${c.archetype.toUpperCase()}</span>
      <span data-px="0.1" data-color="#9ad1ff" data-wrap="16">${c.special.toUpperCase()}</span>
      <span data-px="0.09" data-color="#f0a0a0">KOMBO: ${(c.combos ?? []).map((k) => k.seq).join(" / ")}</span>
      <span class="statrow">${stat("HP", c.stats.hp, 120)}${stat("ATK", c.stats.attack, 11)}${stat("DEF", c.stats.defense, 10)}${stat("SPD", c.stats.speed, 10)}</span>
    </button>`).join("");
  hydrate($("char-grid"));
  $("char-grid").querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => {
      chosen = CHARACTERS[+el.dataset.i];
      if (mode === "arcade") { buildBossGrid(); show("opponents"); }
      else if (mode === "training") startFight(0);
      else startFight(save.read().cleared > 0 && fromContinue ? Math.min(save.read().cleared, BOSSES.length - 1) : 0);
    }));
}
function buildBossGrid() {
  const cleared = save.read().cleared ?? 0;
  $("boss-grid").innerHTML = BOSSES.map((b, i) => `
    <button class="card ${i > cleared ? "locked" : ""}" data-i="${i}">
      <span class="thumb" data-thumb="${b.thumb}"></span>
      <b data-px="0.095" data-wrap="13" ${i > cleared ? 'data-color="#8a8aa0"' : ""}>${i + 1}. ${b.name.toUpperCase()}</b>
    </button>`).join("");
  hydrate($("boss-grid"));
  $("boss-grid").querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => { if (!el.classList.contains("locked")) startFight(+el.dataset.i); }));
}

// ---- tutorial + about ----
// keys: "a:A" / "b:B" colour the attack buttons; plain strings are keyboard keys.
const TUTORIAL = [
  { title: "GERAK & SERANG", rows: [
    [["W", "A", "S", "D"], "GERAK. A/D KIRI-KANAN, W/S MAJU-MUNDUR DI KEDALAMAN ARENA"],
    [["a:J"], "A = PUKUL. CEPAT, DAMAGE KECIL"],
    [["b:K"], "B = TENDANG. LAMBAT, DAMAGE BESAR"],
    [["SHIFT"], "TAHAN = BLOK. DAMAGE BERKURANG, TAPI TETAP TEMBUS SEDIKIT"],
    [["SPASI"], "HINDAR. KEBAL SESAAT, BUTUH STAMINA"],
    [["HP"], "DI HP: JOYSTICK KIRI, TOMBOL AKSI DI KANAN"],
  ] },
  { title: "KOMBO", rows: [
    { p: "TEKAN A DAN B BERURUTAN. HIT TERAKHIR JADI JURUS PENUTUP DENGAN DAMAGE LEBIH BESAR." },
    [["a:A", "a:A", "b:B"], "PENUTUP BERAT: SATU PUKULAN TELAK"],
    [["b:B", "b:B", "a:A"], "PELONTAR: LAWAN TERANGKAT KE UDARA"],
    [["a:A", "b:B", "b:B"], "BERUNTUN: BANYAK PUKULAN CEPAT"],
    [["a:A", "a:A", "a:A"], "GELOMBANG: MELEPAS PROYEKTIL"],
    [["b:B", "b:B", "b:B"], "LONCAT MAJU: MENERJANG LAWAN"],
    { p: "URUTAN BEDA TIAP KARAKTER. DAFTAR LENGKAP ADA DI MENU JEDA DAN MODE LATIHAN." },
  ] },
  { title: "MUSUH & PERTAHANAN", rows: [
    { p: "MUSUH JUGA MEMULAI KOMBO SENDIRI, TERUTAMA SAAT KAMU TERKENA SERANGAN ATAU TERLALU LAMA MENYERANG." },
    [["!"], "TANDA ! DI ATAS MUSUH = SERANGAN BERAT. SIAP BLOK ATAU HINDAR"],
    [["SHIFT"], "BLOK SAAT JAB PEMBUKA, LALU BALAS SAAT DIA PULIH"],
    [["SPASI"], "HINDAR KE BELAKANG UNTUK KELUAR DARI KOMBO"],
    { p: "SERANGAN HANYA KENA JIKA KAMU SEJAJAR DENGAN LAWAN DI KEDALAMAN ARENA." },
  ] },
  { title: "SPESIAL & ULTI", rows: [
    [["L"], "SPESIAL. BUTUH 40 ENERGI"],
    [["L"], "ULTI. TEKAN SPESIAL SAAT ENERGI PENUH. MENEMBUS BLOK"],
    { p: "ENERGI TERISI SAAT KAMU MEMUKUL DAN SAAT KAMU DIPUKUL." },
    { p: "KALAHKAN 10 LAWAN. WAKTU HABIS? SISA HP TERBANYAK MENANG." },
  ] },
];
let tutPage = 0;
function renderTutorial() {
  const pg = TUTORIAL[tutPage];
  setPx($("tut-title"), pg.title);
  $("tut-body").innerHTML = pg.rows.map((r) => {
    if (!Array.isArray(r)) return `<div class="tut-p"><span data-px="0.1" data-color="#cfcfcf" data-wrap="70">${r.p}</span></div>`;
    const keys = r[0].map((k) => {
      const m = /^([ab]):(.*)$/.exec(k);
      return `<span class="key ${m ? "k" + m[1] : ""}" data-px="0.11">${m ? m[2] : k}</span>`;
    }).join("");
    return `<div class="tut-row"><div class="keys">${keys}</div><span class="txt" data-px="0.1" data-wrap="46">${r[1]}</span></div>`;
  }).join("");
  hydrate($("tut-body"));
  setPx($("tut-page"), `${tutPage + 1} / ${TUTORIAL.length}`);
  const last = tutPage === TUTORIAL.length - 1;
  $("tut-prev").classList.toggle("hidden", tutPage === 0);
  $("tut-next").classList.toggle("hidden", last);
  $("tut-train").classList.toggle("hidden", !last);
}
$("btn-tutorial").onclick = () => { tutPage = 0; renderTutorial(); show("tutorial"); };
$("tut-prev").onclick = () => { tutPage = Math.max(0, tutPage - 1); renderTutorial(); };
$("tut-next").onclick = () => { tutPage = Math.min(TUTORIAL.length - 1, tutPage + 1); renderTutorial(); };
$("tut-train").onclick = () => { mode = "training"; fromContinue = false; show("select"); };
$("btn-about").onclick = () => show("about");

let fromContinue = false;
$("btn-campaign").onclick = () => { if (isTouch && fsRequest && !isFs() && !standalone) toggleFullscreen(); mode = "campaign"; fromContinue = false; show("select"); };
$("btn-continue").onclick = () => { if (isTouch && fsRequest && !isFs() && !standalone) toggleFullscreen(); mode = "campaign"; fromContinue = true; show("select"); };
$("btn-arcade").onclick = () => { if (isTouch && fsRequest && !isFs() && !standalone) toggleFullscreen(); mode = "arcade"; fromContinue = false; show("select"); };
document.querySelectorAll("[data-back]").forEach((b) => (b.onclick = () => (b.dataset.back === "menu" ? showMenu() : show(b.dataset.back))));
$("btn-quit").onclick = showMenu;
$("btn-quit2").onclick = showMenu;
$("btn-pause").onclick = () => pause(true);
$("btn-resume").onclick = () => pause(false);
function buildComboList() {
  const c = chosen;
  const rows = (c.combos ?? []).map((k, i) => `
    <div class="combo-row">
      <span data-px="0.13" data-color="#ffd60a">${k.seq.split("").join(" ")}</span>
      <span data-px="0.11" data-color="#fff">COMBO ${i + 1}: ${k.name.toUpperCase()}</span>
      <span data-px="0.1" data-color="#9ad1ff">DMG ${k.move.dmg}</span>
    </div>`).join("");
  $("combo-list").innerHTML = rows;
  hydrate($("combo-list"));
}
function pause(on) {
  if (!battle) return;
  if (on) buildComboList();
  battle.setPaused(on);
  input.clear();
  show(...(on ? ["pause"] : []));
}
addEventListener("keydown", (e) => { if (e.code === "Escape" && battle) pause(!battle.paused); });
document.addEventListener("visibilitychange", () => { if (document.hidden && battle && !battle.paused) pause(true); });
addEventListener("contextmenu", (e) => e.preventDefault());

// ---- fight flow ----
async function startFight(idx) {
  stageIdx = idx;
  const boss = mode === "training" ? TRAINING_DUMMY : BOSSES[idx];
  show("loading");
  try {
    const [pp, bp] = await Promise.all([loadPoses(chosen.sheet), loadPoses(boss.sheet)]);
    input.clear();
    battle = new Battle(chosen, boss, pp, bp, input, { stageNo: idx + 1, onEnd: onFightEnd, touch: isTouch, training: mode === "training" });
    show();
    if (isTouch) $("touch").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    $("loading").innerHTML = `<p>Gagal memuat aset.<br>${err.message}</p><button class="btn" id="btn-err">Menu</button>`;
    $("btn-err").onclick = () => { location.reload(); };
  }
}

function onFightEnd(result) {
  const last = stageIdx === BOSSES.length - 1;
  const data = save.read();
  $("touch").classList.add("hidden");
  input.clear();
  if (result === "win") {
    data.cleared = Math.max(data.cleared ?? 0, stageIdx + 1);
    save.write(data);
    setPx($("result-title"), last ? "RAKYAT MENANG!" : "MENANG!");
    setPx($("result-copy"), last
      ? "Final boss tumbang. Suara rakyat akhirnya terdengar sampai ke atas."
      : `${BOSSES[stageIdx].name} tumbang. Berikutnya: ${BOSSES[stageIdx + 1].name}.`);
    setPx($("btn-next"), last || mode === "arcade" ? "MAIN LAGI" : "LANJUT");
    $("btn-next").onclick = () => (last || mode === "arcade" ? startFight(stageIdx) : startFight(stageIdx + 1));
  } else {
    setPx($("result-title"), "KALAH...");
    setPx($("result-copy"), "Rakyat belum menyerah. Coba lagi dengan strategi lain.");
    setPx($("btn-next"), "ULANGI");
    $("btn-next").onclick = () => startFight(stageIdx);
  }
  show("result");
}

// ---- main loop ----
let menuBg = null;
const loop = new GameLoop(
  () => battle?.update(),
  () => {
    ctx.clearRect(0, 0, W, H);
    if (battle) battle.render(ctx);
    else { menuBg ??= makeBackground(5); ctx.drawImage(menuBg, 0, 0); } // city backdrop behind the menus
  },
);

(async () => {
  buildCharGrid();
  layout();
  hydrate();
  setupFullscreenUi();
  await loadManifest();
  showMenu();
  loop.start();
  // dev hook: index.html#fight=<stage> jumps straight into a fight
  const scr = location.hash.match(/screen=(select|opponents|tutorial|about)/);
  if (scr) {
    chosen = CHARACTERS[0]; mode = "arcade";
    if (scr[1] === "opponents") buildBossGrid();
    if (scr[1] === "tutorial") { tutPage = +(location.hash.match(/page=(\d)/)?.[1] ?? 0); renderTutorial(); }
    show(scr[1]);
  }
  if (location.hash.includes("train")) { mode = "training"; chosen = CHARACTERS[0]; }
  const m = location.hash.match(/fight=(\d+)/);
  if (m) {
    chosen = CHARACTERS[0];
    await startFight(Math.min(+m[1], BOSSES.length - 1));
    // &sim=N runs N scripted ticks synchronously (headless screenshots can't advance rAF)
    const sim = location.hash.match(/sim=(\d+)/);
    if (sim && battle) {
      for (let i = 0; i < +sim[1]; i++) {
        const { boss: b, player: p } = battle;
        if (Math.abs(b.x - p.x) > 85) input.held.add(b.x > p.x ? "right" : "left");
        else { input.held.delete("left"); input.held.delete("right"); }
        if (location.hash.includes("god")) p.hp = p.maxHp;
        if (location.hash.includes("ult") && i === 190) { p.meter = 100; input.pressed.add("special"); }
        else if (location.hash.includes("ult") && i > 170 && i < 240) { /* stay idle so the ultimate can start */ }
        else if (i % 14 === 0) input.pressed.add("punch"); else if (i % 53 === 0) input.pressed.add("kick");
        battle.update();
        if (location.hash.includes("barklog")) { (battle.__seen ??= new Set()); battle.bubbles.forEach((b) => b.f === battle.boss && battle.__seen.add(b.text)); }
      }
      if (location.hash.includes("barklog")) console.log("BARKS " + JSON.stringify([...(battle.__seen ?? [])]));
      if (location.hash.includes("bubble")) {
        const f = battle.boss;
        battle.bubbles.push({ f, text: f.combos[0].quote, t: 6, life: 100, color: f.def.color });
        battle.bubbles.push({ f: battle.player, text: battle.player.combos[0].quote, t: 6, life: 100, color: battle.player.def.color });
      }
      input.clear();
    }
  }
})();
