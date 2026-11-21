// The 2D canvas HUD: minimap, cash, wanted stars, health/armour bars, weapon slots,
// mission banner and objective, speed + car name + condition, radio line, clock,
// crew ability cards, dialogue box, district label, dispatch panel and menus.
// It is drawn every frame over the 3D scene and never touches the simulation.

import { CITY, COLOURS, CREW, DISTRICTS, RADIO, WEAPONS } from './config.js';

const FONT = "'Segoe UI', system-ui, sans-serif";

export function createHud(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    view.scale = dpr;
  }
  resize();
  window.addEventListener('resize', resize);

  function px(v) { return v * view.scale; }
  function rr(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(px(x + r), px(y));
    ctx.arcTo(px(x + w), px(y), px(x + w), px(y + h), px(r));
    ctx.arcTo(px(x + w), px(y + h), px(x), px(y + h), px(r));
    ctx.arcTo(px(x), px(y + h), px(x), px(y), px(r));
    ctx.arcTo(px(x), px(y), px(x + w), px(y), px(r));
    ctx.closePath();
  }
  function fill(x, y, w, h, colour, r = 0) {
    ctx.fillStyle = colour;
    rr(x, y, w, h, r); ctx.fill();
  }
  function stroke(x, y, w, h, colour, r = 0, lw = 1) {
    ctx.strokeStyle = colour; ctx.lineWidth = px(lw);
    rr(x, y, w, h, r); ctx.stroke();
  }
  function text(s, x, y, size, colour, align = 'left', weight = 'normal') {
    ctx.fillStyle = colour;
    ctx.font = `${weight} ${px(size)}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(s, px(x), px(y));
  }
  function clipCircle(x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px(x), px(y), px(r), 0, Math.PI * 2);
    ctx.clip();
  }

  function drawMinimap(state) {
    const cx = 90, cy = 78, r = 66;
    clipCircle(cx, cy, r);
    fill(cx - r, cy - r, r * 2, r * 2, '#101622');
    // North indicator.
    text('N', cx, cy - r + 4, 13, '#ffd27a', 'center', 'bold');

    // Roads.
    ctx.strokeStyle = '#3a3f4c';
    ctx.lineWidth = px(2);
    const scale = r / (CITY.half * 0.16);
    ctx.beginPath();
    const spacing = CITY.block + CITY.roadW;
    for (let k = -9; k <= 9; k += 1) {
      const rx = cx + k * spacing * scale * 0.14;
      ctx.moveTo(px(rx), px(cy - r)); ctx.lineTo(px(rx), px(cy + r));
      const rz = cy + k * spacing * scale * 0.14;
      ctx.moveTo(px(cx - r), px(rz)); ctx.lineTo(px(cx + r), px(rz));
    }
    ctx.stroke();

    // District dots coloured by standing.
    for (const d of DISTRICTS) {
      const c = worldCentre(d.id);
      const dx = (c.x - state.player.pos.x) * scale;
      const dz = (c.z - state.player.pos.z) * scale;
      const mx = cx + dx;
      const mz = cy + dz;
      if (Math.hypot(dx, dz) > r - 4) continue;
      const standing = state.standing[d.id] ?? 0;
      const col = standing >= 60 ? '#6ed27a' : standing >= 30 ? '#e0c07a' : '#e05a5a';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px(mx), px(mz), px(3.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // Mission and activity markers.
    if (state.mission && state.mission.marker) {
      const mx = cx + (state.mission.marker.x - state.player.pos.x) * scale;
      const mz = cy + (state.mission.marker.z - state.player.pos.z) * scale;
      if (Math.hypot(mx - cx, mz - cy) < r - 2) {
        ctx.fillStyle = '#ffd27a';
        ctx.beginPath(); ctx.arc(px(mx), px(mz), px(5), 0, Math.PI * 2); ctx.fill();
      }
    }

    // Police blips.
    ctx.fillStyle = '#4d8bff';
    for (const u of state.police.units) {
      const ux = cx + (u.x - state.player.pos.x) * scale;
      const uz = cy + (u.z - state.player.pos.z) * scale;
      if (Math.hypot(ux - cx, uz - cy) < r - 2) {
        ctx.beginPath(); ctx.arc(px(ux), px(uz), px(2.6), 0, Math.PI * 2); ctx.fill();
      }
    }

    // Player arrow.
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.moveTo(px(cx), px(cy - 8));
    ctx.lineTo(px(cx - 5), px(cy + 6));
    ctx.lineTo(px(cx + 5), px(cy + 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    stroke(cx - r, cy - r, r * 2, r * 2, '#3a3f4c', r, 2);
  }

  function worldCentre(id) {
    const c = { mariposa: [-360, -120], vista: [120, 420], coral: [330, -260], palma: [-120, 200], mirador: [420, 140], puerto: [300, 320] };
    const v = c[id] ?? [0, 0];
    return { x: v[0], z: v[1] };
  }

  function drawBars(state) {
    // Health.
    const hx = 28, hy = 160, w = 190;
    fill(hx, hy, w, 14, '#151b26', 4);
    fill(hx, hy, w * (state.player.hp / 100), 14, '#3f9bd9', 4);
    text('HEALTH', hx, hy + 17, 11, '#b9c4d6');
    // Armour.
    const ax = 28, ay = 192;
    fill(ax, ay, w, 12, '#151b26', 4);
    fill(ax, ay, w * (state.player.armour / 100), 12, '#c9a24a', 4);
    text('ARMOUR', ax, ay + 15, 11, '#b9c4d6');
  }

  function drawWanted(state) {
    const x = 1040, y = 24;
    for (let i = 0; i < 5; i += 1) {
      const col = i < state.wanted ? '#ffd24a' : '#3a3f4c';
      ctx.fillStyle = col;
      drawStar(x + i * 26, y + 12, 11, 5, 4.2);
    }
    text(`WANTED ${state.wanted}`, x - 2, y + 40, 12, '#ffd24a', 'right', 'bold');
    if (state.wanted >= 3) text('AIR UNIT DEPLOYED', x + 20, y + 56, 11, '#7fb7ff', 'right');
  }

  function drawStar(cx, cy, outer, points, inner) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px(x), px(y)); else ctx.lineTo(px(x), px(y));
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawWeapons(state) {
    const x = 28, y = 680;
    for (let i = 0; i < 5; i += 1) {
      const w = state.combat.slots[i];
      const selected = state.combat.current === i;
      const col = selected ? '#4fc3f7' : (w >= 0 ? '#2a3242' : '#1a1f2a');
      fill(x + i * 54, y, 48, 30, col, 5);
      stroke(x + i * 54, y, 48, 30, selected ? '#7fd4ff' : '#3a4252', 5, selected ? 2 : 1);
      const name = w >= 0 ? WEAPONS[w].name : '—';
      text(name, x + i * 54 + 24, y + 9, 10, w >= 0 ? '#e8f0f8' : '#556070', 'center', 'bold');
      if (w >= 0 && WEAPONS[w].ammo !== -1) {
        text(String(state.combat.ammo[WEAPONS[w].id]), x + i * 54 + 24, y + 20, 10, '#b9c4d6', 'center');
      }
    }
  }

  function drawObjective(state) {
    const x = 24, y = 24;
    if (!state.mission) return;
    const m = state.mission;
    const stage = m.current.stages[Math.min(m.stageIndex, m.current.stages.length - 1)];
    fill(x, y, 500, 120, 'rgba(12,16,26,0.82)', 8);
    stroke(x, y, 500, 120, '#3a4252', 8, 1);
    text(`MISSION ${m.current.id} · ${m.current.name}`, x + 16, y + 14, 17, '#ffd27a', 'left', 'bold');
    text(`STAGE ${m.stageIndex + 1}/${m.current.stages.length} · ${stage.text.toUpperCase()}`, x + 16, y + 42, 13, '#e8f0f8', 'left', 'bold');
    text(`OBJECTIVE: ${stage.text}`, x + 16, y + 64, 12, '#b9c4d6');
    text(`NEXT: ${stage.next}`, x + 16, y + 86, 12, '#7fd4ff');
  }

  function drawCar(state) {
    if (!state.player.inVehicle) return;
    const x = 24, y = 216;
    fill(x, y, 300, 74, 'rgba(12,16,26,0.82)', 6);
    const spd = Math.round(Math.abs(state.player.speed) * 3.6);
    text(`${spd}`, x + 14, y + 6, 30, '#e8f0f8', 'left', 'bold');
    text('KM/H', x + 62, y + 22, 11, '#7a8698');
    const carName = state.player.vehicle?.name ?? 'MAREA GT';
    text(carName, x + 14, y + 42, 14, '#ffd27a', 'left', 'bold');
    const dents = Math.round(state.player.dents ?? 0);
    text(`CONDITION ${100 - dents}%`, x + 14, y + 60, 11, dents > 50 ? '#e05a5a' : '#7fd48a');
  }

  function drawRadio(state) {
    const station = RADIO[state.radioIndex % RADIO.length];
    fill(500, 682, 420, 28, 'rgba(12,16,26,0.7)', 5);
    text(station.name, 512, 689, 11, '#7fd4ff', 'left', 'bold');
    text(station.line, 512, 700, 10, '#b9c4d6');
  }

  function drawClock(state) {
    const h = Math.floor(state.clock.hour) % 24;
    const m = Math.floor(state.clock.minute);
    const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${state.clock.night > 0.5 ? 'NIGHT' : 'DAY'}`;
    text(label, 640, 20, 13, '#e8f0f8', 'center', 'bold');
  }

  function drawCrew(state) {
    const x = 900, y = 600;
    for (let i = 0; i < CREW.length; i += 1) {
      const c = CREW[i];
      const owned = state.crew[c.id];
      fill(x + i * 116, y, 106, 92, 'rgba(12,16,26,0.78)', 6);
      stroke(x + i * 116, y, 106, 92, owned ? '#4fc3f7' : '#3a4252', 6, 1);
      text(c.role, x + i * 116 + 53, y + 8, 10, '#7fd4ff', 'center', 'bold');
      text(c.name, x + i * 116 + 53, y + 24, 10, '#e8f0f8', 'center');
      text(c.ability, x + i * 116 + 53, y + 40, 11, '#ffd27a', 'center', 'bold');
      text(`[${c.key.replace('Key', '')}]`, x + i * 116 + 53, y + 56, 9, '#7a8698', 'center');
      text(owned ? 'READY' : 'LOCKED', x + i * 116 + 53, y + 72, 9, owned ? '#6ed27a' : '#556070', 'center', 'bold');
    }
  }

  function drawDistrict(state) {
    const d = DISTRICTS.find(dd => dd.id === state.district);
    if (!d) return;
    const standing = state.standing[d.id] ?? 0;
    const col = standing >= 60 ? '#6ed27a' : standing >= 30 ? '#e0c07a' : '#e05a5a';
    text(`${d.name} — ${d.blurb}`, 640, 706, 12, '#e8f0f8', 'center', 'bold');
    text(`${standing >= 60 ? 'FRIENDLY' : standing >= 30 ? 'NEUTRAL' : 'HOSTILE'} · ${standing}`, 640, 722, 11, col, 'center');
  }

  function drawDialogue(state) {
    const d = state.mission?.dialogue;
    if (!d) return;
    const x = 320, y = 470, w = 640;
    const line = d.lines[Math.min(d.line, d.lines.length - 1)];
    fill(x, y, w, 120, 'rgba(12,16,26,0.88)', 10);
    stroke(x, y, w, 120, '#3a4252', 10, 1);
    // Named portrait.
    fill(x + 12, y + 12, 72, 96, d.portrait, 8);
    text(d.name.slice(0, 1), x + 48, y + 30, 34, '#ffffff', 'center', 'bold');
    text(d.name, x + 96, y + 16, 13, '#ffd27a', 'left', 'bold');
    text(line, x + 96, y + 40, 13, '#e8f0f8');
  }

  function drawDispatch(state) {
    if (state.wanted <= 0 || !state.police.response.length) return;
    const x = 1060, y = 120, w = 196;
    fill(x, y, w, 210, 'rgba(12,16,26,0.82)', 8);
    text('CBP RESPONSE', x + 10, y + 8, 12, '#7fb7ff', 'left', 'bold');
    let yy = y + 28;
    for (let i = 0; i < Math.min(7, state.police.response.length); i += 1) {
      const r = state.police.response[i];
      text(r.callsign, x + 10, yy, 10, '#e8f0f8', 'left', 'bold');
      text(r.tactic, x + 10, yy + 12, 9, '#7a8698');
      text(`${r.distance} m`, x + 150, yy + 12, 9, '#ffd27a', 'right');
      yy += 24;
    }
  }

  function drawBanner(state) {
    if (!state.banner) return;
    const { title, sub, next } = state.banner;
    fill(300, 40, 680, next ? 78 : 54, 'rgba(12,16,26,0.9)', 8);
    text(title, 640, 50, 18, '#ffd27a', 'center', 'bold');
    text(sub, 640, 72, 11, '#e8f0f8', 'center');
    if (next) text(`NEXT: ${next}`, 640, 92, 11, '#7fd4ff', 'center');
  }

  function drawCash(state) {
    text(`$${state.cash.toLocaleString()}`, 1210, 20, 18, '#6ed27a', 'right', 'bold');
  }

  function drawCrosshair(state) {
    if (!state.aiming && !state.player.inVehicle) return;
    const cx = 640, cy = 360;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = px(1.5);
    ctx.beginPath();
    ctx.moveTo(px(cx - 8), px(cy)); ctx.lineTo(px(cx - 3), px(cy));
    ctx.moveTo(px(cx + 3), px(cy)); ctx.lineTo(px(cx + 8), px(cy));
    ctx.moveTo(px(cx), px(cy - 8)); ctx.lineTo(px(cx), px(cy - 3));
    ctx.moveTo(px(cx), px(cy + 3)); ctx.lineTo(px(cx), px(cy + 8));
    ctx.stroke();
  }

  function drawHitmark(state) {
    if (!state.combat.hitmark) return;
    const cx = 640, cy = 360;
    ctx.strokeStyle = '#ff6a6a';
    ctx.lineWidth = px(2);
    ctx.beginPath();
    for (const a of [0, 90, 180, 270]) {
      const r = a * Math.PI / 180;
      ctx.moveTo(px(cx + Math.cos(r) * 10), px(cy + Math.sin(r) * 10));
      ctx.lineTo(px(cx + Math.cos(r) * 16), px(cy + Math.sin(r) * 16));
    }
    ctx.stroke();
  }

  function draw(state) {
    ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
    ctx.clearRect(0, 0, canvas.width / view.scale, canvas.height / view.scale);
    if (state.screen !== 'play') return;
    drawMinimap(state);
    drawBars(state);
    drawWanted(state);
    drawWeapons(state);
    drawObjective(state);
    drawCar(state);
    drawRadio(state);
    drawClock(state);
    drawCrew(state);
    drawDistrict(state);
    drawDialogue(state);
    drawDispatch(state);
    drawBanner(state);
    drawCash(state);
    drawCrosshair(state);
    drawHitmark(state);
  }

  return { draw, resize, canvas, rr };
}
