// The player controller: on-foot movement with sprint and stamina, and vehicle
// handling with speed, steering, handbrake, damage and entering/leaving any
// traffic car. It also exposes a single clean position/heading accessor the live
// minimap and camera both read, so there is one source of truth for the player's
// transform every frame.

import { PLAYER, VEHICLE, CITY } from './config.js';

export function createPlayer(world) {
  const pos = { x: 0, z: 60 };
  let heading = Math.PI;       // facing +z
  let inVehicle = false;
  let vehicle = null;
  let speed = 0;
  let hp = PLAYER.maxHealth;
  let armour = 0;
  let dents = 0;
  let stamina = PLAYER.maxStamina;
  let sprinting = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function enter(v) {
    vehicle = v;
    inVehicle = true;
    speed = 0;
    sprinting = false;
  }

  function exit() {
    const side = Math.sign(Math.random() - 0.5) || 1;
    let ex = vehicle.x + side * VEHICLE.exitOffset;
    let ez = vehicle.z + VEHICLE.exitOffset;
    if (world.blockedCircle(ex, ez, PLAYER.radius)) {
      ex = vehicle.x - side * VEHICLE.exitOffset;
      ez = vehicle.z - VEHICLE.exitOffset;
    }
    pos.x = ex;
    pos.z = ez;
    inVehicle = false;
    vehicle = null;
    speed = 0;
  }

  function nearestCar(traffic) {
    let best = null;
    let bestD = VEHICLE.enterRadius;
    for (const c of traffic.cars) {
      const d = Math.hypot(c.x - pos.x, c.z - pos.z);
      if (d < bestD) { bestD = d; best = c; }
    }
    return best;
  }

  function step(dt, input, traffic, onFoot) {
    if (!inVehicle) {
      // On foot: walk or sprint. Sprint only while the stamina tank has charge,
      // and stamina only refills while not sprinting.
      const move = input.move();
      const wantsSprint = input.run();
      sprinting = wantsSprint && stamina > 0;
      const speedNow = sprinting ? PLAYER.runSpeed : PLAYER.walkSpeed;
      if (sprinting) stamina = Math.max(0, stamina - PLAYER.sprintDrain * dt);
      else stamina = Math.min(PLAYER.maxStamina, stamina + PLAYER.sprintRegen * dt);

      const mx = move.x;
      const mz = move.y;
      const len = Math.hypot(mx, mz) || 1;
      const nx = mx / len;
      const nz = mz / len;
      const sx = pos.x + nx * speedNow * dt;
      const sz = pos.z + nz * speedNow * dt;
      if (!world.blockedCircle(sx, sz, PLAYER.radius) && !world.isWater(sx, sz)) {
        pos.x = sx;
        pos.z = sz;
      }
      if (len > 0.1) heading = Math.atan2(nx, nz);
      onFoot();
      return;
    }

    // Driving.
    const fwd = input.fwd();
    const steer = input.steer();
    const braking = input.brake();
    const target = fwd > 0 ? VEHICLE.maxSpeed : fwd < 0 ? -12 : 0;

    if (braking) speed = clamp(speed - VEHICLE.brake * dt, -12, VEHICLE.maxSpeed);
    else if (target > speed) speed = Math.min(target, speed + VEHICLE.accel * dt);
    else speed = Math.max(target, speed - VEHICLE.brake * dt);

    const steerFactor = 1 - Math.min(0.82, Math.abs(speed) / (VEHICLE.maxSpeed * 1.4));
    heading += steer * VEHICLE.turn * steerFactor * dt;

    const vx = Math.sin(heading) * speed;
    const vz = Math.cos(heading) * speed;

    let hit = false;
    if (world.blockedCircle(vehicle.x + vx * dt, vehicle.z + vz * dt, 1.1) || world.isWater(vehicle.x + vx * dt, vehicle.z + vz * dt)) {
      speed *= -0.25;
      hit = true;
    } else {
      vehicle.x += vx * dt;
      vehicle.z += vz * dt;
    }

    if (hit && Math.abs(speed) > 5) {
      dents = Math.min(VEHICLE.maxDents, dents + Math.abs(speed) * 2.4);
    }

    pos.x = vehicle.x;
    pos.z = vehicle.z;
    vehicle.heading = heading;
    vehicle.speed = speed;
    vehicle.dents = dents;

    if (vehicle.mesh) {
      vehicle.mesh.position.set(vehicle.x, 0.05, vehicle.z);
      vehicle.mesh.rotation.y = heading;
    }
  }

  return {
    pos,
    get heading() { return heading; },
    get inVehicle() { return inVehicle; },
    get vehicle() { return vehicle; },
    get speed() { return speed; },
    set speed(v) { speed = clamp(v, -12, VEHICLE.maxSpeed); },
    get hp() { return hp; },
    get armour() { return armour; },
    get dents() { return dents; },
    get stamina() { return stamina; },
    get sprinting() { return sprinting; },
    set hp(v) { hp = clamp(v, 0, PLAYER.maxHealth); },
    set armour(v) { armour = clamp(v, 0, PLAYER.maxArmour); },
    set dents(v) { dents = clamp(v, 0, VEHICLE.maxDents); },
    // One clean accessor for everything that needs the player's transform.
    get transform() {
      return { x: pos.x, z: pos.z, heading, inVehicle, speed, stamina };
    },
    enter, exit, nearestCar, step,
    reset() {
      pos.x = 0; pos.z = 60; heading = Math.PI; inVehicle = false; vehicle = null;
      speed = 0; hp = PLAYER.maxHealth; armour = 0; dents = 0;
      stamina = PLAYER.maxStamina; sprinting = false;
    },
  };
}
