// Boot and the game loop. Everything is created here: the procedural world, the
// three.js scene, the player, traffic, police, missions, combat, audio, save slots
// and the HUD, then one loop advances the simulation in fixed steps and paints both
// canvases. `?shot=chase|foot|map|title` stages a deterministic screenshot scene.

import * as THREE from 'three';
import { STEP, RADIO, CREW, DISTRICTS, WEAPONS } from './config.js';
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
import { makePerson, makeCar, makeCopCar, makeCop, makeHelicopter, makePlayer } from './entities.js';
import { A_ENTER, A_PAUSE, A_FIRE, A_RADIO, A_HORN, A_ABILITY, A_MISSION, createInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : hashSeed('solara-2026');

const random = createRandom(seed);
const world = createWorld(random);

const canvas = document.getElementById('gl');
const hudCanvas = document.getElementById('hud');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = createScene(world, renderer);
const meshes = { makePerson, makeCar, makeCopCar, makeCop, makeHelicopter, makePlayer };

const player = createPlayer(world);
const traffic = createTraffic(world, random, meshes);
const police = createPolice(world, meshes);
const combat = createCombat();
const missions = createMissions(random);
const audio = createAudio();
const save = createSave();
const clock = createClock();
const hud = createHud(hudCanvas);
const menus = createMenus(hud, save);
const input = createInput(canvas);

save.load();

const state = {
  screen: 'title',
  player, world, traffic, police, combat, missions, save, clock, audio, menus,
  wanted: 0, cash: 0, respect: 0, rank: 'STREET RAT', completion: 0,
  stats: { carsStolen: 0, copsEscaped: 0, distanceDriven: 0, peopleTakenOut: 0, missionsGold: 0, stuntJumps: 0, collectibles: 0 },
  standing: Object.fromEntries(DISTRICTS.map(d => [d.id, d.friendly])),
  crew: { mara: true, tito: true, nia: true },
  ratings: missions.ratings,
  radioIndex: 0, sirenTimer: 0, district: 'vista',
  mission: null, banner: null, aiming: false,
  rivalMesh: null, footProps: null, shotName,
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
  const centre = world.centres[id - 1] ?? world.centres[0];
  state.mission.marker = { x: centre.x, z: centre.z };
  state.banner = { title: `MISSION ${id} · ${missions.current.name}`, sub: `OBJECTIVE: ${missions.current.stages[0].text}` };
  announce(`Mission ${id}: ${missions.current.name}`);
  audio.mission();
}

function nextStage() {
  missions.advance();
  if (state.mission?.current) {
    const st = missions.current.stages[missions.stageIndex];
    state.banner = { title: state.banner?.title ?? '', sub: `STAGE ${missions.stageIndex + 1}/${missions.current.stages.length} · ${st.text.toUpperCase()}`, next: st.next };
  }
  audio.collect();
}

function completeMission() {
  if (!missions.current) return;
  const r = missions.rating(missionTimer);
  missions.complete(missionTimer);
  const respectGain = r === 'GOLD' ? 100 : r === 'SILVER' ? 60 : 35;
  state.respect += respectGain;
  state.completion = Math.min(100, state.completion + 8.25);
  if (r === 'GOLD') state.stats.missionsGold += 1;
  state.banner = { title: `MISSION COMPLETE — ${r}`, sub: `RESPECT +${respectGain}` };
  announce(`Mission complete. Rating ${r}.`);
  audio.mission();
  state.mission = null;
  state.nextMission = Math.min(8, (state.nextMission ?? 1) + 1);
}

let missionTimer = 0;

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
  if (!state.mission?.current) return;
  const text = state.mission.current.stages[state.mission.stageIndex].text.toLowerCase();
  if (text.includes('three') && downed.length >= 3) nextStage();
  else if (text.includes('four aisles') && downed.length >= 4) nextStage();
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
    // Advance a stage when the player is near the current objective.
    if (nearObjective()) nextStage();
    else announce('Reach the objective first.');
    return;
  }
  const nextId = state.nextMission ?? 1;
  startMission(nextId);
  state.nextMission = nextId;
}

function nearObjective() {
  const marker = state.mission?.marker;
  if (!marker) return false;
  const d = Math.hypot(marker.x - player.pos.x, marker.z - player.pos.z);
  return d < 18;
}

function updateMissionProgress() {
  if (!state.mission?.current) return;
  // Auto-complete stages driven by proximity (meet, deliver, escape, race checkpoints).
  if (nearObjective()) {
    const stage = state.mission.current.stages[state.mission.stageIndex];
    const isFinal = state.mission.stageIndex >= state.mission.current.stages.length - 1;
    if (isFinal) { completeMission(); return; }
    // Otherwise advance to the next marker.
    const centres = world.centres;
    const nextId = state.mission.current.id;
    // Pick the district centre for the next stage, cycling through the city.
    const idx = (state.mission.stageIndex + 1) % centres.length;
    state.mission.marker = { x: centres[idx].x, z: centres[idx].z };
    nextStage();
  }
}

function handleActions(actions) {
  if (actions & A_PAUSE) {
    if (state.screen === 'play') { state.screen = 'pause'; menus.setScreen('pause'); announce('Paused.'); }
    else if (state.screen === 'pause') { state.screen = 'play'; menus.setScreen('none'); announce('Playing.'); }
  }
  if (state.screen === 'title') {
    if (actions & (A_FIRE | A_ENTER)) activateTitle();
    return;
  }
  if (state.screen === 'pause') {
    if (actions & (A_FIRE | A_ENTER)) { /* tab already set by click or arrows */ }
    return;
  }
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

// Shot-mode autopilot keeps the chase car moving at a steady, readable speed.
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
    // Keep police behind and beside, to the west, matching the live chase.
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
    // Keep the rival SUV a readable distance ahead.
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
    traffic.update(STEP, player, () => { audio.hit(); });
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
  if (state.screen === 'title') menus.drawTitle(state);
  else if (state.screen === 'pause') menus.drawPause(state);
}

hudCanvas.addEventListener('pointerdown', (e) => {
  const rect = hudCanvas.getBoundingClientRect();
  const hit = menus.pointer(e.clientX - rect.left, e.clientY - rect.top);
  if (state.screen === 'title' && hit?.type === 'title') { menus.setTitle(hit.index); activateTitle(); }
  else if (state.screen === 'pause' && hit?.type === 'tab') { menus.setTab(menus.tabs[hit.index]); }
});

if (shotName) {
  stageShot(shotName, { state, world, player, traffic, police, combat, missions, clock, meshes });
  // Add any staged meshes into the scene.
  if (state.rivalMesh) scene.scene.add(state.rivalMesh);
  if (state.footProps) {
    scene.scene.add(state.footProps.body);
    scene.scene.add(state.footProps.enemy);
  }
  let painted = 0;
  function shotFrame() {
    step();
    renderer.render(scene.scene, scene.camera);
    hud.draw(state);
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
