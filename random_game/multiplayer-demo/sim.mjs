export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 540;
export const MATCH_DURATION = 7 * 60;
export const WINNING_SCORE = 200;
export const CAPTURE_SECONDS = 4;
export const TOTAL_CONTROL_SECONDS = 12;
export const PLAYER_RADIUS = 12;
export const TEAMS = Object.freeze({
  PEJUANG: "pejuang",
  KOLONIAL: "kolonial",
});

export const STATIC_RECTS = Object.freeze([
  { x: 418, y: 194, w: 124, h: 152 },
  { x: 270, y: 76, w: 92, h: 52 },
  { x: 598, y: 412, w: 92, h: 52 },
  { x: 598, y: 76, w: 92, h: 52 },
  { x: 270, y: 412, w: 92, h: 52 },
  { x: 102, y: 247, w: 126, h: 45 },
  { x: 732, y: 247, w: 126, h: 45 },
]);

const POINT_TEMPLATES = Object.freeze([
  { id: "A", x: 166, y: 132, owner: TEAMS.PEJUANG, label: "Kampung Barat" },
  { id: "B", x: 166, y: 408, owner: TEAMS.PEJUANG, label: "Sawah Selatan" },
  { id: "C", x: 380, y: 176, owner: null, label: "Pos Utara" },
  { id: "D", x: 580, y: 364, owner: null, label: "Jembatan" },
  { id: "E", x: 794, y: 132, owner: TEAMS.KOLONIAL, label: "Gudang Timur" },
  { id: "F", x: 794, y: 408, owner: TEAMS.KOLONIAL, label: "Barak Selatan" },
]);

const SPAWNS = Object.freeze({
  pejuang: [
    { x: 58, y: 232 },
    { x: 58, y: 308 },
  ],
  kolonial: [
    { x: 902, y: 232 },
    { x: 902, y: 308 },
  ],
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function normalize(x, y, fallbackX = 1, fallbackY = 0) {
  const length = Math.hypot(x, y);
  if (!length) return { x: fallbackX, y: fallbackY };
  return { x: x / length, y: y / length };
}

function safeName(value) {
  const name = String(value || "Pemain").replace(/[<>]/g, "").trim().slice(0, 16);
  return name || "Pemain";
}

function spawnFor(team, slot) {
  return SPAWNS[team]?.[Number(slot) || 0] || SPAWNS.pejuang[0];
}

export function collidesWorld(x, y, radius = PLAYER_RADIUS) {
  if (x - radius < 18 || x + radius > WORLD_WIDTH - 18 || y - radius < 22 || y + radius > WORLD_HEIGHT - 18) {
    return true;
  }
  for (const rect of STATIC_RECTS) {
    const nearestX = clamp(x, rect.x, rect.x + rect.w);
    const nearestY = clamp(y, rect.y, rect.y + rect.h);
    if ((x - nearestX) ** 2 + (y - nearestY) ** 2 < radius ** 2) return true;
  }
  return false;
}

export function moveActor(actor, dx, dy) {
  const oldX = actor.x;
  actor.x += dx;
  if (collidesWorld(actor.x, actor.y, PLAYER_RADIUS)) actor.x = oldX;
  const oldY = actor.y;
  actor.y += dy;
  if (collidesWorld(actor.x, actor.y, PLAYER_RADIUS)) actor.y = oldY;
}

export function createWorld(members, startedAt = Date.now()) {
  const players = {};
  for (const [uid, member] of Object.entries(members || {})) {
    const team = member.team === TEAMS.KOLONIAL ? TEAMS.KOLONIAL : TEAMS.PEJUANG;
    const slot = Number(member.slot) === 1 ? 1 : 0;
    const spawn = spawnFor(team, slot);
    players[uid] = {
      uid,
      name: safeName(member.name),
      team,
      slot,
      isBot: Boolean(member.isBot),
      x: spawn.x,
      y: spawn.y,
      aimX: team === TEAMS.PEJUANG ? 1 : -1,
      aimY: 0,
      direction: team === TEAMS.PEJUANG ? 2 : 1,
      hp: 100,
      ammo: 5,
      reserve: 25,
      moving: false,
      capture: false,
      dead: false,
      respawnTimer: 0,
      fireCooldown: 0,
      reloadTimer: 0,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      spawnShield: 2,
      handledReloadSeq: 0,
      handledDodgeSeq: 0,
      botReloadSeq: 0,
      botDodgeSeq: 0,
      kills: 0,
      deaths: 0,
    };
  }

  return {
    version: 1,
    status: "playing",
    startedAt,
    tick: 0,
    timeLeft: MATCH_DURATION,
    scores: { pejuang: 0, kolonial: 0 },
    scoreCarry: { pejuang: 0, kolonial: 0 },
    players,
    points: POINT_TEMPLATES.map((point) => ({
      ...point,
      capturing: null,
      progress: 0,
      contested: false,
    })),
    tracers: [],
    tracerSeq: 0,
    eventSeq: 0,
    lastEvent: "Pertandingan dimulai · rebut enam titik bendera!",
    totalControl: { team: null, seconds: 0 },
    overtime: false,
    result: null,
  };
}

function botTargetPoint(world, player) {
  const candidates = world.points.filter((point) => point.owner !== player.team);
  const pool = candidates.length ? candidates : world.points;
  let target = pool[0];
  let bestScore = Infinity;
  for (let index = 0; index < pool.length; index += 1) {
    const point = pool[index];
    let score = Math.hypot(point.x - player.x, point.y - player.y);
    if (point.contested) score -= 85;
    if (point.capturing && point.capturing !== player.team) score -= 55;
    if (index % 2 === player.slot) score -= 20;
    if (score < bestScore) {
      bestScore = score;
      target = point;
    }
  }
  return target;
}

function steerBot(player, x, y) {
  const desired = normalize(x, y, 0, 0);
  if (!collidesWorld(player.x + desired.x * 32, player.y + desired.y * 32, PLAYER_RADIUS)) return desired;
  const turn = (player.slot === 0 ? 1 : -1) * (player.team === TEAMS.PEJUANG ? 1 : -1);
  const first = { x: -desired.y * turn, y: desired.x * turn };
  if (!collidesWorld(player.x + first.x * 32, player.y + first.y * 32, PLAYER_RADIUS)) return first;
  return { x: desired.y * turn, y: -desired.x * turn };
}

export function createBotInputs(world) {
  const botInputs = {};
  if (!world || world.result) return botInputs;

  for (const [uid, player] of Object.entries(world.players)) {
    if (!player.isBot) continue;
    if (player.dead) {
      botInputs[uid] = {
        mx: 0,
        my: 0,
        ax: player.aimX,
        ay: player.aimY,
        fire: false,
        capture: false,
        reloadSeq: player.botReloadSeq,
        dodgeSeq: player.botDodgeSeq,
        seq: world.tick,
      };
      continue;
    }

    const targetPoint = botTargetPoint(world, player);
    const pointDistance = Math.hypot(targetPoint.x - player.x, targetPoint.y - player.y);
    let movement = pointDistance > 45
      ? steerBot(player, targetPoint.x - player.x, targetPoint.y - player.y)
      : { x: 0, y: 0 };
    const opponents = Object.values(world.players)
      .filter((candidate) => !candidate.dead && candidate.team !== player.team)
      .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
    const opponent = opponents[0];
    const opponentDistance = opponent ? Math.hypot(opponent.x - player.x, opponent.y - player.y) : Infinity;
    let aim = normalize(targetPoint.x - player.x, targetPoint.y - player.y, player.aimX, player.aimY);

    if (opponent && opponentDistance <= 255) {
      aim = normalize(opponent.x - player.x, opponent.y - player.y, player.aimX, player.aimY);
      if (opponentDistance < 72 && pointDistance > 45) movement = steerBot(player, player.x - opponent.x, player.y - opponent.y);
    }

    if (player.ammo <= 0 && player.reloadTimer <= 0) player.botReloadSeq += 1;
    if (opponentDistance < 190 && player.dodgeCooldown <= 0 && world.tick % (67 + player.slot * 11) === 0) {
      player.botDodgeSeq += 1;
    }

    botInputs[uid] = {
      mx: round(movement.x, 2),
      my: round(movement.y, 2),
      ax: round(aim.x, 2),
      ay: round(aim.y, 2),
      fire: Boolean(opponent && opponentDistance <= 230 && pointDistance > 47),
      capture: pointDistance <= 53 && targetPoint.owner !== player.team,
      reloadSeq: player.botReloadSeq,
      dodgeSeq: player.botDodgeSeq,
      seq: world.tick,
    };
  }
  return botInputs;
}

function respawnPlayer(player) {
  const spawn = spawnFor(player.team, player.slot);
  player.x = spawn.x;
  player.y = spawn.y;
  player.hp = 100;
  player.ammo = 5;
  player.reserve = 25;
  player.dead = false;
  player.respawnTimer = 0;
  player.reloadTimer = 0;
  player.dodgeTimer = 0;
  player.spawnShield = 2;
  player.aimX = player.team === TEAMS.PEJUANG ? 1 : -1;
  player.aimY = 0;
}

function startReload(player) {
  if (player.dead || player.reloadTimer > 0 || player.ammo >= 5 || player.reserve <= 0) return;
  player.reloadTimer = 1.25;
}

function finishReload(player) {
  const needed = 5 - player.ammo;
  const loaded = Math.min(needed, player.reserve);
  player.ammo += loaded;
  player.reserve -= loaded;
}

function directionFromAim(x, y) {
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? 1 : 2;
  return y < 0 ? 3 : 0;
}

function raycastWorld(x, y, aimX, aimY, maxRange = 245) {
  for (let distance = 5; distance <= maxRange; distance += 5) {
    const testX = x + aimX * distance;
    const testY = y + aimY * distance;
    if (collidesWorld(testX, testY, 2)) return Math.max(0, distance - 5);
  }
  return maxRange;
}

function fireWeapon(world, shooter) {
  if (shooter.ammo <= 0) {
    startReload(shooter);
    return;
  }

  shooter.ammo -= 1;
  shooter.fireCooldown = 0.46;
  const startX = shooter.x + shooter.aimX * 13;
  const startY = shooter.y - 9 + shooter.aimY * 13;
  const wallDistance = raycastWorld(startX, startY, shooter.aimX, shooter.aimY);
  let hitTarget = null;
  let hitDistance = wallDistance;

  for (const target of Object.values(world.players)) {
    if (target.dead || target.team === shooter.team) continue;
    const relativeX = target.x - startX;
    const relativeY = (target.y - 9) - startY;
    const projection = relativeX * shooter.aimX + relativeY * shooter.aimY;
    if (projection <= 0 || projection >= hitDistance) continue;
    const perpendicular = Math.abs(relativeX * shooter.aimY - relativeY * shooter.aimX);
    if (perpendicular <= PLAYER_RADIUS + 4) {
      hitTarget = target;
      hitDistance = projection;
    }
  }

  const endX = startX + shooter.aimX * hitDistance;
  const endY = startY + shooter.aimY * hitDistance;
  world.tracerSeq += 1;
  world.tracers.push({
    id: world.tracerSeq,
    x1: startX,
    y1: startY,
    x2: endX,
    y2: endY,
    team: shooter.team,
    ttl: 0.14,
  });

  if (!hitTarget || hitTarget.spawnShield > 0 || hitTarget.dodgeTimer > 0) return;
  hitTarget.hp = Math.max(0, hitTarget.hp - 28);
  if (hitTarget.hp > 0) return;

  hitTarget.dead = true;
  hitTarget.respawnTimer = 5;
  hitTarget.capture = false;
  hitTarget.deaths += 1;
  shooter.kills += 1;
  world.eventSeq += 1;
  world.lastEvent = `${shooter.name} melumpuhkan ${hitTarget.name}`;
}

function updatePlayers(world, inputs, dt) {
  for (const [uid, player] of Object.entries(world.players)) {
    const input = inputs?.[uid] || {};
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
    player.dodgeTimer = Math.max(0, player.dodgeTimer - dt);
    player.spawnShield = Math.max(0, player.spawnShield - dt);

    if (player.dead) {
      player.respawnTimer -= dt;
      player.moving = false;
      player.capture = false;
      if (player.respawnTimer <= 0) respawnPlayer(player);
      continue;
    }

    if (player.reloadTimer > 0) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) finishReload(player);
    }

    const reloadSeq = Number(input.reloadSeq) || 0;
    if (reloadSeq !== player.handledReloadSeq) {
      player.handledReloadSeq = reloadSeq;
      startReload(player);
    }

    const dodgeSeq = Number(input.dodgeSeq) || 0;
    if (dodgeSeq !== player.handledDodgeSeq) {
      player.handledDodgeSeq = dodgeSeq;
      const moveLength = Math.hypot(Number(input.mx) || 0, Number(input.my) || 0);
      if (moveLength > 0.1 && player.dodgeCooldown <= 0) {
        player.dodgeTimer = 0.23;
        player.dodgeCooldown = 2.1;
      }
    }

    const move = normalize(Number(input.mx) || 0, Number(input.my) || 0, 0, 0);
    const rawMoveLength = clamp(Math.hypot(Number(input.mx) || 0, Number(input.my) || 0), 0, 1);
    const canMove = player.reloadTimer <= 0;
    player.moving = canMove && rawMoveLength > 0.04;
    if (player.moving) {
      const speed = player.dodgeTimer > 0 ? 260 : 128;
      moveActor(player, move.x * speed * rawMoveLength * dt, move.y * speed * rawMoveLength * dt);
    }

    const aimLength = Math.hypot(Number(input.ax) || 0, Number(input.ay) || 0);
    if (aimLength > 0.1) {
      const aim = normalize(Number(input.ax), Number(input.ay), player.aimX, player.aimY);
      player.aimX = aim.x;
      player.aimY = aim.y;
      player.direction = directionFromAim(aim.x, aim.y);
    }

    player.capture = Boolean(input.capture) && player.reloadTimer <= 0;
    if (input.fire && player.fireCooldown <= 0 && player.reloadTimer <= 0 && !player.capture) {
      fireWeapon(world, player);
    }
  }
}

function completeCapture(world, point, team) {
  if (point.owner === null) {
    point.owner = team;
    point.capturing = null;
    point.progress = 0;
    world.lastEvent = `${team === TEAMS.PEJUANG ? "Pejuang" : "Kolonial"} menegakkan bendera di titik ${point.id}`;
  } else {
    point.owner = null;
    point.capturing = team;
    point.progress = 0;
    world.lastEvent = `Titik ${point.id} telah dinetralkan`;
  }
  world.eventSeq += 1;
}

function updateCapturePoints(world, dt) {
  for (const point of world.points) {
    const nearby = Object.values(world.players).filter(
      (player) => !player.dead && player.capture && Math.hypot(player.x - point.x, player.y - point.y) <= 53,
    );
    const pejuang = nearby.filter((player) => player.team === TEAMS.PEJUANG);
    const kolonial = nearby.filter((player) => player.team === TEAMS.KOLONIAL);
    point.contested = pejuang.length > 0 && kolonial.length > 0;

    if (point.contested) continue;
    const activeTeam = pejuang.length ? TEAMS.PEJUANG : kolonial.length ? TEAMS.KOLONIAL : null;
    const activeCount = activeTeam === TEAMS.PEJUANG ? pejuang.length : kolonial.length;

    if (!activeTeam || point.owner === activeTeam) {
      point.progress = Math.max(0, point.progress - dt * 0.55);
      if (point.progress === 0) point.capturing = null;
      continue;
    }

    if (point.capturing !== activeTeam) {
      point.capturing = activeTeam;
      point.progress = 0;
    }
    const speedMultiplier = 1 + Math.max(0, activeCount - 1) * 0.5;
    point.progress += dt * speedMultiplier;
    if (point.progress >= CAPTURE_SECONDS) completeCapture(world, point, activeTeam);
  }
}

function finishWorld(world, winner, reason) {
  if (world.result) return;
  world.status = "finished";
  world.result = {
    winner,
    reason,
    scorePejuang: Math.floor(world.scores.pejuang),
    scoreKolonial: Math.floor(world.scores.kolonial),
  };
  world.eventSeq += 1;
  world.lastEvent = reason;
}

export function finishByForfeit(world, missingUid) {
  if (!world || world.result) return;
  const missingPlayer = world.players?.[missingUid];
  if (!missingPlayer) return;
  const winner = missingPlayer.team === TEAMS.PEJUANG ? TEAMS.KOLONIAL : TEAMS.PEJUANG;
  finishWorld(world, winner, `${missingPlayer.name} terputus dari pertandingan`);
}

function updateScoreAndVictory(world, dt) {
  const owned = {
    pejuang: world.points.filter((point) => point.owner === TEAMS.PEJUANG).length,
    kolonial: world.points.filter((point) => point.owner === TEAMS.KOLONIAL).length,
  };

  for (const team of [TEAMS.PEJUANG, TEAMS.KOLONIAL]) {
    world.scoreCarry[team] += (owned[team] * dt) / 5;
    if (world.scoreCarry[team] >= 1) {
      const wholePoints = Math.floor(world.scoreCarry[team]);
      world.scores[team] += wholePoints;
      world.scoreCarry[team] -= wholePoints;
    }
  }

  const fullOwner = owned.pejuang === 6 ? TEAMS.PEJUANG : owned.kolonial === 6 ? TEAMS.KOLONIAL : null;
  if (fullOwner) {
    if (world.totalControl.team !== fullOwner) world.totalControl = { team: fullOwner, seconds: 0 };
    world.totalControl.seconds += dt;
    if (world.totalControl.seconds >= TOTAL_CONTROL_SECONDS) {
      finishWorld(world, fullOwner, "Seluruh benteng dikuasai selama 12 detik");
      return;
    }
  } else {
    world.totalControl = { team: null, seconds: 0 };
  }

  if (world.scores.pejuang >= WINNING_SCORE || world.scores.kolonial >= WINNING_SCORE) {
    const winner = world.scores.pejuang >= world.scores.kolonial ? TEAMS.PEJUANG : TEAMS.KOLONIAL;
    finishWorld(world, winner, "Mencapai 200 poin pertahanan");
    return;
  }

  if (!world.overtime) world.timeLeft = Math.max(0, world.timeLeft - dt);
  if (world.timeLeft > 0) return;

  if (world.scores.pejuang !== world.scores.kolonial) {
    const winner = world.scores.pejuang > world.scores.kolonial ? TEAMS.PEJUANG : TEAMS.KOLONIAL;
    finishWorld(world, winner, "Unggul saat waktu pertandingan berakhir");
    return;
  }

  world.overtime = true;
  if (owned.pejuang !== owned.kolonial) {
    const winner = owned.pejuang > owned.kolonial ? TEAMS.PEJUANG : TEAMS.KOLONIAL;
    finishWorld(world, winner, "Menguasai mayoritas titik pada babak tambahan");
  }
}

export function stepWorld(world, inputs, dt) {
  if (!world || world.result || world.status !== "playing") return world;
  const safeDt = clamp(Number(dt) || 0, 0, 0.05);
  world.tick += 1;
  updatePlayers(world, inputs, safeDt);
  updateCapturePoints(world, safeDt);
  updateScoreAndVictory(world, safeDt);
  for (const tracer of world.tracers) tracer.ttl -= safeDt;
  world.tracers = world.tracers.filter((tracer) => tracer.ttl > 0);
  return world;
}

export function createSnapshot(world) {
  const players = {};
  for (const [uid, player] of Object.entries(world.players)) {
    players[uid] = {
      uid,
      name: player.name,
      team: player.team,
      slot: player.slot,
      isBot: player.isBot,
      x: round(player.x),
      y: round(player.y),
      aimX: round(player.aimX, 2),
      aimY: round(player.aimY, 2),
      direction: player.direction,
      hp: player.hp,
      ammo: player.ammo,
      reserve: player.reserve,
      moving: player.moving,
      capture: player.capture,
      dead: player.dead,
      respawnTimer: round(player.respawnTimer),
      reloadTimer: round(player.reloadTimer),
      dodgeTimer: round(player.dodgeTimer),
      spawnShield: round(player.spawnShield),
      kills: player.kills,
      deaths: player.deaths,
    };
  }

  return {
    version: world.version,
    status: world.status,
    startedAt: world.startedAt,
    tick: world.tick,
    timeLeft: round(world.timeLeft, 2),
    scores: {
      pejuang: Math.floor(world.scores.pejuang),
      kolonial: Math.floor(world.scores.kolonial),
    },
    players,
    points: world.points.map((point) => ({
      id: point.id,
      x: point.x,
      y: point.y,
      label: point.label,
      owner: point.owner,
      capturing: point.capturing,
      progress: round(point.progress, 2),
      contested: point.contested,
    })),
    tracers: world.tracers.map((tracer) => ({ ...tracer, ttl: round(tracer.ttl, 2) })),
    totalControl: {
      team: world.totalControl.team,
      seconds: round(world.totalControl.seconds, 2),
    },
    overtime: world.overtime,
    result: world.result,
    eventSeq: world.eventSeq,
    lastEvent: world.lastEvent,
  };
}
