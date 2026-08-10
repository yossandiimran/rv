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
  finishByForfeit,
  moveActor,
  stepWorld,
} from "./sim.mjs";

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
  playerReadout: document.querySelector("#player-readout"),
  toast: document.querySelector("#toast"),
};

const assetSources = {
  terrain: "assets/terrain.png",
  road: "assets/road.png",
  buildings: "assets/camp-structures.png",
  trees: "assets/trees.png",
  obstacles: "assets/obstacles.png",
  sutrisno: "assets/sutrisno.png",
  bima: "assets/bima.png",
  patrol: "assets/patrol.png",
  sergeant: "assets/sergeant.png",
};

const images = {};
const keys = Object.create(null);
const pointer = { x: 480, y: 270, inside: false, fire: false };
const touchMove = { x: 0, y: 0 };
const touchAim = { x: 1, y: 0, active: false };
const touchActions = { fire: false, capture: false };

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
let lastFrame = performance.now();
let elapsed = 0;
let lastEventSeq = -1;
let resultCommitted = false;
let matchStartPending = false;
let lastMatchmakingSecond = -1;
let toastTimer = 0;
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

function showScreen(next) {
  screen = next;
  ui.lobbyScreen.classList.toggle("hidden", next !== "lobby");
  ui.roomScreen.classList.toggle("hidden", next !== "room");
  ui.gameScreen.classList.toggle("hidden", next !== "game");
  if (next === "game") canvas.focus();
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
  renderPlayers.clear();
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
  ui.startMatch.classList.toggle("hidden", !isHost);

  if (roomMeta.status === "lobby") {
    if (previousRoomStatus === "finished") {
      ready = false;
      update(ref(db, roomPath(`members/${currentUser.uid}`)), { ready: false }).catch(console.error);
    }
    ui.resultOverlay.classList.add("hidden");
    showScreen("room");
  } else if (roomMeta.status === "starting") {
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
    matchmakingEndsAt: Date.now() + 10_000,
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

function currentAim() {
  if (touchAim.active || Math.hypot(touchAim.x, touchAim.y) > 0.1 && !pointer.inside) {
    return { x: touchAim.x, y: touchAim.y };
  }
  const player = predictedLocal || currentAuthoritativePlayer();
  if (pointer.inside && player) {
    const dx = pointer.x - player.x;
    const dy = pointer.y - player.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }
  const fallback = currentAuthoritativePlayer();
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

function sendInput(packet) {
  if (!currentRoom || roomMeta?.status !== "playing") return;
  inputsCache[currentUser.uid] = packet;
  set(ref(db, roomPath(`inputs/${currentUser.uid}`)), packet).catch((error) => {
    if (error?.code !== "PERMISSION_DENIED") console.error(error);
  });
}

function reconcileLocalPrediction(serverPlayer) {
  if (!serverPlayer) return;
  if (!predictedLocal || serverPlayer.dead) {
    predictedLocal = { x: serverPlayer.x, y: serverPlayer.y };
    return;
  }
  const distance = Math.hypot(serverPlayer.x - predictedLocal.x, serverPlayer.y - predictedLocal.y);
  if (distance > 65) {
    predictedLocal.x = serverPlayer.x;
    predictedLocal.y = serverPlayer.y;
  }
}

function updatePrediction(dt, packet) {
  if (isHost) return;
  const serverPlayer = latestSnapshot?.players?.[currentUser?.uid];
  if (!serverPlayer) return;
  if (!predictedLocal) predictedLocal = { x: serverPlayer.x, y: serverPlayer.y };
  const correction = Math.min(1, dt * 5.5);
  predictedLocal.x += (serverPlayer.x - predictedLocal.x) * correction;
  predictedLocal.y += (serverPlayer.y - predictedLocal.y) * correction;
  if (serverPlayer.dead || serverPlayer.reloadTimer > 0 || serverPlayer.bandageTimer > 0) return;
  const moveLength = Math.min(1, Math.hypot(packet.mx, packet.my));
  if (moveLength <= 0.03) return;
  const speed = serverPlayer.dodgeTimer > 0 ? 235 : 128;
  moveActor(predictedLocal, packet.mx * speed * dt, packet.my * speed * dt);
}

function hostStep(dt, packet) {
  if (!isHost || !authoritativeWorld || roomMeta?.status !== "playing") return;
  Object.assign(inputsCache, createBotInputs(authoritativeWorld));
  inputsCache[currentUser.uid] = packet;
  stepWorld(authoritativeWorld, inputsCache, dt);
  snapshotAccumulator += dt;
  if (snapshotAccumulator >= 0.1) {
    snapshotAccumulator %= 0.1;
    const snapshot = createSnapshot(authoritativeWorld);
    latestSnapshot = snapshot;
    set(ref(db, roomPath("state/snapshot")), snapshot).catch(console.error);
  }

  if (authoritativeWorld.result && !resultCommitted) {
    resultCommitted = true;
    const finalSnapshot = createSnapshot(authoritativeWorld);
    latestSnapshot = finalSnapshot;
    set(ref(db, roomPath("state/snapshot")), finalSnapshot)
      .then(() => update(ref(db, roomPath("meta")), {
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
  if (inputAccumulator >= 1 / 15) {
    inputAccumulator %= 1 / 15;
    sendInput(packet);
  }
  hostStep(dt, packet);
  updatePrediction(dt, packet);
}

function drawAtlasCell(image, columns, rows, column, row, x, y, width, height, alpha = 1) {
  if (!image) return false;
  const sourceWidth = image.width / columns;
  const sourceHeight = image.height / rows;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, column * sourceWidth, row * sourceHeight, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
  return true;
}

function drawGround() {
  ctx.fillStyle = "#4c543b";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  for (let y = 0; y < WORLD_HEIGHT; y += 32) {
    for (let x = 0; x < WORLD_WIDTH; x += 32) {
      if (!drawAtlasCell(images.terrain, 4, 4, 2, 0, x, y, 32, 32)) {
        ctx.fillStyle = (x / 32 + y / 32) % 2 ? "#50593d" : "#4a5339";
        ctx.fillRect(x, y, 32, 32);
      }
    }
  }

  for (let x = 0; x < WORLD_WIDTH; x += 32) {
    drawAtlasCell(images.road, 4, 4, 1, 0, x, 240, 32, 32, 0.85);
    drawAtlasCell(images.road, 4, 4, 1, 0, x, 272, 32, 32, 0.85);
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 32) {
    drawAtlasCell(images.road, 4, 4, 1, 0, 448, y, 32, 32, 0.7);
    drawAtlasCell(images.road, 4, 4, 1, 0, 480, y, 32, 32, 0.7);
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
  drawAtlasCell(images.buildings, 3, 2, 1, 0, 386, 154, 190, 143);
  drawAtlasCell(images.trees, 4, 3, 3, 0, -25, -20, 128, 128);
  drawAtlasCell(images.trees, 4, 3, 0, 0, 856, -18, 128, 128);
  drawAtlasCell(images.trees, 4, 3, 2, 2, -18, 425, 125, 125);
  drawAtlasCell(images.trees, 4, 3, 1, 1, 858, 425, 125, 125);

  for (let index = 0; index < STATIC_RECTS.length; index += 1) {
    const rect = STATIC_RECTS[index];
    if (index === 0) continue;
    ctx.fillStyle = "rgba(52, 47, 37, 0.84)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "rgba(218, 198, 156, 0.28)";
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
    for (let x = rect.x + 8; x < rect.x + rect.w - 8; x += 26) {
      drawAtlasCell(images.obstacles, 4, 4, 1 + (index % 2), 0, x, rect.y - 6, 34, 34, 0.9);
    }
  }

  ctx.fillStyle = "rgba(151, 55, 43, 0.18)";
  ctx.fillRect(18, 190, 72, 160);
  ctx.strokeStyle = "rgba(215, 89, 69, 0.5)";
  ctx.strokeRect(18.5, 190.5, 71, 159);
  ctx.fillStyle = "rgba(52, 81, 108, 0.22)";
  ctx.fillRect(870, 190, 72, 160);
  ctx.strokeStyle = "rgba(86, 127, 163, 0.55)";
  ctx.strokeRect(870.5, 190.5, 71, 159);
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
  ctx.beginPath();
  ctx.moveTo(1, -28);
  ctx.lineTo(25, -20);
  ctx.lineTo(1, -11);
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
  for (const [uid, player] of Object.entries(world?.players || {})) {
    let display = renderPlayers.get(uid);
    if (!display) {
      display = { ...player, x: player.x, y: player.y };
      renderPlayers.set(uid, display);
    }
    Object.assign(display, player, { targetX: player.x, targetY: player.y });
    const blend = isHost ? 1 : Math.min(1, dt * 12);
    display.x += (display.targetX - display.x) * blend;
    display.y += (display.targetY - display.y) * blend;
    if (uid === currentUser?.uid && !isHost && predictedLocal && !player.dead) {
      display.x = predictedLocal.x;
      display.y = predictedLocal.y;
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
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = pickup.type === "ammo" ? "#d3aa61" : "#d8d0af";
  ctx.lineWidth = 2;
  if (pickup.type === "ammo") {
    ctx.strokeRect(-4, -6, 8, 12);
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.lineTo(4, -2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-5, -4);
    ctx.lineTo(5, 4);
    ctx.moveTo(5, -4);
    ctx.lineTo(-5, 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBullet(bullet) {
  const length = Math.hypot(bullet.vx, bullet.vy) || 1;
  const trailX = (bullet.vx / length) * 10;
  const trailY = (bullet.vy / length) * 10;
  ctx.strokeStyle = bullet.team === TEAMS.PEJUANG ? "rgba(244, 202, 112, 0.9)" : "rgba(226, 135, 85, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bullet.x - trailX, bullet.y - trailY);
  ctx.lineTo(bullet.x, bullet.y);
  ctx.stroke();
  ctx.fillStyle = "#f5ddb0";
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius || 2.2, 0, Math.PI * 2);
  ctx.fill();
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
  if (sprite) {
    const frame = player.moving ? Math.floor((elapsed + player.x * 0.002) * 9) % 4 : 0;
    drawAtlasCell(sprite, 4, 4, frame, player.direction, player.x - 22, player.y - 58, 44, 66);
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

function drawWorld(dt) {
  const world = isHost && authoritativeWorld ? authoritativeWorld : latestSnapshot;
  drawGround();
  for (const point of world?.points || []) drawCapturePoint(point);
  drawFortifications();
  for (const pickup of world?.pickups || []) drawPickup(pickup);
  updateRenderPlayers(world, dt);
  const ordered = [...renderPlayers.entries()].sort((a, b) => a[1].y - b[1].y);
  for (const [uid, player] of ordered) drawPlayer(player, uid);

  for (const bullet of world?.bullets || []) drawBullet(bullet);

  const local = renderPlayers.get(currentUser?.uid);
  if (local && !local.dead) {
    const nearby = (world?.points || []).find((point) => Math.hypot(local.x - point.x, local.y - point.y) <= 58);
    if (nearby && nearby.owner !== local.team) {
      ctx.fillStyle = "rgba(15, 18, 14, 0.88)";
      ctx.fillRect(350, 480, 260, 32);
      ctx.fillStyle = "#ead8b4";
      ctx.font = "750 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(nearby.contested ? "TITIK DIPEREBUTKAN" : "TAHAN C / BENDERA UNTUK MENGUASAI TITIK", 480, 490);
    }
  }

  const vignette = ctx.createRadialGradient(480, 270, 190, 480, 270, 590);
  vignette.addColorStop(0, "rgba(8, 10, 8, 0)");
  vignette.addColorStop(1, "rgba(8, 10, 8, 0.52)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function updateHud() {
  const world = isHost && authoritativeWorld ? authoritativeWorld : latestSnapshot;
  if (!world) return;
  ui.scorePejuang.textContent = Math.floor(world.scores?.pejuang || 0);
  ui.scoreKolonial.textContent = Math.floor(world.scores?.kolonial || 0);
  ui.matchTimer.textContent = formatTime(world.timeLeft);
  ui.matchState.textContent = world.overtime ? "BABAK TAMBAHAN" : world.totalControl?.team
    ? `KUASAI PENUH ${Math.max(0, Math.ceil(TOTAL_CONTROL_SECONDS - world.totalControl.seconds))}`
    : "PERTANDINGAN";
  const player = world.players?.[currentUser?.uid];
  if (!player) return;
  ui.playerReadout.textContent = player.dead
    ? `Tumbang · respawn ${Math.max(0, Math.ceil(player.respawnTimer))} detik`
    : `HP ${Math.max(0, Math.ceil(player.hp))} · Peluru ${player.ammo}/${player.reserve} · Perban ${player.bandages ?? 0}${player.reloadTimer > 0 ? " · mengisi..." : player.bandageTimer > 0 ? " · merawat..." : ""}`;
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
  pointer.x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
  pointer.y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
  pointer.inside = true;
}

function bindStick(elementId, knobId, onMove, onRelease) {
  const element = document.querySelector(elementId);
  const knob = document.querySelector(knobId);
  let activePointer = null;

  const move = (event) => {
    if (event.pointerId !== activePointer) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = rect.width * 0.3;
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
    onRelease();
  };

  element.addEventListener("pointerdown", (event) => {
    if (activePointer !== null) return;
    activePointer = event.pointerId;
    element.setPointerCapture?.(event.pointerId);
    move(event);
  });
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener("lostpointercapture", release);
  return release;
}

const resetMoveStick = bindStick(
  "#move-stick",
  "#move-knob",
  (x, y) => { touchMove.x = x; touchMove.y = y; },
  () => { touchMove.x = 0; touchMove.y = 0; },
);

const resetAimStick = bindStick(
  "#aim-stick",
  "#aim-knob",
  (x, y) => {
    const length = Math.hypot(x, y);
    if (length > 0.12) {
      touchAim.x = x / length;
      touchAim.y = y / length;
      touchAim.active = true;
    }
  },
  () => { touchAim.active = false; },
);

canvas.addEventListener("pointermove", updatePointer);
canvas.addEventListener("pointerenter", updatePointer);
canvas.addEventListener("pointerleave", () => { pointer.inside = false; pointer.fire = false; });
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  updatePointer(event);
  pointer.fire = true;
  canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener("pointerup", () => { pointer.fire = false; });
canvas.addEventListener("pointercancel", () => { pointer.fire = false; });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

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
  resetAimStick();
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
