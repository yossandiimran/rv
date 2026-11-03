import { W, H, WORLD_MIN_W, WORLD_MAX_W, setWorldWidth } from "./data/config.js";
import { CHARACTERS } from "./data/characters.js";
import { BOSSES, ARCADE_BOSSES, TRAINING_DUMMY } from "./data/bosses.js";
import { GameLoop } from "./core/GameLoop.js";
import { Input } from "./core/Input.js";
import { loadPoses, loadPixelImage, loadManifest } from "./core/Assets.js";
import { Battle } from "./scenes/Battle.js";
import { makeBackground } from "./scenes/Backgrounds.js";
import { buildPixelText } from "./utils/pixelText.js";
import { ICONS } from "./utils/symbols.js";
import { PROFILES } from "./data/profiles.js";

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
const screens = ["menu", "select", "opponents", "result", "pause", "loading", "tutorial", "about", "profiles"];
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

// ---- layout: the stage fills the screen; the world width follows the aspect so fullscreen has no black bars ----
// --u is "1% of the width of a 16:9 stage" (= stage height / 56.25) so the HTML UI keeps the same size on any aspect.
function layout() {
  const app = $("app"), cs = getComputedStyle(app);
  const availW = innerWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const availH = innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const worldW = Math.max(WORLD_MIN_W, Math.min(WORLD_MAX_W, Math.round((H * availW / availH) / 4) * 4));
  const stageH = Math.min(availH, (availW * H) / worldW), stageW = (stageH * worldW) / H;
  const st = $("stage");
  st.style.width = stageW + "px"; st.style.height = stageH + "px";
  document.documentElement.style.setProperty("--u", stageH / 56.25 + "px");
  if (worldW !== W) {
    const oldW = W;
    setWorldWidth(worldW);
    canvas.width = worldW; // resets the 2D context state; Battle.render sets what it needs each frame
    menuBg = null;
    battle?.onWorldResize(oldW, worldW);
  }
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
for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(ev, () => { layout(); setTimeout(layout, 250); setTimeout(layout, 800); }); // the viewport settles a moment after the event
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
  const isControl = el.tagName === "BUTTON" || el.classList.contains("key"); // buttons keep their pixel-text look
  if (!isControl && +el.dataset.px < PIXEL_TEXT_MIN) { htmlText(el, text); return; }
  el.classList.remove("ht");
  const SRC = isControl ? 10 : 14; // source font size: titles use a finer grid so letters keep their gaps
  const color = el.dataset.color || "#fff", outline = el.dataset.outline || "#000";
  const parts = wrapText(text, +el.dataset.wrap || 999).map((l) => buildPixelText(l, SRC, color, outline));
  const w = Math.max(...parts.map((c) => c.width)), lh = parts[0].height - 2;
  const c = document.createElement("canvas");
  c.width = w; c.height = lh * parts.length + 2;
  const g = c.getContext("2d");
  parts.forEach((p, i) => g.drawImage(p, Math.round((w - p.width) / 2), i * lh));
  c.className = "pxt";
  c.style.width = `calc(var(--u) * ${(el.dataset.px * 10 / SRC).toFixed(4)} * ${w})`; // data-px is tuned for a 10px source
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
// Fighters flagged `pending` have no art yet. At startup we HEAD-request their PNGs; until both exist the card reads
// "SEGERA HADIR" and can't be picked. Dropping the files into game/assets is all it takes (see ASSET_PROMPTS.md).
const isReady = (d) => !d.pending || d.ready === true;
async function probeAssets() {
  await Promise.all([...CHARACTERS, ...ARCADE_BOSSES].filter((d) => d.pending).map(async (d) => {
    try {
      const [a, b] = await Promise.all([fetch(d.sheet, { method: "HEAD" }), fetch(d.thumb, { method: "HEAD" })]);
      d.ready = a.ok && b.ok;
    } catch { d.ready = false; }
  }));
}
const thumbHtml = (d) => isReady(d) ? `<span class="thumb" data-thumb="${d.thumb}"></span>` : `<span class="thumb"><i class="soon">?</i></span>`;
const penguasaList = () => [...BOSSES, ...ARCADE_BOSSES];

// Character select. Campaign is rakyat-only; arcade and training also offer the "penguasa" (boss) roster.
let charTab = "rakyat";
function buildCharGrid() {
  const grid = $("char-grid");
  const tabs = mode !== "campaign";
  $("char-tabs").classList.toggle("hidden", !tabs);
  if (!tabs) charTab = "rakyat";
  $("tab-rakyat").classList.toggle("primary", charTab === "rakyat");
  $("tab-penguasa").classList.toggle("primary", charTab === "penguasa");
  const list = charTab === "rakyat" ? CHARACTERS : penguasaList();
  grid.classList.toggle("boss", charTab !== "rakyat");
  grid.classList.toggle("six", charTab !== "rakyat");
  const soon = '<span data-px="0.1" data-color="#ffd60a">SEGERA HADIR</span>';
  grid.innerHTML = charTab === "rakyat" ? CHARACTERS.map((c, i) => `
    <button class="card ${isReady(c) ? "" : "locked"}" data-i="${i}">
      ${thumbHtml(c)}
      <b data-px="0.13" data-wrap="12">${c.name.toUpperCase()}</b>
      <span data-px="0.1" data-color="#ffd60a">${c.archetype.toUpperCase()}</span>
      <span data-px="0.1" data-color="#9ad1ff" data-wrap="16">${c.special.toUpperCase()}</span>
      <span data-px="0.09" data-color="#f0a0a0">KOMBO: ${(c.combos ?? []).map((k) => k.seq).join(" / ")}</span>
      ${isReady(c) ? `<span class="statrow">${stat("HP", c.stats.hp, 120)}${stat("ATK", c.stats.attack, 11)}${stat("DEF", c.stats.defense, 10)}${stat("SPD", c.stats.speed, 10)}</span>` : soon}
    </button>`).join("") : penguasaList().map((c, i) => `
    <button class="card ${isReady(c) ? "" : "locked"}" data-i="${i}">
      ${thumbHtml(c)}
      <b data-px="0.09" data-wrap="13">${c.name.toUpperCase()}</b>
      ${isReady(c) ? `<span data-px="0.08" data-color="#bdb5d8">HP ${c.stats.hp} · ATK ${c.stats.attack}</span>` : soon}
    </button>`).join("");
  hydrate(grid);
  grid.querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => {
      if (!isReady(list[+el.dataset.i])) return; // art not delivered yet
      chosen = list[+el.dataset.i];
      if (mode === "arcade") { buildOppGrid(); show("opponents"); }
      else if (mode === "training") startFight(0);
      else startFight(save.read().cleared > 0 && fromContinue ? Math.min(save.read().cleared, BOSSES.length - 1) : 0);
    }));
}
$("tab-rakyat").onclick = () => { charTab = "rakyat"; buildCharGrid(); };
$("tab-penguasa").onclick = () => { charTab = "penguasa"; buildCharGrid(); };

// Opponent select (arcade): the whole roster, nothing locked. Boss opponents keep their own stage background.
function buildOppGrid() {
  const all = [
    ...CHARACTERS.map((d) => ({ d, stage: 1, rk: true })),
    ...BOSSES.map((d, i) => ({ d, stage: i + 1, rk: false })),
    ...ARCADE_BOSSES.map((d) => ({ d, stage: d.stage ?? 1, rk: false })),
  ];
  $("boss-grid").innerHTML = all.map((o, i) => `
    <button class="card ${o.rk ? "rk" : ""} ${isReady(o.d) ? "" : "locked"}" data-i="${i}">
      ${thumbHtml(o.d)}
      <b data-px="0.085" data-wrap="12">${o.d.name.toUpperCase()}</b>
    </button>`).join("");
  hydrate($("boss-grid"));
  $("boss-grid").querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => { const o = all[+el.dataset.i]; if (isReady(o.d)) startFight(o.stage - 1, o.d, o.stage); }));
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
$("tut-train").onclick = () => { mode = "training"; fromContinue = false; buildCharGrid(); show("select"); };
$("btn-about").onclick = () => show("about");

// ---- profil penguasa: satirical dossiers (data/profiles.js) ----
let profIdx = 0;
function renderProfile(i) {
  profIdx = i;
  const list = penguasaList(), d = list[i], p = PROFILES[d.id] ?? { jabatan: "", julukan: "", fakta: [], quotes: [], satir: "" };
  $("prof-tabs").querySelectorAll(".ptab").forEach((t, k) => t.classList.toggle("on", k === i));
  const jurus = (d.combos ?? []).slice(0, 4).map((c) => c.name).join(" · ");
  const quotes = p.quotes.map((q) => `"${q}"`).join("   ");
  $("prof-card").innerHTML = `
    <div class="pthumb">${thumbHtml(d)}
      <span data-px="0.085" data-color="#bdb5d8">HP ${d.stats.hp} · ATK ${d.stats.attack}</span>
      <span data-px="0.085" data-color="#bdb5d8">DEF ${d.stats.defense} · SPD ${d.stats.speed}</span></div>
    <div class="ptext">
      <span data-px="0.17" data-color="#ffd60a" data-outline="#9d1f1f">${d.name.toUpperCase()}</span>
      <span data-px="0.088" data-color="#bdb5d8">${p.jabatan}</span>
      <span data-px="0.1" data-color="#ff9d3b">JULUKAN GAME: ${p.julukan.toUpperCase()}</span>
      ${p.fakta.map((f) => `<span class="pfact" data-px="0.086" data-color="#e8e8f2">${f}</span>`).join("")}
      ${quotes ? `<span data-px="0.088" data-color="#9ad1ff">KALIMAT KHAS: ${quotes}</span>` : ""}
      ${jurus ? `<span data-px="0.088" data-color="#f0a0a0">JURUS ANDALAN: ${jurus}</span>` : ""}
      <span data-px="0.088" data-color="#ffe9a8">SATIR: ${p.satir}</span>
    </div>`;
  $("prof-card").scrollTop = 0;
  hydrate($("prof-card"));
}
function buildProfiles() {
  const list = penguasaList();
  $("prof-tabs").innerHTML = list.map((d, i) => `<button class="ptab ${isReady(d) ? "" : "off"}" data-i="${i}" title="${d.name}" aria-label="${d.name}">${isReady(d) ? `<span class="thumb" data-thumb="${d.thumb}"></span>` : '<i class="soon">?</i>'}</button>`).join("");
  hydrate($("prof-tabs"));
  $("prof-tabs").querySelectorAll(".ptab").forEach((t) => (t.onclick = () => renderProfile(+t.dataset.i)));
  renderProfile(Math.min(profIdx, list.length - 1));
}
// KONTEN: one screen, three tabs (profile dossiers / protest symbols / current demands)
let kontenTab = "profil";
const KONTEN_NOTE = {
  profil: "SATIR: julukan dan catatan adalah karangan game. Fakta dan kutipan mengacu pada pemberitaan (sumber di QUOTES.md), bukan tuduhan.",
  simbol: "Simbol-simbol ini muncul di arena. Penjelasan dan sumbernya ada di QUOTES.md.",
  tuntutan: "Tuntutan aksi akhir Okt 2026 dan kutipan tanggapan pemerintah, dari pemberitaan (sumber di QUOTES.md). Kabut asap di arena merujuk ke karhutla.",
};
function openKonten(tab = kontenTab) {
  kontenTab = tab;
  for (const [t, btn] of [["profil", "kt-profil"], ["simbol", "kt-simbol"], ["tuntutan", "kt-tuntutan"]]) {
    $(btn).classList.toggle("primary", tab === t);
    $("konten-" + t).classList.toggle("hidden", tab !== t);
  }
  setPx($("konten-note"), KONTEN_NOTE[tab]);
  if (tab === "profil") buildProfiles(); else if (tab === "simbol") buildSymbols(); else buildDemands();
  show("profiles");
}
$("btn-profiles").onclick = () => openKonten();
$("kt-profil").onclick = () => openKonten("profil");
$("kt-simbol").onclick = () => openKonten("simbol");
$("kt-tuntutan").onclick = () => openKonten("tuntutan");

// Current demands (late Oct 2026), with what is on record about the response. Sources: QUOTES.md.
const DEMANDS = [
  { icon: "fire", name: "PADAMKAN API (KARHUTLA)", note: "Kebakaran hutan dan lahan belum teratasi sekitar 3 bulan; Kemenkes mencatat 333.470 kasus ISPA hingga 21 Okt 2026. Tuntutan: tetapkan bencana nasional, tindak korporasi pelakunya, pulihkan ekosistem. Prabowo (22 Okt): \"Siapa pun kalau dia melanggar, sudahlah, cabut saja\", dan minta polisi hutan ditambah sampai 70 ribu personel." },
  { icon: "coin", name: "TURUNKAN BIAYA HIDUP", note: "Survei yang dikutip: 78% menyebut harga kebutuhan pokok isu paling mendesak (Okt 2026). Demo Juni 2026 menuntut harga BBM turun. Spanduk Greenpeace: \"Hidup makin susah, apa kerja pemerintah?\"." },
  { icon: "book", name: "BIAYA PENDIDIKAN TERJANGKAU", note: "Satu dari lima tuntutan #IndonesiaSadar (BEM UI bersama Komite SADAR), aksi di Bundaran HI, 28 Okt 2026." },
  { icon: "gavel", name: "BERANTAS KKN", note: "Tuntutan #IndonesiaSadar: pemberantasan korupsi, kolusi, dan nepotisme, serta pengawasan penyelenggaraan negara." },
  { icon: "civic", name: "HENTIKAN MILITERISASI RUANG SIPIL", note: "Tuntutan #IndonesiaSadar: hentikan penyempitan ruang sipil. Aksi 28 Okt ricuh sekitar pukul 20.00 (gas air mata); belasan orang ditangkap, termasuk seorang anak. Polda Metro Jaya minta maaf karena menghalangi wartawan." },
  { icon: "chart", name: "PERBAIKI ANGGARAN & EKONOMI", note: "Tuntutan #IndonesiaSadar: pembenahan kebijakan ekonomi. Pada 12 Jun 2026 BEM UI sudah turun di Bundaran HI dengan tajuk \"Menuju Indonesia Bangkrut\" (APBN, harga kebutuhan pokok, MBG)." },
  { icon: "tritura", name: "TRITURA TRISAKTI", note: "29 Okt 2026, Patung Kuda: pulihkan sektor nasional, hapus ketidakcakapan dan rangkap jabatan pejabat, tegakkan supremasi sipil. Massa juga menuntut Menteri Kehutanan dicopot; staf Istana menerima tuntutan dan berjanji meneruskannya." },
];
function buildDemands() {
  $("dem-grid").innerHTML = DEMANDS.map((y, i) => `
    <div class="sym"><canvas width="24" height="16" data-i="${i}"></canvas>
      <div class="txt"><span data-px="0.11" data-color="#ffd60a">${y.name}</span><span data-px="0.08" data-color="#e0e0ee">${y.note}</span></div></div>`).join("");
  $("dem-grid").querySelectorAll("canvas").forEach((c) => ICONS[DEMANDS[+c.dataset.i].icon](c.getContext("2d")));
  hydrate($("dem-grid"));
}

// Protest symbols that appear in the arenas, with the context they come from (sources: QUOTES.md).
const SYMBOLS = [
  { icon: "jolly", name: "BENDERA ONE PIECE", note: "Bendera bajak laut Topi Jerami. Dikibarkan sebagai simbol kritik jelang HUT RI ke-80 (Agu 2025) dan terlihat di tengah bentrok di DPR." },
  { icon: "pink", name: "BRAVE PINK", note: "Pink = keberanian, terinspirasi ibu berjilbab pink yang menghadapi aparat saat demo 28 Agu 2025." },
  { icon: "green", name: "HERO GREEN", note: "Hijau jaket ojol: solidaritas untuk Affan Kurniawan, pengemudi ojol yang meninggal tertabrak kendaraan aparat saat demo." },
  { icon: "plus", name: "17+8", note: "17 tuntutan jangka pendek dan 8 jangka panjang, dirangkum kolektif pada Sep 2025. Ferry Irwandi salah satu juru bicaranya." },
  { icon: "gelap", name: "INDONESIA GELAP", note: "Slogan aksi mahasiswa dan warga sejak Feb 2025 untuk menyuarakan masalah di pemerintahan." },
  { icon: "greenpeace", name: "SPANDUK GREENPEACE", note: "20 Okt 2026: 6 aktivis memanjat Monumen Selamat Datang di Bundaran HI dan membentang spanduk \"Hidup makin susah, apa kerja pemerintah?\". Dibawa ke Polda Metro Jaya lalu dibebaskan." },
  { icon: "salute3", name: "SALAM TIGA JARI", note: "Dipakai massa dalam aksi akhir Okt 2026 sebagai simbol solidaritas, martabat, kebebasan, dan perlawanan terhadap tirani." },
  { icon: "sadar", name: "INDONESIA SADAR", note: "Tema aksi BEM UI 28 Okt 2026 di Bundaran HI. Tuntutan: karhutla, ekonomi, ruang sipil, KKN, dan biaya pendidikan." },
];
function buildSymbols() {
  $("sym-grid").innerHTML = SYMBOLS.map((y, i) => `
    <div class="sym"><canvas width="24" height="16" data-i="${i}"></canvas>
      <div class="txt"><span data-px="0.115" data-color="#ffd60a">${y.name}</span><span data-px="0.085" data-color="#e0e0ee">${y.note}</span></div></div>`).join("");
  $("sym-grid").querySelectorAll("canvas").forEach((c) => ICONS[SYMBOLS[+c.dataset.i].icon](c.getContext("2d")));
  hydrate($("sym-grid"));
}

let fromContinue = false;
$("btn-campaign").onclick = () => { if (isTouch && fsRequest && !isFs() && !standalone) toggleFullscreen(); mode = "campaign"; fromContinue = false; buildCharGrid(); show("select"); };
$("btn-continue").onclick = () => { if (isTouch && fsRequest && !isFs() && !standalone) toggleFullscreen(); mode = "campaign"; fromContinue = true; buildCharGrid(); show("select"); };
$("btn-arcade").onclick = () => { if (isTouch && fsRequest && !isFs() && !standalone) toggleFullscreen(); mode = "arcade"; fromContinue = false; buildCharGrid(); show("select"); };
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
  $("combo-list").classList.toggle("two", (c.combos ?? []).length > 5);
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
let lastOpp = null, lastStage = 1, curOpp = null;
async function startFight(idx, opp = null, stageNo = idx + 1) {
  stageIdx = idx; lastOpp = opp; lastStage = stageNo;
  const boss = mode === "training" ? TRAINING_DUMMY : (opp ?? BOSSES[idx]);
  curOpp = boss;
  show("loading");
  try {
    const [pp, bp] = await Promise.all([loadPoses(chosen.sheet, chosen.fit), loadPoses(boss.sheet, boss.fit)]);
    input.clear();
    battle = new Battle(chosen, boss, pp, bp, input, { stageNo, onEnd: onFightEnd, touch: isTouch, training: mode === "training" });
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
  if (mode !== "campaign") { // arcade: free play, no progress saved
    const win = result === "win";
    setPx($("result-title"), win ? "MENANG!" : "KALAH...");
    setPx($("result-copy"), win ? `${curOpp.name} tumbang.` : "Coba lagi, atau ganti karakter dan lawan.");
    setPx($("btn-next"), win ? "MAIN LAGI" : "ULANGI");
    $("btn-next").onclick = () => startFight(stageIdx, lastOpp, lastStage);
    show("result");
    return;
  }
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
    else { menuBg ??= makeBackground(1); ctx.drawImage(menuBg, 0, 0); } // city backdrop behind the menus
  },
);

(async () => {
  buildCharGrid();
  layout();
  hydrate();
  setupFullscreenUi();
  await loadManifest();
  await probeAssets();
  buildCharGrid();
  showMenu();
  loop.start();
  // dev hook: index.html#fight=<stage> jumps straight into a fight
  const scr = location.hash.match(/screen=(select|opponents|tutorial|about|symbols|profiles|tuntutan)/);
  if (scr) {
    chosen = CHARACTERS[0]; mode = "arcade";
    if (scr[1] === "opponents") buildOppGrid();
    if (scr[1] === "profiles") profIdx = +(location.hash.match(/p=(\d+)/)?.[1] ?? 0);
    if (location.hash.includes("tab=penguasa")) charTab = "penguasa";
    if (scr[1] === "select") buildCharGrid();
    if (scr[1] === "tutorial") { tutPage = +(location.hash.match(/page=(\d)/)?.[1] ?? 0); renderTutorial(); }
    if (scr[1] === "symbols") openKonten("simbol");
    else if (scr[1] === "tuntutan") openKonten("tuntutan");
    else if (scr[1] === "profiles") openKonten("profil");
    else show(scr[1]);
  }
  if (location.hash.includes("train")) { mode = "training"; chosen = CHARACTERS[0]; }
  const m = location.hash.match(/fight=(\d+)/);
  if (m) {
    chosen = CHARACTERS[0];
    const asBoss = location.hash.match(/as=(\d+)/); // dev: play as a boss, e.g. #fight=0&as=9
    if (asBoss) { chosen = BOSSES[+asBoss[1]]; mode = "arcade"; }
    const who = location.hash.match(/who=([a-z-]+)/), vs = location.hash.match(/vs=([a-z-]+)/); // dev: #fight=0&who=windah-basudara&vs=jokowi
    const everyone = [...CHARACTERS, ...BOSSES, ...ARCADE_BOSSES];
    if (who) { chosen = everyone.find((d) => d.id === who[1]) ?? chosen; mode = "arcade"; }
    if (vs) { const o = everyone.find((d) => d.id === vs[1]); mode = "arcade"; await startFight(0, o, o.stage ?? (BOSSES.indexOf(o) + 1 || 1)); }
    else await startFight(Math.min(+m[1], BOSSES.length - 1));
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
