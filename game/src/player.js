// The player controller: on-foot movement with a run button, and vehicle handling
// with speed, steering, handbrake, damage and entering/leaving any traffic car.
// It returns the player's transform each step and keeps the third-person camera.

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

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function enter(v) {
    vehicle = v;
    inVehicle = true;
    speed = 0;
  }

  function exit() {
    // Place the player beside the car, checking the road is not blocked.
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
      // On foot.
      const move = input.move();
      const run = input.run() ? PLAYER.runSpeed : PLAYER.walkSpeed;
      const mx = move.x;
      const mz = move.y;
      const len = Math.hypot(mx, mz) || 1;
      const nx = mx / len;
      const nz = mz / len;
      const sx = pos.x + nx * run * dt;
      const sz = pos.z + nz * run * dt;
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

    // Steering scales down with speed for a stable chase feel.
    const steerFactor = 1 - Math.min(0.82, Math.abs(speed) / (VEHICLE.maxSpeed * 1.4));
    heading += steer * VEHICLE.turn * steerFactor * dt;

    const vx = Math.sin(heading) * speed;
    const vz = Math.cos(heading) * speed;

    // Collide with buildings; a hard hit dents the car.
    let hit = false;
    if (world.blockedCircle(vehicle.x + vx * dt, vehicle.z + vz * dt, 1.1) || world.isWater(vehicle.x + vx * dt, vehicle.z + vz * dt)) {
      speed *= -0.25;
      hit = true;
    } else {
      vehicle.x += vx * dt;
      vehicle.z += vz * dt;
    }

    // A dent on any solid collision; fast impacts dent more.
    if (hit && Math.abs(speed) > 5) {
      dents = Math.min(VEHICLE.maxDents, dents + Math.abs(speed) * 2.4);
    }

    // Keep the player glued to the car for the camera and interactions.
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
    pos, get heading() { return heading; },
    get inVehicle() { return inVehicle; },
    get vehicle() { return vehicle; },
    get speed() { return speed; },
    set speed(v) { speed = clamp(v, -12, VEHICLE.maxSpeed); },
    get hp() { return hp; },
    get armour() { return armour; },
    get dents() { return dents; },
    set hp(v) { hp = clamp(v, 0, PLAYER.maxHealth); },
    set armour(v) { armour = clamp(v, 0, PLAYER.maxArmour); },
    set dents(v) { dents = clamp(v, 0, VEHICLE.maxDents); },
    enter, exit, nearestCar, step,
    reset() {
      pos.x = 0; pos.z = 60; heading = Math.PI; inVehicle = false; vehicle = null;
      speed = 0; hp = PLAYER.maxHealth; armour = 0; dents = 0;
    },
  };
}
