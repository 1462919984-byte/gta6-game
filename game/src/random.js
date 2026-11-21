// A seeded random generator (mulberry32 plus an FNV-1a string hash) and small
// distribution helpers the city, traffic and missions share. The same seed gives
// the same layout, traffic, pedestrians, mission rolls and screenshot scenes every
// time, which keeps the staged shots deterministic.

export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns a float in [min, max). A seeded drop-in for Math.random ranges.
export function range(random, min, max) {
  return min + random() * (max - min);
}

// Returns a whole number in [min, max], inclusive on both ends.
export function rangeInt(random, min, max) {
  return Math.floor(min + random() * (max - min + 1));
}

// Weighted pick: `choices` is an array of {value, weight} (weights are any
// non-negative numbers, at least one of them positive). Missions use it to roll
// a random failure/success flavour for a stage, and traffic uses it to decide a
// driver's aggression class. Stable with the seeded generator.
export function weightedPick(random, choices) {
  let total = 0;
  for (const c of choices) total += c.weight;
  if (total <= 0) return choices[0] ? choices[0].value : null;
  let roll = random() * total;
  for (const c of choices) {
    roll -= c.weight;
    if (roll <= 0) return c.value;
  }
  return choices[choices.length - 1].value;
}

// Fisher-Yates shuffle that consumes the seeded generator, so a seeded run is
// reproducible while a fresh pick still looks natural.
export function shuffle(random, arr) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
