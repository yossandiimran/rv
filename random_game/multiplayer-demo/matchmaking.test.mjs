import assert from "node:assert/strict";
import {
  AUTO_MATCH_SECONDS,
  AUTO_MATCH_SHARDS,
  AUTO_MATCH_SLOT_PRIORITY,
  autoMatchCandidateCodes,
  autoMatchRoomCode,
} from "./matchmaking.mjs";

assert.equal(AUTO_MATCH_SECONDS, 15);
assert.equal(AUTO_MATCH_SHARDS, 8);
assert.deepEqual(AUTO_MATCH_SLOT_PRIORITY, [
  ["pejuang", 0],
  ["pejuang", 1],
  ["kolonial", 0],
  ["kolonial", 1],
]);

const fixedNow = 1_800_000_001_000;
const codes = autoMatchCandidateCodes(fixedNow);
assert.equal(codes.length, AUTO_MATCH_SHARDS * 2);
assert.equal(new Set(codes).size, codes.length, "Setiap shard auto matchmaking harus unik.");
assert.ok(codes.every((code) => /^Q[A-Z2-9]{5}$/.test(code)), "Kode publik harus valid sebagai room enam karakter.");
assert.deepEqual(autoMatchCandidateCodes(fixedNow), codes, "User pada jendela waktu sama harus mencari room yang sama.");

const nextWindowCodes = autoMatchCandidateCodes(fixedNow + AUTO_MATCH_SECONDS * 1000);
const overlap = codes.filter((code) => nextWindowCodes.includes(code));
assert.equal(overlap.length, AUTO_MATCH_SHARDS, "Room window sebelumnya harus tetap ditemukan melewati batas bucket.");

const bucket = Math.floor(fixedNow / (AUTO_MATCH_SECONDS * 1000));
assert.equal(new Set(Array.from({ length: AUTO_MATCH_SHARDS }, (_, shard) => autoMatchRoomCode(bucket, shard))).size, AUTO_MATCH_SHARDS);

process.stdout.write("PASS: auto matchmaking 15 detik, shard room, dan prioritas Pejuang\n");
