// Three localStorage save slots for a career in Solara Coast: cash, respect,
// story progress, district standing, the crew, weapons, the live mission stage
// and the player's HUD preferences. The JSON on disk is written and read by the
// title and pause menus without touching the running simulation.

import { DISTRICTS } from './config.js';

const KEY = 'solara-coast.save';

// Old saves wrote only `settings` (volume/music/quality/invertY) and no HUD
// preference. We keep every historical field readable and simply default the new
// ones when they are absent.
function normaliseSettings(raw) {
  return {
    volume: typeof raw?.volume === 'number' ? raw.volume : 0.7,
    music: typeof raw?.music === 'number' ? raw.music : 0.55,
    quality: typeof raw?.quality === 'number' ? raw.quality : 1,
    invertY: Boolean(raw?.invertY),
    minimapLarge: Boolean(raw?.minimapLarge),
  };
}

function normaliseSlot(raw, act) {
  if (!raw) return null;
  const base = fresh(act ?? 1);
  return {
    act: Number.isInteger(raw.act) ? raw.act : base.act,
    mission: Number.isInteger(raw.mission) ? raw.mission : 1,
    // The mission stage is the new field; keep it when present, otherwise the
    // stage-1 default below. Stage indices are zero-based inside a save.
    missionStage: Number.isInteger(raw.missionStage) ? raw.missionStage : 0,
    cash: typeof raw.cash === 'number' ? raw.cash : 0,
    respect: typeof raw.respect === 'number' ? raw.respect : 0,
    rank: typeof raw.rank === 'string' ? raw.rank : 'STREET RAT',
    completion: typeof raw.completion === 'number' ? raw.completion : 0,
    stats: Object.assign({}, base.stats, raw.stats ?? {}),
    standing: Object.assign({}, base.standing, raw.standing ?? {}),
    crew: Object.assign({}, base.crew, raw.crew ?? {}),
    weapons: Array.isArray(raw.weapons) ? raw.weapons.slice() : base.weapons,
  };
}

function fresh(act) {
  return {
    act,
    mission: 1,
    missionStage: 0,
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

export function createSave() {
  let slots = [];
  let settings = normaliseSettings(null);

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      // Keep whatever was stored, normalised per slot so old saves load cleanly.
      const stored = parsed?.slots ?? [null, null, null];
      slots = [0, 1, 2].map(i => normaliseSlot(stored[i], i + 1));
      settings = normaliseSettings(parsed?.settings);
    } catch {
      slots = [null, null, null];
      settings = normaliseSettings(null);
    }
  }

  function persist() {
    try { window.localStorage.setItem(KEY, JSON.stringify({ slots, settings })); } catch { /* private window */ }
  }

  function save(slotIndex, data) {
    slots[slotIndex] = normaliseSlot(data, (slotIndex + 1));
    persist();
  }

  function newGame(slotIndex, act = 1) {
    const data = fresh(act);
    slots[slotIndex] = data;
    persist();
    return data;
  }

  // Settings updates come from the pause menu and keep the save file in sync.
  function updateSettings(patch) {
    settings = normaliseSettings(Object.assign({}, settings, patch));
    persist();
    return settings;
  }

  return { slots, settings, load, persist, save, newGame, fresh, updateSettings };
}
