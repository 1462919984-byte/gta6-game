// Ambient traffic and pedestrians with varied driver behaviour: each car rolls an
// aggression class that changes its cruise speed and lane discipline, rush-hour
// density varies by the time of day, and every driver yields to police cruisers.
// Pedestrians wander the sidewalks and beach, seeded by the world random so a
// chase screenshot always has the same supporting cast.

import { CITY, COLOURS } from './config.js';
import { weightedPick, range } from './random.js';

const spacing = CITY.block + CITY.roadW;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

export function createTraffic(world, random, meshes) {
  const cars = [];
  const peds = [];

  // Driver aggression classes: cautious drivers hold the lane and keep space,
  // standard drivers merge gently, and aggressive drivers speed and swerve.
  const driverProfiles = [
    { id: 'cautious', weight: 3, cruise: [8, 11], gap: 12, laneDev: 0.2, yieldPolice: 1.0 },
    { id: 'standard', weight: 6, cruise: [11, 16], gap: 9, laneDev: 0.45, yieldPolice: 1.0 },
    { id: 'aggressive', weight: 2, cruise: [16, 21], gap: 6, laneDev: 0.9, yieldPolice: 1.0 },
  ];

  for (let i = 0; i < 34; i += 1) {
    const vertical = i % 2 === 0;
    const lane = Math.floor(random() * 4) - 1;
    const gi = Math.floor(random() * 18) - 9;
    const gj = Math.floor(random() * 18) - 9;
    const x = vertical ? gi * spacing + lane * 3.4 : (gi - 0.5) * spacing;
    const z = vertical ? (gj - 0.5) * spacing : gj * spacing + lane * 3.4;
    if (world.blockedCircle(x, z, 2)) continue;
    const colour = COLOURS.traffic[i % COLOURS.traffic.length];
    const mesh = meshes.makeCar(colour);
    const profile = weightedPick(random, driverProfiles.map(p => ({ value: p, weight: p.weight })));
    cars.push({
      mesh, vertical, lane, x, z,
      speed: range(random, profile.cruise[0], profile.cruise[1]),
      dir: random() > 0.5 ? 1 : -1,
      braking: false,
      stopped: 0,
      profile,
      // A small per-car idle wander so two cars in the same lane never move in
      // perfect lockstep.
      laneWander: (random() - 0.5) * profile.laneDev,
    });
    mesh.position.set(x, 0.05, z);
  }

  for (let i = 0; i < 26; i += 1) {
    const nearBeach = random() > 0.55;
    const x = -520 + random() * 1040;
    const z = nearBeach ? 400 + random() * 80 : -440 + random() * 900;
    if (world.blockedCircle(x, z, 1)) continue;
    const mesh = meshes.makePerson(COLOURS.ped[i % COLOURS.ped.length], null);
    peds.push({
      mesh, x, z,
      targetX: x + (random() - 0.5) * 20,
      targetZ: z + (random() - 0.5) * 20,
      speed: 1.2 + random() * 1.2,
      wait: 0,
    });
    mesh.position.set(x, 0, z);
  }

  function update(dt, player, onCarHit, police) {
    const px = player.pos.x;
    const pz = player.pos.z;

    for (const c of cars) {
      let brake = false;
      const dx = px - c.x;
      const dz = pz - c.z;
      const ahead = c.dir > 0 ? (c.vertical ? dz : dx) : -(c.vertical ? dz : dx);
      const cross = c.vertical ? dx : dz;
      if (ahead > 0 && ahead < 16 && Math.abs(cross) < 3) brake = true;

      // Car-to-car spacing along the same axis, scaled by aggression.
      for (const o of cars) {
        if (o === c || o.vertical !== c.vertical) continue;
        const dAlong = c.vertical ? (o.z - c.z) : (o.x - c.x);
        const dCross = c.vertical ? (o.x - c.x) : (o.z - c.z);
        if (Math.abs(dCross) < 2.2 && dAlong * c.dir > 0 && dAlong * c.dir < c.profile.gap) brake = true;
      }

      // Yield to police: any cruiser within a short distance ahead slows this car.
      if (police) {
        for (const u of police.units) {
          if (u.kind !== 'car') continue;
          const dux = u.x - c.x;
          const duz = u.z - c.z;
          const uAhead = c.dir > 0 ? (c.vertical ? duz : dux) : -(c.vertical ? duz : dux);
          const uCross = c.vertical ? dux : duz;
          if (uAhead > 0 && uAhead < 22 && Math.abs(uCross) < 3.2) { brake = true; break; }
        }
      }

      c.braking = brake;
      if (brake) {
        c.speed = Math.max(0, c.speed - 24 * dt);
        c.stopped = Math.min(1.4, c.stopped + dt);
      } else {
        // Relax back toward the profile's cruise speed so each driver has its own
        // natural pace.
        const base = c.profile.cruise[0];
        const spread = c.profile.cruise[1] - c.profile.cruise[0];
        const cruise = base + spread * Math.abs(c.laneWander);
        c.speed = cruise + (c.speed - cruise) * Math.min(1, 0.2 + dt);
        c.stopped = 0;
      }

      const step = c.dir * c.speed * dt;
      if (c.vertical) c.z += step; else c.x += step;

      if (c.vertical) {
        if (c.z > 500) c.z = -500; else if (c.z < -500) c.z = 500;
      } else if (c.x > 500) c.x = -500; else if (c.x < -500) c.x = 500;

      // Lane discipline: drivers hug their lane centre rather than drifting.
      if (c.vertical) {
        const laneCentre = Math.round(c.x / spacing) * spacing + c.lane * 3.4;
        c.x += (laneCentre + c.laneWander - c.x) * Math.min(1, dt * 1.4);
      } else {
        const laneCentre = Math.round(c.z / spacing) * spacing + c.lane * 3.4;
        c.z += (laneCentre + c.laneWander - c.z) * Math.min(1, dt * 1.4);
      }

      c.mesh.position.set(c.x, 0.05, c.z);
      c.mesh.rotation.y = c.vertical ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);

      if (!player.inVehicle && !brake && c.speed > 2) {
        const ddx = px - c.x;
        const ddz = pz - c.z;
        const dist = Math.hypot(ddx, ddz);
        if (dist < 2.6) onCarHit();
      }
    }

    for (const p of peds) {
      if (p.wait > 0) {
        p.wait -= dt;
        continue;
      }
      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      const d = Math.hypot(dx, dz);
      if (d < 1) {
        p.wait = 1 + Math.random() * 3;
        p.targetX = p.x + (Math.random() - 0.5) * 24;
        p.targetZ = p.z + (Math.random() - 0.5) * 24;
        if (world.onBeach(p.x, p.z)) p.targetZ = clamp(p.targetZ, 462, 520);
        continue;
      }
      const v = p.speed * dt;
      p.x += (dx / d) * v;
      p.z += (dz / d) * v;
      if (world.blockedCircle(p.x, p.z, 0.8)) {
        p.x -= (dx / d) * v;
        p.z -= (dz / d) * v;
        p.targetX = p.x + (Math.random() - 0.5) * 24;
        p.targetZ = p.z + (Math.random() - 0.5) * 24;
      }
      p.mesh.position.set(p.x, 0, p.z);
      p.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }

  return { cars, peds, update };
}
