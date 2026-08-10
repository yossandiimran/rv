import assert from "node:assert/strict";
import { TEAMS, createBotInputs, createSnapshot, createWorld, finishByForfeit, stepWorld } from "./sim.mjs";

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
  assert.equal(world.players.p1.ammo, 4);
  assert.equal(world.players.k1.hp, 72, "Tembakan harus dihitung oleh simulasi host.");
  assert.equal(world.tracers.length, 1);
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

process.stdout.write("PASS: movement, combat, capture, bot AI, scoring, forfeit, dan snapshot multiplayer\n");
