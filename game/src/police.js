// The wanted system and the CBP (Coastal Bay Police) response. Wanted stars climb
// with each crime, cool down only while the player stays out of sight, and the
// response escalates from a pair of foot officers to a coordinated multi-unit
// pursuit with interceptors that cut off escape routes, roadblocks at three stars,
// and the Air One helicopter above four. Every unit is a real agent in the world.

import * as THREE from 'three';
import { WANTED, VEHICLE, COLOURS } from './config.js';

export function createPolice(world, meshes) {
  let wanted = 0;
  let seenTimer = 0;           // consecutive seconds the player has been out of sight
  let hidden = false;
  let dispatchGeneration = 0;
  let searchLight = null;
  const units = [];
  const blocks = [];           // roadblock cars + barrier meshes
  const response = [];
  let playerX = 0;
  let playerZ = 0;
  let lastWanted = 0;

  function addWanted(stars) {
    const before = wanted;
    wanted = Math.min(WANTED.maxStars, wanted + stars);
    seenTimer = 0;
    if (wanted > before) dispatch();
  }

  function dropStar() {
    wanted = Math.max(0, wanted - 1);
    dispatch();
  }

  function canSee(ux, uz) {
    // A unit has line of sight only if it is within its detection range and no
    // building footprint blocks the straight segment to the player.
    const d = Math.hypot(playerX - ux, playerZ - uz);
    if (d > WANTED.losRange) return false;
    return !world.segmentBlocked(ux, uz, playerX, playerZ);
  }

  function groundTarget(px, pz) {
    const heading = Math.atan2(playerX - px, playerZ - pz);
    return heading;
  }

  function aheadPoint(px, pz, distance) {
    // Extrapolate the player's current movement direction forward by `distance`.
    const heading = playerHeading();
    return { x: px + Math.sin(heading) * distance, z: pz + Math.cos(heading) * distance };
  }

  function playerHeading() {
    // Fall back to unit-player direction when we have no player reference.
    return (playerHeadingHint ?? Math.atan2(playerX, playerZ));
  }

  let playerHeadingHint = null;

  function setPlayerHeading(h) { playerHeadingHint = h; }

  function dispatch() {
    for (const u of units) if (u.mesh) u.mesh.visible = false;
    for (const b of blocks) if (b.mesh) b.mesh.visible = false;
    units.length = 0;
    blocks.length = 0;
    response.length = 0;
    dispatchGeneration += 1;

    if (wanted <= 0) return;

    const count = WANTED.unitCounts[wanted] ?? WANTED.unitCounts[WANTED.unitCounts.length - 1];
    const carCount = Math.round(count * WANTED.carRatio);
    const footCount = count - carCount;
    const tactics = ['INTERCEPT', 'FLANK LEFT', 'FLANK RIGHT', 'PURSUIT', 'SHORE WATCH'];

    for (let i = 0; i < count; i += 1) {
      const isCar = i < carCount;
      const mesh = isCar ? meshes.makeCopCar() : meshes.makeCop();
      const unit = {
        kind: isCar ? 'car' : 'foot',
        mesh,
        x: 0, z: 0,
        speed: isCar ? WANTED.unitTopSpeed - Math.random() * 6 : 9 + Math.random() * 5,
        tactic: tactics[i % tactics.length],
        callsign: `CBP-${10 + i}${'ABCD'[i % 4]}`,
        hp: isCar ? 100 : 40,
        role: i === 0 ? 'interceptor' : i % 2 === 1 ? 'flank-left' : i % 2 === 0 ? 'flank-right' : 'pursuit',
        ram: wanted >= 3 && isCar && i < 2,
      };
      units.push(unit);
      response.push({ callsign: unit.callsign, tactic: unit.tactic, distance: 0 });
    }

    if (wanted >= WANTED.helicopterLevel) {
      const air = {
        kind: 'air', mesh: meshes.makeHelicopter(),
        x: 0, z: 0, speed: 40, tactic: 'AIR ONE', callsign: 'AIR-1',
        hp: 200, height: 46,
      };
      units.push(air);
      response.push({ callsign: air.callsign, tactic: air.tactic, distance: 0 });
    }

    if (wanted >= WANTED.roadblockLevel) {
      placeRoadblocks();
    }
  }

  function placeRoadblocks() {
    const ah = aheadPoint(playerX, playerZ, WANTED.roadblockAhead);
    const spot = world.nearestRoadblockPoint(ah.x, ah.z);
    if (!spot) return;
    const heading = playerHeading();
    // Park two cruisers and a barrier across the road, rotated to the road line.
    for (let side = -1; side <= 1; side += 1) {
      const offset = side * 5.2;
      const b = { x: spot.x, z: spot.z, r: 3.2, mesh: meshes.makeCopCar() };
      if (spot.vertical) {
        b.x = spot.x + offset;
        b.mesh.rotation.y = Math.PI / 2;
      } else {
        b.z = spot.z + offset;
        b.mesh.rotation.y = 0;
      }
      b.mesh.position.set(b.x, 0.05, b.z);
      blocks.push(b);
    }
    // A striped barrier closes the remaining gap.
    const barrier = meshes.makeRoadblockBarrier ? meshes.makeRoadblockBarrier() : null;
    if (barrier) {
      barrier.position.set(spot.x, 0, spot.z);
      barrier.rotation.y = spot.vertical ? Math.PI / 2 : 0;
      blocks.push({ x: spot.x, z: spot.z, r: 2.6, mesh: barrier, barrier: true });
    }
  }

  function spawnAt(px, pz) {
    playerX = px;
    playerZ = pz;
    for (let i = 0; i < units.length; i += 1) {
      const u = units[i];
      const ang = (i / Math.max(1, units.length)) * Math.PI * 2 + 0.4;
      u.x = px + Math.cos(ang) * (30 + i * 6);
      u.z = pz + Math.sin(ang) * (30 + i * 6);
      u.mesh.position.set(u.x, u.kind === 'air' ? u.height : 0.05, u.z);
      u.mesh.visible = true;
    }
    for (const b of blocks) b.mesh.visible = true;
  }

  function update(dt, player, scene, onBusted, onRam) {
    playerX = player.pos.x;
    playerZ = player.pos.z;
    playerHeadingHint = player.heading ?? playerHeadingHint;

    if (wanted <= 0) { hidden = true; seenTimer = 0; return; }

    // A unit with line of sight resets the escape timer; with no sightings for the
    // sustained cooldown, one star decays.
    let anySeen = false;
    for (const u of units) {
      if (u.kind === 'air') { anySeen = true; break; }  // Air One holds sight above 3 stars
      if (canSee(u.x, u.z)) { anySeen = true; break; }
    }
    if (anySeen) seenTimer = 0; else seenTimer += dt;
    hidden = !anySeen;

    const needed = WANTED.escapeTime + wanted * WANTED.escapePerStar;
    if (seenTimer > needed) {
      wanted -= 1;
      seenTimer = 0;
      dispatch();
      if (wanted <= 0) return;
    }

    // Searchlight.
    if (searchLight === null) {
      searchLight = new THREE.SpotLight(COLOURS.copLightBlue, 0, 220, 0.5, 0.4);
      searchLight.position.set(playerX, 90, playerZ);
      searchLight.target.position.set(playerX, 0, playerZ);
      scene.add(searchLight);
      scene.add(searchLight.target);
    }
    searchLight.intensity = wanted >= WANTED.helicopterLevel ? 2.2 : wanted >= 3 ? 1.2 : 0;
    searchLight.position.set(playerX, 84, playerZ + 4);
    searchLight.target.position.set(playerX, 0, playerZ);

    for (let i = 0; i < units.length; i += 1) {
      const u = units[i];
      const dx = playerX - u.x;
      const dz = playerZ - u.z;
      const dist = Math.hypot(dx, dz) || 1;

      if (u.kind === 'air') {
        u.x += (dx / dist) * u.speed * dt;
        u.z += (dz / dist) * u.speed * dt;
        u.x = Math.max(-520, Math.min(520, u.x));
        u.z = Math.max(-520, Math.min(520, u.z));
        u.mesh.position.set(u.x, u.height, u.z);
        u.mesh.rotation.y += dt * 6;
      } else {
        let tx = playerX;
        let tz = playerZ;
        // Coordinated approach: interceptors and flankers lead the player rather
        // than all chasing from behind, cutting off the most likely escape line.
        if (u.role === 'interceptor') {
          const p = aheadPoint(playerX, playerZ, WANTED.interceptAhead);
          tx = p.x; tz = p.z;
        } else if (u.role === 'flank-left' || u.role === 'flank-right') {
          const side = u.role === 'flank-left' ? -1 : 1;
          const p = aheadPoint(playerX, playerZ, WANTED.flankAhead);
          const h = playerHeading();
          tx = p.x + Math.cos(h) * side * 30;
          tz = p.z - Math.sin(h) * side * 30;
        }

        const ddx = tx - u.x;
        const ddz = tz - u.z;
        const d = Math.hypot(ddx, ddz) || 1;
        const vx = (ddx / d) * u.speed;
        const vz = (ddz / d) * u.speed;
        u.x += vx * dt;
        u.z += vz * dt;
        u.mesh.position.set(u.x, 0.05, u.z);
        u.mesh.rotation.y = Math.atan2(vx, vz);

        if (u.ram && u.kind === 'car' && dist < 3.2) onRam(u);
        if (u.kind === 'foot' && dist < 2.4) {
          player.hp -= 2 * dt * 30;
          if (player.hp <= 0) onBusted();
        }
        if (!player.inVehicle && dist < 1.6 && u.kind === 'foot') onBusted();
      }

      const r = response[i];
      if (r) r.distance = Math.round(dist);
    }

    // Roadblocks stop the player's car when driven into.
    if (player.inVehicle) {
      for (const b of blocks) {
        const d = Math.hypot(b.x - playerX, b.z - playerZ);
        if (d < b.r + 1.1) {
          player.speed *= -0.3;
          player.dents += 6;
        }
      }
    }
  }

  return {
    get wanted() { return wanted; },
    get hidden() { return hidden; },
    get response() { return response; },
    get units() { return units; },
    get blocks() { return blocks; },
    addWanted, dropStar, dispatch, spawnAt, update, setPlayerHeading,
    reset() {
      wanted = 0; seenTimer = 0; hidden = false;
      units.length = 0; blocks.length = 0; response.length = 0;
      playerHeadingHint = null;
    },
  };
}
