import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  get,
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
import {
  CAPTURE_SECONDS,
  STATIC_RECTS,
  TEAMS,
  TOTAL_CONTROL_SECONDS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createBotInputs,
  createSnapshot,
  createWorld,
  collidesWorld,
  finishByForfeit,
  hasClearLineOfSight,
  moveActor,
  stepWorld,
} from "./sim.mjs?v=20260811-10";
import {
  AUTO_MATCH_SECONDS,
  AUTO_MATCH_SHARDS,
  AUTO_MATCH_SLOT_PRIORITY,
  autoMatchCandidateCodes,
  autoMatchRoomCode,
} from "./matchmaking.mjs";

const firebaseConfig = {
  apiKey: "AIzaSyAZoik0jOpDKIS0jLU2JLT2-sFiGkeEleI",
  authDomain: "chat-random-cfc2c.firebaseapp.com",
  databaseURL: "https://chat-random-cfc2c-default-rtdb.firebaseio.com",
  projectId: "chat-random-cfc2c",
  storageBucket: "chat-random-cfc2c.firebasestorage.app",
  messagingSenderId: "773337926036",
  appId: "1:773337926036:web:8ecec60f97428538b2a781",
  measurementId: "G-LDMM5SJZLW",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = false;

const ui = {
  connectionChip: document.querySelector("#connection-chip"),
  connectionLabel: document.querySelector("#connection-label"),
  lobbyScreen: document.querySelector("#lobby-screen"),
  roomScreen: document.querySelector("#room-screen"),
  gameScreen: document.querySelector("#game-screen"),
  playerName: document.querySelector("#player-name"),
  autoMatch: document.querySelector("#auto-match"),
  roomCodeInput: document.querySelector("#room-code-input"),
  createRoom: document.querySelector("#create-room"),
  joinRoom: document.querySelector("#join-room"),
  lobbyStatus: document.querySelector("#lobby-status"),
  roomCodeLabel: document.querySelector("#room-code-label"),
  gameRoomCode: document.querySelector("#game-room-code"),
  copyRoom: document.querySelector("#copy-room"),
  pejuangSlots: document.querySelector("#pejuang-slots"),
  kolonialSlots: document.querySelector("#kolonial-slots"),
  roomStatus: document.querySelector("#room-status"),
  leaveRoom: document.querySelector("#leave-room"),
  readyButton: document.querySelector("#ready-button"),
  startMatch: document.querySelector("#start-match"),
  gameStage: document.querySelector("#game-stage"),
  fullscreenButton: document.querySelector("#fullscreen-button"),
  gameLoading: document.querySelector("#game-loading"),
  resultOverlay: document.querySelector("#result-overlay"),
  resultKicker: document.querySelector("#result-kicker"),
  resultTitle: document.querySelector("#result-title"),
  resultDetail: document.querySelector("#result-detail"),
  backToRoom: document.querySelector("#back-to-room"),
  scorePejuang: document.querySelector("#score-pejuang"),
  scoreKolonial: document.querySelector("#score-kolonial"),
  matchState: document.querySelector("#match-state"),
  matchTimer: document.querySelector("#match-timer"),
  stageScorePejuang: document.querySelector("#stage-score-pejuang"),
  stageScoreKolonial: document.querySelector("#stage-score-kolonial"),
  stageMatchState: document.querySelector("#stage-match-state"),
  stageMatchTimer: document.querySelector("#stage-match-timer"),
  playerReadout: document.querySelector("#player-readout"),
  toast: document.querySelector("#toast"),
};

const assetSources = {
  terrain: "../assets/tilesets/terrain-atlas-32-v2.png",
  road: "../assets/tilesets/dirt-road-autotile-32-v1.png",
  rice: "../assets/tilesets/rice-terrace-atlas-32-v1.png",
  river: "../assets/tilesets/riverbank-autotile-32-v1.png",
  villageBuildings: "../assets/environment/buildings/village-buildings-256x192-v1.png",
  campBuildings: "../assets/environment/buildings/camp-structures-256x192-v1.png",
  trees: "../assets/environment/vegetation/trees-large-192-v1.png",
  groundVegetation: "../assets/environment/vegetation/ground-vegetation-64-v1.png",
  obstacles: "../assets/environment/vegetation/natural-obstacles-128-v1.png",
  decals: "../assets/environment/decals/ground-decals-64-v1.png",
  bridge: "../assets/environment/bridges/river-crossings-256x128-v1.png",
  vfx: "../assets/effects/environment-vfx-64-v1.png",
  weapons: "../assets/weapons/world-weapons-128x96-v1.png",
  itemIcons: "../assets/items/inventory-icons-64-v1.png",
  sutrisno: "../assets/characters/variants/sutrisno-armed-walk-32x48-v1.png",
  bima: "../assets/characters/variants/bima-rifleman-walk-32x48-v1.png",
  patrol: "../assets/enemies/sprites/rifle-patrol-walk-32x48-v1.png",
  sergeant: "../assets/enemies/sprites/sergeant-walk-32x48-v1.png",
  playerAction: "../assets/characters/variants/sutrisno-combat-actions-48-v1.png",
  enemyAction: "../assets/enemies/sprites/enemy-rifle-actions-48-v1.png",
};

const images = {};
const keys = Object.create(null);
const pointer = { x: 480, y: 270, inside: false, fire: false };
const touchMove = { x: 0, y: 0 };
const touchActions = { fire: false, capture: false };
const mobileInputQuery = window.matchMedia("(pointer: coarse), (max-width: 820px)");
const AUTO_AIM_RANGE = 270;
const INPUT_CHANGE_INTERVAL = 1 / 30;
const INPUT_HEARTBEAT_INTERVAL = 1 / 20;
const SNAPSHOT_INTERVAL = 1 / 20;
const camera = { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, zoom: 1, ready: false };

let currentUser = null;
let authReady = false;
let assetsReady = false;
let currentRoom = "";
let currentTeam = TEAMS.PEJUANG;
let currentSlot = 0;
let isHost = false;
let roomMeta = null;
let previousRoomStatus = null;
let members = {};
let latestSnapshot = null;
let authoritativeWorld = null;
let inputsCache = {};
let predictedLocal = null;
let renderPlayers = new Map();
let autoAimTargetUid = "";
let predictedBullets = [];
let predictedEffects = [];
let predictedShotSeq = 0;
let predictedFireCooldown = 0;
let predictedMeleeCooldown = 0;
let predictedDodgeTimer = 0;
let predictedReloadTimer = 0;
let predictedReloadPending = false;
let predictedAmmo = null;
let lastPredictedServerAmmo = null;
let lastPredictedReloadSeq = 0;
let lastPredictedMeleeSeq = 0;
let lastPredictedDodgeSeq = 0;
let screen = "lobby";
let ready = false;
let busy = false;
let reloadSeq = 0;
let meleeSeq = 0;
let bandageSeq = 0;
let dodgeSeq = 0;
let inputSeq = 0;
let inputAccumulator = 0;
let snapshotAccumulator = 0;
let lastSentInput = null;
let lastSnapshotReceivedAt = performance.now();
let lastFrame = performance.now();
let elapsed = 0;
let lastEventSeq = -1;
let resultCommitted = false;
let matchStartPending = false;
let lastMatchmakingSecond = -1;
let toastTimer = 0;
let nativeFrameFullscreen = false;
let roomUnsubscribers = [];
let disconnectRegistrations = [];

function setConnection(state, label) {
  ui.connectionChip.dataset.state = state;
  ui.connectionLabel.textContent = label;
}

function setLobbyStatus(text, error = false) {
  ui.lobbyStatus.textContent = text;
  ui.lobbyStatus.classList.toggle("error", error);
}

function showToast(text, seconds = 2.4) {
  ui.toast.textContent = text;
  ui.toast.classList.remove("hidden");
  toastTimer = seconds;
}

function nativeFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function fullscreenActive() {
  return nativeFullscreenElement() === ui.gameStage
    || ui.gameStage.classList.contains("frame-fullscreen");
}

function updateFullscreenButton() {
  const active = fullscreenActive();
  const label = ui.fullscreenButton.querySelector("small");
  if (label) label.textContent = active ? "Keluar" : "Fullscreen";
  ui.fullscreenButton.setAttribute("aria-label", active ? "Keluar dari layar penuh" : "Aktifkan layar penuh landscape");
}

async function lockLandscape() {
  if (!window.screen.orientation?.lock) return false;
  try {
    await window.screen.orientation.lock("landscape");
    return true;
  } catch {
    return false;
  }
}

async function exitFrameFullscreen() {
  const fullscreenElement = nativeFullscreenElement();
  ui.gameStage.classList.remove("frame-fullscreen");
  document.body.classList.remove("game-cinema-active");
  nativeFrameFullscreen = false;

  try {
    if (fullscreenElement === ui.gameStage && document.exitFullscreen) await document.exitFullscreen();
    else if (fullscreenElement === ui.gameStage && document.webkitExitFullscreen) document.webkitExitFullscreen();
  } catch {
    // CSS mode has already been closed, even if the native API refuses to exit.
  }

  window.screen.orientation?.unlock?.();
  updateFullscreenButton();
}

async function toggleMobileFullscreen() {
  if (fullscreenActive()) {
    await exitFrameFullscreen();
    return;
  }

  // Enter the frame-sized CSS mode synchronously. This keeps the button useful
  // on mobile browsers that expose, but reject, the native Fullscreen API.
  ui.gameStage.classList.add("frame-fullscreen");
  document.body.classList.add("game-cinema-active");
  updateFullscreenButton();

  try {
    if (ui.gameStage.requestFullscreen) {
      await ui.gameStage.requestFullscreen({ navigationUI: "hide" });
      nativeFrameFullscreen = true;
    } else if (ui.gameStage.webkitRequestFullscreen) {
      ui.gameStage.webkitRequestFullscreen();
      nativeFrameFullscreen = true;
    }
  } catch {
    nativeFrameFullscreen = false;
  }

  const locked = await lockLandscape();
  if (!locked && matchMedia("(orientation: portrait)").matches) showToast("Putar HP ke posisi landscape untuk tampilan terbaik.", 3);
  updateFullscreenButton();
}

function showScreen(next) {
  screen = next;
  ui.lobbyScreen.classList.toggle("hidden", next !== "lobby");
  ui.roomScreen.classList.toggle("hidden", next !== "room");
  ui.gameScreen.classList.toggle("hidden", next !== "game");
  if (next === "game") canvas.focus();
  else if (fullscreenActive()) {
    exitFrameFullscreen().catch(console.error);
  }
}

function selectedTeam() {
  return document.querySelector('input[name="team"]:checked')?.value === TEAMS.KOLONIAL
    ? TEAMS.KOLONIAL
    : TEAMS.PEJUANG;
}

function playerName() {
  const value = ui.playerName.value.replace(/[<>]/g, "").trim().slice(0, 16);
  return value || "Pemain";
}

function normalizeRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const byte of bytes) result += alphabet[byte % alphabet.length];
  return result;
}

function roomPath(suffix = "") {
  const base = `gameMatches/${currentRoom}`;
  return suffix ? `${base}/${suffix}` : base;
}

function loadImage(name, src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      images[name] = image;
      resolve();
    };
    image.onerror = () => {
      images[name] = null;
      resolve();
    };
    image.src = src;
  });
}

async function loadAssets() {
  await Promise.all(Object.entries(assetSources).map(([name, src]) => loadImage(name, src)));
  assetsReady = true;
  if (latestSnapshot) ui.gameLoading.classList.add("hidden");
}

function enableLobbyActions() {
  const enabled = authReady && !busy;
  ui.autoMatch.disabled = !enabled;
  ui.createRoom.disabled = !enabled;
  ui.joinRoom.disabled = !enabled;
}

async function bootstrapFirebase() {
  onValue(ref(db, ".info/connected"), (snapshot) => {
    if (snapshot.val() === true) setConnection("online", "Firebase tersambung");
    else setConnection("offline", "Koneksi terputus");
  });

  try {
    const credential = await signInAnonymously(auth);
    currentUser = credential.user;
    authReady = true;
    setLobbyStatus("Siap. Buat room baru atau masukkan kode teman.");
    enableLobbyActions();
  } catch (error) {
    console.error(error);
    setConnection("error", "Firebase Auth belum aktif");
    const message = error?.code === "auth/operation-not-allowed"
      ? "Anonymous Authentication belum diaktifkan di Firebase Console. Lihat README demo."
      : `Firebase gagal: ${error?.code || error?.message || "kesalahan tidak diketahui"}`;
    setLobbyStatus(message, true);
  }
}

async function claimTeamSlot(code, team) {
  for (let slot = 0; slot < 2; slot += 1) {
    const slotRef = ref(db, `gameMatches/${code}/slots/${team}/${slot}`);
    const result = await runTransaction(
      slotRef,
      (value) => (value === null || value === currentUser.uid ? currentUser.uid : undefined),
      { applyLocally: false },
    );
    if (result.committed && result.snapshot.val() === currentUser.uid) return slot;
  }
  throw new Error(`Tim ${team === TEAMS.PEJUANG ? "Pejuang" : "Kolonial"} sudah penuh.`);
}

async function claimExactSlot(code, team, slot) {
  const slotRef = ref(db, `gameMatches/${code}/slots/${team}/${slot}`);
  const result = await runTransaction(
    slotRef,
    (value) => (value === null || value === currentUser.uid ? currentUser.uid : undefined),
    { applyLocally: false },
  );
  return result.committed && result.snapshot.val() === currentUser.uid;
}

async function claimPreferredAutoSlot(code) {
  for (const [team, slot] of AUTO_MATCH_SLOT_PRIORITY) {
    if (await claimExactSlot(code, team, slot)) return { team, slot };
  }
  return null;
}

async function autoMatchCandidates() {
  const codes = autoMatchCandidateCodes();
  const snapshots = await Promise.all(codes.map(async (code) => ({
    code,
    snapshot: await get(ref(db, `gameMatches/${code}`)),
  })));
  const now = Date.now();
  return snapshots
    .filter(({ snapshot }) => {
      if (!snapshot.exists()) return false;
      const room = snapshot.val();
      const humanCount = Object.keys(room.members || {}).length;
      return room.meta?.autoMatch === true
        && room.meta?.status === "lobby"
        && Number(room.meta?.matchmakingEndsAt || 0) > now
        && humanCount < 4;
    })
    .sort((a, b) => Number(a.snapshot.val().meta.createdAt || 0) - Number(b.snapshot.val().meta.createdAt || 0));
}

async function tryJoinAutoRoom(code) {
  let claimed = null;
  try {
    const metaSnapshot = await get(ref(db, `gameMatches/${code}/meta`));
    const meta = metaSnapshot.val();
    if (!meta || meta.autoMatch !== true || meta.status !== "lobby" || Number(meta.matchmakingEndsAt || 0) <= Date.now()) {
      return false;
    }

    const existingMember = await get(ref(db, `gameMatches/${code}/members/${currentUser.uid}`));
    if (existingMember.exists()) {
      const member = existingMember.val();
      const team = member.team === TEAMS.KOLONIAL ? TEAMS.KOLONIAL : TEAMS.PEJUANG;
      const slot = Number(member.slot) === 1 ? 1 : 0;
      if (!(await claimExactSlot(code, team, slot))) return false;
      claimed = { team, slot };
    } else {
      claimed = await claimPreferredAutoSlot(code);
      if (!claimed) return false;
      await writeOwnMember(code, claimed.team, claimed.slot);
    }
    await enterRoom(code, claimed.team, claimed.slot);
    return true;
  } catch (error) {
    if (claimed) await remove(ref(db, `gameMatches/${code}/slots/${claimed.team}/${claimed.slot}`)).catch(() => {});
    if (String(error?.code || "").includes("PERMISSION_DENIED")) throw error;
    return false;
  }
}

async function autoMatch() {
  if (!authReady || busy) return;
  busy = true;
  enableLobbyActions();
  setLobbyStatus("Mencari pejuang lain...");

  try {
    const candidates = await autoMatchCandidates();
    for (const candidate of candidates) {
      if (await tryJoinAutoRoom(candidate.code)) return;
    }

    const bucket = Math.floor(Date.now() / (AUTO_MATCH_SECONDS * 1000));
    for (let shard = 0; shard < AUTO_MATCH_SHARDS; shard += 1) {
      const code = autoMatchRoomCode(bucket, shard);
      const createdAt = Date.now();
      const metaRef = ref(db, `gameMatches/${code}/meta`);
      const result = await runTransaction(
        metaRef,
        (value) => value === null
          ? {
              hostUid: currentUser.uid,
              status: "lobby",
              createdAt,
              matchmakingEndsAt: createdAt + AUTO_MATCH_SECONDS * 1000,
              mode: "benteng-2v2",
              autoMatch: true,
            }
          : undefined,
        { applyLocally: false },
      );

      if (!result.committed) {
        if (await tryJoinAutoRoom(code)) return;
        continue;
      }

      const claimed = await claimPreferredAutoSlot(code);
      if (!claimed) throw new Error("Room publik gagal menyediakan slot Pejuang.");
      try {
        await writeOwnMember(code, claimed.team, claimed.slot);
        await enterRoom(code, claimed.team, claimed.slot);
        return;
      } catch (error) {
        await remove(ref(db, `gameMatches/${code}/slots/${claimed.team}/${claimed.slot}`)).catch(() => {});
        await update(metaRef, { status: "abandoned" }).catch(() => {});
        throw error;
      }
    }
    throw new Error("Antrean sedang penuh. Coba tekan Auto Matchmaking lagi.");
  } catch (error) {
    console.error(error);
    setLobbyStatus(error.message || "Auto matchmaking gagal.", true);
  } finally {
    busy = false;
    enableLobbyActions();
  }
}

async function writeOwnMember(code, team, slot) {
  await set(ref(db, `gameMatches/${code}/members/${currentUser.uid}`), {
    name: playerName(),
    team,
    slot,
    ready: false,
    joinedAt: Date.now(),
  });
}

async function createRoom() {
  if (!authReady || busy) return;
  busy = true;
  enableLobbyActions();
  setLobbyStatus("Membuat room...");
  const team = selectedTeam();

  try {
    let code = "";
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = randomRoomCode();
      const metaRef = ref(db, `gameMatches/${candidate}/meta`);
      const result = await runTransaction(
        metaRef,
        (value) => value === null
          ? {
              hostUid: currentUser.uid,
              status: "lobby",
              createdAt: Date.now(),
              matchmakingEndsAt: Date.now() + 10_000,
              mode: "benteng-2v2",
            }
          : undefined,
        { applyLocally: false },
      );
      if (result.committed) {
        code = candidate;
        break;
      }
    }
    if (!code) throw new Error("Tidak berhasil mendapatkan kode room.");
    const slot = await claimTeamSlot(code, team);
    await writeOwnMember(code, team, slot);
    await enterRoom(code, team, slot);
  } catch (error) {
    console.error(error);
    setLobbyStatus(error.message || "Gagal membuat room.", true);
  } finally {
    busy = false;
    enableLobbyActions();
  }
}

async function joinRoom() {
  if (!authReady || busy) return;
  const code = normalizeRoomCode(ui.roomCodeInput.value);
  if (code.length !== 6) {
    setLobbyStatus("Kode room harus enam karakter.", true);
    return;
  }
  busy = true;
  enableLobbyActions();
  setLobbyStatus("Mencari room...");
  let team = selectedTeam();

  try {
    const metaSnapshot = await get(ref(db, `gameMatches/${code}/meta`));
    if (!metaSnapshot.exists()) throw new Error("Room tidak ditemukan.");
    const meta = metaSnapshot.val();
    if (meta.status !== "lobby") throw new Error("Pertandingan room ini sudah dimulai atau selesai.");
    const existingMember = await get(ref(db, `gameMatches/${code}/members/${currentUser.uid}`));
    let slot;
    if (existingMember.exists()) {
      team = existingMember.val().team === TEAMS.KOLONIAL ? TEAMS.KOLONIAL : TEAMS.PEJUANG;
      slot = Number(existingMember.val().slot) === 1 ? 1 : 0;
      const slotClaim = await runTransaction(
        ref(db, `gameMatches/${code}/slots/${team}/${slot}`),
        (value) => value === null || value === currentUser.uid ? currentUser.uid : undefined,
        { applyLocally: false },
      );
      if (!slotClaim.committed) throw new Error("Slot lama pemain sudah digunakan akun lain.");
    } else {
      slot = await claimTeamSlot(code, team);
    }
    try {
      await writeOwnMember(code, team, slot);
    } catch (error) {
      await remove(ref(db, `gameMatches/${code}/slots/${team}/${slot}`));
      throw error;
    }
    await enterRoom(code, team, slot);
  } catch (error) {
    console.error(error);
    setLobbyStatus(error.message || "Gagal masuk room.", true);
  } finally {
    busy = false;
    enableLobbyActions();
  }
}

async function registerOnDisconnect() {
  disconnectRegistrations = [
    onDisconnect(ref(db, roomPath(`members/${currentUser.uid}`))),
    onDisconnect(ref(db, roomPath(`inputs/${currentUser.uid}`))),
    onDisconnect(ref(db, roomPath(`slots/${currentTeam}/${currentSlot}`))),
  ];
  await Promise.all(disconnectRegistrations.map((registration) => registration.remove()));
  if (isHost) {
    const hostDisconnect = onDisconnect(ref(db, roomPath("meta/status")));
    await hostDisconnect.set("abandoned");
    disconnectRegistrations.push(hostDisconnect);
  }
}

async function enterRoom(code, team, slot) {
  currentRoom = code;
  currentTeam = team;
  currentSlot = slot;
  reloadSeq = 0;
  meleeSeq = 0;
  bandageSeq = 0;
  dodgeSeq = 0;
  inputSeq = 0;
  ready = false;
  roomMeta = null;
  previousRoomStatus = null;
  members = {};
  latestSnapshot = null;
  authoritativeWorld = null;
  inputsCache = {};
  resultCommitted = false;
  matchStartPending = false;
  lastMatchmakingSecond = -1;
  predictedLocal = null;
  resetClientCombatPrediction();
  lastSentInput = null;
  inputAccumulator = 0;
  snapshotAccumulator = 0;
  lastSnapshotReceivedAt = performance.now();
  renderPlayers.clear();
  camera.x = WORLD_WIDTH / 2;
  camera.y = WORLD_HEIGHT / 2;
  camera.zoom = 1;
  camera.ready = false;
  ui.roomCodeLabel.textContent = code;
  ui.gameRoomCode.textContent = code;
  ui.roomCodeInput.value = code;
  history.replaceState(null, "", `${location.pathname}?room=${code}`);
  showScreen("room");

  roomUnsubscribers.push(
    onValue(ref(db, roomPath("meta")), handleMetaSnapshot),
    onValue(ref(db, roomPath("members")), handleMembersSnapshot),
    onValue(ref(db, roomPath("inputs")), (snapshot) => {
      if (isHost) inputsCache = snapshot.val() || {};
    }),
    onValue(ref(db, roomPath("state/snapshot")), handleGameSnapshot),
  );

  const metaSnapshot = await get(ref(db, roomPath("meta")));
  isHost = metaSnapshot.val()?.hostUid === currentUser.uid;
  await registerOnDisconnect();
}

function handleMetaSnapshot(snapshot) {
  const nextMeta = snapshot.val();
  if (!nextMeta) {
    showToast("Room sudah tidak tersedia.");
    return;
  }
  roomMeta = nextMeta;
  isHost = roomMeta.hostUid === currentUser.uid;
  ui.startMatch.classList.toggle("hidden", !isHost || roomMeta.autoMatch === true);
  ui.copyRoom.classList.toggle("hidden", roomMeta.autoMatch === true);

  if (roomMeta.status === "lobby") {
    predictedLocal = null;
    resetClientCombatPrediction();
    if (previousRoomStatus === "finished") {
      ready = false;
      update(ref(db, roomPath(`members/${currentUser.uid}`)), { ready: false }).catch(console.error);
    }
    ui.resultOverlay.classList.add("hidden");
    showScreen("room");
  } else if (roomMeta.status === "starting") {
    predictedLocal = null;
    resetClientCombatPrediction();
    showScreen("room");
    ui.roomStatus.textContent = "Lineup dikunci · menyiapkan bot dan arena...";
  } else if (roomMeta.status === "playing" || roomMeta.status === "finished") {
    showScreen("game");
    ui.gameLoading.classList.toggle("hidden", Boolean(latestSnapshot && assetsReady));
  } else if (roomMeta.status === "abandoned") {
    showScreen("game");
    showAbandonedResult();
  }

  previousRoomStatus = roomMeta.status;
  renderRoom();
}

function handleMembersSnapshot(snapshot) {
  members = snapshot.val() || {};
  if (isHost && authoritativeWorld && roomMeta?.status === "playing" && !authoritativeWorld.result) {
    const missingUid = Object.keys(authoritativeWorld.players).find(
      (uid) => !authoritativeWorld.players[uid].isBot && !members[uid],
    );
    if (missingUid) finishByForfeit(authoritativeWorld, missingUid);
  }
  renderRoom();
}

function handleGameSnapshot(snapshot) {
  const next = snapshot.val();
  if (!next) return;
  latestSnapshot = next;
  lastSnapshotReceivedAt = performance.now();
  if (assetsReady) ui.gameLoading.classList.add("hidden");
  if (next.eventSeq !== lastEventSeq) {
    if (lastEventSeq >= 0 && next.lastEvent) showToast(next.lastEvent);
    lastEventSeq = next.eventSeq;
  }
  reconcileLocalPrediction(next.players?.[currentUser?.uid]);
  if (next.result) showResult(next.result);
}

function slotMarkup(team, slot) {
  const entry = Object.entries(members).find(([, member]) => member.team === team && Number(member.slot) === slot);
  const element = document.createElement("div");
  element.className = `player-slot${entry ? " filled" : ""}`;
  if (!entry) {
    const seconds = Math.max(0, Math.ceil(((roomMeta?.matchmakingEndsAt || Date.now()) - Date.now()) / 1000));
    element.textContent = roomMeta?.status === "lobby"
      ? `Slot ${slot + 1} · bot masuk dalam ${seconds} dtk`
      : `Slot ${slot + 1} · menyiapkan bot`;
    return element;
  }
  const [uid, member] = entry;
  const name = document.createElement("span");
  name.textContent = `${member.name}${uid === currentUser.uid ? " (kamu)" : ""}`;
  const status = document.createElement("small");
  status.className = "ready";
  status.textContent = "Online";
  element.append(name, status);
  return element;
}

function renderRoom() {
  if (!currentRoom) return;
  ui.pejuangSlots.replaceChildren(slotMarkup(TEAMS.PEJUANG, 0), slotMarkup(TEAMS.PEJUANG, 1));
  ui.kolonialSlots.replaceChildren(slotMarkup(TEAMS.KOLONIAL, 0), slotMarkup(TEAMS.KOLONIAL, 1));
  const memberList = Object.values(members);
  const seconds = Math.max(0, Math.ceil(((roomMeta?.matchmakingEndsAt || Date.now()) - Date.now()) / 1000));
  ui.startMatch.disabled = !isHost || memberList.length < 1 || roomMeta?.status !== "lobby" || matchStartPending;
  if (roomMeta?.status === "starting") {
    ui.roomStatus.textContent = "Lineup dikunci · menyiapkan bot dan arena...";
  } else if (memberList.length >= 4) {
    ui.roomStatus.textContent = "Empat pemain ditemukan · pertandingan segera dimulai.";
  } else if (roomMeta?.autoMatch === true) {
    ui.roomStatus.textContent = `Auto matchmaking ${seconds} detik · Pejuang diisi lebih dahulu, lalu ${4 - memberList.length} slot kosong menjadi bot.`;
  } else {
    ui.roomStatus.textContent = `Mencari pemain ${seconds} detik · jika kosong, ${4 - memberList.length} slot diisi bot.`;
  }
}

async function toggleReady() {
  if (!currentRoom || !currentUser) return;
  ready = !ready;
  await update(ref(db, roomPath(`members/${currentUser.uid}`)), { ready });
}

function lineupWithBots(humanMembers) {
  const lineup = { ...humanMembers };
  const names = {
    pejuang: ["Sutrisno BOT", "Bima BOT"],
    kolonial: ["Patroli BOT", "Sersan BOT"],
  };
  for (const team of [TEAMS.PEJUANG, TEAMS.KOLONIAL]) {
    for (let slot = 0; slot < 2; slot += 1) {
      const occupied = Object.values(humanMembers).some(
        (member) => member.team === team && Number(member.slot) === slot,
      );
      if (occupied) continue;
      lineup[`bot-${team}-${slot}`] = {
        name: names[team][slot],
        team,
        slot,
        ready: true,
        isBot: true,
      };
    }
  }
  return lineup;
}

async function startMatchWithBots() {
  if (!isHost || matchStartPending || roomMeta?.status !== "lobby") return;
  matchStartPending = true;
  renderRoom();
  const metaRef = ref(db, roomPath("meta"));
  try {
    const lock = await runTransaction(
      metaRef,
      (value) => value?.status === "lobby" ? { ...value, status: "starting" } : undefined,
      { applyLocally: false },
    );
    if (!lock.committed) return;
    const memberSnapshot = await get(ref(db, roomPath("members")));
    const freshMembers = memberSnapshot.val() || {};
    const lineup = lineupWithBots(freshMembers);
    const botCount = Object.values(lineup).filter((member) => member.isBot).length;
    authoritativeWorld = createWorld(lineup, Date.now());
    resultCommitted = false;
    lastEventSeq = -1;
    await set(ref(db, roomPath("state/snapshot")), createSnapshot(authoritativeWorld));
    await update(metaRef, {
      status: "playing",
      startedAt: Date.now(),
      humanCount: Object.keys(freshMembers).length,
      botCount,
      result: null,
    });
  } catch (error) {
    console.error(error);
    await update(metaRef, {
      status: "lobby",
      matchmakingEndsAt: Date.now() + 5_000,
    }).catch(() => {});
    showToast("Gagal memulai match · mencoba matchmaking lagi");
  } finally {
    matchStartPending = false;
  }
}

function updateMatchmaking() {
  if (!currentRoom || !roomMeta || screen !== "room") return;
  const seconds = Math.max(0, Math.ceil(((roomMeta.matchmakingEndsAt || Date.now()) - Date.now()) / 1000));
  if (seconds !== lastMatchmakingSecond) {
    lastMatchmakingSecond = seconds;
    renderRoom();
  }
  if (!isHost || matchStartPending || roomMeta.status !== "lobby") return;
  const humanCount = Object.keys(members).length;
  if (humanCount >= 4 || seconds <= 0) startMatchWithBots().catch(console.error);
}

async function cancelDisconnects() {
  await Promise.all(disconnectRegistrations.map((registration) => registration.cancel().catch(() => {})));
  disconnectRegistrations = [];
}

async function leaveRoom() {
  if (!currentRoom) return;
  const leavingRoom = currentRoom;
  const wasHost = isHost;
  await cancelDisconnects();
  if (wasHost) {
    await update(ref(db, `gameMatches/${leavingRoom}/meta`), { status: "abandoned" }).catch(() => {});
  }
  await Promise.all([
    remove(ref(db, `gameMatches/${leavingRoom}/members/${currentUser.uid}`)),
    remove(ref(db, `gameMatches/${leavingRoom}/inputs/${currentUser.uid}`)),
    remove(ref(db, `gameMatches/${leavingRoom}/slots/${currentTeam}/${currentSlot}`)),
  ]).catch(console.error);
  roomUnsubscribers.forEach((unsubscribe) => unsubscribe());
  roomUnsubscribers = [];
  currentRoom = "";
  roomMeta = null;
  members = {};
  latestSnapshot = null;
  authoritativeWorld = null;
  history.replaceState(null, "", location.pathname);
  showScreen("lobby");
  setLobbyStatus("Siap. Buat room baru atau masukkan kode teman.");
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(safe / 60);
  const remainder = String(safe % 60).padStart(2, "0");
  return `${String(minutes).padStart(2, "0")}:${remainder}`;
}

function showResult(result) {
  const pejuangWon = result.winner === TEAMS.PEJUANG;
  ui.resultKicker.textContent = "Pertandingan selesai";
  ui.resultTitle.textContent = pejuangWon ? "Pejuang Republik menguasai benteng." : "Pasukan Kolonial mempertahankan benteng.";
  ui.resultDetail.textContent = `${result.reason}. Skor akhir ${result.scorePejuang}–${result.scoreKolonial}.`;
  ui.backToRoom.textContent = isHost ? "Kembali ke lobby" : "Menunggu host";
  ui.backToRoom.disabled = !isHost;
  ui.resultOverlay.classList.remove("hidden");
}

function showAbandonedResult() {
  ui.gameLoading.classList.add("hidden");
  ui.resultKicker.textContent = "Room ditutup";
  ui.resultTitle.textContent = "Host meninggalkan pertandingan.";
  ui.resultDetail.textContent = "Buat room baru untuk memulai pertandingan berikutnya.";
  ui.backToRoom.textContent = "Keluar room";
  ui.backToRoom.disabled = false;
  ui.resultOverlay.classList.remove("hidden");
}

async function returnToLobby() {
  if (roomMeta?.status === "abandoned") {
    await leaveRoom();
    return;
  }
  if (!isHost) return;
  await remove(ref(db, roomPath("state/snapshot")));
  await update(ref(db, roomPath("meta")), {
    status: "lobby",
    result: null,
    matchmakingEndsAt: Date.now() + (roomMeta?.autoMatch === true ? AUTO_MATCH_SECONDS * 1000 : 10_000),
    humanCount: null,
    botCount: null,
  });
  authoritativeWorld = null;
  latestSnapshot = null;
  resultCommitted = false;
}

function currentMove() {
  let x = touchMove.x;
  let y = touchMove.y;
  if (keys.KeyA || keys.ArrowLeft) x -= 1;
  if (keys.KeyD || keys.ArrowRight) x += 1;
  if (keys.KeyW || keys.ArrowUp) y -= 1;
  if (keys.KeyS || keys.ArrowDown) y += 1;
  const length = Math.hypot(x, y);
  if (length > 1) return { x: x / length, y: y / length };
  return { x, y };
}

function currentAuthoritativePlayer() {
  return authoritativeWorld?.players?.[currentUser?.uid] || latestSnapshot?.players?.[currentUser?.uid] || null;
}

function nearestAutoAimTarget(world, player) {
  if (!world || !player) {
    autoAimTargetUid = "";
    return null;
  }

  const candidates = Object.values(world.players || {})
    .filter((candidate) => !candidate.dead && candidate.team !== player.team)
    .map((candidate) => {
      const dx = candidate.x - player.x;
      const dy = candidate.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (
        distance > AUTO_AIM_RANGE
        || !hasClearLineOfSight(player.x, player.y - 12, candidate.x, candidate.y - 10, 2)
      ) {
        return null;
      }

      const towardPlayerX = distance > 0 ? -dx / distance : 0;
      const towardPlayerY = distance > 0 ? -dy / distance : 0;
      const threatDot = (candidate.aimX || 0) * towardPlayerX + (candidate.aimY || 0) * towardPlayerY;
      let score = distance;
      if (candidate.capture) score -= 55;
      if (candidate.fireCooldown > 0.04) score -= 34;
      if (threatDot > 0.72) score -= 30 + (threatDot - 0.72) * 55;
      if (candidate.hp <= 45) score -= 14;
      return { candidate, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  if (!candidates.length) {
    autoAimTargetUid = "";
    return null;
  }

  const best = candidates[0];
  const locked = candidates.find(({ candidate }) => candidate.uid === autoAimTargetUid);
  const selected = locked && locked.score <= best.score + 36 ? locked : best;
  autoAimTargetUid = selected.candidate.uid;
  return selected.candidate;
}

function currentAim() {
  const authoritativePlayer = currentAuthoritativePlayer();
  const player = predictedLocal || authoritativePlayer;
  if (mobileInputQuery.matches && player && authoritativePlayer) {
    const world = isHost && authoritativeWorld ? authoritativeWorld : latestSnapshot;
    const target = nearestAutoAimTarget(world, { ...authoritativePlayer, x: player.x, y: player.y });
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const length = Math.hypot(dx, dy) || 1;
      return { x: dx / length, y: dy / length };
    }
    return {
      x: authoritativePlayer.aimX || (currentTeam === TEAMS.PEJUANG ? 1 : -1),
      y: authoritativePlayer.aimY || 0,
    };
  }
  if (pointer.inside && player) {
    const dx = pointer.x - player.x;
    const dy = pointer.y - player.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }
  const fallback = authoritativePlayer;
  return { x: fallback?.aimX || (currentTeam === TEAMS.PEJUANG ? 1 : -1), y: fallback?.aimY || 0 };
}

function buildInputPacket() {
  const move = currentMove();
  const aim = currentAim();
  inputSeq += 1;
  return {
    mx: Math.round(move.x * 100) / 100,
    my: Math.round(move.y * 100) / 100,
    ax: Math.round(aim.x * 100) / 100,
    ay: Math.round(aim.y * 100) / 100,
    fire: Boolean(pointer.fire || keys.Space || touchActions.fire),
    capture: Boolean(keys.KeyC || touchActions.capture),
    reloadSeq,
    meleeSeq,
    bandageSeq,
    dodgeSeq,
    seq: inputSeq,
    clientAt: Date.now(),
  };
}

function inputActionChanged(packet, previous) {
  return !previous
    || packet.fire !== previous.fire
    || packet.capture !== previous.capture
    || packet.reloadSeq !== previous.reloadSeq
    || packet.meleeSeq !== previous.meleeSeq
    || packet.bandageSeq !== previous.bandageSeq
    || packet.dodgeSeq !== previous.dodgeSeq;
}

function inputDirectionChanged(packet, previous) {
  if (!previous) return true;
  return Math.abs(packet.mx - previous.mx) >= 0.04
    || Math.abs(packet.my - previous.my) >= 0.04
    || Math.abs(packet.ax - previous.ax) >= 0.07
    || Math.abs(packet.ay - previous.ay) >= 0.07;
}

function shouldSendInput(packet) {
  if (inputActionChanged(packet, lastSentInput)) return true;
  if (inputAccumulator >= INPUT_CHANGE_INTERVAL && inputDirectionChanged(packet, lastSentInput)) return true;
  return inputAccumulator >= INPUT_HEARTBEAT_INTERVAL;
}

function sendInput(packet) {
  if (!currentRoom || roomMeta?.status !== "playing") return;
  inputsCache[currentUser.uid] = packet;
  lastSentInput = { ...packet };
  inputAccumulator = 0;
  if (!isHost) {
    set(ref(db, roomPath(`inputs/${currentUser.uid}`)), packet).catch((error) => {
      if (error?.code !== "PERMISSION_DENIED") console.error(error);
    });
  }
}

function reconcileLocalPrediction(serverPlayer) {
  if (!serverPlayer) return;
  if (!predictedLocal || serverPlayer.dead) {
    predictedLocal = { x: serverPlayer.x, y: serverPlayer.y };
    return;
  }
  const distance = Math.hypot(serverPlayer.x - predictedLocal.x, serverPlayer.y - predictedLocal.y);
  if (distance > 96) {
    predictedLocal.x = serverPlayer.x;
    predictedLocal.y = serverPlayer.y;
  }
}

function updatePrediction(dt, packet) {
  if (isHost) return;
  const serverPlayer = latestSnapshot?.players?.[currentUser?.uid];
  if (!serverPlayer) return;
  if (!predictedLocal) predictedLocal = { x: serverPlayer.x, y: serverPlayer.y };
  const moveLength = Math.min(1, Math.hypot(packet.mx, packet.my));
  const correction = Math.min(1, dt * (moveLength > 0.03 ? 1.8 : 8));
  predictedLocal.x += (serverPlayer.x - predictedLocal.x) * correction;
  predictedLocal.y += (serverPlayer.y - predictedLocal.y) * correction;
  if (serverPlayer.dead || serverPlayer.bandageTimer > 0) return;
  if (moveLength <= 0.03) return;
  const speed = Math.max(serverPlayer.dodgeTimer || 0, predictedDodgeTimer) > 0 ? 235 : 128;
  moveActor(predictedLocal, packet.mx * speed * dt, packet.my * speed * dt);
}

function resetClientCombatPrediction() {
  predictedBullets = [];
  predictedEffects = [];
  predictedShotSeq = 0;
  predictedFireCooldown = 0;
  predictedMeleeCooldown = 0;
  predictedDodgeTimer = 0;
  predictedReloadTimer = 0;
  predictedReloadPending = false;
  predictedAmmo = null;
  lastPredictedServerAmmo = null;
  lastPredictedReloadSeq = reloadSeq;
  lastPredictedMeleeSeq = meleeSeq;
  lastPredictedDodgeSeq = dodgeSeq;
}

function addPredictedEffect(type, x, y, player, ttl = 0.24) {
  predictedShotSeq += 1;
  predictedEffects.push({
    id: -100_000 - predictedShotSeq,
    type,
    x,
    y,
    team: player.team,
    direction: player.direction,
    ttl,
    predicted: true,
  });
}

function syncPredictedAmmo(serverPlayer) {
  if (predictedAmmo === null || lastPredictedServerAmmo === null) {
    predictedAmmo = serverPlayer.ammo;
  } else if (serverPlayer.ammo > lastPredictedServerAmmo) {
    predictedAmmo = serverPlayer.ammo;
    predictedReloadPending = false;
    predictedReloadTimer = 0;
  } else {
    predictedAmmo = Math.min(predictedAmmo, serverPlayer.ammo);
  }
  lastPredictedServerAmmo = serverPlayer.ammo;
  if (serverPlayer.reloadTimer > 0 && !predictedReloadPending) {
    predictedReloadPending = true;
    predictedReloadTimer = serverPlayer.reloadTimer;
  }
}

function spawnPredictedBullet(serverPlayer, packet) {
  const origin = predictedLocal || serverPlayer;
  const length = Math.hypot(packet.ax, packet.ay) || 1;
  const aimX = packet.ax / length;
  const aimY = packet.ay / length;
  predictedShotSeq += 1;
  predictedBullets.push({
    id: -predictedShotSeq,
    ownerUid: currentUser.uid,
    team: serverPlayer.team,
    x: origin.x + aimX * 15,
    y: origin.y - 12 + aimY * 15,
    vx: aimX * 360,
    vy: aimY * 360,
    life: 0.8,
    radius: 2.2,
    predicted: true,
  });
  addPredictedEffect(
    "muzzle",
    origin.x + aimX * 24,
    origin.y - 12 + aimY * 24,
    serverPlayer,
    0.2,
  );
}

function updatePredictedProjectiles(dt, world) {
  for (const bullet of predictedBullets) {
    if (bullet.life <= 0) continue;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    const hitWorld = bullet.x < 0
      || bullet.x > WORLD_WIDTH
      || bullet.y < 0
      || bullet.y > WORLD_HEIGHT
      || collidesWorld(bullet.x, bullet.y, bullet.radius);
    const hitPlayer = Object.values(world?.players || {}).some(
      (player) => !player.dead
        && player.team !== bullet.team
        && Math.hypot(bullet.x - player.x, bullet.y - (player.y - 10)) <= 17,
    );
    if (hitWorld || hitPlayer) {
      bullet.life = 0;
      addPredictedEffect("impact", bullet.x, bullet.y, { team: bullet.team, direction: 0 }, 0.2);
    }
  }
  predictedBullets = predictedBullets.filter((bullet) => bullet.life > 0);
  for (const effect of predictedEffects) effect.ttl -= dt;
  predictedEffects = predictedEffects.filter((effect) => effect.ttl > 0);
}

function updateClientCombatPrediction(dt, packet) {
  if (isHost) return;
  const world = latestSnapshot;
  const serverPlayer = world?.players?.[currentUser?.uid];
  updatePredictedProjectiles(dt, world);
  predictedFireCooldown = Math.max(0, predictedFireCooldown - dt);
  predictedMeleeCooldown = Math.max(0, predictedMeleeCooldown - dt);
  predictedDodgeTimer = Math.max(0, predictedDodgeTimer - dt);
  predictedReloadTimer = Math.max(0, predictedReloadTimer - dt);
  if (!serverPlayer || serverPlayer.dead) {
    predictedAmmo = serverPlayer?.ammo ?? null;
    return;
  }

  syncPredictedAmmo(serverPlayer);
  if (packet.reloadSeq !== lastPredictedReloadSeq) {
    lastPredictedReloadSeq = packet.reloadSeq;
    if (predictedAmmo < 5 && serverPlayer.reserve > 0 && !predictedReloadPending) {
      predictedReloadPending = true;
      predictedReloadTimer = 1.05;
    }
  }
  if (packet.meleeSeq !== lastPredictedMeleeSeq) {
    lastPredictedMeleeSeq = packet.meleeSeq;
    if (predictedMeleeCooldown <= 0 && !predictedReloadPending) {
      const origin = predictedLocal || serverPlayer;
      addPredictedEffect(
        "melee",
        origin.x + packet.ax * 28,
        origin.y - 8 + packet.ay * 22,
        serverPlayer,
        0.3,
      );
      predictedMeleeCooldown = 0.66;
    }
  }
  if (packet.dodgeSeq !== lastPredictedDodgeSeq) {
    lastPredictedDodgeSeq = packet.dodgeSeq;
    if (Math.hypot(packet.mx, packet.my) > 0.1) predictedDodgeTimer = 0.24;
  }

  const canFire = packet.fire
    && predictedFireCooldown <= 0
    && predictedAmmo > 0
    && !predictedReloadPending
    && serverPlayer.bandageTimer <= 0
    && !packet.capture;
  if (canFire) {
    spawnPredictedBullet(serverPlayer, packet);
    predictedAmmo -= 1;
    predictedFireCooldown = 0.28;
    if (predictedAmmo <= 0 && serverPlayer.reserve > 0) {
      predictedReloadPending = true;
      predictedReloadTimer = 1.05;
    }
  }
}

function publishSnapshot(snapshot, roomCode = currentRoom) {
  return set(ref(db, `gameMatches/${roomCode}/state/snapshot`), snapshot);
}

function hostStep(dt, packet) {
  if (!isHost || !authoritativeWorld || roomMeta?.status !== "playing") return;
  Object.assign(inputsCache, createBotInputs(authoritativeWorld));
  inputsCache[currentUser.uid] = packet;
  const previousEffectSeq = authoritativeWorld.effectSeq;
  const previousEventSeq = authoritativeWorld.eventSeq;
  stepWorld(authoritativeWorld, inputsCache, dt);
  snapshotAccumulator += dt;
  const urgentSnapshot = authoritativeWorld.effectSeq !== previousEffectSeq
    || authoritativeWorld.eventSeq !== previousEventSeq;
  if (urgentSnapshot || snapshotAccumulator >= SNAPSHOT_INTERVAL) {
    snapshotAccumulator = urgentSnapshot ? 0 : snapshotAccumulator % SNAPSHOT_INTERVAL;
    const snapshot = createSnapshot(authoritativeWorld);
    latestSnapshot = snapshot;
    publishSnapshot(snapshot).catch(console.error);
  }

  if (authoritativeWorld.result && !resultCommitted) {
    resultCommitted = true;
    const finishedRoom = currentRoom;
    const finalSnapshot = createSnapshot(authoritativeWorld);
    latestSnapshot = finalSnapshot;
    publishSnapshot(finalSnapshot, finishedRoom)
      .then(() => update(ref(db, `gameMatches/${finishedRoom}/meta`), {
        status: "finished",
        result: authoritativeWorld.result,
        finishedAt: Date.now(),
      }))
      .catch(console.error);
  }
}

function updateGame(dt) {
  if (roomMeta?.status !== "playing") return;
  const packet = buildInputPacket();
  inputAccumulator += dt;
  if (shouldSendInput(packet)) sendInput(packet);
  hostStep(dt, packet);
  updateClientCombatPrediction(dt, packet);
  updatePrediction(dt, packet);
}

function drawAtlasCell(image, columns, rows, column, row, x, y, width, height, alpha = 1) {
  if (!image) return false;
  const sourceWidth = image.width / columns;
  const sourceHeight = image.height / rows;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.drawImage(image, column * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
  return true;
}

function drawTileRegion(image, column, row, x, y, width, height, alpha = 1) {
  if (!image) return false;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  for (let tileY = y; tileY < y + height; tileY += 32) {
    for (let tileX = x; tileX < x + width; tileX += 32) {
      drawAtlasCell(image, 4, 4, column, row, tileX, tileY, 32, 32, alpha);
    }
  }
  ctx.restore();
  return true;
}

function updateCamera(world, dt) {
  const mobile = mobileInputQuery.matches;
  const local = renderPlayers.get(currentUser?.uid) || world?.players?.[currentUser?.uid];
  const targetZoom = mobile ? 1.38 : 1;
  if (mobile && local && !local.dead) {
    if (!camera.ready) {
      camera.x = local.x;
      camera.y = local.y;
      camera.zoom = targetZoom;
      camera.ready = true;
    } else {
      const follow = Math.min(1, dt * 12);
      camera.x += (local.x - camera.x) * follow;
      camera.y += (local.y - camera.y) * follow;
      camera.zoom += (targetZoom - camera.zoom) * Math.min(1, dt * 8);
    }
  } else {
    camera.x += (WORLD_WIDTH / 2 - camera.x) * Math.min(1, dt * 8);
    camera.y += (WORLD_HEIGHT / 2 - camera.y) * Math.min(1, dt * 8);
    camera.zoom += (1 - camera.zoom) * Math.min(1, dt * 8);
    camera.ready = false;
  }
}

function applyWorldCamera() {
  ctx.translate(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);
}

function screenToWorld(screenX, screenY) {
  return {
    x: camera.x + (screenX - WORLD_WIDTH / 2) / camera.zoom,
    y: camera.y + (screenY - WORLD_HEIGHT / 2) / camera.zoom,
  };
}

function worldToScreen(worldX, worldY) {
  return {
    x: WORLD_WIDTH / 2 + (worldX - camera.x) * camera.zoom,
    y: WORLD_HEIGHT / 2 + (worldY - camera.y) * camera.zoom,
  };
}

function drawOuterForestFloor() {
  ctx.fillStyle = "#20281c";
  ctx.fillRect(-480, -320, WORLD_WIDTH + 960, WORLD_HEIGHT + 640);
  const viewWidth = WORLD_WIDTH / camera.zoom;
  const viewHeight = WORLD_HEIGHT / camera.zoom;
  const minX = Math.floor((camera.x - viewWidth / 2 - 64) / 64) * 64;
  const maxX = Math.ceil((camera.x + viewWidth / 2 + 64) / 64) * 64;
  const minY = Math.floor((camera.y - viewHeight / 2 - 64) / 64) * 64;
  const maxY = Math.ceil((camera.y + viewHeight / 2 + 64) / 64) * 64;
  for (let y = minY; y <= maxY; y += 64) {
    for (let x = minX; x <= maxX; x += 64) {
      drawAtlasCell(images.terrain, 4, 4, (Math.abs(x + y) / 64) % 2 ? 2 : 1, 0, x, y, 64, 64, 0.56);
    }
  }
  ctx.fillStyle = "rgba(7, 12, 8, 0.38)";
  ctx.fillRect(-480, -320, WORLD_WIDTH + 960, WORLD_HEIGHT + 640);
}

function drawOuterForestTrees() {
  const drawForestTree = (x, y, seed, alpha = 1) => {
    const column = seed % 4;
    const row = seed % 5 === 0 ? 1 : 0;
    const size = 128 + (seed % 3) * 12;
    drawAtlasCell(images.trees, 4, 3, column, row, x - size / 2, y - size + 24, size, size, alpha);
  };

  let seed = 0;
  for (let x = -380; x <= WORLD_WIDTH + 380; x += 104) {
    drawForestTree(x, -72, seed += 1, 0.9);
    drawForestTree(x + 42, -164, seed += 1, 0.82);
    drawForestTree(x, WORLD_HEIGHT + 84, seed += 1, 0.94);
    drawForestTree(x + 45, WORLD_HEIGHT + 176, seed += 1, 0.82);
  }
  for (let y = 18; y <= WORLD_HEIGHT; y += 94) {
    drawForestTree(-76, y, seed += 1, 0.94);
    drawForestTree(-172, y + 38, seed += 1, 0.82);
    drawForestTree(WORLD_WIDTH + 76, y, seed += 1, 0.94);
    drawForestTree(WORLD_WIDTH + 174, y + 38, seed += 1, 0.82);
  }

  ctx.strokeStyle = "rgba(219, 198, 150, 0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(17, 21, WORLD_WIDTH - 34, WORLD_HEIGHT - 39);
}

function drawGround() {
  ctx.fillStyle = "#4c543b";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  if (!drawTileRegion(images.terrain, 2, 0, 0, 0, WORLD_WIDTH, WORLD_HEIGHT)) {
    ctx.fillStyle = "#4e573b";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // Kampung Republik, petak sawah, tanah hangus, dan markas kolonial.
  drawTileRegion(images.terrain, 1, 0, 24, 28, 334, 194, 0.92);
  drawTileRegion(images.rice, 1, 0, 24, 326, 330, 192, 0.98);
  drawTileRegion(images.terrain, 3, 3, 384, 136, 192, 252, 0.96);
  drawTileRegion(images.terrain, 0, 0, 610, 26, 326, 202, 0.94);
  drawTileRegion(images.terrain, 0, 0, 610, 316, 326, 202, 0.94);

  // Jalan utama dan jalur penghubung enam benteng.
  drawTileRegion(images.road, 3, 0, 0, 240, WORLD_WIDTH, 64, 0.9);
  drawTileRegion(images.road, 2, 0, 448, 0, 64, WORLD_HEIGHT, 0.82);
  drawTileRegion(images.road, 3, 0, 96, 112, 286, 34, 0.78);
  drawTileRegion(images.road, 3, 0, 576, 112, 288, 34, 0.78);
  drawTileRegion(images.road, 2, 0, 150, 142, 34, 260, 0.72);
  drawTileRegion(images.road, 2, 0, 778, 142, 34, 260, 0.72);

  // Saluran irigasi dangkal di titik jembatan.
  drawTileRegion(images.river, 0, 0, 514, 334, 132, 62, 0.94);

  // Pematang sawah membuat area selatan-barat terbaca sebagai petak, bukan karpet tile.
  ctx.fillStyle = "rgba(74, 61, 34, 0.68)";
  for (let y = 357; y < 510; y += 48) ctx.fillRect(24, y, 330, 5);
  for (let x = 86; x < 354; x += 86) ctx.fillRect(x, 326, 5, 192);

  const decals = [
    [0, 0, 66, 70, 58, 58, 0.42],
    [1, 0, 214, 174, 48, 48, 0.38],
    [1, 1, 397, 167, 64, 64, 0.82],
    [3, 1, 497, 284, 58, 58, 0.78],
    [0, 3, 421, 311, 60, 60, 0.72],
    [2, 0, 684, 84, 68, 68, 0.42],
    [3, 0, 840, 354, 52, 52, 0.46],
    [2, 3, 690, 466, 62, 62, 0.38],
  ];
  for (const [column, row, x, y, width, height, alpha] of decals) {
    drawAtlasCell(images.decals, 4, 4, column, row, x, y, width, height, alpha);
  }

  const baseGradient = ctx.createLinearGradient(0, 0, WORLD_WIDTH, 0);
  baseGradient.addColorStop(0, "rgba(164, 58, 45, 0.18)");
  baseGradient.addColorStop(0.2, "rgba(164, 58, 45, 0)");
  baseGradient.addColorStop(0.8, "rgba(61, 92, 121, 0)");
  baseGradient.addColorStop(1, "rgba(61, 92, 121, 0.22)");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawFortifications() {
  // Bangunan berikut ditambatkan ke STATIC_RECTS, jadi visual dan collision tetap selaras.
  drawAtlasCell(images.villageBuildings, 3, 2, 2, 0, 242, 24, 145, 109);
  drawAtlasCell(images.villageBuildings, 3, 2, 0, 1, 242, 357, 145, 109);
  drawAtlasCell(images.villageBuildings, 3, 2, 1, 0, 384, 151, 194, 146);
  drawAtlasCell(images.campBuildings, 3, 2, 1, 0, 568, 22, 148, 111);
  drawAtlasCell(images.campBuildings, 3, 2, 0, 1, 570, 358, 148, 111);
  drawAtlasCell(images.campBuildings, 3, 2, 2, 1, 82, 218, 158, 79);
  drawAtlasCell(images.campBuildings, 3, 2, 2, 1, 720, 218, 158, 79);

  // Jembatan kayu dan detail wilayah sawah.
  drawAtlasCell(images.bridge, 4, 3, 0, 0, 493, 319, 174, 87, 1);
  const ricePlants = [
    [45, 337], [111, 337], [197, 337], [283, 337],
    [45, 385], [111, 385], [197, 385], [283, 385],
    [45, 433], [111, 433], [197, 433], [283, 433],
    [45, 481], [111, 481], [197, 481], [283, 481],
  ];
  for (let index = 0; index < ricePlants.length; index += 1) {
    const [x, y] = ricePlants[index];
    const sway = Math.sin(elapsed * 1.7 + index) * 1.5;
    drawAtlasCell(images.groundVegetation, 4, 4, index % 2, 1, x + sway, y, 30, 30, 0.8);
  }

  // Siluet pohon membingkai arena; pohon mati memperkuat pusat kampung yang terbakar.
  drawAtlasCell(images.trees, 4, 3, 0, 0, -44, -26, 156, 156);
  drawAtlasCell(images.trees, 4, 3, 2, 0, 82, -47, 145, 145);
  drawAtlasCell(images.trees, 4, 3, 3, 0, 846, -35, 154, 154);
  drawAtlasCell(images.trees, 4, 3, 2, 2, -35, 410, 145, 145);
  drawAtlasCell(images.trees, 4, 3, 1, 1, 848, 412, 150, 150);
  drawAtlasCell(images.trees, 4, 3, 3, 1, 526, 85, 125, 125, 0.92);

  // Perlengkapan kamp dan hasil bumi memakai natural-obstacle atlas utama.
  drawAtlasCell(images.obstacles, 4, 4, 3, 2, 205, 443, 60, 60, 0.9);
  drawAtlasCell(images.obstacles, 4, 4, 2, 2, 654, 164, 66, 66, 0.9);
  drawAtlasCell(images.obstacles, 4, 4, 2, 1, 816, 166, 68, 68, 0.9);
  drawAtlasCell(images.obstacles, 4, 4, 3, 3, 842, 421, 58, 58, 0.82);

  // Api dan asap rumah runtuh dianimasikan dari environment-vfx atlas.
  const fireFrame = Math.floor(elapsed * 8) % 4;
  const smokeFrame = Math.floor(elapsed * 3.2) % 4;
  drawAtlasCell(images.vfx, 4, 4, fireFrame, 0, 424, 198, 50, 50, 0.96);
  drawAtlasCell(images.vfx, 4, 4, (fireFrame + 2) % 4, 0, 488, 207, 44, 44, 0.92);
  drawAtlasCell(images.vfx, 4, 4, smokeFrame, 1, 434, 143, 78, 78, 0.6);
  drawAtlasCell(images.vfx, 4, 4, (smokeFrame + 1) % 4, 1, 485, 156, 66, 66, 0.46);
  drawAtlasCell(images.vfx, 4, 4, fireFrame, 0, 755, 165, 27, 27, 0.72);

  ctx.fillStyle = "rgba(151, 55, 43, 0.18)";
  ctx.fillRect(18, 190, 72, 160);
  ctx.strokeStyle = "rgba(215, 89, 69, 0.5)";
  ctx.strokeRect(18.5, 190.5, 71, 159);
  ctx.fillStyle = "rgba(52, 81, 108, 0.22)";
  ctx.fillRect(870, 190, 72, 160);
  ctx.strokeStyle = "rgba(86, 127, 163, 0.55)";
  ctx.strokeRect(870.5, 190.5, 71, 159);

  const zoneLabels = [
    [54, 42, "KAMPUNG REPUBLIK"],
    [44, 505, "SAWAH SELATAN"],
    [406, 116, "KAMPUNG TERBAKAR"],
    [738, 42, "MARKAS KOLONIAL"],
  ];
  ctx.font = "800 8px system-ui, sans-serif";
  ctx.textAlign = "left";
  for (const [x, y, label] of zoneLabels) {
    const width = ctx.measureText(label).width + 14;
    ctx.fillStyle = "rgba(15, 18, 14, 0.68)";
    ctx.fillRect(x - 6, y - 11, width, 17);
    ctx.fillStyle = "rgba(232, 214, 177, 0.74)";
    ctx.fillText(label, x, y - 9);
  }
}

function teamColor(team, alpha = 1) {
  if (team === TEAMS.PEJUANG) return `rgba(210, 73, 57, ${alpha})`;
  if (team === TEAMS.KOLONIAL) return `rgba(72, 111, 148, ${alpha})`;
  return `rgba(205, 183, 136, ${alpha})`;
}

function drawCapturePoint(point) {
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.setLineDash([7, 6]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = point.contested ? "rgba(235, 189, 79, 0.95)" : teamColor(point.owner, 0.75);
  ctx.beginPath();
  ctx.arc(0, 0, 51, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = teamColor(point.owner, 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, 49, 0, Math.PI * 2);
  ctx.fill();

  if (point.capturing && point.progress > 0) {
    ctx.strokeStyle = teamColor(point.capturing, 1);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 56, -Math.PI / 2, -Math.PI / 2 + (point.progress / CAPTURE_SECONDS) * Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(20, 22, 18, 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 21);
  ctx.lineTo(0, -29);
  ctx.stroke();
  ctx.fillStyle = teamColor(point.owner, point.owner ? 0.95 : 0.45);
  const flagWave = Math.sin(elapsed * 4.5 + point.id.charCodeAt(0)) * 3;
  ctx.beginPath();
  ctx.moveTo(1, -28);
  ctx.quadraticCurveTo(13, -27 + flagWave, 26, -20);
  ctx.quadraticCurveTo(14, -14 + flagWave, 1, -11);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(17, 20, 16, 0.78)";
  ctx.beginPath();
  ctx.arc(-35, -38, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ead8b4";
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(point.id, -35, -44);
  ctx.font = "650 8px system-ui, sans-serif";
  ctx.fillStyle = "rgba(236, 218, 180, 0.76)";
  ctx.fillText(point.contested ? "DIPEREBUTKAN" : point.label.toUpperCase(), 0, 60);
  ctx.restore();
}

function updateRenderPlayers(world, dt) {
  const activeIds = new Set(Object.keys(world?.players || {}));
  const snapshotAge = isHost ? 0 : Math.min(0.12, Math.max(0, (performance.now() - lastSnapshotReceivedAt) / 1000));
  for (const [uid, player] of Object.entries(world?.players || {})) {
    let display = renderPlayers.get(uid);
    if (!display) {
      display = { ...player, x: player.x, y: player.y };
      renderPlayers.set(uid, display);
    }
    const previousX = display.x;
    const previousY = display.y;
    const remoteLead = !isHost && uid !== currentUser?.uid && player.moving
      ? Math.min(0.14, 0.045 + snapshotAge)
      : 0;
    const speed = player.dodgeTimer > 0 ? 235 : 128;
    Object.assign(display, player, {
      targetX: player.x + (player.moveX || 0) * speed * remoteLead,
      targetY: player.y + (player.moveY || 0) * speed * remoteLead,
    });
    display.x = previousX;
    display.y = previousY;
    const serverJump = Math.hypot(player.x - display.x, player.y - display.y);
    if (isHost || player.dead || serverJump > 100) {
      display.x = player.x;
      display.y = player.y;
    } else {
      const blend = Math.min(1, dt * 18);
      display.x += (display.targetX - display.x) * blend;
      display.y += (display.targetY - display.y) * blend;
    }
    if (uid === currentUser?.uid && !isHost && predictedLocal && !player.dead) {
      display.x = predictedLocal.x;
      display.y = predictedLocal.y;
      display.fireCooldown = Math.max(display.fireCooldown || 0, predictedFireCooldown);
      display.meleeCooldown = Math.max(display.meleeCooldown || 0, predictedMeleeCooldown);
      display.dodgeTimer = Math.max(display.dodgeTimer || 0, predictedDodgeTimer);
      display.reloadTimer = Math.max(display.reloadTimer || 0, predictedReloadTimer);
    }
  }
  for (const uid of renderPlayers.keys()) {
    if (!activeIds.has(uid)) renderPlayers.delete(uid);
  }
}

function spriteFor(player) {
  if (player.team === TEAMS.PEJUANG) return Number(player.slot) === 0 ? images.sutrisno : images.bima;
  return Number(player.slot) === 0 ? images.patrol : images.sergeant;
}

function drawPickup(pickup) {
  const bob = Math.sin(elapsed * 3.4 + Number(pickup.id || 0)) * 2;
  ctx.save();
  ctx.translate(pickup.x, pickup.y + bob);
  ctx.fillStyle = "rgba(18, 20, 17, 0.72)";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  if (pickup.type === "ammo") {
    drawAtlasCell(images.weapons, 4, 4, 2, 2, -15, -12, 30, 23);
  } else {
    drawAtlasCell(images.itemIcons, 4, 4, 0, 1, -11, -11, 22, 22);
  }
  ctx.strokeStyle = pickup.type === "ammo" ? "rgba(211, 170, 97, 0.85)" : "rgba(216, 208, 175, 0.85)";
  ctx.lineWidth = 1;
  ctx.strokeRect(-12.5, -12.5, 25, 25);
  ctx.restore();
}

function drawBullet(bullet) {
  const length = Math.hypot(bullet.vx, bullet.vy) || 1;
  const trailX = (bullet.vx / length) * 17;
  const trailY = (bullet.vy / length) * 17;
  const snapshotAge = isHost || bullet.predicted ? 0 : Math.min(
    Math.max(0, bullet.life || 0),
    Math.min(0.12, Math.max(0, (performance.now() - lastSnapshotReceivedAt) / 1000)),
  );
  const bulletX = bullet.x + bullet.vx * snapshotAge;
  const bulletY = bullet.y + bullet.vy * snapshotAge;
  ctx.strokeStyle = bullet.team === TEAMS.PEJUANG ? "rgba(244, 202, 112, 0.9)" : "rgba(226, 135, 85, 0.9)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(bulletX - trailX, bulletY - trailY);
  ctx.lineTo(bulletX, bulletY);
  ctx.stroke();
  ctx.save();
  ctx.translate(bulletX, bulletY);
  ctx.rotate(Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2);
  drawAtlasCell(images.vfx, 4, 4, Math.floor(elapsed * 16 + bullet.id) % 4, 0, -7, -12, 14, 14, 0.7);
  ctx.restore();
}

function directionVector(direction) {
  if (direction === 0) return { x: 0, y: 1 };
  if (direction === 1) return { x: -1, y: 0 };
  if (direction === 3) return { x: 0, y: -1 };
  return { x: 1, y: 0 };
}

function combatActionRow(player) {
  if (player.team === TEAMS.KOLONIAL && player.dead) return 3;
  if (player.hitTimer > 0) return player.team === TEAMS.PEJUANG ? 3 : 2;
  if (player.meleeCooldown > 0.36) return player.team === TEAMS.PEJUANG ? 2 : 0;
  if (player.fireCooldown > 0.1) return 1;
  return -1;
}

function drawCombatEffect(effect) {
  const frame = (Math.floor(elapsed * 14) + Number(effect.id || 0)) % 4;
  if (effect.type === "muzzle") {
    ctx.save();
    ctx.translate(effect.x, effect.y);
    const vector = directionVector(effect.direction);
    ctx.rotate(Math.atan2(vector.y, vector.x) + Math.PI / 2);
    drawAtlasCell(images.vfx, 4, 4, frame, 0, -12, -22, 24, 24, 0.92);
    ctx.restore();
    return;
  }

  const size = effect.type === "melee" ? 42 : effect.type === "hit" ? 34 : 28;
  drawAtlasCell(images.vfx, 4, 4, frame, 2, effect.x - size / 2, effect.y - size / 2, size, size, 0.72);
  if (effect.type === "melee") {
    const vector = directionVector(effect.direction);
    const angle = Math.atan2(vector.y, vector.x);
    ctx.strokeStyle = teamColor(effect.team, Math.max(0.25, effect.ttl * 2.4));
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(effect.x - vector.x * 13, effect.y - vector.y * 13, 29, angle - 0.75, angle + 0.75);
    ctx.stroke();
  } else if (effect.type === "hit") {
    ctx.strokeStyle = "rgba(169, 66, 48, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 9 + (0.28 - effect.ttl) * 32, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLocalActionProgress(world) {
  const player = world?.players?.[currentUser?.uid];
  if (!player || player.dead || (player.reloadTimer <= 0 && player.bandageTimer <= 0)) return;
  const isReloading = player.reloadTimer > 0;
  const remaining = isReloading ? player.reloadTimer : player.bandageTimer;
  const duration = isReloading ? 1.05 : 1.35;
  const progress = Math.max(0, Math.min(1, 1 - remaining / duration));
  const x = 410;
  const y = 78;
  ctx.fillStyle = "rgba(16, 19, 15, 0.9)";
  ctx.fillRect(x, y, 140, 31);
  ctx.strokeStyle = "rgba(229, 209, 166, 0.32)";
  ctx.strokeRect(x + 0.5, y + 0.5, 139, 30);
  ctx.fillStyle = "#342d23";
  ctx.fillRect(x + 10, y + 20, 120, 5);
  ctx.fillStyle = isReloading ? "#d4aa61" : "#d7d0ae";
  ctx.fillRect(x + 10, y + 20, 120 * progress, 5);
  ctx.fillStyle = "#ead8b4";
  ctx.font = "800 8px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(isReloading ? "MENGISI PELURU" : "MEMBALUT LUKA", x + 70, y + 5);
}

function drawPlayer(player, uid) {
  ctx.save();
  if (player.dead) ctx.globalAlpha = 0.28;
  if (player.spawnShield > 0 && Math.floor(elapsed * 12) % 2 === 0) ctx.globalAlpha *= 0.55;
  if (player.invulnerable > 0 && Math.floor(elapsed * 18) % 2 === 0) ctx.globalAlpha *= 0.28;
  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 3, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (uid === currentUser?.uid) {
    ctx.strokeStyle = "rgba(244, 221, 169, 0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y - 4, 17, 0, Math.PI * 2);
    ctx.stroke();
  }

  const sprite = spriteFor(player);
  const actionRow = combatActionRow(player);
  const actionAtlas = player.team === TEAMS.KOLONIAL
    ? images.enemyAction
    : Number(player.slot) === 0
      ? images.playerAction
      : null;
  if (player.moving && !player.dead) {
    const dustSize = player.dodgeTimer > 0 ? 38 : 25;
    const dustFrame = Math.floor((elapsed + player.x * 0.004) * 9) % 4;
    drawAtlasCell(images.vfx, 4, 4, dustFrame, 2, player.x - dustSize / 2, player.y - 10, dustSize, dustSize, player.dodgeTimer > 0 ? 0.7 : 0.3);
  }

  if (actionRow >= 0 && actionAtlas) {
    drawAtlasCell(actionAtlas, 4, 4, player.direction, actionRow, player.x - 28, player.y - 58, 56, 56);
  } else if (sprite) {
    const frame = player.moving ? Math.floor((elapsed + player.x * 0.002) * 9) % 4 : 0;
    const vector = directionVector(player.direction);
    const meleeLunge = player.meleeCooldown > 0.36 ? 5 : 0;
    const recoil = player.fireCooldown > 0.1 ? -3 : 0;
    const bob = player.moving ? Math.sin(elapsed * 18 + player.x * 0.02) * 1.2 : 0;
    drawAtlasCell(
      sprite,
      4,
      4,
      frame,
      player.direction,
      player.x - 22 + vector.x * (meleeLunge + recoil),
      player.y - 58 + vector.y * (meleeLunge + recoil) + bob,
      44,
      66,
    );
  } else {
    ctx.fillStyle = teamColor(player.team, 1);
    ctx.beginPath();
    ctx.arc(player.x, player.y - 12, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.font = "700 9px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(13, 15, 12, 0.85)";
  const nameWidth = Math.max(42, ctx.measureText(player.name).width + 12);
  ctx.fillRect(player.x - nameWidth / 2, player.y - 73, nameWidth, 13);
  ctx.fillStyle = "#ead9b7";
  ctx.fillText(player.dead ? `${player.name} · ${Math.max(0, Math.ceil(player.respawnTimer))}` : player.name, player.x, player.y - 71);
  if (!player.dead) {
    ctx.fillStyle = "rgba(17, 18, 15, 0.8)";
    ctx.fillRect(player.x - 18, player.y - 57, 36, 4);
    ctx.fillStyle = teamColor(player.team, 1);
    ctx.fillRect(player.x - 18, player.y - 57, 36 * Math.max(0, player.hp / 100), 4);
  }
  ctx.restore();
}

function drawAutoAimLock(world, local) {
  if (!mobileInputQuery.matches || !local || local.dead) return;
  const target = nearestAutoAimTarget(world, local);
  if (!target) return;
  const display = renderPlayers.get(target.uid) || target;
  const pulse = 19 + Math.sin(elapsed * 7) * 2;
  ctx.save();
  ctx.translate(display.x, display.y - 12);
  ctx.strokeStyle = "rgba(235, 184, 76, 0.88)";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(18, 21, 17, 0.8)";
  ctx.fillRect(-18, -31, 36, 11);
  ctx.fillStyle = "#efd38f";
  ctx.font = "800 7px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AUTO", 0, -30);
  ctx.restore();
}

function drawMinimap(world) {
  if (!world) return;
  const mobile = mobileInputQuery.matches;
  const width = mobile ? 158 : 172;
  const height = mobile ? 94 : 102;
  const x = WORLD_WIDTH - width - 14;
  const y = 58;
  const innerX = x + 7;
  const innerY = y + 19;
  const innerWidth = width - 14;
  const innerHeight = height - 26;
  const mapX = (value) => innerX + (value / WORLD_WIDTH) * innerWidth;
  const mapY = (value) => innerY + (value / WORLD_HEIGHT) * innerHeight;

  ctx.save();
  ctx.fillStyle = "rgba(12, 16, 12, 0.9)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(232, 211, 169, 0.38)";
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.fillStyle = "rgba(229, 210, 168, 0.8)";
  ctx.font = "800 8px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("PETA BENTENG", x + 8, y + 6);

  ctx.save();
  ctx.beginPath();
  ctx.rect(innerX, innerY, innerWidth, innerHeight);
  ctx.clip();
  ctx.fillStyle = "#465137";
  ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
  ctx.fillStyle = "rgba(123, 101, 53, 0.34)";
  ctx.fillRect(mapX(0), mapY(326), innerWidth * 0.37, innerHeight * 0.36);
  ctx.fillStyle = "rgba(67, 72, 63, 0.42)";
  ctx.fillRect(mapX(610), mapY(26), innerWidth * 0.34, innerHeight * 0.37);
  ctx.fillRect(mapX(610), mapY(316), innerWidth * 0.34, innerHeight * 0.37);
  ctx.fillStyle = "rgba(82, 50, 36, 0.62)";
  ctx.fillRect(mapX(384), mapY(136), innerWidth * 0.2, innerHeight * 0.47);

  ctx.fillStyle = "rgba(23, 27, 21, 0.68)";
  for (const rect of STATIC_RECTS) {
    ctx.fillRect(mapX(rect.x), mapY(rect.y), (rect.w / WORLD_WIDTH) * innerWidth, (rect.h / WORLD_HEIGHT) * innerHeight);
  }

  for (const point of world.points || []) {
    ctx.fillStyle = teamColor(point.owner, point.owner ? 0.96 : 0.68);
    ctx.beginPath();
    ctx.arc(mapX(point.x), mapY(point.y), point.contested ? 4.2 : 3.2, 0, Math.PI * 2);
    ctx.fill();
    if (point.contested) {
      ctx.strokeStyle = "rgba(241, 198, 81, 0.9)";
      ctx.stroke();
    }
  }

  for (const player of Object.values(world.players || {})) {
    if (player.dead) continue;
    const isLocal = player.uid === currentUser?.uid;
    ctx.fillStyle = isLocal ? "#f6df9d" : teamColor(player.team, 1);
    ctx.beginPath();
    ctx.arc(mapX(player.x), mapY(player.y), isLocal ? 3.8 : 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const viewWidth = WORLD_WIDTH / camera.zoom;
  const viewHeight = WORLD_HEIGHT / camera.zoom;
  ctx.strokeStyle = "rgba(244, 224, 180, 0.62)";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    mapX(camera.x - viewWidth / 2),
    mapY(camera.y - viewHeight / 2),
    (viewWidth / WORLD_WIDTH) * innerWidth,
    (viewHeight / WORLD_HEIGHT) * innerHeight,
  );
  ctx.restore();
  ctx.restore();
}

function drawMobilePlayerHud(world) {
  if (!mobileInputQuery.matches) return;
  const player = world?.players?.[currentUser?.uid];
  if (!player) return;
  const displayAmmo = !isHost && predictedAmmo !== null ? predictedAmmo : player.ammo;
  const displayReload = player.reloadTimer > 0 || (!isHost && predictedReloadPending);
  const x = 14;
  const y = 14;
  const width = 190;
  ctx.fillStyle = "rgba(12, 16, 12, 0.88)";
  ctx.fillRect(x, y, width, 65);
  ctx.strokeStyle = "rgba(232, 211, 169, 0.32)";
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, 64);
  ctx.fillStyle = teamColor(player.team, 0.95);
  ctx.fillRect(x, y, 4, 65);
  ctx.fillStyle = "#ead8b4";
  ctx.font = "800 9px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(player.name.toUpperCase(), x + 12, y + 9);
  ctx.fillStyle = "#342a22";
  ctx.fillRect(x + 12, y + 26, 112, 8);
  ctx.fillStyle = player.hp > 35 ? "#a84b38" : "#d96a45";
  ctx.fillRect(x + 12, y + 26, 112 * Math.max(0, player.hp / 100), 8);
  ctx.fillStyle = "#d5c39d";
  ctx.font = "700 8px system-ui, sans-serif";
  ctx.fillText(`HP ${Math.ceil(player.hp)}`, x + 130, y + 25);
  ctx.fillText(`PELURU ${displayAmmo}/${player.reserve}`, x + 12, y + 43);
  ctx.fillText(`PERBAN ${player.bandages ?? 0}`, x + 104, y + 43);
  if (displayReload) {
    ctx.fillStyle = "rgba(225, 177, 91, 0.9)";
    ctx.fillText("AUTO RELOAD", x + 12, y + 54);
  }
}

function drawWorld(dt) {
  const world = isHost && authoritativeWorld ? authoritativeWorld : latestSnapshot;
  updateRenderPlayers(world, dt);
  updateCamera(world, dt);

  ctx.save();
  const localState = world?.players?.[currentUser?.uid];
  const worldShake = localState?.hitTimer > 0 ? 3.5 * Math.min(1, localState.hitTimer / 0.12) : 0;
  if (worldShake > 0) ctx.translate((Math.random() - 0.5) * worldShake, (Math.random() - 0.5) * worldShake);
  applyWorldCamera();
  drawOuterForestFloor();
  drawGround();
  drawOuterForestTrees();
  drawFortifications();
  for (const point of world?.points || []) drawCapturePoint(point);
  for (const pickup of world?.pickups || []) drawPickup(pickup);
  const ordered = [...renderPlayers.entries()].sort((a, b) => a[1].y - b[1].y);
  for (const [uid, player] of ordered) drawPlayer(player, uid);
  const suppressLocalAuthoritativeBullets = !isHost && predictedBullets.length > 0;
  for (const bullet of world?.bullets || []) {
    if (suppressLocalAuthoritativeBullets && bullet.ownerUid === currentUser?.uid) continue;
    drawBullet(bullet);
  }
  for (const bullet of predictedBullets) drawBullet(bullet);
  for (const effect of world?.effects || []) drawCombatEffect(effect);
  for (const effect of predictedEffects) drawCombatEffect(effect);

  const local = renderPlayers.get(currentUser?.uid);
  if (local && !local.dead) drawAutoAimLock(world, local);
  ctx.restore();

  const vignette = ctx.createRadialGradient(480, 270, 190, 480, 270, 590);
  vignette.addColorStop(0, "rgba(8, 10, 8, 0)");
  vignette.addColorStop(1, mobileInputQuery.matches ? "rgba(8, 10, 8, 0.4)" : "rgba(8, 10, 8, 0.52)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  if (local && !local.dead) {
    const nearby = (world?.points || []).find((point) => Math.hypot(local.x - point.x, local.y - point.y) <= 58);
    if (nearby && nearby.owner !== local.team) {
      const promptY = mobileInputQuery.matches ? 380 : 480;
      ctx.fillStyle = "rgba(15, 18, 14, 0.88)";
      ctx.fillRect(350, promptY, 260, 32);
      ctx.fillStyle = "#ead8b4";
      ctx.font = "750 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(nearby.contested ? "TITIK DIPEREBUTKAN" : "TAHAN C / BENDERA UNTUK MENGUASAI TITIK", 480, promptY + 10);
    }
  }

  drawLocalActionProgress(world);
  drawMobilePlayerHud(world);
  drawMinimap(world);

  if (pointer.inside && !mobileInputQuery.matches) {
    const screenPointer = worldToScreen(pointer.x, pointer.y);
    ctx.strokeStyle = "rgba(239, 220, 178, 0.82)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(screenPointer.x, screenPointer.y, 7, 0, Math.PI * 2);
    ctx.moveTo(screenPointer.x - 12, screenPointer.y);
    ctx.lineTo(screenPointer.x - 4, screenPointer.y);
    ctx.moveTo(screenPointer.x + 4, screenPointer.y);
    ctx.lineTo(screenPointer.x + 12, screenPointer.y);
    ctx.moveTo(screenPointer.x, screenPointer.y - 12);
    ctx.lineTo(screenPointer.x, screenPointer.y - 4);
    ctx.moveTo(screenPointer.x, screenPointer.y + 4);
    ctx.lineTo(screenPointer.x, screenPointer.y + 12);
    ctx.stroke();
  }
}

function updateHud() {
  const world = isHost && authoritativeWorld ? authoritativeWorld : latestSnapshot;
  if (!world) return;
  const pejuangScore = Math.floor(world.scores?.pejuang || 0);
  const kolonialScore = Math.floor(world.scores?.kolonial || 0);
  const matchTime = formatTime(world.timeLeft);
  const matchState = world.overtime ? "BABAK TAMBAHAN" : world.totalControl?.team
    ? `KUASAI PENUH ${Math.max(0, Math.ceil(TOTAL_CONTROL_SECONDS - world.totalControl.seconds))}`
    : "PERTANDINGAN";
  ui.scorePejuang.textContent = pejuangScore;
  ui.stageScorePejuang.textContent = pejuangScore;
  ui.scoreKolonial.textContent = kolonialScore;
  ui.stageScoreKolonial.textContent = kolonialScore;
  ui.matchTimer.textContent = matchTime;
  ui.stageMatchTimer.textContent = matchTime;
  ui.matchState.textContent = matchState;
  ui.stageMatchState.textContent = matchState;
  const player = world.players?.[currentUser?.uid];
  if (!player) return;
  const displayAmmo = !isHost && predictedAmmo !== null ? predictedAmmo : player.ammo;
  const displayReload = player.reloadTimer > 0 || (!isHost && predictedReloadPending);
  ui.playerReadout.textContent = player.dead
    ? `Tumbang · respawn ${Math.max(0, Math.ceil(player.respawnTimer))} detik`
    : `HP ${Math.max(0, Math.ceil(player.hp))} · Peluru ${displayAmmo}/${player.reserve} · Perban ${player.bandages ?? 0}${displayReload ? " · mengisi..." : player.bandageTimer > 0 ? " · merawat..." : ""}`;
}

function render(dt) {
  ctx.save();
  drawWorld(dt);
  ctx.restore();
  updateHud();
}

function loop(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  elapsed += dt;
  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) ui.toast.classList.add("hidden");
  }
  if (screen === "game") {
    updateGame(dt);
    render(dt);
  }
  if (screen === "room") updateMatchmaking();
  requestAnimationFrame(loop);
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  const screenX = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
  const screenY = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
  const worldPoint = screenToWorld(screenX, screenY);
  pointer.x = worldPoint.x;
  pointer.y = worldPoint.y;
  pointer.inside = true;
}

function bindFloatingStick(elementId, knobId, onMove, onRelease) {
  const element = document.querySelector(elementId);
  const knob = document.querySelector(knobId);
  let activePointer = null;
  let centerX = 0;
  let centerY = 0;

  const place = (event) => {
    const bounds = ui.gameStage.getBoundingClientRect();
    const half = element.offsetWidth / 2;
    centerX = bounds.width <= half * 2
      ? bounds.left + bounds.width / 2
      : Math.max(bounds.left + half, Math.min(bounds.right - half, event.clientX));
    centerY = bounds.height <= half * 2
      ? bounds.top + bounds.height / 2
      : Math.max(bounds.top + half, Math.min(bounds.bottom - half, event.clientY));
    element.style.left = `${centerX}px`;
    element.style.top = `${centerY}px`;
  };

  const move = (event) => {
    if (event.pointerId !== activePointer) return;
    event.preventDefault();
    const max = element.offsetWidth * 0.32;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const length = Math.hypot(dx, dy);
    if (length > max) {
      dx = (dx / length) * max;
      dy = (dy / length) * max;
    }
    knob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    onMove(dx / max, dy / max);
  };

  const release = (event) => {
    if (event && activePointer !== null && event.pointerId !== activePointer) return;
    activePointer = null;
    knob.style.transform = "translate3d(0, 0, 0)";
    element.classList.remove("is-active");
    onRelease();
  };

  ui.gameStage.addEventListener("pointerdown", (event) => {
    if (!mobileInputQuery.matches || event.pointerType === "mouse" || activePointer !== null || screen !== "game") return;
    if (event.target.closest?.("button, .game-overlay")) return;
    event.preventDefault();
    activePointer = event.pointerId;
    place(event);
    element.classList.add("is-active");
    ui.gameStage.setPointerCapture?.(event.pointerId);
    move(event);
  });
  ui.gameStage.addEventListener("pointermove", move);
  ui.gameStage.addEventListener("pointerup", release);
  ui.gameStage.addEventListener("pointercancel", release);
  ui.gameStage.addEventListener("lostpointercapture", release);
  return release;
}

const resetMoveStick = bindFloatingStick(
  "#move-stick",
  "#move-knob",
  (x, y) => { touchMove.x = x; touchMove.y = y; },
  () => { touchMove.x = 0; touchMove.y = 0; },
);

canvas.addEventListener("pointermove", updatePointer);
canvas.addEventListener("pointerenter", updatePointer);
canvas.addEventListener("pointerleave", () => { pointer.inside = false; pointer.fire = false; });
canvas.addEventListener("pointerdown", (event) => {
  if (event.pointerType !== "mouse") {
    event.preventDefault();
    pointer.fire = false;
    return;
  }
  if (event.button !== 0) return;
  updatePointer(event);
  pointer.fire = true;
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener("pointerup", () => { pointer.fire = false; });
canvas.addEventListener("pointercancel", () => { pointer.fire = false; });

for (const eventName of ["contextmenu", "selectstart", "dragstart"]) {
  ui.gameStage.addEventListener(eventName, (event) => event.preventDefault());
}

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  keys[event.code] = true;
  if (event.repeat) return;
  if (event.code === "KeyE") meleeSeq += 1;
  if (event.code === "KeyF") bandageSeq += 1;
  if (event.code === "KeyR") reloadSeq += 1;
  if (event.code === "ShiftLeft" || event.code === "ShiftRight") dodgeSeq += 1;
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

window.addEventListener("blur", () => {
  for (const code of Object.keys(keys)) keys[code] = false;
  pointer.fire = false;
  touchActions.fire = false;
  touchActions.capture = false;
  resetMoveStick();
});

for (const button of document.querySelectorAll("[data-touch-action]")) {
  const action = button.dataset.touchAction;
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    if (action === "fire") touchActions.fire = true;
    if (action === "capture") touchActions.capture = true;
    if (action === "melee") meleeSeq += 1;
    if (action === "bandage") bandageSeq += 1;
    if (action === "reload") reloadSeq += 1;
    if (action === "dodge") dodgeSeq += 1;
  });
  const release = () => {
    if (action === "fire") touchActions.fire = false;
    if (action === "capture") touchActions.capture = false;
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
}

ui.fullscreenButton.addEventListener("click", () => toggleMobileFullscreen().catch(console.error));
const handleFullscreenChange = () => {
  if (!nativeFullscreenElement() && nativeFrameFullscreen) {
    nativeFrameFullscreen = false;
    ui.gameStage.classList.remove("frame-fullscreen");
    document.body.classList.remove("game-cinema-active");
    window.screen.orientation?.unlock?.();
  }
  updateFullscreenButton();
};
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

ui.autoMatch.addEventListener("click", () => autoMatch().catch(console.error));
ui.createRoom.addEventListener("click", createRoom);
ui.joinRoom.addEventListener("click", joinRoom);
ui.readyButton.addEventListener("click", () => toggleReady().catch(console.error));
ui.startMatch.addEventListener("click", () => startMatchWithBots().catch(console.error));
ui.leaveRoom.addEventListener("click", () => leaveRoom().catch(console.error));
ui.copyRoom.addEventListener("click", async () => {
  await navigator.clipboard?.writeText(currentRoom);
  showToast(`Kode ${currentRoom} disalin`);
});
ui.backToRoom.addEventListener("click", () => returnToLobby().catch(console.error));
ui.roomCodeInput.addEventListener("input", () => {
  ui.roomCodeInput.value = normalizeRoomCode(ui.roomCodeInput.value);
});
ui.roomCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") joinRoom();
});
ui.playerName.value = localStorage.getItem("sumpah-merdeka-player-name") || "";
ui.playerName.addEventListener("change", () => {
  localStorage.setItem("sumpah-merdeka-player-name", playerName());
});

const queryRoom = normalizeRoomCode(new URLSearchParams(location.search).get("room"));
if (queryRoom) ui.roomCodeInput.value = queryRoom;

loadAssets().catch(console.error);
bootstrapFirebase().catch(console.error);
requestAnimationFrame(loop);
