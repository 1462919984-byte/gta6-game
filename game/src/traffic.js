// Ambient traffic and pedestrians: lane-following cars that stop for the player and
// for each other, and people who wander the sidewalks and beach. They are seeded by
// the world random so a chase screenshot always has the same supporting cast.

import { CITY, COLOURS } from './config.js';

const spacing = CITY.block + CITY.roadW;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

export function createTraffic(world, random, meshes) {
  const cars = [];
  const peds = [];

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
    cars.push({
      mesh, vertical, lane, x, z,
      speed: 9 + random() * 8,
      dir: random() > 0.5 ? 1 : -1,
      braking: false,
      stopped: 0,
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

  function update(dt, player, onCarHit) {
    const px = player.pos.x;
    const pz = player.pos.z;

    for (const c of cars) {
      // Slow/stop when the player stands or drives in front of this car.
      let brake = false;
      const dx = px - c.x;
      const dz = pz - c.z;
      const ahead = c.dir > 0 ? (c.vertical ? dz : dx) : -(c.vertical ? dz : dx);
      const cross = c.vertical ? dx : dz;
      if (ahead > 0 && ahead < 16 && Math.abs(cross) < 3) brake = true;

      // Simple car-to-car spacing along the same axis.
      for (const o of cars) {
        if (o === c) continue;
        if (o.vertical !== c.vertical) continue;
        const dAlong = c.vertical ? (o.z - c.z) : (o.x - c.x);
        const dCross = c.vertical ? (o.x - c.x) : (o.z - c.z);
        if (Math.abs(dCross) < 2.2 && dAlong * c.dir > 0 && dAlong * c.dir < 9) brake = true;
      }

      c.braking = brake;
      if (brake) {
        c.speed = Math.max(0, c.speed - 24 * dt);
        c.stopped = Math.min(1.4, c.stopped + dt);
      } else {
        c.speed = 11 + (c.speed - 11) * Math.min(1, 0.2 + dt);
        c.stopped = 0;
      }

      const step = c.dir * c.speed * dt;
      if (c.vertical) c.z += step; else c.x += step;

      // Keep cars inside the grid; flip at the edge.
      if (c.vertical) {
        if (c.z > 500) c.z = -500; else if (c.z < -500) c.z = 500;
      } else if (c.x > 500) c.x = -500; else if (c.x < -500) c.x = 500;

      c.mesh.position.set(c.x, 0.05, c.z);
      c.mesh.rotation.y = c.vertical ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);

      // A moving car that reaches the player on foot knocks them back.
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
        if (world.onBeach(p.x, p.z)) {
          p.targetZ = clamp(p.targetZ, 462, 520);
        }
        continue;
      }
      const v = p.speed * dt;
      p.x += (dx / d) * v;
      p.z += (dz / d) * v;
      // Peds stay on ground and walk around buildings by retargeting.
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
