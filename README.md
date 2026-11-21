# Solara Coast

An original open-world crime game in the spirit of a sun-soaked coastal city, built
entirely from static files and playable in a desktop browser with keyboard and mouse.
Every name, character, vehicle, district, radio station and mission is invented for
this game — nothing is borrowed from any commercial title.

Drive, steal and carjack traffic; walk the boulevards and the night market; dodge a
five-star CBP response with ramming, flanking, roadblocks and the Air One helicopter;
play eight story missions with named NPC portraits and gold/silver/bronze ratings;
recruit a three-person crew with key-bound abilities; and build district standing
across six neighbourhoods. Three save slots keep your career in `localStorage`.

## Run it

```bash
node serve.ts
```

Then open <http://localhost:8080>.

Move with **W A S D**, run with **SHIFT**, press **F** to enter or exit a car, aim
with the mouse and fire with **LEFT CLICK** or **SPACE**, switch weapons with
**1–5**, use crew abilities with **Q E R**, cycle the radio with **TAB**, honk with
**H**, and pause with **ESC** or **P**.

## Make.fun

This entry competes in make.fun bounty **gta6-01 — Make GTA 6**.

[![Make.fun gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/1462919984-byte/gta6-game/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/1462919984-byte/gta6-game/reward.svg)](https://make.fun/bounty/gta6-01)

## Structure

```
game/index.html        — single entry point, import map for three.js
game/src/*.js          — original game source, one file per job:
  main.js               boot, loop, missions wiring, screenshots
  world.js              procedural street grid, districts, blockers
  scene.js              three.js geometry, sky, water, lights
  entities.js           low-poly people, cars, cop cruiser, helicopter
  player.js             on-foot + vehicle controller, damage
  traffic.js            lane-following cars and wandering pedestrians
  police.js             wanted level, dispatch, pursuit, Air One
  combat.js             weapon slots, ammo, hitscan
  missions.js           eight-stage story arc and ratings
  hud.js                minimap, cash, stars, bars, objectives, crew
  menus.js              title, pause, map, stats, crew, settings, save
  audio.js              original WebAudio synth SFX and radio jingles
  save.js               three localStorage save slots
  clock.js              day/night clock
  input.js              keyboard + mouse
  shots.js              deterministic ?shot= scenes
  config.js             tuning, colours, weapons, radio, districts
  random.js             seeded random
game/vendor/three.min.js — vendored three.js engine (MIT)
```

## License

MIT — see `LICENSE`.
