// Procedural world: the street grid, buildings, palms, docks, beach, water and every
// static object of Solara Coast. It also answers the questions the rest of the game
// asks of the city — is a point on the road, on the beach, blocked by a building — and
// returns the seed-fixed layout so the screenshots are reproducible.

import { CITY, COLOURS } from './config.js';

export function createWorld(random) {
  const { half, block, roadW } = CITY;
  const spacing = block + roadW;   // 60
  const cellHalf = block / 2;      // 23
  const roadHalf = roadW / 2;      // 7

  const buildings = [];
  const palms = [];
  const lamps = [];
  const docks = [];
  const billboards = [];
  const hydrants = [];
  const district = [];

  // A building lot. `x,z` is the centre of the cell, `w,d` the footprint.
  function addBuilding(x, z, w, d, h, colour, style) {
    buildings.push({ x, z, w, d, h, colour, style });
  }

  function isWater(x, z) {
    return z > 505 || (x > 500 && z > 430) || (x < -500 && z > 430);
  }

  function onBeach(x, z) {
    return !isWater(x, z) && z > 458 && Math.abs(x) < 520;
  }

  // Iterate the grid cells. Roads run along the k*spacing lines.
  for (let gi = -9; gi <= 9; gi += 1) {
    for (let gj = -9; gj <= 9; gj += 1) {
      const x = gi * spacing + spacing / 2;
      const z = gj * spacing + spacing / 2;
      if (isWater(x, z)) continue;

      const r = random();
      const park = r > 0.94 && Math.abs(gi) % 2 === 0;
      const plaza = r < 0.05 && (gj === 0 || gj === 2 || gj === -2);

      if (park) {
        palms.push({ x, z, s: 1 + random() * 0.4 });
        palms.push({ x: x + 8, z: z - 6, s: 1 + random() * 0.4 });
        continue;
      }
      if (plaza) {
        billboards.push({ x: x + 14, z: z - 2, y: 6, s: 2.4, face: gi > 0 ? 1 : -1, label: 'SOLARA COAST' });
        continue;
      }

      // Buildings: 1–4 lots per cell with varied height and a coastal palette.
      const lots = 1 + Math.floor(random() * 3);
      for (let l = 0; l < lots; l += 1) {
        const w = 12 + random() * (cellHalf - 6);
        const d = 12 + random() * (cellHalf - 6);
        const bx = x - cellHalf + 8 + random() * (block - 16 - w);
        const bz = z - cellHalf + 8 + random() * (block - 16 - d);
        const h = 8 + random() * (gj > 0 && gj < 5 ? 34 : 20);
        const pick = Math.floor(random() * 4);
        const colour = [COLOURS.buildingA, COLOURS.buildingB, COLOURS.buildingC, COLOURS.buildingD][pick];
        const style = random() > 0.5 ? 'flat' : 'tower';
        addBuilding(bx, bz, w, d, h, colour, style);
      }
    }
  }

  // Palm-lined beach boulevard (the famous coastal strip along the water).
  for (let x = -520; x <= 520; x += 14) {
    if (Math.abs(x) % 56 < 14) palms.push({ x, z: 448, s: 1.2 + random() * 0.5 });
  }
  // The sea wall and a second row for depth.
  for (let x = -540; x <= 540; x += 6) {
    if (random() > 0.82) palms.push({ x, z: 476 + random() * 22, s: 1 + random() * 0.6 });
  }

  // Street lamps on every other road corner.
  for (let k = -8; k <= 8; k += 1) {
    lamps.push({ x: k * spacing, z: 500, side: 'beach' });
    lamps.push({ x: k * spacing, z: -500, side: 'north' });
  }

  // Docks: a little industrial edge in the north-east.
  for (let d = 0; d < 6; d += 1) {
    docks.push({ x: 300 + d * 34, z: 330, w: 26, d: 40 });
  }
  for (let h = 0; h < 8; h += 1) {
    hydrants.push({ x: -420 + h * 118, z: 30, red: true });
  }

  // District centres, used by the HUD map and standing system.
  const centres = [
    { id: 'mariposa', x: -360, z: -120 },
    { id: 'vista', x: 120, z: 420 },
    { id: 'coral', x: 330, z: -260 },
    { id: 'palma', x: -120, z: 200 },
    { id: 'mirador', x: 420, z: 140 },
    { id: 'puerto', x: 300, z: 320 },
  ];

  function districtAt(x, z) {
    let best = 'vista';
    let bestD = 1e9;
    for (const c of centres) {
      const d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
      if (d < bestD) { bestD = d; best = c.id; }
    }
    return best;
  }

  // Roads lie along grid lines; the beach boulevard is a wide road too.
  function onRoad(x, z) {
    const gx = x - Math.round(x / spacing) * spacing;
    const gz = z - Math.round(z / spacing) * spacing;
    if (Math.abs(gx) < roadHalf) return true;
    if (Math.abs(gz) < roadHalf) return true;
    // Coastal boulevard across the south, above the beach.
    if (z > 430 && z < 462 && Math.abs(x) < 540) return true;
    return false;
  }

  function blockedCircle(x, z, r) {
    for (const b of buildings) {
      const hx = Math.abs(x - b.x);
      const hz = Math.abs(z - b.z);
      if (hx < b.w / 2 + r && hz < b.d / 2 + r) return true;
    }
    for (const dk of docks) {
      const hx = Math.abs(x - dk.x);
      const hz = Math.abs(z - dk.z);
      if (hx < dk.w / 2 + r && hz < dk.d / 2 + r) return true;
    }
    return false;
  }

  return {
    buildings, palms, lamps, docks, billboards, hydrants,
    centres, districtAt, onRoad, blockedCircle, isWater, onBeach,
    spacing, half,
  };
}
