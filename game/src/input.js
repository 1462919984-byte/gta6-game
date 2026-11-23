// Keyboard and mouse input: held keys, a pointer-lock aim vector, and one-shot
// actions queued as bit flags so a press between frames is never dropped. The M
// key toggles the minimap size; J opens the mission panel; pause, entering cars,
// firing and abilities all read from the same queue.

import { KEY } from './config.js';

export const A_ENTER = 1;
export const A_PAUSE = 2;
export const A_FIRE = 4;
export const A_RADIO = 8;
export const A_HORN = 16;
export const A_ABILITY = 32;
export const A_JUMP = 64;
export const A_MISSION = 128;
export const A_MINIMAP = 256;

const held = new Set();
let aimX = 0;
let aimY = 0;
let mouseDown = false;
let buttons = 0;

function matches(code, list) { return list.includes(code); }

export function createInput(target) {
  window.addEventListener('keydown', (event) => {
    held.add(event.code);
    if (event.code === 'Escape' || event.code === 'KeyP') {
      if (!event.repeat) buttons |= A_PAUSE;
      event.preventDefault();
    } else if (event.code === 'KeyF' || event.code === 'Enter' || event.code === 'NumpadEnter') {
      if (!event.repeat) buttons |= A_ENTER;
    } else if (KEY.fire.includes(event.code) && !event.repeat) {
      buttons |= A_FIRE;
    } else if (event.code === 'KeyTab') {
      if (!event.repeat) buttons |= A_RADIO;
      event.preventDefault();
    } else if (event.code === 'KeyH') {
      if (!event.repeat) buttons |= A_HORN;
    } else if (event.code === 'KeyQ' || event.code === 'KeyE' || event.code === 'KeyR') {
      if (!event.repeat) buttons |= A_ABILITY;
    } else if (KEY.mission.includes(event.code)) {
      if (!event.repeat) buttons |= A_MISSION;
    } else if (KEY.minimap.includes(event.code)) {
      if (!event.repeat) buttons |= A_MINIMAP;
    }
  });

  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  target.addEventListener('pointerdown', (event) => {
    if (event.button === 0) { mouseDown = true; buttons |= A_FIRE; }
  });
  target.addEventListener('pointerup', () => { mouseDown = false; });
  target.addEventListener('pointermove', (event) => {
    if (document.pointerLockElement === target) {
      aimX = Math.max(-1, Math.min(1, aimX + event.movementX * 0.0016));
      aimY = Math.max(-1, Math.min(1, aimY + event.movementY * 0.0016));
    }
  });

  return {
    move() {
      let x = 0, y = 0;
      for (const c of KEY.left) if (held.has(c)) x -= 1;
      for (const c of KEY.right) if (held.has(c)) x += 1;
      for (const c of KEY.up) if (held.has(c)) y -= 1;
      for (const c of KEY.down) if (held.has(c)) y += 1;
      return { x, y };
    },
    fwd() {
      let v = 0;
      for (const c of KEY.up) if (held.has(c)) v += 1;
      for (const c of KEY.down) if (held.has(c)) v -= 1;
      return v;
    },
    steer() {
      let v = 0;
      for (const c of KEY.left) if (held.has(c)) v += 1;
      for (const c of KEY.right) if (held.has(c)) v -= 1;
      return v;
    },
    brake() {
      for (const c of ['Space', 'ControlLeft']) if (held.has(c)) return true;
      return false;
    },
    run() {
      for (const c of KEY.run) if (held.has(c)) return true;
      return false;
    },
    aim() { return aimX; },
    aimY() { return aimY; },
    take() { const b = buttons; buttons = 0; return b; },
    keyHeld(codes) { for (const c of codes) if (held.has(c)) return true; return false; },
    mouseDown() { return mouseDown; },
  };
}
