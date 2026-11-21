// Combat state and rules: weapon slots, ammo, firing with per-weapon spread,
// hit feedback hooks and a hit-marker event the HUD shows. The muzzle tracer and
// the hit marker are drawn by the HUD, but the numbers and the hooks live here so
// the game can play a hit confirmation sound exactly when a bullet connects.

import { WEAPONS } from './config.js';

export function createCombat() {
  const slots = [0, 1, -1, -1, -1];  // fists always, pistol default, others locked
  let current = 0;
  let ammo = { pistol: 96, smg: 240, shotgun: 48, rifle: 150 };
  let cooldown = 0;
  let tracer = null;   // {x,y,z,t} in world space for the HUD to project
  let hitmark = 0;
  let lastHit = null;  // the target object hit by the most recent shot
  const hooks = { onHit: null, onMiss: null };

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

  // Apply a cone of fire to the aim direction using the weapon's spread value.
  function scatter(dir) {
    const w = weapon();
    if (w.id === 'fists') return dir;
    const ang = Math.atan2(dir.x, dir.z);
    const pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    const spread = w.spread;
    // Two independent gaussian-ish rolls keep the cone round rather than square.
    const a = ang + (Math.random() - 0.5) * 2 * spread;
    const p = pitch + (Math.random() - 0.5) * 2 * spread;
    const cp = Math.cos(p);
    return { x: Math.sin(a) * cp, y: Math.sin(p), z: Math.cos(a) * cp };
  }

  function fire(origin, dir, targets) {
    if (!canFire()) return null;
    const w = weapon();
    cooldown = w.rate;
    if (w.ammo !== -1) ammo[w.id] -= 1;

    const d = scatter(dir);
    let best = null;
    let bestT = w.range;
    for (const t of targets) {
      const toX = t.x - origin.x;
      const toY = t.y - origin.y;
      const toZ = t.z - origin.z;
      const dist = Math.hypot(toX, toY, toZ);
      if (dist > w.range) continue;
      const dot = (toX * d.x + toY * d.y + toZ * d.z) / (dist || 1);
      if (dot < 0.86) continue;
      const perp = Math.sqrt(Math.max(0, 1 - dot * dot)) * dist;
      if (perp > 1.6) continue;
      if (dist < bestT) { bestT = dist; best = t; }
    }

    if (best) {
      best.hp -= w.damage;
      hitmark = 0.18;
      lastHit = best;
      if (hooks.onHit) hooks.onHit(best, w);
    } else if (hooks.onMiss) {
      hooks.onMiss();
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
    get lastHit() { return lastHit; },
    set hooks(v) { Object.assign(hooks, v); },
    reset() {
      current = 0; ammo = { pistol: 96, smg: 240, shotgun: 48, rifle: 150 };
      cooldown = 0; tracer = null; hitmark = 0; lastHit = null;
    },
  };
}
