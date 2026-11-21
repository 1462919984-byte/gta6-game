// All tuning numbers, colours and world constants for Solara Coast live here so the
// rest of the game never hard-codes a magic value.

export const STEP = 1 / 60;

export const CITY = {
  name: 'SOLARA COAST',
  half: 560,          // half-width of the city grid in metres
  roadW: 14,          // road width
  block: 46,          // building block size
  lanes: 2,
};

export const COLOURS = {
  skyTop: '#2b4a8f',
  skyMid: '#c77b4a',
  skyLow: '#f6c177',
  sun: '#ffd27a',
  water: '#2e8fb0',
  waterDeep: '#1d6d8c',
  sand: '#e7c98e',
  road: '#2a2d34',
  roadLine: '#d9b45a',
  sidewalk: '#8a857a',
  buildingA: '#e8c99a',
  buildingB: '#d9a878',
  buildingC: '#c9816a',
  buildingD: '#9f7e6d',
  window: '#ffd98a',
  palmTrunk: '#8a6a50',
  palmLeaf: '#4f9e6b',
  cop: '#1c2f5a',
  copLightBlue: '#3d8bff',
  copLightRed: '#ff4b4b',
  player: '#3f9bd9',
  enemy: '#c94f4f',
  traffic: ['#c9d2d8', '#b3544a', '#5a7fae', '#e3e0d5', '#3a6f4f', '#d8a24a', '#7a5fa8'],
  ped: ['#d9b8a3', '#b98a6a', '#8a6a52', '#e0d5c9', '#5f4a3a'],
};

export const PLAYER = {
  walkSpeed: 6.5,
  runSpeed: 10.5,
  radius: 0.55,
  height: 1.8,
  maxHealth: 100,
  maxArmour: 100,
};

export const VEHICLE = {
  enterRadius: 3.2,
  exitOffset: 1.8,
  maxSpeed: 44,
  accel: 17,
  brake: 26,
  turn: 1.9,
  maxDents: 100,
};

export const WANTED = {
  maxStars: 5,
  decay: 0.045,
  baseCool: 6,
  cooldownPerStar: 2.2,
  searchRadius: 130,
  airRadius: 90,
};

export const WEAPONS = [
  { id: 'fists', name: 'FISTS', slot: 1, ammo: -1, damage: 12, range: 2.4, rate: 0.35, colour: '#e8e0d0' },
  { id: 'pistol', name: 'M9 VOLT', slot: 2, ammo: 96, damage: 26, range: 60, rate: 0.22, colour: '#9fb0c0' },
  { id: 'smg', name: 'FALCO SMG', slot: 3, ammo: 240, damage: 16, range: 48, rate: 0.09, colour: '#7fa8d8' },
  { id: 'shotgun', name: 'MAREA 12', slot: 4, ammo: 48, damage: 62, range: 22, rate: 0.85, colour: '#d8a24a' },
  { id: 'rifle', name: 'CORCEL R-7', slot: 5, ammo: 150, damage: 34, range: 90, rate: 0.14, colour: '#5a7fae' },
];

export const RADIO = [
  { name: 'SOLARA FM 96.4', line: 'Golden hour, every hour — Solara FM.' },
  { name: 'COASTAL BEATS 88.7', line: 'Sun, salt and bass. You are on Coastal Beats.' },
  { name: 'LA NOCHE 103', line: 'Night market anthems from Old Mariposa.' },
  { name: 'MARIACHI GOLD', line: 'Horns up for the gold coast, mi gente.' },
  { name: 'THE DRIFT', line: 'Keeping it slow down the boulevard.' },
];

export const CREW = [
  { id: 'mara', name: 'MARA SOL', role: 'DRIVER', key: 'KeyQ', ability: 'SLIPSTREAM', desc: 'Speed boost while driving.', cooldown: 9 },
  { id: 'tito', name: 'TITO CRUZ', role: 'MECHANIC', key: 'KeyE', ability: 'QUICK FIX', desc: 'Repairs 30% of the car body.', cooldown: 12 },
  { id: 'nia', name: 'NIA FONTAINE', role: 'LOOKOUT', key: 'KeyR', ability: 'EYES OUT', desc: 'Drops wanted heat by one star.', cooldown: 16 },
];

export const DISTRICTS = [
  { id: 'mariposa', name: 'OLD MARIPOSA', blurb: 'Stilt houses and the night market', friendly: 74 },
  { id: 'vista', name: 'VISTA DEL SOL', blurb: 'Palm-lined beach boulevard', friendly: 62 },
  { id: 'coral', name: 'CORAL HEIGHTS', blurb: 'Glass towers and rooftop bars', friendly: 41 },
  { id: 'palma', name: 'PALMA VIEJA', blurb: 'Cobbled alleys under bougainvillea', friendly: 85 },
  { id: 'mirador', name: 'MIRADOR HILLS', blurb: 'Winding lanes above the bay', friendly: 33 },
  { id: 'puerto', name: 'PUERTO NUEVO', blurb: 'Cargo docks and salt air', friendly: 18 },
];

export const KEY = {
  up: ['KeyW', 'ArrowUp'],
  down: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  run: ['ShiftLeft', 'ShiftRight'],
  enter: ['KeyF', 'Enter'],
  fire: ['Mouse0', 'Space'],
  aim: ['Mouse2'],
  switch: ['Key1', 'Key2', 'Key3', 'Key4', 'Key5'],
  pause: ['Escape', 'KeyP'],
  interact: ['KeyF'],
  horn: ['KeyH'],
  radio: ['KeyTab'],
  mission: ['KeyM'],
};
