(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const loadingPanel = document.querySelector("#loading");
  const introPanel = document.querySelector("#intro");
  const resultPanel = document.querySelector("#result");
  const pausePanel = document.querySelector("#pause");
  const startButton = document.querySelector("#start-button");
  const restartButton = document.querySelector("#restart-button");
  const resultKicker = document.querySelector("#result-kicker");
  const resultTitle = document.querySelector("#result-title");
  const resultCopy = document.querySelector("#result-copy");

  const WORLD_W = 640;
  const WORLD_H = 360;
  const TAU = Math.PI * 2;
  const keys = Object.create(null);
  const touchMove = { x: 0, y: 0 };
  const touchAction = { fire: false };
  const pointer = { x: 420, y: 180, inside: false };

  ctx.imageSmoothingEnabled = false;

  const imageSources = {
    terrain: "assets/tilesets/terrain-atlas-32-v2.png",
    road: "assets/tilesets/dirt-road-autotile-32-v1.png",
    river: "assets/tilesets/riverbank-autotile-32-v1.png",
    buildings: "assets/environment/buildings/village-buildings-256x192-v1.png",
    trees: "assets/environment/vegetation/trees-large-192-v1.png",
    obstacles: "assets/environment/vegetation/natural-obstacles-128-v1.png",
    bridge: "assets/environment/bridges/river-crossings-256x128-v1.png",
    decals: "assets/environment/decals/ground-decals-64-v1.png",
    vfx: "assets/effects/environment-vfx-64-v1.png",
    playerWalk: "assets/characters/variants/sutrisno-armed-walk-32x48-v1.png",
    playerAction: "assets/characters/variants/sutrisno-combat-actions-48-v1.png",
    enemyPatrol: "assets/enemies/sprites/rifle-patrol-walk-32x48-v1.png",
    enemySentry: "assets/enemies/sprites/sentry-walk-32x48-v1.png",
    enemyScout: "assets/enemies/sprites/scout-walk-32x48-v1.png",
    enemySergeant: "assets/enemies/sprites/sergeant-walk-32x48-v1.png",
    enemyAction: "assets/enemies/sprites/enemy-rifle-actions-48-v1.png",
  };

  const images = {};

  const enemyConfig = {
    patrol: { image: "enemyPatrol", hp: 50, speed: 38, range: 150, aim: 0.82, damage: 10, cooldown: 1.45 },
    sentry: { image: "enemySentry", hp: 72, speed: 27, range: 185, aim: 1.02, damage: 12, cooldown: 1.7 },
    scout: { image: "enemyScout", hp: 42, speed: 52, range: 135, aim: 0.62, damage: 8, cooldown: 1.2 },
    sergeant: { image: "enemySergeant", hp: 92, speed: 33, range: 175, aim: 0.74, damage: 14, cooldown: 1.35 },
  };

  const waves = [
    [
      { type: "patrol", x: 621, y: 245 },
      { type: "patrol", x: 590, y: 274 },
      { type: "patrol", x: 323, y: 28 },
    ],
    [
      { type: "sentry", x: 618, y: 240 },
      { type: "patrol", x: 540, y: 31 },
      { type: "scout", x: 255, y: 25 },
      { type: "patrol", x: 616, y: 274 },
    ],
    [
      { type: "sergeant", x: 615, y: 244 },
      { type: "sentry", x: 576, y: 274 },
      { type: "scout", x: 245, y: 25 },
      { type: "patrol", x: 338, y: 26 },
      { type: "patrol", x: 614, y: 275 },
    ],
  ];

  const staticRects = [
    { x: 392, y: 65, w: 210, h: 102 },
    { x: 49, y: 67, w: 143, h: 72 },
    { x: 2, y: 0, w: 73, h: 87 },
    { x: 565, y: 63, w: 70, h: 80 },
    { x: 0, y: 286, w: 276, h: 74 },
    { x: 364, y: 286, w: 276, h: 74 },
  ];

  const staticCircles = [
    { x: 231, y: 65, r: 26 },
    { x: 92, y: 232, r: 15 },
    { x: 517, y: 230, r: 17 },
  ];

  let mode = "loading";
  let paused = false;
  let lastTime = performance.now();
  let elapsed = 0;
  let player;
  let enemies = [];
  let bullets = [];
  let particles = [];
  let pickups = [];
  let waveIndex = 0;
  let waveDelay = -1;
  let escapeOpen = false;
  let kills = 0;
  let toast = { text: "", time: 0 };
  let shake = 0;

  function loadImage(name, src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        images[name] = image;
        resolve();
      };
      image.onerror = () => {
        console.warn(`Aset gagal dimuat: ${src}`);
        images[name] = null;
        resolve();
      };
      image.src = src;
    });
  }

  Promise.all(Object.entries(imageSources).map(([name, src]) => loadImage(name, src))).then(() => {
    mode = "ready";
    resetWorld();
    loadingPanel.classList.add("hidden");
    if (new URLSearchParams(window.location.search).get("autostart") === "1") {
      startGame();
    } else {
      introPanel.classList.remove("hidden");
    }
    canvas.focus();
  });

  function resetWorld() {
    player = {
      x: 185,
      y: 214,
      radius: 10,
      hp: 100,
      maxHp: 100,
      ammo: 5,
      magazine: 5,
      reserve: 25,
      bandages: 2,
      dir: 2,
      moving: false,
      fireCooldown: 0,
      meleeCooldown: 0,
      reloadTimer: 0,
      bandageTimer: 0,
      actionRow: -1,
      actionTimer: 0,
      invulnerable: 0,
      dodgeTimer: 0,
      dodgeCooldown: 0,
      aimX: 1,
      aimY: 0,
    };
    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];
    waveIndex = 0;
    waveDelay = -1;
    escapeOpen = false;
    kills = 0;
    elapsed = 0;
    shake = 0;
    toast = { text: "", time: 0 };
  }

  function startGame() {
    resetWorld();
    mode = "playing";
    paused = false;
    introPanel.classList.add("hidden");
    resultPanel.classList.add("hidden");
    pausePanel.classList.add("hidden");
    spawnWave(0);
    showToast("Sutrisno: Bawa warga pergi! Aku tahan jalan timur!", 3.4);
    canvas.focus();
  }

  function finishGame(won) {
    mode = won ? "won" : "lost";
    paused = false;
    resultKicker.textContent = won ? "Jalur hutan terbuka" : "Sutrisno jatuh";
    resultTitle.textContent = won ? "Warga mendapat waktu untuk pergi." : "Serbuan belum tertahan.";
    resultCopy.textContent = won
      ? `${kills} musuh dilumpuhkan. Sutrisno memilih mundur bersama warga, bukan mengejar pasukan yang tersisa.`
      : `${kills} musuh dilumpuhkan. Gunakan cover, isi peluru di sela gelombang, dan simpan perban untuk keadaan genting.`;
    resultPanel.classList.remove("hidden");
  }

  function spawnWave(index) {
    for (const spawn of waves[index]) {
      const config = enemyConfig[spawn.type];
      enemies.push({
        type: spawn.type,
        x: spawn.x,
        y: spawn.y,
        radius: 10,
        hp: config.hp,
        maxHp: config.hp,
        dir: 1,
        moving: false,
        state: "chase",
        aimTimer: 0,
        cooldown: 0.35 + Math.random() * 0.5,
        fireFlash: 0,
        hitTimer: 0,
        deadTimer: 0,
        targetX: player.x,
        targetY: player.y,
        spawnFlash: 0.7,
      });
    }
  }

  function showToast(text, duration = 2) {
    toast.text = text;
    toast.time = duration;
  }

  function directionFromVector(x, y) {
    if (Math.abs(x) > Math.abs(y)) return x < 0 ? 1 : 2;
    return y < 0 ? 3 : 0;
  }

  function directionVector(dir) {
    if (dir === 1) return { x: -1, y: 0 };
    if (dir === 2) return { x: 1, y: 0 };
    if (dir === 3) return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  }

  function nearestLivingEnemy() {
    let best = null;
    let bestDistance = Infinity;
    for (const enemy of enemies) {
      if (enemy.state === "dead") continue;
      const distance = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }
    return best;
  }

  function updateAim(useAutoAim = false) {
    let dx;
    let dy;
    const target = useAutoAim ? nearestLivingEnemy() : null;
    if (target) {
      dx = target.x - player.x;
      dy = target.y - player.y;
    } else if (pointer.inside) {
      dx = pointer.x - player.x;
      dy = pointer.y - player.y;
    } else {
      const facing = directionVector(player.dir);
      dx = facing.x;
      dy = facing.y;
    }
    const length = Math.hypot(dx, dy) || 1;
    player.aimX = dx / length;
    player.aimY = dy / length;
    player.dir = directionFromVector(dx, dy);
  }

  function firePlayer(useAutoAim = false) {
    if (mode !== "playing" || paused || player.reloadTimer > 0 || player.bandageTimer > 0) return;
    if (player.fireCooldown > 0) return;
    if (player.ammo <= 0) {
      showToast(player.reserve > 0 ? "Magasin kosong · tekan R" : "Peluru habis · dekati drop musuh", 1.2);
      return;
    }
    updateAim(useAutoAim);
    player.ammo -= 1;
    player.fireCooldown = 0.28;
    player.actionRow = 1;
    player.actionTimer = 0.16;
    bullets.push({
      team: "player",
      x: player.x + player.aimX * 15,
      y: player.y - 12 + player.aimY * 15,
      vx: player.aimX * 360,
      vy: player.aimY * 360,
      damage: 26,
      life: 0.8,
      radius: 2.2,
    });
    burst(player.x + player.aimX * 18, player.y - 12 + player.aimY * 18, "#e9b866", 3, 45);
    shake = Math.max(shake, 1.7);
  }

  function meleePlayer() {
    if (mode !== "playing" || paused || player.meleeCooldown > 0 || player.reloadTimer > 0) return;
    player.meleeCooldown = 0.66;
    player.actionRow = 2;
    player.actionTimer = 0.3;
    updateAim(false);
    let hit = false;
    for (const enemy of enemies) {
      if (enemy.state === "dead") continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      const dot = distance > 0 ? (dx / distance) * player.aimX + (dy / distance) * player.aimY : 1;
      if (distance <= 42 && dot > -0.12) {
        damageEnemy(enemy, 38, player.aimX * 9, player.aimY * 9);
        hit = true;
      }
    }
    if (hit) {
      shake = Math.max(shake, 3.5);
      burst(player.x + player.aimX * 26, player.y + player.aimY * 20, "#d5c29a", 7, 65);
    }
  }

  function reloadPlayer() {
    if (mode !== "playing" || paused || player.reloadTimer > 0 || player.ammo >= player.magazine || player.reserve <= 0) return;
    player.reloadTimer = 1.05;
    player.actionRow = 0;
    player.actionTimer = 1.05;
    showToast("Mengisi peluru...", 0.9);
  }

  function bandagePlayer() {
    if (mode !== "playing" || paused || player.bandageTimer > 0 || player.bandages <= 0 || player.hp >= player.maxHp) return;
    player.bandageTimer = 1.35;
    player.actionRow = 0;
    player.actionTimer = 1.35;
    showToast("Menekan luka...", 1.1);
  }

  function dodgePlayer() {
    if (mode !== "playing" || paused || player.dodgeCooldown > 0 || player.dodgeTimer > 0) return;
    const move = currentMoveVector();
    if (move.x === 0 && move.y === 0) return;
    player.dodgeTimer = 0.24;
    player.dodgeCooldown = 2.1;
    player.invulnerable = 0.32;
    burst(player.x, player.y + 5, "#9b8c6f", 6, 40);
  }

  function currentMoveVector() {
    let x = touchMove.x;
    let y = touchMove.y;
    if (keys.KeyA || keys.ArrowLeft) x -= 1;
    if (keys.KeyD || keys.ArrowRight) x += 1;
    if (keys.KeyW || keys.ArrowUp) y -= 1;
    if (keys.KeyS || keys.ArrowDown) y += 1;
    const length = Math.hypot(x, y);
    if (length > 1) return { x: x / length, y: y / length };
    return length ? { x, y } : { x: 0, y: 0 };
  }

  function update(dt) {
    elapsed += dt;
    if (toast.time > 0) toast.time -= dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 11);

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateParticles(dt);
    updatePickups(dt);

    enemies = enemies.filter((enemy) => enemy.deadTimer > -0.65);
    bullets = bullets.filter((bullet) => bullet.life > 0);
    particles = particles.filter((particle) => particle.life > 0);

    const alive = enemies.filter((enemy) => enemy.state !== "dead").length;
    if (!escapeOpen && alive === 0) {
      if (waveIndex < waves.length - 1) {
        if (waveDelay < 0) {
          waveDelay = 2.25;
          showToast("Ada gerakan lagi dari timur...", 1.9);
        } else {
          waveDelay -= dt;
          if (waveDelay <= 0) {
            waveIndex += 1;
            waveDelay = -1;
            spawnWave(waveIndex);
            showToast(
              waveIndex === waves.length - 1
                ? "Darma: Komandan mereka datang! Bertahan, Tris!"
                : `Gelombang ${waveIndex + 1} · mereka mencoba mengepung!`,
              2.8,
            );
          }
        }
      } else {
        escapeOpen = true;
        showToast("Darma: Jalur terbuka! Mundur lewat jembatan!", 4);
      }
    }

    if (escapeOpen && player.x > 284 && player.x < 356 && player.y > 337) finishGame(true);
    if (player.hp <= 0) finishGame(false);
  }

  function updatePlayer(dt) {
    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
    player.meleeCooldown = Math.max(0, player.meleeCooldown - dt);
    player.actionTimer = Math.max(0, player.actionTimer - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
    player.dodgeTimer = Math.max(0, player.dodgeTimer - dt);

    if (touchAction.fire) firePlayer(true);

    if (player.reloadTimer > 0) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) {
        const needed = player.magazine - player.ammo;
        const loaded = Math.min(needed, player.reserve);
        player.ammo += loaded;
        player.reserve -= loaded;
      }
    }

    if (player.bandageTimer > 0) {
      player.bandageTimer -= dt;
      if (player.bandageTimer <= 0) {
        player.bandages -= 1;
        player.hp = Math.min(player.maxHp, player.hp + 38);
        burst(player.x, player.y - 10, "#dfd2ad", 9, 35);
      }
    }

    const move = currentMoveVector();
    player.moving = (move.x !== 0 || move.y !== 0) && player.reloadTimer <= 0 && player.bandageTimer <= 0;
    if (player.moving) {
      player.dir = directionFromVector(move.x, move.y);
      const speed = player.dodgeTimer > 0 ? 235 : 94;
      moveActor(player, move.x * speed * dt, move.y * speed * dt);
    }
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      const config = enemyConfig[enemy.type];
      enemy.spawnFlash = Math.max(0, enemy.spawnFlash - dt);
      enemy.fireFlash = Math.max(0, enemy.fireFlash - dt);
      enemy.hitTimer = Math.max(0, enemy.hitTimer - dt);

      if (enemy.state === "dead") {
        enemy.deadTimer -= dt;
        continue;
      }

      enemy.cooldown -= dt;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      enemy.dir = directionFromVector(dx, dy);
      enemy.moving = false;

      if (enemy.state === "aim") {
        enemy.aimTimer -= dt;
        enemy.targetX = player.x;
        enemy.targetY = player.y;
        if (enemy.aimTimer <= 0) {
          fireEnemy(enemy, config);
          enemy.state = "chase";
          enemy.cooldown = config.cooldown + Math.random() * 0.35;
        }
        continue;
      }

      if (enemy.hitTimer > 0) continue;

      if (distance <= config.range && enemy.cooldown <= 0 && hasLineOfSight(enemy.x, enemy.y - 12, player.x, player.y - 12)) {
        enemy.state = "aim";
        enemy.aimTimer = config.aim;
        enemy.targetX = player.x;
        enemy.targetY = player.y;
        continue;
      }

      if (distance > config.range * 0.72 || !hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
        let mx = dx / distance;
        let my = dy / distance;
        for (const other of enemies) {
          if (other === enemy || other.state === "dead") continue;
          const ox = enemy.x - other.x;
          const oy = enemy.y - other.y;
          const od = Math.hypot(ox, oy);
          if (od > 0 && od < 24) {
            mx += (ox / od) * 0.7;
            my += (oy / od) * 0.7;
          }
        }
        const ml = Math.hypot(mx, my) || 1;
        moveActor(enemy, (mx / ml) * config.speed * dt, (my / ml) * config.speed * dt);
        enemy.moving = true;
      }
    }
  }

  function fireEnemy(enemy, config) {
    const dx = enemy.targetX - enemy.x;
    const dy = enemy.targetY - (enemy.y - 12);
    const length = Math.hypot(dx, dy) || 1;
    enemy.fireFlash = 0.14;
    bullets.push({
      team: "enemy",
      x: enemy.x + (dx / length) * 14,
      y: enemy.y - 12 + (dy / length) * 14,
      vx: (dx / length) * 220,
      vy: (dy / length) * 220,
      damage: config.damage,
      life: 1.35,
      radius: 2.2,
    });
    burst(enemy.x + (dx / length) * 18, enemy.y - 12 + (dy / length) * 18, "#e3a54d", 2, 32);
  }

  function updateBullets(dt) {
    for (const bullet of bullets) {
      if (bullet.life <= 0) continue;
      const previousX = bullet.x;
      const previousY = bullet.y;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      bullet.life -= dt;

      if (bullet.x < 0 || bullet.x > WORLD_W || bullet.y < 0 || bullet.y > WORLD_H || segmentHitsWorld(previousX, previousY, bullet.x, bullet.y)) {
        bullet.life = 0;
        burst(bullet.x, bullet.y, "#8d8066", 3, 28);
        continue;
      }

      if (bullet.team === "player") {
        for (const enemy of enemies) {
          if (enemy.state === "dead") continue;
          if (Math.hypot(bullet.x - enemy.x, bullet.y - (enemy.y - 10)) <= enemy.radius + bullet.radius + 3) {
            bullet.life = 0;
            damageEnemy(enemy, bullet.damage, bullet.vx * 0.018, bullet.vy * 0.018);
            break;
          }
        }
      } else if (player.invulnerable <= 0 && Math.hypot(bullet.x - player.x, bullet.y - (player.y - 10)) <= player.radius + bullet.radius + 3) {
        bullet.life = 0;
        player.hp = Math.max(0, player.hp - bullet.damage);
        player.invulnerable = 0.34;
        player.actionRow = 3;
        player.actionTimer = 0.2;
        shake = Math.max(shake, 5);
        burst(player.x, player.y - 10, "#a44635", 8, 60);
      }
    }
  }

  function damageEnemy(enemy, damage, knockX, knockY) {
    enemy.hp -= damage;
    enemy.hitTimer = 0.2;
    enemy.x += knockX;
    enemy.y += knockY;
    burst(enemy.x, enemy.y - 9, "#9f4736", 7, 55);
    if (enemy.hp <= 0) {
      enemy.state = "dead";
      enemy.deadTimer = 0.7;
      kills += 1;
      if (Math.random() < 0.42) {
        pickups.push({
          type: Math.random() < 0.75 ? "ammo" : "bandage",
          x: enemy.x,
          y: enemy.y,
          bob: Math.random() * TAU,
          life: 14,
        });
      }
    }
  }

  function updatePickups(dt) {
    for (const pickup of pickups) {
      pickup.life -= dt;
      pickup.bob += dt * 3.4;
      if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < 22) {
        if (pickup.type === "ammo") {
          player.reserve = Math.min(40, player.reserve + 6);
          showToast("Mengambil 6 peluru", 1.1);
        } else {
          player.bandages = Math.min(3, player.bandages + 1);
          showToast("Mengambil 1 perban", 1.1);
        }
        pickup.life = 0;
      }
    }
    pickups = pickups.filter((pickup) => pickup.life > 0);
  }

  function updateParticles(dt) {
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.92;
      particle.vy *= 0.92;
      particle.life -= dt;
    }
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color,
        life: 0.22 + Math.random() * 0.28,
        maxLife: 0.5,
        size: 1 + Math.random() * 2,
      });
    }
  }

  function moveActor(actor, dx, dy) {
    const oldX = actor.x;
    actor.x += dx;
    if (collidesWorld(actor.x, actor.y, actor.radius)) actor.x = oldX;
    const oldY = actor.y;
    actor.y += dy;
    if (collidesWorld(actor.x, actor.y, actor.radius)) actor.y = oldY;
    actor.x = Math.max(actor.radius + 2, Math.min(WORLD_W - actor.radius - 2, actor.x));
    actor.y = Math.max(actor.radius + 18, Math.min(WORLD_H - actor.radius - 2, actor.y));
  }

  function collidesWorld(x, y, radius) {
    for (const rect of staticRects) {
      const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
      const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
      if ((x - nearestX) ** 2 + (y - nearestY) ** 2 < radius ** 2) return true;
    }
    for (const circle of staticCircles) {
      if (Math.hypot(x - circle.x, y - circle.y) < radius + circle.r) return true;
    }
    return false;
  }

  function segmentHitsWorld(x1, y1, x2, y2) {
    for (let i = 1; i <= 7; i += 1) {
      const t = i / 7;
      if (collidesWorld(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 1.5)) return true;
    }
    return false;
  }

  function hasLineOfSight(x1, y1, x2, y2) {
    for (let i = 1; i < 18; i += 1) {
      const t = i / 18;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      if (collidesWorld(x, y, 2)) return false;
    }
    return true;
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

  function render() {
    ctx.save();
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    ctx.translate(shakeX, shakeY);
    drawGround();
    drawStaticWorld();
    drawPickups();
    drawActors();
    drawBulletsAndParticles();
    drawForeground();
    ctx.restore();
    drawHud();
  }

  function drawGround() {
    ctx.fillStyle = "#4a5137";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    for (let y = 0; y < WORLD_H; y += 32) {
      for (let x = 0; x < WORLD_W; x += 32) {
        if (!drawAtlasCell(images.terrain, 4, 4, 2, 0, x, y, 32, 32)) {
          ctx.fillStyle = (x / 32 + y / 32) % 2 ? "#545d3e" : "#4f583b";
          ctx.fillRect(x, y, 32, 32);
        }
      }
    }

    for (let y = 144; y <= 240; y += 32) {
      for (let x = 0; x < WORLD_W; x += 32) {
        drawAtlasCell(images.road, 4, 4, 1, 0, x, y, 32, 32);
      }
    }

    for (let x = 0; x < WORLD_W; x += 32) {
      drawAtlasCell(images.river, 4, 4, 1, 0, x, 288, 32, 32);
      drawAtlasCell(images.river, 4, 4, 0, 0, x, 320, 32, 40);
    }

    const decalPlacements = [
      [0, 0, 202, 160, 52, 52, 0.52],
      [2, 0, 405, 211, 58, 58, 0.5],
      [3, 1, 468, 126, 50, 50, 0.65],
      [2, 1, 352, 89, 60, 60, 0.7],
      [1, 3, 533, 190, 55, 55, 0.5],
      [0, 2, 119, 149, 54, 54, 0.45],
    ];
    for (const [col, row, x, y, w, h, alpha] of decalPlacements) {
      drawAtlasCell(images.decals, 4, 4, col, row, x, y, w, h, alpha);
    }
  }

  function drawStaticWorld() {
    drawAtlasCell(images.bridge, 4, 3, 2, 0, 269, 248, 102, 126);
    drawAtlasCell(images.buildings, 3, 2, 2, 0, 30, 18, 188, 141);
    drawAtlasCell(images.buildings, 3, 2, 1, 0, 357, 2, 266, 200);

    drawAtlasCell(images.trees, 4, 3, 3, 0, -14, -12, 112, 112);
    drawAtlasCell(images.trees, 4, 3, 0, 0, 184, -25, 110, 110);
    drawAtlasCell(images.trees, 4, 3, 3, 1, 548, 42, 110, 110);
    drawAtlasCell(images.trees, 4, 3, 2, 2, 13, 195, 105, 105);

    drawAtlasCell(images.obstacles, 4, 4, 1, 0, 67, 207, 55, 55);
    drawAtlasCell(images.obstacles, 4, 4, 2, 0, 489, 201, 62, 62);
    drawAtlasCell(images.obstacles, 4, 4, 1, 2, 277, 86, 54, 54);

    const flameFrame = Math.floor(elapsed * 7) % 4;
    drawAtlasCell(images.vfx, 4, 4, flameFrame, 0, 430, 106, 38, 38, 0.9);
    drawAtlasCell(images.vfx, 4, 4, (flameFrame + 2) % 4, 0, 506, 123, 32, 32, 0.85);
    drawAtlasCell(images.vfx, 4, 4, Math.floor(elapsed * 3) % 4, 1, 462, 55, 62, 62, 0.5);
  }

  function drawPickups() {
    for (const pickup of pickups) {
      const bob = Math.sin(pickup.bob) * 2;
      ctx.save();
      ctx.translate(pickup.x, pickup.y + bob);
      ctx.fillStyle = "rgba(18, 20, 17, 0.72)";
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, TAU);
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
  }

  function drawActors() {
    const actors = enemies.map((enemy) => ({ kind: "enemy", entity: enemy }));
    actors.push({ kind: "player", entity: player });
    actors.sort((a, b) => a.entity.y - b.entity.y);
    for (const actor of actors) {
      if (actor.kind === "player") drawPlayer();
      else drawEnemy(actor.entity);
    }
  }

  function drawPlayer() {
    const flicker = player.invulnerable > 0 && Math.floor(elapsed * 18) % 2 === 0;
    if (flicker) return;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 2, 12, 5, 0, 0, TAU);
    ctx.fill();

    if (player.actionTimer > 0 && images.playerAction) {
      drawAtlasCell(images.playerAction, 4, 4, player.dir, Math.max(0, player.actionRow), player.x - 27, player.y - 53, 54, 54);
    } else if (images.playerWalk) {
      const frame = player.moving ? Math.floor(elapsed * 9) % 4 : 0;
      drawAtlasCell(images.playerWalk, 4, 4, frame, player.dir, player.x - 22, player.y - 57, 44, 66);
    } else {
      ctx.fillStyle = "#d7c59f";
      ctx.beginPath();
      ctx.arc(player.x, player.y - 11, 10, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const config = enemyConfig[enemy.type];
    ctx.save();
    if (enemy.spawnFlash > 0) ctx.globalAlpha = 0.45 + (Math.sin(elapsed * 35) + 1) * 0.25;
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 2, 11, 4, 0, 0, TAU);
    ctx.fill();

    let usedAction = false;
    if (images.enemyAction) {
      let row = -1;
      if (enemy.state === "dead") row = 3;
      else if (enemy.hitTimer > 0) row = 2;
      else if (enemy.fireFlash > 0) row = 1;
      else if (enemy.state === "aim") row = 0;
      if (row >= 0) {
        drawAtlasCell(images.enemyAction, 4, 4, enemy.dir, row, enemy.x - 27, enemy.y - 53, 54, 54);
        usedAction = true;
      }
    }

    if (!usedAction) {
      const walkImage = images[config.image];
      if (walkImage) {
        const frame = enemy.moving ? Math.floor((elapsed + enemy.x * 0.01) * 8) % 4 : 0;
        drawAtlasCell(walkImage, 4, 4, frame, enemy.dir, enemy.x - 22, enemy.y - 57, 44, 66);
      } else {
        ctx.fillStyle = "#626357";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y - 10, 10, 0, TAU);
        ctx.fill();
      }
    }

    if (enemy.state === "aim") {
      const progress = 1 - enemy.aimTimer / enemyConfig[enemy.type].aim;
      ctx.strokeStyle = `rgba(205, 71, 49, ${0.25 + progress * 0.65})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(enemy.x, enemy.y - 15);
      ctx.lineTo(enemy.targetX, enemy.targetY - 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (enemy.hp < enemy.maxHp && enemy.state !== "dead") {
      ctx.fillStyle = "rgba(15, 16, 14, 0.75)";
      ctx.fillRect(enemy.x - 13, enemy.y - 62, 26, 3);
      ctx.fillStyle = "#a84635";
      ctx.fillRect(enemy.x - 13, enemy.y - 62, 26 * (enemy.hp / enemy.maxHp), 3);
    }
    ctx.restore();
  }

  function drawBulletsAndParticles() {
    for (const bullet of bullets) {
      ctx.strokeStyle = bullet.team === "player" ? "#f0c66f" : "#d46a43";
      ctx.lineWidth = bullet.team === "player" ? 1.5 : 1.2;
      ctx.beginPath();
      ctx.moveTo(bullet.x, bullet.y);
      ctx.lineTo(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018);
      ctx.stroke();
    }
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawForeground() {
    if (escapeOpen) {
      const pulse = 0.45 + Math.sin(elapsed * 4) * 0.18;
      ctx.fillStyle = `rgba(218, 184, 104, ${pulse * 0.32})`;
      ctx.fillRect(286, 320, 68, 40);
      ctx.strokeStyle = `rgba(238, 213, 151, ${pulse})`;
      ctx.strokeRect(287.5, 321.5, 65, 36);
      ctx.fillStyle = "#f0dcae";
      ctx.font = "700 8px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("JALUR AMAN", 320, 349);
    }

    const vignette = ctx.createRadialGradient(320, 180, 120, 320, 180, 390);
    vignette.addColorStop(0, "rgba(9, 11, 10, 0)");
    vignette.addColorStop(1, "rgba(8, 10, 9, 0.58)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    if (pointer.inside && mode === "playing" && !paused) {
      ctx.strokeStyle = "rgba(238, 218, 177, 0.78)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 6, 0, TAU);
      ctx.moveTo(pointer.x - 10, pointer.y);
      ctx.lineTo(pointer.x - 4, pointer.y);
      ctx.moveTo(pointer.x + 4, pointer.y);
      ctx.lineTo(pointer.x + 10, pointer.y);
      ctx.moveTo(pointer.x, pointer.y - 10);
      ctx.lineTo(pointer.x, pointer.y - 4);
      ctx.moveTo(pointer.x, pointer.y + 4);
      ctx.lineTo(pointer.x, pointer.y + 10);
      ctx.stroke();
    }
  }

  function drawHud() {
    if (mode === "loading") return;
    ctx.save();
    ctx.textBaseline = "top";

    ctx.fillStyle = "rgba(18, 20, 17, 0.84)";
    roundedRect(12, 12, 174, 54, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(226, 207, 166, 0.26)";
    ctx.stroke();

    ctx.fillStyle = "#d8c59d";
    ctx.font = "700 9px system-ui, sans-serif";
    ctx.fillText("SUTRISNO", 22, 20);
    ctx.fillStyle = "#30251f";
    ctx.fillRect(22, 34, 104, 8);
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = hpRatio > 0.35 ? "#a74a36" : "#d86a42";
    ctx.fillRect(22, 34, 104 * hpRatio, 8);
    ctx.fillStyle = "#b9aa89";
    ctx.font = "600 8px system-ui, sans-serif";
    ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, 131, 34);
    ctx.fillText(`PELURU ${player.ammo}/${player.reserve}`, 22, 49);
    ctx.fillText(`PERBAN ${player.bandages}`, 105, 49);

    ctx.fillStyle = "rgba(18, 20, 17, 0.82)";
    roundedRect(416, 12, 212, 47, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(226, 207, 166, 0.24)";
    ctx.stroke();
    ctx.fillStyle = "#c76142";
    ctx.font = "700 8px system-ui, sans-serif";
    ctx.fillText(escapeOpen ? "TUJUAN BARU" : `GELOMBANG ${waveIndex + 1}/${waves.length}`, 428, 20);
    ctx.fillStyle = "#e6d4ae";
    ctx.font = "600 9px Georgia, serif";
    ctx.fillText(escapeOpen ? "Mundur lewat jembatan selatan" : "Tahan serbuan dari jalan timur", 428, 35);

    if (player.reloadTimer > 0 || player.bandageTimer > 0) {
      const duration = player.reloadTimer > 0 ? 1.05 : 1.35;
      const remaining = player.reloadTimer > 0 ? player.reloadTimer : player.bandageTimer;
      const label = player.reloadTimer > 0 ? "MENGISI PELURU" : "MEMBALUT LUKA";
      ctx.fillStyle = "rgba(18, 20, 17, 0.84)";
      roundedRect(250, 315, 140, 27, 4);
      ctx.fill();
      ctx.fillStyle = "#3a3025";
      ctx.fillRect(260, 331, 120, 4);
      ctx.fillStyle = "#d3aa61";
      ctx.fillRect(260, 331, 120 * (1 - remaining / duration), 4);
      ctx.fillStyle = "#e1ceaa";
      ctx.font = "700 8px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, 320, 320);
    }

    if (toast.time > 0) {
      ctx.font = "700 9px system-ui, sans-serif";
      const width = Math.min(410, Math.max(180, ctx.measureText(toast.text).width + 30));
      ctx.fillStyle = "rgba(22, 24, 20, 0.9)";
      roundedRect((WORLD_W - width) / 2, 76, width, 25, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(224, 200, 150, 0.24)";
      ctx.stroke();
      ctx.fillStyle = "#ead8b1";
      ctx.textAlign = "center";
      ctx.fillText(toast.text, WORLD_W / 2, 84);
    }

    ctx.restore();
  }

  function roundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function loop(now) {
    const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (mode === "playing" && !paused) update(dt);
    render();
    requestAnimationFrame(loop);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * WORLD_W;
    pointer.y = ((event.clientY - rect.top) / rect.height) * WORLD_H;
    pointer.inside = true;
  }

  canvas.addEventListener("pointermove", updatePointer);
  canvas.addEventListener("pointerenter", updatePointer);
  canvas.addEventListener("pointerleave", () => { pointer.inside = false; });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    updatePointer(event);
    firePlayer(false);
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", (event) => {
    const blocked = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"];
    if (blocked.includes(event.code)) event.preventDefault();
    keys[event.code] = true;
    if (event.repeat) return;
    if (event.code === "Space") firePlayer(false);
    if (event.code === "KeyE") meleePlayer();
    if (event.code === "KeyR") reloadPlayer();
    if (event.code === "KeyF") bandagePlayer();
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") dodgePlayer();
    if (event.code === "Escape" && mode === "playing") {
      paused = !paused;
      pausePanel.classList.toggle("hidden", !paused);
    }
  });

  window.addEventListener("keyup", (event) => {
    keys[event.code] = false;
  });

  window.addEventListener("blur", () => {
    resetJoystick();
    touchAction.fire = false;
    if (mode === "playing") {
      paused = true;
      pausePanel.classList.remove("hidden");
    }
  });

  const joystick = document.querySelector("#joystick");
  const joystickKnob = document.querySelector("#joystick-knob");
  let joystickPointerId = null;

  function moveJoystick(event) {
    if (event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = rect.width * 0.31;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance) {
      dx = (dx / distance) * maxDistance;
      dy = (dy / distance) * maxDistance;
    }
    touchMove.x = dx / maxDistance;
    touchMove.y = dy / maxDistance;
    joystickKnob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }

  function resetJoystick(event) {
    if (event && joystickPointerId !== null && event.pointerId !== joystickPointerId) return;
    touchMove.x = 0;
    touchMove.y = 0;
    joystickPointerId = null;
    joystickKnob.style.transform = "translate3d(0, 0, 0)";
  }

  joystick.addEventListener("pointerdown", (event) => {
    if (joystickPointerId !== null) return;
    joystickPointerId = event.pointerId;
    joystick.setPointerCapture?.(event.pointerId);
    moveJoystick(event);
  });
  joystick.addEventListener("pointermove", moveJoystick);
  joystick.addEventListener("pointerup", resetJoystick);
  joystick.addEventListener("pointercancel", resetJoystick);
  joystick.addEventListener("lostpointercapture", resetJoystick);

  for (const button of document.querySelectorAll("[data-action]")) {
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      const action = button.dataset.action;
      if (action === "fire") {
        touchAction.fire = true;
        firePlayer(true);
      }
      if (action === "melee") meleePlayer();
      if (action === "reload") reloadPlayer();
      if (action === "bandage") bandagePlayer();
      if (action === "dodge") dodgePlayer();
    });
    const release = () => {
      if (button.dataset.action === "fire") touchAction.fire = false;
    };
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  }

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);
  resetWorld();
  requestAnimationFrame(loop);
})();
