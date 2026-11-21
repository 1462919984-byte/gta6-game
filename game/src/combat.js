// Combat state and rules: weapon slots, ammo, firing, damage and targets. The
// muzzle tracer and the hit marker are drawn by the HUD, but the numbers live here.

import { WEAPONS } from './config.js';

export function createCombat() {
  const slots = [0, 1, -1, -1, -1];  // fists always, pistol default, others locked
  let current = 0;
  let ammo = { pistol: 96, smg: 240, shotgun: 48, rifle: 150 };
  let cooldown = 0;
  let tracer = null;   // {x,y,z,t} in world space for the HUD to project
  let hitmark = 0;

  const weapon = () => WEAPONS[slots[current]];

  function giveWeapon(index) {
    if (index >= 0 && index < slots.length) slots[index] = index;
  }

  function switchTo(slotIndex) {
    if (slotIndex >= 0 && slotIndex < slots.length && slots[slotIndex] >= 0) current = slotIndex;
  }

  function canFire() {
    const w = weapon();
    if (cooldown > 0) return false;
    if (w.ammo === -1) return true;
    return ammo[w.id] > 0;
  }

  function fire(origin, dir, targets) {
    if (!canFire()) return null;
    const w = weapon();
    cooldown = w.rate;
    if (w.ammo !== -1) ammo[w.id] -= 1;

    // Hitscan against the target list.
    let best = null;
    let bestT = w.range;
    for (const t of targets) {
      const toX = t.x - origin.x;
      const toY = t.y - origin.y;
      const toZ = t.z - origin.z;
      const d = Math.hypot(toX, toY, toZ);
      if (d > w.range) continue;
      const dot = (toX * dir.x + toY * dir.y + toZ * dir.z) / (d || 1);
      if (dot < 0.86) continue;
      const perp = Math.sqrt(Math.max(0, 1 - dot * dot)) * d;
      if (perp > 1.6) continue;
      if (d < bestT) { bestT = d; best = t; }
    }
    if (best) {
      best.hp -= w.damage;
      hitmark = 0.18;
    }
    tracer = { x: origin.x, y: origin.y, z: origin.z, t: 0.08 };
    return best;
  }

  function step(dt) {
    if (cooldown > 0) cooldown -= dt;
    if (hitmark > 0) hitmark -= dt;
    if (tracer) {
      tracer.t -= dt;
      if (tracer.t <= 0) tracer = null;
    }
  }

  return {
    slots, current, ammo, weapon, giveWeapon, switchTo, canFire, fire, step,
    get tracer() { return tracer; },
    get hitmark() { return hitmark > 0; },
    reset() { current = 0; ammo = { pistol: 96, smg: 240, shotgun: 48, rifle: 150 }; cooldown = 0; tracer = null; },
  };
}
