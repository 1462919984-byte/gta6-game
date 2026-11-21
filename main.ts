// The gta6-01 entry point for Solara Coast, an original open-world crime game
// built entirely from static files (three.js vendored under game/vendor, ES
// modules under game/src). This program copies game/ and screenshots/ beside this
// file into the output directory and writes /output/dossier.json with the
// vendored make.fun library, using the same scorer caps as the gate.
//
// Node 22, standard library only: run with `MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts`.
// Serve the game locally with `node serve.ts --port 8080` and open that address.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// Copy the whole game/ tree exactly, preserving its vendored three.js and sources.
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Screenshots: four JPEG renders (1-chase, 2-foot, 3-map, 4-title). The first by
// name is the cover, so copying beside this file preserves that order.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps (reference/gate.json): text_max_bytes shapes the dossier
// text; the other caps refuse an entry the scorer would refuse. Build the summary
// the judge reads and write it to dossier.json.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Solara Coast packaged: ${out}/dossier.json + game/ + screenshots/`);
