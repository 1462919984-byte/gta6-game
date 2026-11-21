// Multi-stage missions for Solara Coast. Each mission is a real sequence of stages:
// go to a marked location, steal or deliver a specific vehicle, take out or evade
// targets, survive a pursuit, then reach the dropoff. Stages have a per-stage goal
// shown to the player, a typed completion check, optional failure conditions, and
// immediate cash + respect rewards. The eight-mission roster and the
// createMissions(random) interface are unchanged, and progress serialises cleanly.

import { CITY, MISSION_REWARDS } from './config.js';
import { weightedPick, range } from './random.js';

// Stage kind names, so main.js can dispatch completion checks by type instead of
// grepping stage text. This is what makes a stage a real objective rather than a
// proximity trigger.
const K = {
  GOTO: 'goto',         // reach a marked location
  STEAL: 'steal',       // enter a specific vehicle
  DELIVER: 'deliver',   // reach the dropoff in a vehicle
  KILLS: 'kills',       // defeat a number of marked enemies
  SURVIVE: 'survive',   // stay alive / hold position for a timer
  ESCAPE: 'escape',     // lose wanted heat
  PURSUIT: 'pursuit',   // stay near a moving target
  REACH: 'reach',       // any final dropoff
};

export function createMissions(random) {
  const list = [
    {
      id: 1, name: "WELCOME TO SOLARA", district: 'PUERTO NUEVO', giver: 'RENZO MARÍN',
      landmark: 'north-docks',
      stages: [
        { kind: K.GOTO, text: 'Meet Renzo at the north docks', next: 'Drive to the marker', x: 300, z: 330, radius: 24 },
        { kind: K.STEAL, text: 'Steal the Marea GT from the lot', next: 'Walk up to the car and press F', vehicleName: 'MAREA GT' },
        { kind: K.DELIVER, text: 'Deliver it to the Palm Vieja garage', next: 'Drive to the gold marker', landmark: 'palm-garage', radius: 26 },
      ],
      gold: 90, silver: 130,
    },
    {
      id: 2, name: "SALT & STEEL", district: 'PUERTO NUEVO', giver: 'RENZO MARÍN',
      landmark: 'north-docks',
      stages: [
        { kind: K.KILLS, text: 'Take out the three rival smugglers', next: 'Use the pistol on the marked men', count: 3 },
        { kind: K.GOTO, text: 'Grab the cargo manifest', next: 'Walk over the glowing crate', x: 300, z: 330, radius: 14 },
        { kind: K.ESCAPE, text: 'Escape to the safehouse', next: 'Lose the CBP heat', clearWanted: true },
      ],
      gold: 100, silver: 150,
    },
    {
      id: 3, name: "MARKET SQUEEZE", district: 'OLD MARIPOSA', giver: 'INES VARELA',
      landmark: 'night-market',
      stages: [
        { kind: K.GOTO, text: 'Reach the night market', next: 'Follow the marker into Old Mariposa', landmark: 'night-market', radius: 30 },
        { kind: K.KILLS, text: 'Clear the four aisles', next: 'Defeat the armed thugs', count: 4 },
        { kind: K.GOTO, text: 'Collect the protection ledger', next: 'Take the glowing folder', x: -360, z: -120, radius: 12 },
        { kind: K.SURVIVE, text: 'Hold the market until the heat clears', next: 'Survive the CBP wave', timer: 20 },
      ],
      gold: 150, silver: 220,
    },
    {
      id: 4, name: "HIGH TIDE HEIST", district: 'VISTA DEL SOL', giver: 'INES VARELA',
      landmark: 'boulevard',
      stages: [
        { kind: K.STEAL, text: 'Jack the armoured van on the boulevard', next: 'Ram it and press F', vehicleName: 'ARMOURED VAN' },
        { kind: K.PURSUIT, text: 'Outrun the CBP on the coastal strip', next: 'Keep the heat above 2 stars', minWanted: 2 },
        { kind: K.DELIVER, text: 'Drop the van at the coral garage', next: 'Drive to the marker', landmark: 'coral-garage', radius: 26 },
      ],
      gold: 160, silver: 240,
    },
    {
      id: 5, name: "GLASS & GOLD", district: 'CORAL HEIGHTS', giver: 'KAI OKAFOR',
      landmark: 'coral-garage',
      stages: [
        { kind: K.GOTO, text: 'Climb the tower parking decks', next: 'Drive to the rooftop ramp', landmark: 'coral-garage', radius: 24 },
        { kind: K.KILLS, text: 'Hit the 3 gold briefcases', next: 'Walk over each glowing case', count: 3 },
        { kind: K.GOTO, text: 'Stunt-jump back to street level', next: 'Hit the marked ramp at speed', x: 330, z: -260, radius: 20 },
        { kind: K.ESCAPE, text: 'Escape the Air One searchlight', next: 'Break line of sight', clearWanted: true },
      ],
      gold: 170, silver: 250,
    },
    {
      id: 6, name: "ORO'S FALL", district: 'MIRADOR HILLS', giver: 'KAI OKAFOR',
      landmark: 'mirador-hills',
      stages: [
        { kind: K.SURVIVE, text: 'Wreck the Regent', next: 'Ram the black SUV until it smokes', timer: 10 },
        { kind: K.PURSUIT, text: 'Chase the Regent down the hills', next: 'Stay within 40 m of it', radius: 40 },
        { kind: K.GOTO, text: 'Stop the hand-off at the pier', next: 'Block the pier and fire', landmark: 'north-docks', radius: 24 },
      ],
      gold: 180, silver: 260,
    },
    {
      id: 7, name: "BURNING BRIDGES", district: 'PALMA VIEJA', giver: 'MARA SOL',
      landmark: 'palm-garage',
      stages: [
        { kind: K.GOTO, text: 'Free Mara from the Palma lockup', next: 'Reach the police garage', landmark: 'palm-garage', radius: 24 },
        { kind: K.KILLS, text: 'Fight through the garage', next: 'Defeat 5 CBP officers', count: 5 },
        { kind: K.STEAL, text: 'Drive Mara out in the getaway car', next: 'Press F on the Marea GT', vehicleName: 'MAREA GT' },
        { kind: K.ESCAPE, text: 'Lose the 4-star pursuit', next: 'Get to a safe district', clearWanted: true },
      ],
      gold: 200, silver: 280,
    },
    {
      id: 8, name: "COASTAL CROWN", district: 'ALL DISTRICTS', giver: 'THE WHOLE CITY',
      landmark: 'sunset-overlook',
      stages: [
        { kind: K.GOTO, text: 'Rally the crew at the beach', next: 'Drive to the boulevard marker', landmark: 'boulevard', radius: 30 },
        { kind: K.PURSUIT, text: 'Win the final street race', next: 'Pass every checkpoint', radius: 34 },
        { kind: K.KILLS, text: 'Defend the crown against the syndicate', next: 'Defeat the last convoy', count: 3 },
        { kind: K.GOTO, text: 'Take the coast for your own', next: 'Reach the sunset overlook', landmark: 'sunset-overlook', radius: 26 },
      ],
      gold: 220, silver: 300,
    },
  ];

  let current = null;
  let stageIndex = 0;
  let stageProgress = 0;
  let stageTimer = 0;
  let started = 0;
  let ratings = [null, null, null, null, null, null, null, null];
  let dialogue = null;

  function start(id) {
    current = list[id - 1];
    stageIndex = 0;
    stageProgress = 0;
    stageTimer = 0;
    started = performance.now();
    dialogue = makeDialogue(current);
  }

  // A fresh mission uses the first stage; a save with a later stage resumes it.
  function restoreStage(id, stage) {
    current = list[id - 1];
    stageIndex = Math.max(0, Math.min(current.stages.length - 1, stage));
    stageProgress = 0;
    stageTimer = 0;
    started = performance.now();
    dialogue = makeDialogue(current);
  }

  function makeDialogue(m) {
    const lines = {
      1: [`${m.giver}: "This city runs on favours, and tonight you owe me one."`, `${m.giver}: "Grab the car. Don't make me wait."`],
      2: [`${m.giver}: "Three smugglers think they own my docks. Show them otherwise."`, `${m.giver}: "The manifest is in the crate. Then burn the heat."`],
      3: [`${m.giver}: "The market is ours. Four aisles. Clean them."`, `${m.giver}: "Take the ledger and hold the block."`],
      4: [`${m.giver}: "An armoured van, right on the boulevard. Bold is better."`, `${m.giver}: "Lose them on the coast and drop it at Coral."`],
      5: [`${m.giver}: "Rooftop briefcases, three of them. Then fly off the ramp."`, `${m.giver}: "Air One hates the alleyways. Use them."`],
      6: [`${m.giver}: "The Regent took half the hills. Wreck it."`, `${m.giver}: "Run it down before it reaches the pier."`],
      7: [`${m.giver}: "Get me out of Palma, and the crew is yours."`, `${m.giver}: "Four stars. Drive like the sea wind."`],
      8: [`${m.giver}: "One last race. One last fight. Then the coast is ours."`, `${m.giver}: "Win it all, Sol."`],
    };
    return { name: m.giver, portrait: portraitFor(m.giver), lines: lines[m.id], line: 0 };
  }

  function portraitFor(name) {
    const map = {
      'RENZO MARÍN': '#d9a24a', 'INES VARELA': '#c94f6a', 'KAI OKAFOR': '#4f7fc9', 'MARA SOL': '#8a5fb8', 'THE WHOLE CITY': '#e0c07a',
    };
    return map[name] ?? '#e0c07a';
  }

  // The marker for the current stage, resolved from its coordinates or landmark.
  function marker(world) {
    if (!current) return null;
    const stage = current.stages[stageIndex];
    if (!stage) return null;
    if (stage.landmark) {
      const l = world.landmark(stage.landmark);
      return { x: l.x, z: l.z };
    }
    if (Number.isFinite(stage.x) && Number.isFinite(stage.z)) return { x: stage.x, z: stage.z };
    return null;
  }

  function stage() {
    return current ? current.stages[stageIndex] : null;
  }

  // A typed completion test: returns true when the stage's specific condition is
  // satisfied. Callers pass a small context of observable game facts.
  function stageComplete(ctx) {
    const s = stage();
    if (!s) return false;
    switch (s.kind) {
      case K.GOTO:
      case K.DELIVER:
      case K.REACH: {
        if (!ctx.marker) return false;
        const d = Math.hypot(ctx.marker.x - ctx.x, ctx.marker.z - ctx.z);
        const inCar = s.kind === K.DELIVER || s.kind === K.REACH ? ctx.inVehicle : true;
        return inCar && d <= (s.radius ?? 18);
      }
      case K.STEAL:
        return ctx.inVehicle && ctx.vehicleName === s.vehicleName;
      case K.KILLS:
        return (ctx.kills ?? 0) >= (s.count ?? 1);
      case K.SURVIVE:
        return (ctx.timer ?? 0) >= (s.timer ?? 0);
      case K.ESCAPE:
        return s.clearWanted ? ctx.wanted === 0 : (ctx.wanted ?? 99) <= (s.maxWanted ?? 1);
      case K.PURSUIT:
        if (s.minWanted !== undefined) return ctx.wanted >= s.minWanted;
        return (ctx.distance ?? 999) <= (s.radius ?? 40);
      default:
        return true;
    }
  }

  // Failure conditions, checked before completion, so a destroyed vehicle or an
  // expired timer actually ends the attempt.
  function stageFailed(ctx) {
    const s = stage();
    if (!s) return false;
    if (s.timer && (ctx.timer ?? 0) > s.timer + 10 && ctx.timer < s.timer) return false;
    if (s.vehicleName && ctx.targetDestroyed) return true;
    if (s.kind === K.DELIVER && !ctx.inVehicle && ctx.started && ctx.timer > 2) return true;
    return false;
  }

  function advance() {
    stageIndex = Math.min(current.stages.length - 1, stageIndex + 1);
    stageProgress = 0;
    stageTimer = 0;
    if (dialogue && dialogue.line < dialogue.lines.length - 1) dialogue.line += 1;
  }

  function rewardFor(stageIdx) {
    return { cash: MISSION_REWARDS.stageCash, respect: MISSION_REWARDS.stageRespect };
  }

  function rating(elapsed) {
    if (elapsed <= current.gold) return 'GOLD';
    if (elapsed <= current.silver) return 'SILVER';
    return 'BRONZE';
  }

  function complete(elapsed) {
    ratings[current.id - 1] = rating(elapsed);
    current = null;
    stageIndex = 0;
    stageTimer = 0;
  }

  function tick(dt) {
    if (current) {
      stageTimer += dt;
      // Survive/hold stages advance their own progress against the target timer.
      const s = stage();
      if (s && s.kind === K.SURVIVE) stageProgress = stageTimer;
    }
  }

  return {
    list,
    get current() { return current; },
    get stageIndex() { return stageIndex; },
    get stage() { return stage(); },
    get dialogue() { return dialogue; },
    get ratings() { return ratings; },
    get stageTimer() { return stageTimer; },
    start, restoreStage, advance, complete, rating, tick, marker, stageComplete, stageFailed, rewardFor,
    reset() {
      current = null; stageIndex = 0; stageProgress = 0; stageTimer = 0;
      ratings = [null, null, null, null, null, null, null, null]; dialogue = null;
    },
  };
}
