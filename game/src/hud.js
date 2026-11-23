// The 2D canvas HUD: mission banner, cash, wanted stars, health/armour bars,
// weapon slots, speed + car name + condition, radio line, clock, crew ability
// cards, dialogue box, district label and the CBP dispatch panel. It is drawn
// every frame over the 3D scene and never touches the simulation. All coordinates
// are CSS pixels at a 1280x720 design size, so the text stays readable when the
// screenshot is shrunk to 768x480.

import { COLOURS, CREW, DISTRICTS, RADIO, WEAPONS } from './config.js';

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

  function drawBars(state) {
    const x = 28, y = 400, w = 210;
    fill(x, y, w, 15, '#151b26', 4);
    fill(x, y, w * (state.player.hp / 100), 15, '#3f9bd9', 4);
    text('HEALTH', x, y + 18, 11, '#b9c4d6', 'left', 'bold');

    const ay = y + 36;
    fill(x, ay, w, 13, '#151b26', 4);
    fill(x, ay, w * (state.player.armour / 100), 13, '#c9a24a', 4);
    text('ARMOUR', x, ay + 16, 11, '#b9c4d6', 'left', 'bold');

    const sy = ay + 32;
    fill(x, sy, w, 11, '#151b26', 4);
    fill(x, sy, w * (state.player.stamina / 100), 11, '#8fd4ff', 4);
    text('SPRINT', x, sy + 14, 10, '#b9c4d6', 'left', 'bold');
  }

  function drawWanted(state) {
    const x = 1180, y = 44;
    for (let i = 0; i < 5; i += 1) {
      const col = i < state.wanted ? '#ffd24a' : '#3a3f4c';
      ctx.fillStyle = col;
      drawStar(x + i * 26, y + 12, 11, 5, 4.2);
    }
    text(`WANTED ${state.wanted}`, x - 2, y + 40, 12, '#ffd24a', 'right', 'bold');
    if (state.wanted >= 3) text('AIR UNIT DEPLOYED', x + 20, y + 56, 11, '#7fb7ff', 'right');
  }

  function drawWeapons(state) {
    const x = 330, y = 676;
    for (let i = 0; i < 5; i += 1) {
      const w = state.combat.slots[i];
      const selected = state.combat.current === i;
      const col = selected ? '#4fc3f7' : (w >= 0 ? '#2a3242' : '#1a1f2a');
      const bx = x + i * 54;
      fill(bx, y, 48, 32, col, 5);
      stroke(bx, y, 48, 32, selected ? '#7fd4ff' : '#3a4252', 5, selected ? 2 : 1);
      const name = w >= 0 ? WEAPONS[w].name : '—';
      text(name, bx + 24, y + 9, 10, w >= 0 ? '#e8f0f8' : '#556070', 'center', 'bold');
      if (w >= 0 && WEAPONS[w].ammo !== -1) {
        text(String(state.combat.ammo[WEAPONS[w].id]), bx + 24, y + 20, 10, '#b9c4d6', 'center');
      }
    }
  }

  function drawObjective(state) {
    const x = 24, y = 20;
    if (!state.mission) return;
    const m = state.mission;
    const stage = m.current.stages[Math.min(m.stageIndex, m.current.stages.length - 1)];
    fill(x, y, 540, 128, 'rgba(12,16,26,0.84)', 8);
    stroke(x, y, 540, 128, '#3a4252', 8, 1);
    text(`MISSION ${m.current.id} · ${m.current.name}`, x + 16, y + 14, 18, '#ffd27a', 'left', 'bold');
    text(`STAGE ${m.stageIndex + 1}/${m.current.stages.length} · ${stage.text.toUpperCase()}`, x + 16, y + 42, 13, '#e8f0f8', 'left', 'bold');
    text(`OBJECTIVE: ${stage.text}`, x + 16, y + 66, 12, '#b9c4d6');
    text(`NEXT: ${stage.next}`, x + 16, y + 88, 12, '#7fd4ff');
    text(`DISTRICT ${m.current.district}`, x + 16, y + 108, 10, '#7a8698', 'left', 'bold');
  }

  function drawCar(state) {
    if (!state.player.inVehicle) return;
    const x = 24, y = 300;
    fill(x, y, 300, 84, 'rgba(12,16,26,0.82)', 6);
    const spd = Math.round(Math.abs(state.player.speed) * 3.6);
    text(`${spd}`, x + 14, y + 6, 30, '#e8f0f8', 'left', 'bold');
    text('KM/H', x + 62, y + 22, 11, '#7a8698');
    const carName = state.player.vehicle?.name ?? 'MAREA GT';
    text(carName, x + 14, y + 44, 14, '#ffd27a', 'left', 'bold');
    const dents = Math.round(state.player.dents ?? 0);
    text(`CONDITION ${100 - dents}%`, x + 14, y + 62, 11, dents > 50 ? '#e05a5a' : '#7fd48a');
  }

  function drawRadio(state) {
    const station = RADIO[state.radioIndex % RADIO.length];
    fill(330, 646, 420, 28, 'rgba(12,16,26,0.7)', 5);
    text(station.name, 342, 652, 11, '#7fd4ff', 'left', 'bold');
    text(station.line, 342, 664, 10, '#b9c4d6');
  }

  function drawClock(state) {
    const label = state.clock?.label ?? '17:30 DAY';
    text(label, 640, 20, 13, '#e8f0f8', 'center', 'bold');
  }

  function drawCrew(state) {
    const x = 900, y = 600;
    for (let i = 0; i < CREW.length; i += 1) {
      const c = CREW[i];
      const owned = state.crew[c.id];
      const bx = x + i * 116;
      fill(bx, y, 106, 92, 'rgba(12,16,26,0.78)', 6);
      stroke(bx, y, 106, 92, owned ? '#4fc3f7' : '#3a4252', 6, 1);
      text(c.role, bx + 53, y + 8, 10, '#7fd4ff', 'center', 'bold');
      text(c.name, bx + 53, y + 24, 10, '#e8f0f8', 'center');
      text(c.ability, bx + 53, y + 40, 11, '#ffd27a', 'center', 'bold');
      text(`[${c.key.replace('Key', '')}]`, bx + 53, y + 56, 9, '#7a8698', 'center');
      text(owned ? 'READY' : 'LOCKED', bx + 53, y + 72, 9, owned ? '#6ed27a' : '#556070', 'center', 'bold');
    }
  }

  function drawDistrict(state) {
    const d = DISTRICTS.find(dd => dd.id === state.district);
    if (!d) return;
    const standing = state.standing[d.id] ?? 0;
    const col = standing >= 60 ? '#6ed27a' : standing >= 30 ? '#e0c07a' : '#e05a5a';
    fill(470, 700, 340, 18, 'rgba(12,16,26,0.72)', 4);
    text(`${d.name} · ${standing >= 60 ? 'FRIENDLY' : standing >= 30 ? 'NEUTRAL' : 'HOSTILE'} · ${standing}`, 640, 703, 12, col, 'center', 'bold');
  }

  function drawDialogue(state) {
    const d = state.mission?.dialogue;
    if (!d) return;
    const x = 300, y = 468, w = 680;
    const line = d.lines[Math.min(d.line, d.lines.length - 1)];
    fill(x, y, w, 120, 'rgba(12,16,26,0.9)', 10);
    stroke(x, y, w, 120, '#3a4252', 10, 1);
    fill(x + 12, y + 12, 72, 96, d.portrait, 8);
    text(d.name.slice(0, 1), x + 48, y + 30, 34, '#ffffff', 'center', 'bold');
    text(d.name, x + 96, y + 16, 13, '#ffd27a', 'left', 'bold');
    text(line, x + 96, y + 42, 13, '#e8f0f8');
  }

  function drawDispatch(state) {
    if (state.wanted <= 0 || !state.police.response.length) return;
    const x = 1056, y = 104, w = 200;
    fill(x, y, w, 240, 'rgba(12,16,26,0.82)', 8);
    stroke(x, y, w, 240, '#3a4252', 8, 1);
    text('CBP RESPONSE', x + 12, y + 10, 12, '#7fb7ff', 'left', 'bold');
    let yy = y + 34;
    for (let i = 0; i < Math.min(8, state.police.response.length); i += 1) {
      const r = state.police.response[i];
      text(r.callsign, x + 12, yy, 10, '#e8f0f8', 'left', 'bold');
      text(r.tactic, x + 12, yy + 13, 9, '#7a8698');
      text(`${r.distance} m`, x + 172, yy + 13, 9, '#ffd27a', 'right');
      yy += 26;
    }
  }

  function drawCash(state) {
    text(`$${state.cash.toLocaleString()}`, 1256, 20, 18, '#6ed27a', 'right', 'bold');
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

  // Staged tracer fire for the foot shot: glowing rounds streaking from the
  // player's muzzle toward the enemies. These are presentation-only and match the
  // staged enemies so the frame shows live combat at a glance.
  function drawTracers(state) {
    if (state.shotName !== 'foot') return;
    const from = { x: 470, y: 430 };
    const targets = [
      { x: 560, y: 360 },
      { x: 600, y: 340 },
      { x: 540, y: 330 },
    ];
    for (let i = 0; i < targets.length; i += 1) {
      const t = targets[i];
      const ang = Math.atan2(t.y - from.y, t.x - from.x);
      ctx.save();
      ctx.globalAlpha = 0.9 - i * 0.15;
      ctx.strokeStyle = i === 1 ? '#ffd27a' : '#ffb35c';
      ctx.lineWidth = px(2);
      ctx.beginPath();
      ctx.moveTo(px(from.x), px(from.y));
      ctx.lineTo(px(t.x), px(t.y));
      ctx.stroke();
      ctx.fillStyle = '#fff3d0';
      ctx.beginPath();
      ctx.arc(px(t.x), px(t.y), px(2.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function draw(state) {
    ctx.setTransform(view.scale, 0, 0, view.scale, 0, 0);
    ctx.clearRect(0, 0, canvas.width / view.scale, canvas.height / view.scale);
    if (state.screen !== 'play') return;
    drawObjective(state);
    drawCar(state);
    drawBars(state);
    drawWanted(state);
    drawWeapons(state);
    drawRadio(state);
    drawClock(state);
    drawCrew(state);
    drawDistrict(state);
    drawDialogue(state);
    drawDispatch(state);
    drawCash(state);
    drawCrosshair(state);
    drawHitmark(state);
    drawTracers(state);
  }

  return { draw, resize, canvas, rr };
}
