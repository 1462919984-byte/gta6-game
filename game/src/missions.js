// The eight-stage story of Solara Coast: mission definitions, objectives, stage
// advancement, dialogue with named NPC portraits, and gold/silver/bronze ratings.
// The arc follows you from a dockside favour to owning the whole city.

import { CITY } from './config.js';

export function createMissions(random) {
  const list = [
    {
      id: 1, name: "WELCOME TO SOLARA", district: 'PUERTO NUEVO', giver: 'RENZO MARÍN',
      stages: [
        { text: 'Meet Renzo at the north docks', next: 'Drive to the marker' },
        { text: 'Steal the Marea GT from the lot', next: 'Walk up to the car and press F' },
        { text: 'Deliver it to the Palm Vieja garage', next: 'Drive to the gold marker' },
      ],
      gold: 90, silver: 130,
    },
    {
      id: 2, name: "SALT & STEEL", district: 'PUERTO NUEVO', giver: 'RENZO MARÍN',
      stages: [
        { text: 'Take out the three rival smugglers', next: 'Use the pistol on the marked men' },
        { text: 'Grab the cargo manifest', next: 'Walk over the glowing crate' },
        { text: 'Escape to the safehouse', next: 'Lose the CBP heat' },
      ],
      gold: 100, silver: 150,
    },
    {
      id: 3, name: "MARKET SQUEEZE", district: 'OLD MARIPOSA', giver: 'INES VARELA',
      stages: [
        { text: 'Reach the night market', next: 'Follow the marker into Old Mariposa' },
        { text: 'Clear the four aisles', next: 'Defeat the armed thugs' },
        { text: 'Collect the protection ledger', next: 'Take the glowing folder' },
        { text: 'Hold the market until the heat clears', next: 'Survive the CBP wave' },
      ],
      gold: 150, silver: 220,
    },
    {
      id: 4, name: "HIGH TIDE HEIST", district: 'VISTA DEL SOL', giver: 'INES VARELA',
      stages: [
        { text: 'Jack the armoured van on the boulevard', next: 'Ram it and press F' },
        { text: 'Outrun the CBP on the coastal strip', next: 'Keep the heat above 2 stars' },
        { text: 'Drop the van at the coral garage', next: 'Drive to the marker' },
      ],
      gold: 160, silver: 240,
    },
    {
      id: 5, name: "GLASS & GOLD", district: 'CORAL HEIGHTS', giver: 'KAI OKAFOR',
      stages: [
        { text: 'Climb the tower parking decks', next: 'Drive to the rooftop ramp' },
        { text: 'Hit the 3 gold briefcases', next: 'Walk over each glowing case' },
        { text: 'Stunt-jump back to street level', next: 'Hit the marked ramp at speed' },
        { text: 'Escape the Air One searchlight', next: 'Break line of sight' },
      ],
      gold: 170, silver: 250,
    },
    {
      id: 6, name: "ORO'S FALL", district: 'MIRADOR HILLS', giver: 'KAI OKAFOR',
      stages: [
        { text: 'Wreck the Regent', next: 'Ram the black SUV until it smokes' },
        { text: 'Chase the Regent down the hills', next: 'Stay within 40 m of it' },
        { text: 'Stop the hand-off at the pier', next: 'Block the pier and fire' },
      ],
      gold: 180, silver: 260,
    },
    {
      id: 7, name: "BURNING BRIDGES", district: 'PALMA VIEJA', giver: 'MARA SOL',
      stages: [
        { text: 'Free Mara from the Palma lockup', next: 'Reach the police garage' },
        { text: 'Fight through the garage', next: 'Defeat 5 CBP officers' },
        { text: 'Drive Mara out in the getaway car', next: 'Press F on the Marea GT' },
        { text: 'Lose the 4-star pursuit', next: 'Get to a safe district' },
      ],
      gold: 200, silver: 280,
    },
    {
      id: 8, name: "COASTAL CROWN", district: 'ALL DISTRICTS', giver: 'THE WHOLE CITY',
      stages: [
        { text: 'Rally the crew at the beach', next: 'Drive to the boulevard marker' },
        { text: 'Win the final street race', next: 'Pass every checkpoint' },
        { text: 'Defend the crown against the syndicate', next: 'Defeat the last convoy' },
        { text: 'Take the coast for your own', next: 'Reach the sunset overlook' },
      ],
      gold: 220, silver: 300,
    },
  ];

  let current = null;
  let stageIndex = 0;
  let stageProgress = 0;
  let started = 0;
  let ratings = [null, null, null, null, null, null, null, null];
  let dialogue = null;   // {name, portrait, lines[], line}

  function start(id) {
    current = list[id - 1];
    stageIndex = 0;
    stageProgress = 0;
    started = 0;
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

  function advance() {
    stageIndex = Math.min(current.stages.length - 1, stageIndex + 1);
    if (dialogue && dialogue.line < dialogue.lines.length - 1) dialogue.line += 1;
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
  }

  return {
    list,
    get current() { return current; },
    get stageIndex() { return stageIndex; },
    get dialogue() { return dialogue; },
    get ratings() { return ratings; },
    start, advance, complete, rating,
    reset() { current = null; stageIndex = 0; stageProgress = 0; ratings = [null, null, null, null, null, null, null, null]; dialogue = null; },
  };
}
