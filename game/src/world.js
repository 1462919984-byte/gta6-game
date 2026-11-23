// Procedural world: the street grid, buildings, palms, docks, beach, water, the
// night market stalls, roadblock spawn points and mission-relevant landmarks.
// It answers the spatial questions the rest of the game asks — is a point on the
// road, on the beach, blocked by a building — and returns a seed-fixed layout so
// the screenshots are reproducible.
//
// The beach boulevard stays a clear palm-lined strip with no building between the
// road and the water, which is what makes the chase cover read as a coastal city.

import { CITY, COLOURS, DISTRICTS } from './config.js';

export function createWorld(random) {
  const { half, block, roadW, boulevardZ } = CITY;
  const spacing = block + roadW;   // 60
  const cellHalf = block / 2;      // 23
  const roadHalf = roadW / 2;      // 7

  const buildings = [];
  const palms = [];
  const lamps = [];
  const docks = [];
  const billboards = [];
  const hydrants = [];
  const stalls = [];
  const district = [];
  const roadblockPoints = [];
  const landmarks = [];

  function addBuilding(x, z, w, d, h, colour, style) {
    buildings.push({ x, z, w, d, h, colour, style });
  }

  function isWater(x, z) {
    return z > 505 || (x > 500 && z > 430) || (x < -500 && z > 430);
  }

  function onBeach(x, z) {
    return !isWater(x, z) && z > 458 && Math.abs(x) < 520;
  }

  // Iterate the grid cells. Roads run along the k*spacing lines. Cells north of
  // the boulevard are allowed; the strip between boulevard and beach is kept
  // clear so the coastal drive has open sightlines to the water.
  for (let gi = -9; gi <= 9; gi += 1) {
    for (let gj = -9; gj <= 9; gj += 1) {
      const x = gi * spacing + spacing / 2;
      const z = gj * spacing + spacing / 2;
      if (isWater(x, z)) continue;
      // Keep the beachfront open from the boulevard to the water.
      if (z > boulevardZ - 12) continue;

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
        const pick = Math.floor(random() * 5);
        const colour = [COLOURS.buildingA, COLOURS.buildingB, COLOURS.buildingC, COLOURS.buildingD, COLOURS.buildingE][pick];
        const style = random() > 0.5 ? 'flat' : 'tower';
        addBuilding(bx, bz, w, d, h, colour, style);
      }
    }
  }

  // Palm-lined beach boulevard: tall palms on the north side, smaller palms on the
  // sand side, all offset so none stands on the drive line itself.
  for (let x = -520; x <= 520; x += 14) {
    if (Math.abs(x) % 56 < 14) palms.push({ x, z: boulevardZ - 12, s: 1.15 + random() * 0.45 });
  }
  for (let x = -540; x <= 540; x += 6) {
    if (random() > 0.8) palms.push({ x, z: 486 + random() * 18, s: 1 + random() * 0.55 });
  }

  // Street lamps along the boulevard and on the main cross streets.
  for (let k = -8; k <= 8; k += 1) {
    lamps.push({ x: k * spacing, z: boulevardZ + 18, side: 'beach' });
    lamps.push({ x: k * spacing, z: -500, side: 'north' });
    lamps.push({ x: -500, z: k * spacing, side: 'west' });
  }

  // Docks: a little industrial edge in the north-east.
  for (let d = 0; d < 6; d += 1) {
    docks.push({ x: 300 + d * 34, z: 330, w: 26, d: 40 });
  }
  for (let h = 0; h < 8; h += 1) {
    hydrants.push({ x: -420 + h * 118, z: 30, red: true });
  }

  // The Old Mariposa night market: a tight two-row bazaar of open stalls and
  // hanging string lights that doubles as the foot-combat set. Stalls are low
  // (under 3.5m) so the player and enemies stay visible from the over-shoulder cam.
  const market = { x: -360, z: -120 };
  for (let i = 0; i < 14; i += 1) {
    const row = i % 2 === 0 ? -1 : 1;
    const along = (i - 7) * 7;
    stalls.push({
      x: market.x + row * 9,
      z: market.z + along,
      w: 5.4,
      d: 2.6,
      h: 2.8,
      colour: i % 3 === 0 ? COLOURS.stallRoof : COLOURS.stall,
      sign: ['FRUTA', 'TACO', 'RUM', 'CAFÉ', 'SEDA', 'FLOR', 'JOYAS', 'PESCADO'][i % 8],
    });
  }

  // District centres, used by the HUD map, standing system and mission markers.
  const centres = DISTRICTS.map(d => ({ id: d.id, x: d.cx, z: d.cz }));

  // Roadblock spawn points: intersections where a cruiser can park across a road.
  for (let k = -8; k <= 8; k += 1) {
    for (let j = -8; j <= 8; j += 1) {
      const x = k * spacing;
      const z = j * spacing;
      if (isWater(x, z)) continue;
      roadblockPoints.push({ x, z, vertical: true });
      roadblockPoints.push({ x, z: z + spacing / 2, vertical: false });
    }
  }

  // Mission-relevant landmarks: named places the story stages point at.
  landmarks.push(
    { id: 'north-docks', name: 'NORTH DOCKS', x: 300, z: 330 },
    { id: 'night-market', name: 'NIGHT MARKET', x: market.x, z: market.z },
    { id: 'boulevard', name: 'COASTAL BOULEVARD', x: 0, z: boulevardZ },
    { id: 'palm-garage', name: 'PALMA GARAGE', x: -120, z: 200 },
    { id: 'coral-garage', name: 'CORAL GARAGE', x: 330, z: -260 },
    { id: 'mirador-hills', name: 'MIRADOR HILLS', x: 420, z: 140 },
    { id: 'sunset-overlook', name: 'SUNSET OVERLOOK', x: -480, z: 420 },
  );

  function landmark(id) {
    return landmarks.find(l => l.id === id) ?? { id, name: id, x: 0, z: 60 };
  }

  function districtAt(x, z) {
    let best = 'vista';
    let bestD = 1e9;
    for (const c of centres) {
      const d = (c.x - x) * (c.x - x) + (c.z - z) * (c.z - z);
      if (d < bestD) { bestD = d; best = c.id; }
    }
    return best;
  }

  function onRoad(x, z) {
    const gx = x - Math.round(x / spacing) * spacing;
    const gz = z - Math.round(z / spacing) * spacing;
    if (Math.abs(gx) < roadHalf) return true;
    if (Math.abs(gz) < roadHalf) return true;
    if (z > boulevardZ - 8 && z < boulevardZ + 8 && Math.abs(x) < 540) return true;
    return false;
  }

  function snapToRoad(x, z) {
    const gx = Math.round(x / spacing) * spacing;
    const gz = Math.round(z / spacing) * spacing;
    const vDist = Math.abs(x - gx);
    const hDist = Math.abs(z - gz);
    if (vDist <= hDist) return { x: gx, z, vertical: true };
    return { x, z: gz, vertical: false };
  }

  function nearestRoadblockPoint(x, z) {
    let best = null;
    let bestD = 1e9;
    for (const p of roadblockPoints) {
      const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
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

  function segmentBlocked(ax, az, bx, bz) {
    const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 3);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (blockedCircle(ax + (bx - ax) * t, az + (bz - az) * t, 0.6)) return true;
    }
    return false;
  }

  return {
    buildings, palms, lamps, docks, billboards, hydrants, stalls,
    centres, roadblockPoints, landmarks, market,
    districtAt, onRoad, blockedCircle, isWater, onBeach,
    snapToRoad, nearestRoadblockPoint, segmentBlocked, landmark,
    spacing, half,
  };
}
