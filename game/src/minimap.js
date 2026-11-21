// A live minimap drawn onto its own small canvas. It shows the player arrow, nearby
// traffic cars, police units, the current mission objective marker, district/street
// context, a wanted-level indicator, and the game clock. The M key toggles it
// between a small corner map and a large overlay, and it redraws at most about ten
// times per second to stay cheap. It renders the same in normal play and the
// ?shot=map staged scene.

import { CITY, COLOURS, MINIMAP } from './config.js';

const TAU = Math.PI * 2;

export function createMinimap(canvas) {
  const ctx = canvas.getContext('2d');
  let large = false;
  let lastDraw = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const size = large ? MINIMAP.largeCanvasW : MINIMAP.smallCanvasW;
    canvas.width = size * dpr;
    canvas.height = (large ? MINIMAP.largeCanvasH : MINIMAP.smallCanvasH) * dpr;
    // The backing store matches the CSS size (172px small, 640px large); the
    // browser scales the canvas to the element dimensions set in index.html.
  }
  resize();

  function setLarge(v) {
    large = Boolean(v);
    canvas.classList.toggle('large', large);
    resize();
  }

  function toggle() {
    setLarge(!large);
    return large;
  }

  function scale(state) {
    return large ? MINIMAP.largeCanvasW / (CITY.half * 2.6) : MINIMAP.worldScale;
  }

  function worldToMap(x, z, state) {
    const s = scale(state);
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    return { x: w / 2 + (x - state.player.pos.x) * s, z: h / 2 + (z - state.player.pos.z) * s };
  }

  function drawRoads(state) {
    const s = scale(state);
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.strokeStyle = '#2a3242';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const spacing = CITY.block + CITY.roadW;
    const worldLeft = state.player.pos.x - w / (2 * s);
    const worldRight = state.player.pos.x + w / (2 * s);
    const worldTop = state.player.pos.z - h / (2 * s);
    const worldBottom = state.player.pos.z + h / (2 * s);
    const startK = Math.floor(worldLeft / spacing) - 1;
    const endK = Math.ceil(worldRight / spacing) + 1;
    for (let k = startK; k <= endK; k += 1) {
      const p = worldToMap(k * spacing, 0, state);
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, h);
    }
    const startJ = Math.floor(worldTop / spacing) - 1;
    const endJ = Math.ceil(worldBottom / spacing) + 1;
    for (let j = startJ; j <= endJ; j += 1) {
      const p = worldToMap(0, j * spacing, state);
      ctx.moveTo(0, p.z);
      ctx.lineTo(w, p.z);
    }
    // The coastal boulevard.
    const bz = worldToMap(0, 446, state).z;
    ctx.moveTo(0, bz);
    ctx.lineTo(w, bz);
    ctx.stroke();
  }

  function drawDistrictLabels(state) {
    if (!large) return;
    ctx.fillStyle = '#b9c4d6';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centres = {
      mariposa: [-360, -120], vista: [120, 420], coral: [330, -260],
      palma: [-120, 200], mirador: [420, 140], puerto: [300, 320],
    };
    for (const [id, [x, z]] of Object.entries(centres)) {
      const p = worldToMap(x, z, state);
      const standing = state.standing[id] ?? 0;
      ctx.fillStyle = standing >= 60 ? '#6ed27a' : standing >= 30 ? '#e0c07a' : '#e05a5a';
      ctx.fillText(id.toUpperCase(), p.x, p.z);
    }
  }

  function drawBlip(x, z, colour, radius, state, shape = 'dot') {
    const p = worldToMap(x, z, state);
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    if (p.x < -radius || p.x > w + radius || p.z < -radius || p.z > h + radius) return;
    ctx.fillStyle = colour;
    ctx.beginPath();
    if (shape === 'diamond') {
      const r = radius * 1.4;
      ctx.moveTo(p.x, p.z - r);
      ctx.lineTo(p.x + r, p.z);
      ctx.lineTo(p.x, p.z + r);
      ctx.lineTo(p.x - r, p.z);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.arc(p.x, p.z, radius, 0, TAU);
      ctx.fill();
    }
  }

  function drawPlayer(state) {
    const p = worldToMap(state.player.pos.x, state.player.pos.z, state);
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.fillStyle = MINIMAP.blip.player;
    ctx.beginPath();
    ctx.moveTo(p.x, p.z - 9);
    ctx.lineTo(p.x - 5, p.z + 7);
    ctx.lineTo(p.x + 5, p.z + 7);
    ctx.closePath();
    ctx.fill();
    // Heading ray.
    ctx.strokeStyle = MINIMAP.blip.player;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.z);
    ctx.lineTo(p.x + Math.sin(state.player.heading) * 12, p.z + Math.cos(state.player.heading) * 12);
    ctx.stroke();
  }

  function draw(state, now) {
    if (now - lastDraw < MINIMAP.refreshMs) return;
    lastDraw = now;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);

    // Background.
    ctx.fillStyle = '#0d1220ee';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = large ? '#3a4252' : '#2a3242';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    drawRoads(state);

    // Traffic.
    for (const c of state.traffic.cars) {
      drawBlip(c.x, c.z, MINIMAP.blip.traffic, 1.6, state);
    }
    // Police.
    for (const u of state.police.units) {
      if (u.kind === 'air') drawBlip(u.x, u.z, '#7fb7ff', 3.4, state, 'diamond');
      else drawBlip(u.x, u.z, MINIMAP.blip.police, 2.4, state);
    }
    // Roadblocks.
    for (const b of state.police.blocks) {
      drawBlip(b.x, b.z, MINIMAP.blip.roadblock, 3.2, state, 'diamond');
    }

    drawDistrictLabels(state);

    // Mission objective.
    const marker = state.mission?.marker;
    if (marker) drawBlip(marker.x, marker.z, MINIMAP.blip.mission, 5, state, 'diamond');

    drawPlayer(state);

    // Wanted indicator in the top-left corner of the map.
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = state.wanted > 0 ? '#ffd24a' : '#556070';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(`${'★'.repeat(state.wanted)}${'☆'.repeat(5 - state.wanted)}`, 8, 8);

    // Clock string from clock.label() so the minimap area also shows time.
    ctx.fillStyle = '#b9c4d6';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(state.clock?.label ?? '', w - 8, 8);
  }

  return { draw, resize, setLarge, toggle, canvas,
    get large() { return large; } };
}
