// Boot and the game loop for Solara Coast. Everything is created here: the
// procedural world, the three.js scene, the player, traffic, police, missions,
// combat, audio, save slots, the live minimap and the HUD, then one loop advances
// the simulation in fixed steps and paints every canvas. `?shot=` stages a
// deterministic screenshot scene through stageShot.

import * as THREE from 'three';
import { STEP, RADIO, CREW, DISTRICTS, WEAPONS, MISSION_REWARDS, MINIMAP } from './config.js';
import { hashSeed, createRandom } from './random.js';
import { createWorld } from './world.js';
import { createScene } from './scene.js';
import { createPlayer } from './player.js';
import { createTraffic } from './traffic.js';
import { createPolice } from './police.js';
import { createCombat } from './combat.js';
import { createMissions } from './missions.js';
import { createAudio } from './audio.js';
import { createSave } from './save.js';
import { createClock } from './clock.js';
import { createHud } from './hud.js';
import { createMenus } from './menus.js';
import { createMinimap } from './minimap.js';
import { makePerson, makeCar, makeCopCar, makeCop, makeHelicopter, makePlayer, makeRoadblockBarrier } from './entities.js';
import { A_ENTER, A_PAUSE, A_FIRE, A_RADIO, A_HORN, A_ABILITY, A_MISSION, A_MINIMAP, createInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : hashSeed('solara-2026');

const random = createRandom(seed);
const world = createWorld(random);

const canvas = document.getElementById('gl');
const hudCanvas = document.getElementById('hud');
const minimapCanvas = document.getElementById('minimap');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = createScene(world, renderer);
const meshes = { makePerson, makeCar, makeCopCar, makeCop, makeHelicopter, makePlayer, makeRoadblockBarrier };

const player = createPlayer(world);
const traffic = createTraffic(world, random, meshes);
const police = createPolice(world, meshes);
const combat = createCombat();
const missions = createMissions(random);
const audio = createAudio();
const save = createSave();
const clock = createClock();
const hud = createHud(hudCanvas);
const minimap = createMinimap(minimapCanvas);
const menus = createMenus(hud, save);
const input = createInput(canvas);

save.load();

const state = {
  screen: 'title',
  player, world, traffic, police, combat, missions, save, clock, audio, menus, minimap,
  wanted: 0, cash: 0, respect: 0, rank: 'STREET RAT', completion: 0,
  stats: { carsStolen: 0, copsEscaped: 0, distanceDriven: 0, peopleTakenOut: 0, missionsGold: 0, stuntJumps: 0, collectibles: 0 },
  standing: Object.fromEntries(DISTRICTS.map(d => [d.id, d.friendly])),
  crew: { mara: true, tito: true, nia: true },
  ratings: missions.ratings,
  missionKills: 0,
  radioIndex: 0, sirenTimer: 0, district: 'vista',
  mission: null, banner: null, aiming: false,
  minimapLarge: Boolean(save.settings.minimapLarge),
  rivalMesh: null, footProps: null, shotName,
  missionStartedAt: 0, missionTimer: 0, nextMission: null,
};

const status = document.getElementById('status');
function announce(message) { status.textContent = message; }

const enemies = [];
const downed = [];

function spawnEnemy(x, z, hp = 40) {
  const mesh = meshes.makePerson('#c94f4f', '#c9a884');
  mesh.position.set(x, 0, z);
  const enemy = { x, z, y: 0.9, hp, mesh };
  enemies.push(enemy);
  scene.scene.add(mesh);
  return enemy;
}

function startMission(id) {
  missions.start(id);
  state.mission = missions;
  state.mission.marker = missions.marker(world);
  state.missionStartedAt = performance.now();
  state.missionTimer = 0;
  const s = missions.current.stages[0];
  state.banner = { title: `MISSION ${id} · ${missions.current.name}`, sub: `STAGE 1/${missions.current.stages.length} · ${s.text.toUpperCase()}`, next: s.next };
  announce(`Mission ${id}: ${missions.current.name}`);
  audio.mission();
}

function nextStage() {
  missions.advance();
  if (missions.current) {
    const s = missions.stage;
    state.mission.marker = missions.marker(world);
    state.banner = { title: state.banner?.title ?? '', sub: `STAGE ${missions.stageIndex + 1}/${missions.current.stages.length} · ${s.text.toUpperCase()}`, next: s.next };
    state.cash += MISSION_REWARDS.stageCash;
    state.respect += MISSION_REWARDS.stageRespect;
  }
  audio.stageComplete();
}

function completeMission() {
  if (!missions.current) return;
  const r = missions.rating(missionTimer);
  missions.complete(missionTimer);
  const respectGain = MISSION_REWARDS.respect[r];
  const cashGain = MISSION_REWARDS.cash[missions.list.findIndex(m => m.id === state.nextMission) + 1] ?? 0;
  state.respect += respectGain;
  state.cash += cashGain;
  state.completion = Math.min(100, state.completion + 8.25);
  if (r === 'GOLD') state.stats.missionsGold += 1;
  state.banner = { title: `MISSION COMPLETE — ${r}`, sub: `RESPECT +${respectGain} · CASH +$${cashGain.toLocaleString()}` };
  announce(`Mission complete. Rating ${r}.`);
  audio.mission();
  state.mission = null;
  state.nextMission = Math.min(8, (state.nextMission ?? 1) + 1);
  state.stats.copsEscaped += 1;
}

let missionTimer = 0;

// Mission stage observations used by the typed completion checks.
function missionContext() {
  const marker = state.mission?.marker ?? null;
  return {
    x: player.pos.x,
    z: player.pos.z,
    inVehicle: player.inVehicle,
    vehicleName: player.inVehicle ? player.vehicle?.name : null,
    kills: state.missionKills,
    wanted: police.wanted,
    timer: missions.stageTimer,
    marker,
    distance: state.rivalMesh ? Math.hypot(state.rivalMesh.position.x - player.pos.x, state.rivalMesh.position.z - player.pos.z) : 999,
  };
}

function fireWeapon() {
  if (!combat.canFire()) return;
  const origin = { x: player.pos.x, y: player.inVehicle ? 1.6 : 1.5, z: player.pos.z };
  const dir = aimDirection();
  const targets = [];
  for (const e of enemies) targets.push({ x: e.x, y: 0.9, z: e.z, hp: e.hp, ref: e });
  for (const u of police.units) {
    if (u.kind === 'air' || u.kind === 'rival') continue;
    targets.push({ x: u.x, y: u.kind === 'foot' ? 0.9 : 0.8, z: u.z, hp: u.hp, ref: u });
  }
  const hit = combat.fire(origin, dir, targets);
  if (hit) {
    const entity = hit.ref;
    entity.hp -= combat.weapon().damage;
    audio.hit();
    if (entity.hp <= 0 && entity.mesh) {
      entity.mesh.visible = false;
      if (enemies.includes(entity)) {
        enemies.splice(enemies.indexOf(entity), 1);
        downed.push({ x: entity.x, z: entity.z, mesh: entity.mesh });
        state.stats.peopleTakenOut += 1;
        state.missionKills += 1;
        checkStageKills();
      }
    }
  } else {
    audio.gunshot();
  }
}

function aimDirection() {
  const h = player.heading + input.aim();
  return { x: Math.sin(h), y: input.aimY() * 0.25, z: Math.cos(h) };
}

function checkStageKills() {
  if (!missions.current) return;
  const s = missions.stage;
  if (s && (s.kind === 'kills') && (downed.length >= (s.count ?? 1))) nextStage();
}

function handleInteraction() {
  if (player.inVehicle) {
    player.exit();
    announce('You got out of the car.');
    return;
  }
  const car = player.nearestCar(traffic);
  if (car) {
    player.enter(car);
    car.name = pickCarName();
    state.stats.carsStolen += 1;
    announce(`Carjacked a ${car.name}.`);
    if (police.wanted === 0) police.addWanted(1);
  }
}

function pickCarName() {
  const names = ['MAREA GT', 'FALCO S', 'SIRENA', 'VAQUERO', 'LUZ SPORT', 'COSTA R', 'PALMA CRUISER'];
  return names[Math.floor(Math.random() * names.length)];
}

function startMissionByKey() {
  if (state.screen !== 'play') return;
  if (state.mission?.current) {
    // A stage can be nudged forward when its typed condition already holds.
    if (missionStageReady()) nextStage();
    else announce('Complete the current objective first.');
    return;
  }
  const nextId = state.nextMission ?? 1;
  startMission(nextId);
  state.nextMission = nextId;
  state.missionKills = 0;
}

// Typed completion for the current stage.
function missionStageReady() {
  return missions.stageComplete(missionContext());
}

function missionFailed() {
  return missions.stageFailed(missionContext());
}

function updateMissionProgress() {
  if (!missions.current) return;
  missions.tick(STEP);
  missionTimer += STEP;
  // A destroyed required vehicle fails the stage (recoverable by retrying).
  if (missionFailed()) {
    state.banner = { title: 'MISSION STAGE FAILED', sub: 'Objective lost — press J to restart the stage', next: 'GET BACK IN POSITION' };
    return;
  }
  if (missionStageReady()) {
    const isFinal = missions.stageIndex >= missions.current.stages.length - 1;
    if (isFinal) { completeMission(); return; }
    nextStage();
  }
}

function handleActions(actions) {
  if (actions & A_PAUSE) {
    if (state.screen === 'play') { state.screen = 'pause'; menus.setScreen('pause'); announce('Paused.'); }
    else if (state.screen === 'pause') { state.screen = 'play'; menus.setScreen('none'); announce('Playing.'); }
  }
  if (actions & A_MINIMAP) {
    state.minimapLarge = minimap.toggle();
    save.updateSettings({ minimapLarge: state.minimapLarge });
    announce(`Minimap ${state.minimapLarge ? 'enlarged' : 'shrunk'}.`);
  }
  if (state.screen === 'title') {
    if (actions & (A_FIRE | A_ENTER)) activateTitle();
    return;
  }
  if (state.screen === 'pause') return;
  if (actions & A_ENTER) handleInteraction();
  if (actions & A_MISSION) startMissionByKey();
  if (actions & A_RADIO) { state.radioIndex = (state.radioIndex + 1) % RADIO.length; announce(RADIO[state.radioIndex].name); }
  if (actions & A_HORN && player.inVehicle) audio.hit();
  if (actions & A_ABILITY) useCrewAbility();
}

function activateTitle() {
  const idx = menus.titleIndex;
  if (idx === 0 || idx === 1) { loadSlot(save.slots[0] ?? save.newGame(0)); }
  else if (idx === 2) { loadSlot(save.slots[1] ?? save.newGame(1)); }
  else if (idx === 3) { state.screen = 'pause'; menus.setScreen('pause'); menus.setTab('settings'); }
}

function loadSlot(slot) {
  state.cash = slot.cash; state.respect = slot.respect; state.rank = slot.rank;
  state.completion = slot.completion; state.stats = slot.stats; state.standing = slot.standing; state.crew = slot.crew;
  state.nextMission = slot.mission ?? 1;
  state.minimapLarge = Boolean(save.settings.minimapLarge);
  minimap.setLarge(state.minimapLarge);
  // Resume an in-progress mission stage when a save carries one.
  if (slot.mission && slot.missionStage > 0) {
    missions.restoreStage(slot.mission, slot.missionStage);
    state.mission = missions;
    state.mission.marker = missions.marker(world);
  } else {
    state.mission = null;
  }
  state.screen = 'play'; menus.setScreen('none');
  audio.ensure();
  announce('Playing. Move with WASD, press F to steal a car.');
}

function useCrewAbility() {
  const held = [];
  for (const c of CREW) if (input.keyHeld([c.key])) held.push(c);
  const c = held[0];
  if (!c || !state.crew[c.id]) return;
  if (c.id === 'mara') { state.banner = { title: 'SLIPSTREAM', sub: 'Speed boost active' }; announce('Slipstream!'); }
  else if (c.id === 'tito') { player.dents = Math.max(0, player.dents - 30); state.banner = { title: 'QUICK FIX', sub: 'Body repaired 30%' }; announce('Quick fix applied.'); }
  else if (c.id === 'nia') { if (police.wanted > 0) { police.dropStar(); state.banner = { title: 'EYES OUT', sub: 'Wanted level dropped' }; announce('Heat dropped.'); } }
}

const playerMesh = meshes.makePlayer();
scene.scene.add(playerMesh);
playerMesh.visible = false;

// Hook combat hit feedback into audio: a hit plays the soft hit, a miss plays the
// gunshot, which the fireWeapon path also handles. The hook only adds the marker.
combat.hooks = {
  onHit() { audio.hit(); },
  onMiss() { audio.gunshot(); },
};

function shotAutopilot() {
  if (shotName === 'chase' && player.inVehicle) {
    const heading = Math.PI / 2 + Math.sin(frames * 0.012) * 0.05;
    player.vehicle.speed = 31;
    player.vehicle.heading = heading;
    player.vehicle.x += Math.sin(heading) * 31 * STEP;
    player.vehicle.z += Math.cos(heading) * 31 * STEP;
    player.pos.x = player.vehicle.x;
    player.pos.z = player.vehicle.z;
    player.vehicle.mesh.position.set(player.vehicle.x, 0.05, player.vehicle.z);
    player.vehicle.mesh.rotation.y = heading;
    for (let i = 0; i < police.units.length; i += 1) {
      const u = police.units[i];
      if (u.kind === 'air') {
        u.x = player.pos.x - 30;
        u.z = player.pos.z + 6;
        u.mesh.position.set(u.x, u.height, u.z);
        continue;
      }
      const behind = 16 + i * 6;
      const lateral = (i % 2 === 0 ? -1 : 1) * (4 + i * 1.4);
      u.x = player.pos.x - behind;
      u.z = player.pos.z + lateral;
      u.mesh.position.set(u.x, 0.05, u.z);
      u.mesh.rotation.y = Math.PI / 2;
    }
    if (state.rivalMesh) {
      const rx = player.pos.x + 62;
      state.rivalMesh.position.set(rx, 0.05, player.pos.z);
      state.rivalMesh.rotation.y = Math.PI / 2;
    }
  }
}

function step() {
  clock.step(STEP);
  combat.step(STEP);
  audio.step(STEP, state);

  if (state.screen === 'play') {
    handleActions(input.take());
    player.step(STEP, input, traffic, () => {});
    traffic.update(STEP, player, () => { audio.hit(); }, police);
    if (player.inVehicle) state.stats.distanceDriven += Math.abs(player.speed) * STEP / 1000;
    if (state.mission?.current) missionTimer += STEP;
    if (input.mouseDown() || input.keyHeld(['Space'])) fireWeapon();
    updateMissionProgress();
  }

  state.wanted = police.wanted;
  state.district = world.districtAt(player.pos.x, player.pos.z);
  police.update(STEP, player, scene.scene, () => { audio.busted(); }, () => { player.dents += 4; audio.hit(); });

  playerMesh.position.set(player.pos.x, player.inVehicle ? 1.1 : 0, player.pos.z);
  playerMesh.rotation.y = player.heading;
  playerMesh.visible = !player.inVehicle;

  if (shotName) shotAutopilot();

  const cam = scene.camera;
  if (window.__lastW !== window.innerWidth || window.__lastH !== window.innerHeight) {
    window.__lastW = window.innerWidth;
    window.__lastH = window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    hud.resize();
    minimap.resize();
  }
  const back = 8.4, up = 4.2;
  cam.position.set(player.pos.x - Math.sin(player.heading) * back, up + (player.inVehicle ? 1.4 : 0), player.pos.z - Math.cos(player.heading) * back);
  cam.lookAt(player.pos.x, player.inVehicle ? 1.2 : 1.2, player.pos.z);

  scene.updateSky(clock);
  state.aiming = input.mouseDown() && !player.inVehicle;
}

let frames = 0;
let last = performance.now();
let accumulator = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.25);
  last = now;
  accumulator += dt;
  while (accumulator >= STEP) {
    step();
    accumulator -= STEP;
    frames += 1;
  }
  renderer.render(scene.scene, scene.camera);
  hud.draw(state);
  minimap.draw(state, now);
  if (state.screen === 'title') menus.drawTitle(state);
  else if (state.screen === 'pause') menus.drawPause(state);
}

hudCanvas.addEventListener('pointerdown', (e) => {
  const rect = hudCanvas.getBoundingClientRect();
  const hit = menus.pointer(e.clientX - rect.left, e.clientY - rect.top);
  if (state.screen === 'title' && hit?.type === 'title') { menus.setTitle(hit.index); activateTitle(); }
  else if (state.screen === 'pause' && hit?.type === 'tab') { menus.setTab(menus.tabs[hit.index]); }
});

// Make the pause menu's settings toggle the minimap size and persist it.
const originalToggle = menus.toggleMinimapSize;
menus.toggleMinimapSize = () => {
  state.minimapLarge = originalToggle();
  minimap.setLarge(state.minimapLarge);
  return state.minimapLarge;
};

if (shotName) {
  stageShot(shotName, { state, world, player, traffic, police, combat, missions, clock, meshes });
  if (state.rivalMesh) scene.scene.add(state.rivalMesh);
  if (state.footProps) {
    scene.scene.add(state.footProps.body);
    scene.scene.add(state.footProps.enemy);
  }
  if (state.minimapLarge) minimap.setLarge(true);
  let painted = 0;
  function shotFrame() {
    step();
    renderer.render(scene.scene, scene.camera);
    hud.draw(state);
    minimap.draw(state, performance.now());
    if (state.screen === 'title') menus.drawTitle(state);
    else if (state.screen === 'pause') menus.drawPause(state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(shotFrame);
    else window.__shotReady = true;
  }
  requestAnimationFrame(shotFrame);
} else {
  announce('Solara Coast. Press ENTER or click to begin.');
  requestAnimationFrame(frame);
}
