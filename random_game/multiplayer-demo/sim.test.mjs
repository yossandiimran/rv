import assert from "node:assert/strict";
import {
  TEAMS,
  createBotInputs,
  createSnapshot,
  createWorld,
  finishByForfeit,
  hasClearLineOfSight,
  stepWorld,
} from "./sim.mjs";

const members = {
  p1: { name: "Sutrisno", team: TEAMS.PEJUANG, slot: 0 },
  p2: { name: "Bima", team: TEAMS.PEJUANG, slot: 1 },
  k1: { name: "Patroli", team: TEAMS.KOLONIAL, slot: 0 },
  k2: { name: "Sersan", team: TEAMS.KOLONIAL, slot: 1 },
};

function advance(world, inputs, seconds) {
  const steps = Math.ceil(seconds / 0.05);
  for (let index = 0; index < steps; index += 1) stepWorld(world, inputs, 0.05);
}

{
  const world = createWorld(members, 1);
  assert.equal(Object.keys(world.players).length, 4);
  assert.equal(world.points.length, 6);
  assert.equal(world.points.filter((point) => point.owner === TEAMS.PEJUANG).length, 2);
  assert.equal(world.points.filter((point) => point.owner === TEAMS.KOLONIAL).length, 2);

  const startX = world.players.p1.x;
  advance(world, { p1: { mx: 1, my: 0, ax: 1, ay: 0 } }, 0.5);
  assert.ok(world.players.p1.x > startX, "Pemain harus bergerak dari input host.");
}

{
  const world = createWorld(members, 1);
  Object.assign(world.players.p1, { x: 220, y: 190, aimX: 1, aimY: 0, spawnShield: 0 });
  Object.assign(world.players.k1, { x: 310, y: 190, spawnShield: 0 });
  stepWorld(world, { p1: { ax: 1, ay: 0, fire: true } }, 0.05);
  const firingSnapshot = createSnapshot(world);
  assert.equal(firingSnapshot.players.p1.fireCooldown, 0.28);
  assert.ok(firingSnapshot.effects.some((effect) => effect.type === "muzzle"), "Muzzle VFX harus ikut snapshot.");
  advance(world, { p1: { ax: 1, ay: 0, fire: false } }, 0.3);
  assert.equal(world.players.p1.ammo, 4);
  assert.equal(world.players.k1.hp, 74, "Projectile demo pertama harus memberi 26 damage.");
  assert.ok(world.effects.some((effect) => effect.type === "hit"), "Hit VFX harus disinkronkan host.");
  assert.equal(world.bulletSeq, 1);
}

{
  const world = createWorld(members, 1);
  Object.assign(world.players.p1, { x: 250, y: 190, aimX: 1, aimY: 0, spawnShield: 0 });
  Object.assign(world.players.k1, { x: 287, y: 190, spawnShield: 0 });
  stepWorld(world, { p1: { ax: 1, ay: 0, meleeSeq: 1 } }, 0.05);
  assert.equal(world.players.k1.hp, 62, "Pukulan popor demo pertama harus memberi 38 damage.");
  assert.equal(world.players.p1.meleeCooldown, 0.66);
  assert.ok(world.effects.some((effect) => effect.type === "melee"), "Pukulan harus membuat effect event.");
}

{
  const world = createWorld(members, 1);
  Object.assign(world.players.p1, { hp: 40, bandages: 2, spawnShield: 0 });
  stepWorld(world, { p1: { bandageSeq: 1 } }, 0.05);
  assert.ok(world.players.p1.bandageTimer > 1.2, "Perban harus membutuhkan waktu pemakaian.");
  advance(world, {}, 1.4);
  assert.equal(world.players.p1.hp, 78, "Perban demo pertama harus memulihkan 38 HP.");
  assert.equal(world.players.p1.bandages, 1);
}

{
  const world = createWorld(members, 1);
  const reloadStartX = world.players.p1.x;
  Object.assign(world.players.p1, { ammo: 0, reserve: 25 });
  stepWorld(world, { p1: { mx: 1, my: 0, reloadSeq: 1 } }, 0.05);
  assert.equal(world.players.p1.reloadTimer, 1.05, "Reload demo pertama harus berlangsung 1,05 detik.");
  assert.ok(world.players.p1.x > reloadStartX, "Pemain harus tetap bisa bergerak sambil reload.");
  advance(world, {}, 1.1);
  assert.equal(world.players.p1.ammo, 5);
  assert.equal(world.players.p1.reserve, 20);
}

{
  const world = createWorld(members, 1);
  Object.assign(world.players.p1, { ammo: 1, reserve: 6, aimX: 1, aimY: 0 });
  stepWorld(world, { p1: { ax: 1, ay: 0, fire: true } }, 0.05);
  assert.equal(world.players.p1.ammo, 0);
  assert.equal(world.players.p1.reloadTimer, 0);
  stepWorld(world, { p1: { ax: 1, ay: 0, fire: false } }, 0.05);
  assert.equal(world.players.p1.reloadTimer, 1.05, "Magasin kosong harus memulai auto reload.");
  advance(world, {}, 1.1);
  assert.equal(world.players.p1.ammo, 5);
  assert.equal(world.players.p1.reserve, 1);
}

{
  const world = createWorld(members, 1);
  const startX = world.players.p1.x;
  stepWorld(world, { p1: { mx: 1, my: 0, dodgeSeq: 1 } }, 0.05);
  assert.equal(world.players.p1.dodgeTimer, 0.24);
  assert.equal(world.players.p1.invulnerable, 0.32);
  assert.ok(world.players.p1.x - startX > 11, "Dodge harus memakai kecepatan demo pertama.");
}

{
  const world = createWorld(members, 1);
  Object.assign(world.players.p1, { x: 90, y: 90, reserve: 20, bandages: 1 });
  world.pickups.push({ id: 1, type: "ammo", x: 90, y: 90, life: 14 });
  stepWorld(world, {}, 0.05);
  assert.equal(world.players.p1.reserve, 26, "Drop amunisi harus menambah enam peluru.");
  world.pickups.push({ id: 2, type: "bandage", x: 90, y: 90, life: 14 });
  stepWorld(world, {}, 0.05);
  assert.equal(world.players.p1.bandages, 2, "Drop perban harus dapat diambil.");
}

{
  const world = createWorld(members, 1);
  const point = world.points.find((candidate) => candidate.id === "C");
  Object.assign(world.players.p1, { x: point.x, y: point.y });
  advance(world, { p1: { capture: true, ax: 1, ay: 0 } }, 4.2);
  assert.equal(point.owner, TEAMS.PEJUANG, "Titik netral harus berubah menjadi milik Pejuang.");
}

{
  const world = createWorld(members, 1);
  for (const point of world.points) point.owner = TEAMS.PEJUANG;
  advance(world, {}, 12.2);
  assert.equal(world.result?.winner, TEAMS.PEJUANG);
  assert.match(world.result?.reason || "", /12 detik/);
  const snapshot = createSnapshot(world);
  assert.equal(snapshot.players.p1.handledReloadSeq, undefined);
  assert.equal(snapshot.players.p1.bandages, 2);
  assert.equal(snapshot.points.length, 6);
}

{
  const world = createWorld(members, 1);
  finishByForfeit(world, "k1");
  assert.equal(world.result?.winner, TEAMS.PEJUANG);
}

{
  const botMembers = {
    human: { name: "Pemain", team: TEAMS.PEJUANG, slot: 0 },
    "bot-pejuang-1": { name: "Bima BOT", team: TEAMS.PEJUANG, slot: 1, isBot: true },
    "bot-kolonial-0": { name: "Patroli BOT", team: TEAMS.KOLONIAL, slot: 0, isBot: true },
    "bot-kolonial-1": { name: "Sersan BOT", team: TEAMS.KOLONIAL, slot: 1, isBot: true },
  };
  const world = createWorld(botMembers, 1);
  const inputs = createBotInputs(world);
  assert.equal(Object.keys(inputs).length, 3);
  const startX = world.players["bot-pejuang-1"].x;
  advance(world, { ...inputs }, 0.3);
  assert.notEqual(world.players["bot-pejuang-1"].x, startX, "Bot harus bergerak menuju objective.");
  const startingOwners = world.points.map((point) => point.owner).join(",");
  for (let step = 0; step < 400; step += 1) stepWorld(world, createBotInputs(world), 0.05);
  assert.notEqual(
    world.points.map((point) => point.owner).join(","),
    startingOwners,
    "Bot harus mampu mengubah kepemilikan capture point.",
  );
  assert.equal(createSnapshot(world).players["bot-pejuang-1"].isBot, true);
}

{
  const world = createWorld({
    human: { name: "Pemain", team: TEAMS.PEJUANG, slot: 0 },
    bot: { name: "Patroli BOT", team: TEAMS.KOLONIAL, slot: 0, isBot: true },
  }, 1);
  Object.assign(world.players.human, { x: 430, y: 150, spawnShield: 10 });
  Object.assign(world.players.bot, { x: 550, y: 150, spawnShield: 0 });
  const initialInput = createBotInputs(world).bot;
  assert.equal(initialInput.fire, false, "Bot harus memiliki jeda reaksi sebelum menembak.");
  assert.ok(Math.hypot(initialInput.mx, initialInput.my) <= 0.83, "Gerak bot harus lebih lambat dari pemain.");

  let fireFrames = 0;
  let firingWithAimError = 0;
  for (let step = 0; step < 80; step += 1) {
    Object.assign(world.players.human, { x: 430, y: 150, hp: 100, dead: false, spawnShield: 10 });
    Object.assign(world.players.bot, { x: 550, y: 150, dead: false, spawnShield: 0 });
    const input = createBotInputs(world).bot;
    if (input.fire) {
      fireFrames += 1;
      if (Math.abs(input.ay) >= 0.03) firingWithAimError += 1;
    }
    stepWorld(world, { bot: input }, 0.05);
  }

  assert.ok(fireFrames > 0 && fireFrames <= 8, "Bot harus menembak dalam burst pendek, bukan terus-menerus.");
  assert.ok(world.bulletSeq >= 2 && world.bulletSeq <= 4, "Bot maksimal menembak sekitar sekali per siklus reaksi.");
  assert.equal(firingWithAimError, fireFrames, "Bidikan bot harus memiliki deviasi agar tidak menjadi aimbot.");
}

{
  const world = createWorld({
    human: { name: "Pemain", team: TEAMS.PEJUANG, slot: 0 },
    bot: { name: "Patroli BOT", team: TEAMS.KOLONIAL, slot: 0, isBot: true },
  }, 1);
  assert.equal(
    hasClearLineOfSight(400, 258, 560, 260, 2),
    false,
    "Bangunan tengah harus memutus line of sight bot dan auto aim.",
  );
  assert.equal(
    hasClearLineOfSight(430, 138, 550, 140, 2),
    true,
    "Area terbuka harus dapat dikunci bot dan auto aim.",
  );
  let attemptedBlockedShot = false;
  for (let step = 0; step < 60; step += 1) {
    Object.assign(world.players.human, { x: 400, y: 270, hp: 100, dead: false, spawnShield: 10 });
    Object.assign(world.players.bot, { x: 560, y: 270, dead: false, spawnShield: 0 });
    const input = createBotInputs(world).bot;
    attemptedBlockedShot ||= input.fire;
    stepWorld(world, { bot: input }, 0.05);
  }
  assert.equal(attemptedBlockedShot, false, "Bot tidak boleh menembak asal jika lawan tertutup bangunan.");
  assert.equal(world.bulletSeq, 0, "Dinding harus mencegah bot membuat proyektil.");
}

process.stdout.write("PASS: movement, combat/VFX, capture, bot AI, scoring, forfeit, dan snapshot multiplayer\n");
