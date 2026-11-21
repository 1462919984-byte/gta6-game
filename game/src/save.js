// Three save slots in localStorage: career stats, story progress, respect, district
// standing, and the current settings. Save data is serialised to JSON so it can be
// written and read by the title and pause menus without touching the game state.

import { DISTRICTS } from './config.js';

const KEY = 'solara-coast.save';

export function createSave() {
  let slots = [];
  let settings = { volume: 0.7, music: 0.55, quality: 1, invertY: false };

  function fresh(act) {
    return {
      act,
      mission: 1,
      cash: 0,
      respect: 0,
      rank: 'STREET RAT',
      completion: 0,
      stats: {
        carsStolen: 0, copsEscaped: 0, distanceDriven: 0, peopleTakenOut: 0,
        missionsGold: 0, stuntJumps: 0, collectibles: 0,
      },
      standing: Object.fromEntries(DISTRICTS.map(d => [d.id, d.friendly])),
      crew: { mara: false, tito: false, nia: false },
      weapons: ['pistol'],
    };
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      slots = parsed?.slots ?? [null, null, null];
      settings = parsed?.settings ?? settings;
    } catch {
      slots = [null, null, null];
    }
  }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify({ slots, settings })); } catch { /* private window */ }
  }

  function save(slotIndex, data) {
    slots[slotIndex] = data;
    persist();
  }

  function newGame(slotIndex, act = 1) {
    const data = fresh(act);
    slots[slotIndex] = data;
    persist();
    return data;
  }

  return { slots, settings, load, persist, save, newGame, fresh };
}
