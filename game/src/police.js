// The wanted system and the CBP (Coastal Bay Police) response. Wanted stars climb
// with each crime, cool down while hidden, and dispatch escalates from two foot
// officers up to a five-star pursuit with ramming, flanking, a roadblock and the
// Air One helicopter with a searchlight. Every unit is a real agent in the world.

import * as THREE from 'three';
import { WANTED, VEHICLE, COLOURS } from './config.js';

export function createPolice(world, meshes) {
  let wanted = 0;
  let heat = 0;                 // time since the last crime / last seen
  let hidden = false;
  let cooldown = 0;
  const units = [];             // {kind:'foot'|'car'|'air', mesh, x,z, speed, tactic, callsign, hp}
  const blocks = [];            // roadblock cars
  const response = [];          // the last dispatch, for the HUD panel
  let searchLight = null;

  function addWanted(stars) {
    wanted = Math.min(WANTED.maxStars, wanted + stars);
    heat = 0;
    cooldown = 3;
    dispatch();
  }

  function dropStar() {
    wanted = Math.max(0, wanted - 1);
    dispatch();
  }

  function dispatch() {
    // Remove old units so the response always matches the current heat.
    for (const u of units) if (u.mesh) u.mesh.visible = false;
    units.length = 0;
    blocks.length = 0;
    response.length = 0;

    const around = (n, r) => {
      const a = Math.random() * Math.PI * 2;
      return { x: playerX + Math.cos(a) * r, z: playerZ + Math.sin(a) * r };
    };

    if (wanted <= 0) return;

    const count = wanted === 1 ? 2 : wanted === 2 ? 3 : wanted === 3 ? 4 : wanted === 4 ? 5 : 7;
    const tactics = ['RAMMING', 'FLANKING', 'PURSUIT', 'SHORE WATCH', 'MARKSMAN'];
    for (let i = 0; i < count; i += 1) {
      const isCar = i >= Math.ceil(count * 0.4);
      const mesh = isCar ? meshes.makeCopCar() : meshes.makeCop();
      const unit = {
        kind: isCar ? 'car' : 'foot',
        mesh,
        x: 0, z: 0,
        speed: isCar ? 30 + Math.random() * 8 : 9 + Math.random() * 5,
        tactic: tactics[i % tactics.length],
        callsign: `CBP-${(10 + i)}${'ABCD'[Math.floor(Math.random() * 4)]}`,
        hp: isCar ? 100 : 40,
        flank: i % 2 === 1,
        ram: wanted >= 3 && i < 2,
      };
      units.push(unit);
      response.push({ callsign: unit.callsign, tactic: unit.tactic, distance: 0 });
    }

    // Air One above three stars.
    if (wanted >= 3) {
      const air = {
        kind: 'air', mesh: meshes.makeHelicopter(),
        x: 0, z: 0, speed: 38, tactic: 'AIR ONE', callsign: 'AIR-1',
        hp: 200, height: 46,
      };
      units.push(air);
      response.push({ callsign: air.callsign, tactic: air.tactic, distance: 0 });
    }

    // Roadblock above four stars: two cruisers parked across the boulevard ahead.
    if (wanted >= 4) {
      for (let side = -1; side <= 1; side += 2) {
        const car = meshes.makeCopCar();
        const bx = playerX + side * 5;
        const bz = playerZ + 70;
        car.position.set(bx, 0.05, bz);
        blocks.push({ mesh: car, x: bx, z: bz, r: 3.2 });
      }
    }
  }

  function spawnAt(playerX, playerZ) {
    // Re-seed unit positions around the player after dispatch already chose them.
    for (let i = 0; i < units.length; i += 1) {
      const u = units[i];
      const ang = (i / units.length) * Math.PI * 2 + 0.4;
      u.x = playerX + Math.cos(ang) * (30 + i * 6);
      u.z = playerZ + Math.sin(ang) * (30 + i * 6);
      u.mesh.position.set(u.x, u.kind === 'air' ? u.height : 0.05, u.z);
      u.mesh.visible = true;
    }
  }

  function update(dt, player, scene, onBusted, onRam) {
    if (wanted <= 0) return;
    const px = player.pos.x;
    const pz = player.pos.z;
    playerX = px;
    playerZ = pz;

    // Heat: the pursuit cools while the player is out of sight and off-road.
    const seen = distToNearestUnit(px, pz) < 90 || player.inVehicle || player.speed > 14;
    if (seen) heat = 0; else heat += dt;
    hidden = !seen;

    if (heat > WANTED.baseCool + wanted * WANTED.cooldownPerStar) {
      wanted -= 1;
      heat = 0;
      dispatch();
      return;
    }

    // Air One searchlight cone points at the player.
    if (searchLight === null) {
      searchLight = new THREE.SpotLight(COLOURS.copLightBlue, 0, 220, 0.5, 0.4);
      searchLight.position.set(px, 90, pz);
      searchLight.target.position.set(px, 0, pz);
      scene.add(searchLight);
      scene.add(searchLight.target);
    }
    searchLight.intensity = wanted >= 3 ? 2.2 : 0;
    searchLight.position.set(px, 84, pz + 4);
    searchLight.target.position.set(px, 0, pz);

    for (let i = 0; i < units.length; i += 1) {
      const u = units[i];
      const dx = px - u.x;
      const dz = pz - u.z;
      const dist = Math.hypot(dx, dz);
      if (u.kind === 'air') {
        u.x += (dx / (dist || 1)) * u.speed * dt;
        u.z += (dz / (dist || 1)) * u.speed * dt;
        u.x = Math.max(-520, Math.min(520, u.x));
        u.z = Math.max(-520, Math.min(520, u.z));
        u.mesh.position.set(u.x, u.height, u.z);
        u.mesh.rotation.y += dt * 6;
      } else {
        let vx = (dx / (dist || 1)) * u.speed;
        let vz = (dz / (dist || 1)) * u.speed;
        // Flankers curve around; rammers aim straight through.
        if (u.flank && !u.ram) {
          const side = (i % 2 === 0 ? 1 : -1) * 0.5;
          vx = (dx / (dist || 1) + dz / (dist || 1) * side) * u.speed;
          vz = (dz / (dist || 1) - dx / (dist || 1) * side) * u.speed;
        }
        u.x += vx * dt;
        u.z += vz * dt;
        u.mesh.position.set(u.x, 0.05, u.z);
        const targetHeading = Math.atan2(vx, vz);
        u.mesh.rotation.y = targetHeading;

        // Ramming: a fast car that touches the player's car dents and shoves it.
        if (u.ram && u.kind === 'car' && dist < 3.2) {
          onRam(u);
        }
        // Foot officers close in and knock the player's health.
        if (u.kind === 'foot' && dist < 2.4) {
          player.hp -= 2 * dt * 30;
          if (player.hp <= 0) onBusted();
        }
        // A unit that reaches the player on foot busts them.
        if (!player.inVehicle && dist < 1.6 && u.kind === 'foot') {
          onBusted();
        }
      }

      // Keep the response panel distances live.
      const r = response[i];
      if (r) r.distance = Math.round(dist);
    }

    // Roadblocks stop the player's car when driven into.
    if (player.inVehicle) {
      for (const b of blocks) {
        const d = Math.hypot(b.x - px, b.z - pz);
        if (d < b.r + 1.1) {
          player.speed *= -0.3;
          player.dents += 6;
        }
      }
    }
  }

  function distToNearestUnit(px, pz) {
    let best = 1e9;
    for (const u of units) {
      const d = Math.hypot(u.x - px, u.z - pz);
      if (d < best) best = d;
    }
    return best;
  }

  let playerX = 0;
  let playerZ = 0;

  return {
    get wanted() { return wanted; },
    get hidden() { return hidden; },
    get response() { return response; },
    get units() { return units; },
    get blocks() { return blocks; },
    addWanted, dropStar, dispatch, spawnAt, update,
    reset() { wanted = 0; heat = 0; hidden = false; cooldown = 0; units.length = 0; blocks.length = 0; response.length = 0; },
  };
}
