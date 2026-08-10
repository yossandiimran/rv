export const AUTO_MATCH_SECONDS = 15;
export const AUTO_MATCH_SHARDS = 8;

const AUTO_MATCH_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const AUTO_MATCH_SLOT_PRIORITY = Object.freeze([
  Object.freeze(["pejuang", 0]),
  Object.freeze(["pejuang", 1]),
  Object.freeze(["kolonial", 0]),
  Object.freeze(["kolonial", 1]),
]);

export function autoMatchRoomCode(bucket, shard) {
  const radix = AUTO_MATCH_ALPHABET.length;
  const range = radix ** 5;
  let value = ((bucket * AUTO_MATCH_SHARDS + shard) % range + range) % range;
  let encoded = "";
  for (let index = 0; index < 5; index += 1) {
    encoded = AUTO_MATCH_ALPHABET[value % radix] + encoded;
    value = Math.floor(value / radix);
  }
  return `Q${encoded}`;
}

export function autoMatchCandidateCodes(now = Date.now()) {
  const bucket = Math.floor(now / (AUTO_MATCH_SECONDS * 1000));
  const codes = [];
  for (const candidateBucket of [bucket - 1, bucket]) {
    for (let shard = 0; shard < AUTO_MATCH_SHARDS; shard += 1) {
      codes.push(autoMatchRoomCode(candidateBucket, shard));
    }
  }
  return codes;
}
