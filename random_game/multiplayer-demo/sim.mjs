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
      bandages: 2,
      moving: false,
      capture: false,
      dead: false,
      respawnTimer: 0,
      fireCooldown: 0,
      meleeCooldown: 0,
      reloadTimer: 0,
      bandageTimer: 0,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      invulnerable: 0,
      spawnShield: 2,
      handledReloadSeq: 0,
      handledMeleeSeq: 0,
      handledBandageSeq: 0,
      handledDodgeSeq: 0,
      botReloadSeq: 0,
      botMeleeSeq: 0,
      botBandageSeq: 0,
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
    bullets: [],
    bulletSeq: 0,
    pickups: [],
    pickupSeq: 0,
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
        meleeSeq: player.botMeleeSeq,
        bandageSeq: player.botBandageSeq,
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
    if (opponentDistance <= 42 && player.meleeCooldown <= 0) player.botMeleeSeq += 1;
    if (player.hp <= 45 && player.bandages > 0 && player.bandageTimer <= 0 && opponentDistance > 110) {
      player.botBandageSeq += 1;
    }
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
      meleeSeq: player.botMeleeSeq,
      bandageSeq: player.botBandageSeq,
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
  player.bandages = 2;
  player.dead = false;
  player.respawnTimer = 0;
  player.fireCooldown = 0;
  player.meleeCooldown = 0;
  player.reloadTimer = 0;
  player.bandageTimer = 0;
  player.dodgeTimer = 0;
  player.dodgeCooldown = 0;
  player.invulnerable = 0;
  player.spawnShield = 2;
  player.capture = false;
  player.aimX = player.team === TEAMS.PEJUANG ? 1 : -1;
  player.aimY = 0;
}

function startReload(player) {
  if (player.dead || player.reloadTimer > 0 || player.ammo >= 5 || player.reserve <= 0) return;
  player.reloadTimer = 1.05;
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

function segmentHitsWorld(x1, y1, x2, y2, radius = 2) {
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(distance / 4));
  for (let index = 1; index <= steps; index += 1) {
    const ratio = index / steps;
    if (collidesWorld(x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio, radius)) return true;
  }
  return false;
}

function fireWeapon(world, shooter) {
  if (shooter.ammo <= 0) return;

  shooter.ammo -= 1;
  shooter.fireCooldown = 0.28;
  world.bulletSeq += 1;
  world.bullets.push({
    id: world.bulletSeq,
    ownerUid: shooter.uid,
    team: shooter.team,
    x: shooter.x + shooter.aimX * 15,
    y: shooter.y - 12 + shooter.aimY * 15,
    vx: shooter.aimX * 360,
    vy: shooter.aimY * 360,
    damage: 26,
    life: 0.8,
    radius: 2.2,
  });
}

function dropPickup(world, player) {
  if (Math.random() >= 0.42) return;
  world.pickupSeq += 1;
  world.pickups.push({
    id: world.pickupSeq,
    type: Math.random() < 0.75 ? "ammo" : "bandage",
    x: player.x,
    y: player.y,
    life: 14,
  });
}

function damagePlayer(world, target, amount, attacker, knockX = 0, knockY = 0) {
  if (target.dead || target.spawnShield > 0 || target.invulnerable > 0) return false;
  target.hp = Math.max(0, target.hp - amount);
  if (knockX || knockY) moveActor(target, knockX, knockY);
  if (target.hp > 0) return true;

  target.dead = true;
  target.respawnTimer = 5;
  target.capture = false;
  target.reloadTimer = 0;
  target.bandageTimer = 0;
  target.deaths += 1;
  if (attacker) attacker.kills += 1;
  dropPickup(world, target);
  world.eventSeq += 1;
  world.lastEvent = `${attacker?.name || "Lawan"} melumpuhkan ${target.name}`;
  return true;
}

function meleePlayer(world, attacker) {
  attacker.meleeCooldown = 0.66;
  let hit = false;
  for (const target of Object.values(world.players)) {
    if (target.dead || target.team === attacker.team) continue;
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const distance = Math.hypot(dx, dy);
    const dot = distance > 0 ? (dx / distance) * attacker.aimX + (dy / distance) * attacker.aimY : 1;
    if (distance <= 42 && dot > -0.12) {
      hit = damagePlayer(world, target, 38, attacker, attacker.aimX * 9, attacker.aimY * 9) || hit;
    }
  }
  return hit;
}

function startBandage(player) {
  if (player.dead || player.bandageTimer > 0 || player.bandages <= 0 || player.hp >= 100) return;
  player.bandageTimer = 1.35;
}

function updateBullets(world, dt) {
  for (const bullet of world.bullets) {
    if (bullet.life <= 0) continue;
    const previousX = bullet.x;
    const previousY = bullet.y;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (
      bullet.x < 0
      || bullet.x > WORLD_WIDTH
      || bullet.y < 0
      || bullet.y > WORLD_HEIGHT
      || segmentHitsWorld(previousX, previousY, bullet.x, bullet.y, bullet.radius)
    ) {
      bullet.life = 0;
      continue;
    }

    for (const target of Object.values(world.players)) {
      if (target.dead || target.team === bullet.team) continue;
      if (Math.hypot(bullet.x - target.x, bullet.y - (target.y - 10)) <= PLAYER_RADIUS + bullet.radius + 3) {
        if (target.invulnerable > 0) continue;
        bullet.life = 0;
        const attacker = world.players[bullet.ownerUid];
        damagePlayer(world, target, bullet.damage, attacker, bullet.vx * 0.018, bullet.vy * 0.018);
        break;
      }
    }
  }
  world.bullets = world.bullets.filter((bullet) => bullet.life > 0);
}

function updatePickups(world, dt) {
  for (const pickup of world.pickups) {
    pickup.life -= dt;
    if (pickup.life <= 0) continue;
    const collector = Object.values(world.players).find(
      (player) => !player.dead && Math.hypot(player.x - pickup.x, player.y - pickup.y) < 22,
    );
    if (!collector) continue;
    if (pickup.type === "ammo") collector.reserve = Math.min(40, collector.reserve + 6);
    else collector.bandages = Math.min(3, collector.bandages + 1);
    pickup.life = 0;
  }
  world.pickups = world.pickups.filter((pickup) => pickup.life > 0);
}

function updatePlayers(world, inputs, dt) {
  for (const [uid, player] of Object.entries(world.players)) {
    const input = inputs?.[uid] || {};
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
    player.dodgeTimer = Math.max(0, player.dodgeTimer - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
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

    if (player.bandageTimer > 0) {
      player.bandageTimer -= dt;
      if (player.bandageTimer <= 0) {
        player.bandages -= 1;
        player.hp = Math.min(100, player.hp + 38);
      }
    }

    const reloadSeq = Number(input.reloadSeq) || 0;
    if (reloadSeq !== player.handledReloadSeq) {
      player.handledReloadSeq = reloadSeq;
      startReload(player);
    }

    const meleeSeq = Number(input.meleeSeq) || 0;
    if (meleeSeq !== player.handledMeleeSeq) {
      player.handledMeleeSeq = meleeSeq;
      if (player.meleeCooldown <= 0 && player.reloadTimer <= 0) meleePlayer(world, player);
    }

    const bandageSeq = Number(input.bandageSeq) || 0;
    if (bandageSeq !== player.handledBandageSeq) {
      player.handledBandageSeq = bandageSeq;
      startBandage(player);
    }

    const dodgeSeq = Number(input.dodgeSeq) || 0;
    if (dodgeSeq !== player.handledDodgeSeq) {
      player.handledDodgeSeq = dodgeSeq;
      const moveLength = Math.hypot(Number(input.mx) || 0, Number(input.my) || 0);
      if (moveLength > 0.1 && player.dodgeCooldown <= 0) {
        player.dodgeTimer = 0.24;
        player.dodgeCooldown = 2.1;
        player.invulnerable = 0.32;
      }
    }

    const move = normalize(Number(input.mx) || 0, Number(input.my) || 0, 0, 0);
    const rawMoveLength = clamp(Math.hypot(Number(input.mx) || 0, Number(input.my) || 0), 0, 1);
    const canMove = player.reloadTimer <= 0 && player.bandageTimer <= 0;
    player.moving = canMove && rawMoveLength > 0.04;
    if (player.moving) {
      const speed = player.dodgeTimer > 0 ? 235 : 128;
      moveActor(player, move.x * speed * rawMoveLength * dt, move.y * speed * rawMoveLength * dt);
    }

    const aimLength = Math.hypot(Number(input.ax) || 0, Number(input.ay) || 0);
    if (aimLength > 0.1) {
      const aim = normalize(Number(input.ax), Number(input.ay), player.aimX, player.aimY);
      player.aimX = aim.x;
      player.aimY = aim.y;
      player.direction = directionFromAim(aim.x, aim.y);
    }

    player.capture = Boolean(input.capture) && player.reloadTimer <= 0 && player.bandageTimer <= 0;
    if (input.fire && player.fireCooldown <= 0 && player.reloadTimer <= 0 && player.bandageTimer <= 0 && !player.capture) {
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
  updateBullets(world, safeDt);
  updatePickups(world, safeDt);
  updateCapturePoints(world, safeDt);
  updateScoreAndVictory(world, safeDt);
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
      bandages: player.bandages,
      moving: player.moving,
      capture: player.capture,
      dead: player.dead,
      respawnTimer: round(player.respawnTimer),
      reloadTimer: round(player.reloadTimer),
      bandageTimer: round(player.bandageTimer),
      meleeCooldown: round(player.meleeCooldown),
      dodgeTimer: round(player.dodgeTimer),
      dodgeCooldown: round(player.dodgeCooldown),
      invulnerable: round(player.invulnerable),
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
    bullets: world.bullets.map((bullet) => ({
      id: bullet.id,
      team: bullet.team,
      x: round(bullet.x),
      y: round(bullet.y),
      vx: round(bullet.vx),
      vy: round(bullet.vy),
      life: round(bullet.life, 2),
      radius: bullet.radius,
    })),
    pickups: world.pickups.map((pickup) => ({
      id: pickup.id,
      type: pickup.type,
      x: round(pickup.x),
      y: round(pickup.y),
      life: round(pickup.life, 2),
    })),
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
