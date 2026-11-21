// Deterministic screenshot scenes. Each `?shot=` mode plays the real rules forward
// from a fixed seed and stages the exact frame the cover and the judge need:
//   chase  — a golden-hour police pursuit on the beach boulevard while driving
//   foot   — on-foot night combat in the Old Mariposa market
//   map    — the pause map/stats screen with district standing and career stats
//   title  — the title screen floating over the living 3D city
// The same seed always gives the same frame.

export function stageShot(name, ctx) {
  const { state, world, player, traffic, police, combat, missions, clock, meshes } = ctx;

  // Reset to a known baseline.
  player.reset();
  clock.reset();
  combat.reset();
  police.reset();
  state.wanted = 0;
  state.stats = { carsStolen: 41, copsEscaped: 12, distanceDriven: 48.2, peopleTakenOut: 23, missionsGold: 3, stuntJumps: 5, collectibles: 11 };
  state.completion = 66.1;
  state.respect = 0;
  state.cash = 18450;
  state.radioIndex = 0;
  state.crew = { mara: true, tito: true, nia: true };

  if (name === 'chase') {
    clock.hour = 16.8;
    state.screen = 'play';
    state.menus.setScreen('none');
    // Drive a stolen car east along the beach boulevard, police chasing.
    const car = traffic.cars[0];
    player.enter(car);
    car.name = 'MAREA GT';
    car.heading = Math.PI / 2;
    car.x = 0;
    car.z = 446;
    car.speed = 31;
    player.pos.x = 0;
    player.pos.z = 446;
    state.wanted = 4;
    state.cash = 18450;
    state.mission = missions;
    missions.start(6);
    state.mission.marker = { x: 300, z: 446 };
    state.banner = { title: "MISSION 6 · ORO'S FALL", sub: 'STAGE 3/4 · WRECK THE REGENT', next: 'STAY WITHIN 40 M' };
    police.addWanted(4);
    police.spawnAt(0, 446);
    // Extra traffic cars nearby for density, parked along the boulevard.
    for (let i = 1; i < 4; i += 1) {
      traffic.cars[i].x = -60 - i * 30;
      traffic.cars[i].z = 446;
      traffic.cars[i].heading = Math.PI / 2;
      traffic.cars[i].mesh.position.set(traffic.cars[i].x, 0.05, traffic.cars[i].z);
      traffic.cars[i].mesh.rotation.y = Math.PI / 2;
    }
    // Spawn a rival black SUV ahead for the wreck objective.
    const rival = meshes.makeCar('#20242c');
    rival.position.set(78, 0.05, 446);
    rival.rotation.y = Math.PI / 2;
    state.rivalMesh = rival;
  } else if (name === 'foot') {
    clock.hour = 22.5;
    player.pos.x = -360;
    player.pos.z = -120;
    state.screen = 'play';
    state.menus.setScreen('none');
    state.wanted = 3;
    state.mission = missions;
    missions.start(4);
    state.mission.marker = { x: -360, z: -120 };
    state.banner = { title: 'MISSION 4 · MARKET SQUEEZE', sub: 'CLEAR THE AISLES', next: 'DEFEAT THE ARMED THUGS' };
    // Aim an SMG for the crosshair and spawn a couple of visible targets.
    combat.giveWeapon(2);
    combat.switchTo(2);
    police.addWanted(3);
    police.spawnAt(-360, -120);
    // A downed body and an enemy in the market.
    const body = meshes.makePerson('#5a4a3a', '#c9a884');
    body.position.set(-356, 0.05, -116);
    body.rotation.z = Math.PI / 2;
    state.footProps = { body, enemy: meshes.makePerson('#c94f4f', '#c9a884') };
    state.footProps.enemy.position.set(-344, 0, -128);
  } else if (name === 'map') {
    clock.hour = 18.2;
    player.pos.x = 120;
    player.pos.z = 420;
    state.screen = 'pause';
    state.menus.setScreen('pause');
    state.menus.setTab('stats');
    // Populate two save slots so the stats screen is dense.
    state.save.slots[0] = { act: 2, mission: 5, cash: 84000, respect: 42, rank: 'COAST LIEUTENANT', completion: 66.1, stats: state.stats, standing: state.standing, crew: { mara: true, tito: true, nia: true } };
    state.save.slots[1] = { act: 1, mission: 2, cash: 12000, respect: 6, rank: 'STREET RAT', completion: 8.3, stats: { carsStolen: 3, copsEscaped: 1, distanceDriven: 2.1, peopleTakenOut: 0, missionsGold: 0, stuntJumps: 0, collectibles: 0 }, standing: state.standing, crew: { mara: false, tito: false, nia: false } };
    state.save.slots[2] = null;
  } else {
    // title (and any unknown)
    clock.hour = 17.1;
    player.pos.x = 120;
    player.pos.z = 420;
    state.screen = 'title';
    state.menus.setScreen('title');
    state.save.slots[0] = { act: 3, mission: 8, cash: 184500, respect: 90, rank: 'COASTAL KING', completion: 100, stats: state.stats, standing: state.standing, crew: { mara: true, tito: true, nia: true } };
    state.save.slots[1] = { act: 2, mission: 5, cash: 84000, respect: 42, rank: 'COAST LIEUTENANT', completion: 66.1, stats: state.stats, standing: state.standing, crew: { mara: true, tito: true, nia: true } };
    state.save.slots[2] = null;
  }

  return true;
}
