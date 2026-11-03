import { W, H } from "./data/config.js";
import { CHARACTERS } from "./data/characters.js";
import { BOSSES } from "./data/bosses.js";
import { GameLoop } from "./core/GameLoop.js";
import { Input } from "./core/Input.js";
import { loadPoses, loadManifest } from "./core/Assets.js";
import { Battle } from "./scenes/Battle.js";

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
const screens = ["menu", "select", "opponents", "result", "pause", "loading"];
let mode = "campaign";       // campaign | arcade
let chosen = null;           // playable def
let stageIdx = 0;
let battle = null;
const isTouch = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

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
addEventListener("resize", layout);
addEventListener("orientationchange", layout);

// ---- menus ----
function buildCharGrid() {
  $("char-grid").innerHTML = CHARACTERS.map((c, i) => `
    <button class="card" data-i="${i}">
      <img src="${c.thumb}" alt="" draggable="false" />
      <b>${c.name}</b><span>${c.archetype} · ${c.special}</span>
      <span class="statrow">HP ${c.stats.hp} · ATK ${c.stats.attack} · DEF ${c.stats.defense} · SPD ${c.stats.speed}</span>
    </button>`).join("");
  $("char-grid").querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => {
      chosen = CHARACTERS[+el.dataset.i];
      if (mode === "arcade") { buildBossGrid(); show("opponents"); }
      else startFight(save.read().cleared > 0 && fromContinue ? Math.min(save.read().cleared, BOSSES.length - 1) : 0);
    }));
}
function buildBossGrid() {
  const cleared = save.read().cleared ?? 0;
  $("boss-grid").innerHTML = BOSSES.map((b, i) => `
    <button class="card ${i > cleared ? "locked" : ""}" data-i="${i}">
      <img src="${b.thumb}" alt="" draggable="false" /><b>${i + 1}. ${b.name}</b>
    </button>`).join("");
  $("boss-grid").querySelectorAll(".card").forEach((el) =>
    el.addEventListener("click", () => { if (!el.classList.contains("locked")) startFight(+el.dataset.i); }));
}

let fromContinue = false;
$("btn-campaign").onclick = () => { mode = "campaign"; fromContinue = false; show("select"); };
$("btn-continue").onclick = () => { mode = "campaign"; fromContinue = true; show("select"); };
$("btn-arcade").onclick = () => { mode = "arcade"; fromContinue = false; show("select"); };
document.querySelectorAll("[data-back]").forEach((b) => (b.onclick = () => (b.dataset.back === "menu" ? showMenu() : show(b.dataset.back))));
$("btn-quit").onclick = showMenu;
$("btn-quit2").onclick = showMenu;
$("btn-pause").onclick = () => pause(true);
$("btn-resume").onclick = () => pause(false);
function pause(on) {
  if (!battle) return;
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
  const boss = BOSSES[idx];
  show("loading");
  try {
    const [pp, bp] = await Promise.all([loadPoses(chosen.sheet), loadPoses(boss.sheet)]);
    input.clear();
    battle = new Battle(chosen, boss, pp, bp, input, { stageNo: idx + 1, onEnd: onFightEnd });
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
    $("result-title").textContent = last ? "RAKYAT MENANG!" : "Menang!";
    $("result-copy").textContent = last
      ? "Final boss tumbang. Suara rakyat akhirnya terdengar sampai ke atas."
      : `${BOSSES[stageIdx].name} tumbang. Berikutnya: ${BOSSES[stageIdx + 1].name}.`;
    $("btn-next").textContent = last || mode === "arcade" ? "Main lagi" : "Lanjut";
    $("btn-next").onclick = () => (last || mode === "arcade" ? startFight(stageIdx) : startFight(stageIdx + 1));
  } else {
    $("result-title").textContent = "Kalah…";
    $("result-copy").textContent = "Rakyat belum menyerah. Coba lagi dengan strategi lain.";
    $("btn-next").textContent = "Ulangi";
    $("btn-next").onclick = () => startFight(stageIdx);
  }
  show("result");
}

// ---- main loop ----
const loop = new GameLoop(
  () => battle?.update(),
  () => {
    ctx.clearRect(0, 0, W, H);
    if (battle) battle.render(ctx);
  },
);

(async () => {
  buildCharGrid();
  layout();
  await loadManifest();
  showMenu();
  loop.start();
  // dev hook: index.html#fight=<stage> jumps straight into a fight
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
        if (i % 14 === 0) input.pressed.add("punch"); else if (i % 53 === 0) input.pressed.add("kick");
        battle.update();
      }
      input.clear();
    }
  }
})();
