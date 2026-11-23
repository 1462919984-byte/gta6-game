// Every tuning number, colour, world constant and reward table for Solara Coast
// lives in this one file so the rest of the game never hard-codes a magic value.
// The golden-hour palette is deliberately saturated and warm: terracotta and
// coral buildings, an orange sun low over the ocean, and a long-shadow key light.

export const STEP = 1 / 60;

export const CITY = {
  name: 'SOLARA COAST',
  half: 560,          // half-width of the city grid in metres
  roadW: 14,          // road width
  block: 46,          // building block size
  lanes: 2,
  boulevardZ: 446,    // centre line of the palm-lined beach boulevard
};

export const COLOURS = {
  // Sky gradient stops (top -> mid -> horizon).
  skyTop: '#1f3f8c',
  skyUpper: '#6a5aa8',
  skyMid: '#e0794f',
  skyLow: '#ffb35c',
  skyHorizon: '#ffd9a0',
  sunCore: '#fff3d0',
  sunGlow: '#ffb35c',
  water: '#2e8fb0',
  waterDeep: '#1d6d8c',
  waterSunset: '#c96a4a',
  sand: '#f3d9a8',
  sandDeep: '#e7c98e',
  road: '#33313a',
  roadLine: '#e6c98a',
  sidewalk: '#b9a98c',
  buildingA: '#f0c79a',
  buildingB: '#e6a878',
  buildingC: '#d98a6a',
  buildingD: '#c9776a',
  buildingE: '#b98a78',
  roof: '#8a5a52',
  window: '#ffd98a',
  windowNight: '#7fb7ff',
  palmTrunk: '#8a6a50',
  palmLeaf: '#3fae72',
  palmLeafDark: '#2e8a5a',
  cop: '#1c2f5a',
  copLightBlue: '#3d8bff',
  copLightRed: '#ff4b4b',
  player: '#3f9bd9',
  enemy: '#c94f4f',
  barrier: '#c8503c',
  barrierStripe: '#f2e2c0',
  stall: '#e8b06a',
  stallRoof: '#c9776a',
  stringLight: '#ffd27a',
  stringLightGlow: '#ff9a5a',
  tracer: '#ffd27a',
  traffic: ['#e8d9c0', '#b3544a', '#5a7fae', '#e3e0d5', '#3a6f4f', '#d8a24a', '#7a5fa8', '#c94f6a'],
  ped: ['#d9b8a3', '#b98a6a', '#8a6a52', '#e0d5c9', '#5f4a3a', '#c9a884'],
};

export const PLAYER = {
  walkSpeed: 6.5,
  runSpeed: 10.5,
  radius: 0.55,
  height: 1.8,
  maxHealth: 100,
  maxArmour: 100,
  maxStamina: 100,
  sprintDrain: 24,
  sprintRegen: 30,
  minSprintStamina: 6,
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
  escapeTime: 5.5,
  escapePerStar: 2.0,
  losRange: 112,
  losSamples: 6,
  unitCounts: [0, 2, 3, 4, 6, 8],
  carRatio: 0.45,
  roadblockLevel: 3,
  helicopterLevel: 4,
  interceptAhead: 70,
  flankAhead: 38,
  roadblockAhead: 92,
  pursuitTopSpeed: 42,
  unitTopSpeed: 46,
};

export const MINIMAP = {
  smallRadius: 62,
  largeRadius: 300,
  smallCanvasW: 172,
  smallCanvasH: 172,
  largeCanvasW: 640,
  largeCanvasH: 640,
  refreshMs: 100,
  worldScale: 1.05,
  blip: {
    player: '#4fc3f7',
    police: '#4d8bff',
    traffic: '#9aa4b2',
    mission: '#ffd27a',
    roadblock: '#ff6a5a',
    district: '#6ed27a',
  },
};

export const MISSION_REWARDS = {
  stageCash: 250,
  stageRespect: 15,
  respect: { GOLD: 100, SILVER: 60, BRONZE: 35 },
  cash: [0, 900, 1400, 1800, 2200, 2600, 3000, 3400, 4200],
};

export const WEAPONS = [
  { id: 'fists', name: 'FISTS', slot: 1, ammo: -1, damage: 12, range: 2.4, rate: 0.35, spread: 0.03, colour: '#e8e0d0' },
  { id: 'pistol', name: 'M9 VOLT', slot: 2, ammo: 96, damage: 26, range: 60, rate: 0.22, spread: 0.012, colour: '#9fb0c0' },
  { id: 'smg', name: 'FALCO SMG', slot: 3, ammo: 240, damage: 16, range: 48, rate: 0.09, spread: 0.024, colour: '#7fa8d8' },
  { id: 'shotgun', name: 'MAREA 12', slot: 4, ammo: 48, damage: 62, range: 22, rate: 0.85, spread: 0.065, colour: '#d8a24a' },
  { id: 'rifle', name: 'CORCEL R-7', slot: 5, ammo: 150, damage: 34, range: 90, rate: 0.14, spread: 0.004, colour: '#5a7fae' },
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
  { id: 'mariposa', name: 'OLD MARIPOSA', blurb: 'Stilt houses and the night market', friendly: 74, cx: -360, cz: -120 },
  { id: 'vista', name: 'VISTA DEL SOL', blurb: 'Palm-lined beach boulevard', friendly: 62, cx: 120, cz: 420 },
  { id: 'coral', name: 'CORAL HEIGHTS', blurb: 'Glass towers and rooftop bars', friendly: 41, cx: 330, cz: -260 },
  { id: 'palma', name: 'PALMA VIEJA', blurb: 'Cobbled alleys under bougainvillea', friendly: 85, cx: -120, cz: 200 },
  { id: 'mirador', name: 'MIRADOR HILLS', blurb: 'Winding lanes above the bay', friendly: 33, cx: 420, cz: 140 },
  { id: 'puerto', name: 'PUERTO NUEVO', blurb: 'Cargo docks and salt air', friendly: 18, cx: 300, cz: 320 },
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
  mission: ['KeyJ'],
  minimap: ['KeyM'],
};
