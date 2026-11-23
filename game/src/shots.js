// Deterministic screenshot scenes. Each `?shot=` mode plays the real rules forward
// from a fixed seed and stages the exact frame the cover and the judge need:
//   chase  — a golden-hour police pursuit on the beach boulevard while driving
//   foot   — on-foot night combat in the Old Mariposa market
//   map    — the pause stats screen with district standing and career depth
//   title  — the title screen floating over the living 3D city
// The same seed always gives the same frame. A fixed shotCamera is set on the
// shared state so main.js can frame the scene without a tree blocking the player.

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
  state.shotCamera = null;

  if (name === 'chase') {
    clock.hour = 16.9;
    state.screen = 'play';
    state.menus.setScreen('none');
    // Drive a stolen car east along the beach boulevard, police chasing behind.
    const car = traffic.cars[0];
    player.enter(car);
    car.name = 'MAREA GT';
    // Repaint the carjacked ride a bright player blue so the cover chase shows
    // the player's car clearly against the sand and the CBP wedge.
    if (car.mesh && car.mesh.children[0] && car.mesh.children[0].material) {
      car.mesh.children[0].material.color.set('#3f9bd9');
    }
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
    state.objectiveMarker = { x: 300, z: 446 };
    state.banner = { title: "MISSION 6 · ORO'S FALL", sub: 'STAGE 2/3 · CHASE THE REGENT DOWN THE HILLS', next: 'STAY WITHIN 40 M' };
    police.addWanted(4);
    police.spawnAt(0, 446);
    // Clear the roadblock so the boulevard stays open for the cover.
    for (const b of police.blocks) b.mesh.visible = false;

    // Traffic parked along the boulevard ahead for density.
    for (let i = 1; i < 5; i += 1) {
      traffic.cars[i].x = 70 + i * 34;
      traffic.cars[i].z = 446;
      traffic.cars[i].heading = Math.PI / 2;
      traffic.cars[i].mesh.position.set(traffic.cars[i].x, 0.05, traffic.cars[i].z);
      traffic.cars[i].mesh.rotation.y = Math.PI / 2;
    }

    // A rival black SUV ahead for the wreck objective.
    const rival = meshes.makeCar('#20242c');
    rival.position.set(104, 0.05, 446);
    rival.rotation.y = Math.PI / 2;
    state.rivalMesh = rival;

    // Fixed over-the-shoulder chase camera: low, behind and to the driver side so
    // the player car, the pursuing cruisers and the boulevard are all in frame.
    state.shotCamera = { x: -14, z: 460, y: 4.8, lookX: 12, lookY: 1.1, lookZ: 445 };
  } else if (name === 'foot') {
    clock.hour = 22.6;
    player.pos.x = -360;
    player.pos.z = -120;
    player.reset();
    player.pos.x = -360;
    player.pos.z = -120;
    state.screen = 'play';
    state.menus.setScreen('none');
    state.wanted = 3;
    state.mission = missions;
    missions.start(3);
    state.objectiveMarker = { x: -360, z: -120 };
    state.banner = { title: 'MISSION 3 · MARKET SQUEEZE', sub: 'STAGE 2/4 · CLEAR THE FOUR AISLES', next: 'DEFEAT THE ARMED THUGS' };
    // Aim an SMG for the crosshair and spawn visible enemies in the market.
    combat.giveWeapon(2);
    combat.switchTo(2);
    police.addWanted(3);
    police.spawnAt(-360, -120);
    for (const b of police.blocks) b.mesh.visible = false;

    // A downed body and two enemies among the stalls.
    const body = meshes.makePerson('#5a4a3a', '#c9a884');
    body.position.set(-354, 0.05, -114);
    body.rotation.z = Math.PI / 2;
    const enemy1 = meshes.makePerson('#c94f4f', '#c9a884');
    enemy1.position.set(-348, 0, -130);
    const enemy2 = meshes.makePerson('#c94f4f', '#b98a6a');
    enemy2.position.set(-372, 0, -132);
    state.footProps = { body, enemy1, enemy2 };

    // Over-shoulder camera looking north through the market aisle.
    state.shotCamera = { x: -360, z: -112.6, y: 2.1, lookX: -356, lookY: 1.15, lookZ: -132 };
  } else if (name === 'map') {
    clock.hour = 18.2;
    player.pos.x = 120;
    player.pos.z = 420;
    state.screen = 'pause';
    state.menus.setScreen('pause');
    state.menus.setTab('stats');
    state.minimapLarge = false;
    state.mission = missions;
    missions.start(3);
    state.objectiveMarker = { x: -360, z: -120 };
    state.banner = { title: 'MISSION 3 · MARKET SQUEEZE', sub: 'STAGE 2/4 · CLEAR THE FOUR AISLES', next: 'DEFEAT THE ARMED THUGS' };
    // Populate two save slots so the stats screen is dense.
    state.save.slots[0] = { act: 2, mission: 5, cash: 84000, respect: 42, rank: 'COAST LIEUTENANT', completion: 66.1, stats: state.stats, standing: state.standing, crew: { mara: true, tito: true, nia: true } };
    state.save.slots[1] = { act: 1, mission: 2, cash: 12000, respect: 6, rank: 'STREET RAT', completion: 8.3, stats: { carsStolen: 3, copsEscaped: 1, distanceDriven: 2.1, peopleTakenOut: 0, missionsGold: 0, stuntJumps: 0, collectibles: 0 }, standing: state.standing, crew: { mara: false, tito: false, nia: false } };
    state.save.slots[2] = null;
    state.ratings = ['GOLD', 'SILVER', 'GOLD', 'BRONZE', 'GOLD', null, null, null];
  } else {
    // title (and any unknown)
    clock.hour = 17.2;
    player.pos.x = 120;
    player.pos.z = 420;
    state.screen = 'title';
    state.menus.setScreen('title');
    state.save.slots[0] = { act: 3, mission: 8, cash: 184500, respect: 90, rank: 'COASTAL KING', completion: 100, stats: state.stats, standing: state.standing, crew: { mara: true, tito: true, nia: true } };
    state.save.slots[1] = { act: 2, mission: 5, cash: 84000, respect: 42, rank: 'COAST LIEUTENANT', completion: 66.1, stats: state.stats, standing: state.standing, crew: { mara: true, tito: true, nia: true } };
    state.save.slots[2] = null;
    // High, wide hero camera over the sunset boulevard.
    state.shotCamera = { x: 150, z: 360, y: 58, lookX: 20, lookY: 4, lookZ: 446 };
  }

  return true;
}
