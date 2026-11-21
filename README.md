# Solara Coast

An original open-world crime game in the spirit of a sun-soaked coastal city, built
entirely from static files and playable in a desktop browser with keyboard and mouse.
Every name, character, vehicle, district, radio station and mission is invented for
this game — nothing is borrowed from any commercial title.

Drive, steal and carjack traffic; walk the boulevards and the night market; dodge a
five-star CBP response with coordinated interceptors, flanking units, roadblocks and
the Air One helicopter; and play eight multi-stage story missions with named NPC
portraits and gold/silver/bronze ratings. A live minimap tracks the player, traffic,
police, roadblocks and the current mission objective, and can be toggled small or
large with **M**.

## New systems

- **Multi-stage missions** — every mission is a sequence of typed objectives (go to a
  marked location, steal or deliver a specific vehicle, defeat a number of targets,
  survive a timed hold, lose a pursuit, or stay near a moving target). Each stage
  shows a per-stage goal, checks its own completion condition, fails when a required
  vehicle is destroyed, and pays cash plus respect on success.
- **Coordinated police pursuit** — wanted levels escalate the response: more units at
  higher stars, interceptors that cut off the player's escape route, flankers that
  approach from the sides, roadblocks at three stars, the Air One helicopter at four
  stars, and a line-of-sight cooldown that only clears heat after a sustained escape.
- **Live minimap** — a separate canvas map showing the player arrow, nearby traffic,
  police units, roadblocks, the mission marker, district labels, a wanted-star strip
  and the game clock. **M** toggles between small and large; the size is persisted.

## Run it

```bash
node serve.ts --port 8080
```

Then open <http://localhost:8080>. `GET /healthz` answers `ok`.

Move with **W A S D**, run with **SHIFT**, press **F** to enter or exit a car, aim
with the mouse and fire with **LEFT CLICK** or **SPACE**, switch weapons with
**1–5**, use crew abilities with **Q E R**, cycle the radio with **TAB**, honk with
**H**, open the mission panel with **J**, toggle the minimap with **M**, and pause
with **ESC** or **P**.

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
  world.js              procedural street grid, districts, blockers, roadblock spots
  scene.js              three.js geometry, sky, water, lights
  entities.js           low-poly people, cars, cop cruiser, helicopter, barriers
  player.js             on-foot + vehicle controller, sprint/stamina, transform
  traffic.js            lane-following cars with aggression and police yielding
  police.js             wanted level, coordinated pursuit, roadblocks, Air One
  combat.js             weapon slots, ammo, spread, hitscan, hit feedback
  missions.js           eight multi-stage story missions and ratings
  minimap.js            live minimap canvas (small/large toggle)
  hud.js                bars, cash, stars, objective tracker, dispatch, menus
  menus.js              title, pause, map, stats, crew, settings, save
  audio.js              original WebAudio synth SFX, stage/wanted cues, radio
  save.js               three localStorage save slots + settings + minimap pref
  clock.js              day/night clock + formatted clock string
  input.js              keyboard + mouse incl. M minimap toggle
  shots.js              deterministic ?shot= scenes
  config.js             tuning, colours, weapons, radio, districts, new systems
  random.js             seeded random + weighted picks
game/vendor/three.min.js — vendored three.js engine (MIT)
```

## License

MIT — see `LICENSE`.
