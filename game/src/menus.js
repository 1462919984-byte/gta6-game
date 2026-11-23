// Title and pause screens, all drawn on the same HUD canvas. The title floats over
// the living 3D city at sunset with a large gradient wordmark, the four menu
// actions and three save slots. The pause screen has map / story / stats / crew /
// settings / controls / save tabs. Buttons are pointer-hit-tested and the whole
// thing is keyboard-navigable with arrows and Enter.

import { CITY, CREW, DISTRICTS } from './config.js';

export function createMenus(hud, save) {
  const ctx = hud.canvas.getContext('2d');
  let screen = 'title';
  let pauseTab = 'map';
  let titleIndex = 0;
  let pauseIndex = 0;

  const titleButtons = ['CONTINUE', 'NEW GAME', 'LOAD GAME', 'SETTINGS'];
  const tabs = ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE'];

  function isTitle() { return screen === 'title'; }
  function isPause() { return screen === 'pause'; }

  function drawTitle(state) {
    const W = 1280, H = 720;
    // Darken only the centre strip so the 3D sunset city remains visible at the
    // edges — the title must float over the world, not hide it.
    const gradBack = ctx.createLinearGradient(0, 0, 0, H);
    gradBack.addColorStop(0, 'rgba(8,10,16,0.20)');
    gradBack.addColorStop(0.55, 'rgba(8,10,16,0.66)');
    gradBack.addColorStop(1, 'rgba(8,10,16,0.30)');
    ctx.fillStyle = gradBack;
    ctx.fillRect(0, 0, W, H);

    // Big gradient city title with a soft drop shadow for contrast.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    const grad = ctx.createLinearGradient(0, 130, 0, 300);
    grad.addColorStop(0, '#ffe9a0');
    grad.addColorStop(0.45, '#f6a24a');
    grad.addColorStop(0.75, '#e06a5a');
    grad.addColorStop(1, '#c94f6a');
    ctx.font = '900 118px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = grad;
    ctx.fillText('SOLARA', W / 2, 132);
    ctx.fillText('COAST', W / 2, 256);
    ctx.restore();
    ctx.font = '600 23px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f2e2c0';
    ctx.fillText('An open-world crime saga under a golden sky', W / 2, 392);

    // Buttons.
    for (let i = 0; i < titleButtons.length; i += 1) {
      const y = 428 + i * 54;
      const sel = i === titleIndex;
      ctx.fillStyle = sel ? 'rgba(255,210,122,0.94)' : 'rgba(12,16,26,0.84)';
      hud.rr(500, y, 280, 44, 8); ctx.fill();
      if (sel) { ctx.strokeStyle = '#fff3d0'; ctx.lineWidth = 2; hud.rr(500, y, 280, 44, 8); ctx.stroke(); }
      ctx.fillStyle = sel ? '#111826' : '#e8f0f8';
      ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(titleButtons[i], W / 2, y + 13);
    }

    // Save slots summary on the right.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SAVE SLOTS', 840, 430);
    for (let s = 0; s < 3; s += 1) {
      const slot = save.slots[s];
      const label = slot ? `Act ${slot.act} · Mission ${slot.mission} · ${slot.completion}%` : 'EMPTY';
      ctx.fillStyle = slot ? '#7fd48a' : '#556070';
      ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${s + 1}. ${label}`, 840, 454 + s * 22);
    }
    ctx.fillStyle = '#7a8698';
    ctx.font = '500 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('↑↓ choose · ENTER confirm', 840, 532);
  }

  function drawMap(state) {
    const W = 1280, H = 720;
    ctx.fillStyle = 'rgba(8,10,16,0.90)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '800 42px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SOLARA COAST', W / 2, 48);
    ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#b9c4d6';
    ctx.fillText('DISTRICT STANDING', W / 2, 84);

    // A stylised full-city map with a readable street grid and coastal water.
    const mx = 110, my = 116, mw = 1060, mh = 430;
    ctx.fillStyle = '#101622';
    hud.rr(mx, my, mw, mh, 10); ctx.fill();
    ctx.strokeStyle = '#3a3f4c';
    ctx.lineWidth = 2;
    hud.rr(mx, my, mw, mh, 10); ctx.stroke();

    // Water along the south edge and a beach strip.
    ctx.fillStyle = '#1d6d8c';
    ctx.fillRect(mx, my + mh - 74, mw, 74);
    ctx.fillStyle = '#e7c98e';
    ctx.fillRect(mx, my + mh - 88, mw, 14);

    // Street grid.
    ctx.strokeStyle = '#2a3242';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = -8; k <= 8; k += 1) {
      const x = mx + mw / 2 + k * 46;
      ctx.moveTo(x, my);
      ctx.lineTo(x, my + mh - 74);
    }
    for (let j = -6; j <= 6; j += 1) {
      const y = my + mh / 2 - j * 40;
      ctx.moveTo(mx, y);
      ctx.lineTo(mx + mw, y);
    }
    ctx.stroke();

    // District blocks.
    const centres = {
      mariposa: [mx + 230, my + 250], vista: [mx + 520, my + 100], coral: [mx + 760, my + 260],
      palma: [mx + 400, my + 180], mirador: [mx + 900, my + 150], puerto: [mx + 850, my + 320],
    };
    for (const d of DISTRICTS) {
      const [x, y] = centres[d.id];
      const standing = state.standing[d.id] ?? 0;
      const col = standing >= 60 ? '#6ed27a' : standing >= 30 ? '#e0c07a' : '#e05a5a';
      ctx.fillStyle = col + '44';
      hud.rr(x - 82, y - 40, 164, 80, 8); ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      hud.rr(x - 82, y - 40, 164, 80, 8); ctx.stroke();
      ctx.fillStyle = '#e8f0f8';
      ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(d.name, x, y - 12);
      ctx.fillStyle = col;
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${standing >= 60 ? 'FRIENDLY' : standing >= 30 ? 'NEUTRAL' : 'HOSTILE'} · ${standing}`, x, y + 14);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b9c4d6';
    ctx.font = '500 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('GREEN — friendly · AMBER — neutral · RED — hostile', mx + 20, my + mh - 22);
  }

  function drawStats(state) {
    const W = 1280, H = 720;
    ctx.fillStyle = 'rgba(8,10,16,0.92)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '800 40px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('CAREER', W / 2, 50);

    // Completion ring.
    const cx = 330, cy = 330, r = 108;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (state.completion / 100));
    ctx.strokeStyle = '#ffd27a';
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2 + Math.PI * 2 * (state.completion / 100), -Math.PI / 2 + Math.PI * 2);
    ctx.strokeStyle = '#2a3242';
    ctx.lineWidth = 16;
    ctx.stroke();
    ctx.fillStyle = '#e8f0f8';
    ctx.font = '800 46px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${state.completion.toFixed(1)}%`, cx, cy - 12);
    ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('COMPLETE', cx, cy + 40);

    // Career stat rows.
    const stats = [
      ['CARS STOLEN', state.stats.carsStolen],
      ['COPS ESCAPED', state.stats.copsEscaped],
      ['DISTANCE DRIVEN', `${state.stats.distanceDriven.toFixed(1)} KM`],
      ['PEOPLE TAKEN OUT', state.stats.peopleTakenOut],
      ['MISSIONS GOLD', state.stats.missionsGold],
      ['STUNT JUMPS', state.stats.stuntJumps],
      ['COLLECTIBLES', state.stats.collectibles],
    ];
    ctx.textAlign = 'left';
    let sy = 176;
    for (const [name, value] of stats) {
      ctx.fillStyle = '#556070';
      ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(name, 500, sy);
      ctx.fillStyle = '#e8f0f8';
      ctx.font = '700 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(String(value), 760, sy - 4);
      sy += 46;
    }

    // Mission ratings.
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('MISSION RATINGS', 900, 176);
    for (let m = 0; m < 8; m += 1) {
      const rating = state.ratings[m];
      const col = rating === 'GOLD' ? '#ffd27a' : rating === 'SILVER' ? '#c9d2d8' : rating === 'BRONZE' ? '#c98a5a' : '#556070';
      ctx.fillStyle = col;
      ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`M${m + 1} ${rating ?? '—'}`, 900, 202 + m * 26);
    }

    // Save slots.
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SAVE SLOTS', 500, 560);
    for (let s = 0; s < 3; s += 1) {
      const slot = save.slots[s];
      ctx.fillStyle = slot ? '#7fd48a' : '#556070';
      ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${s + 1}. ${slot ? `Act ${slot.act} · Mission ${slot.mission} · ${slot.completion}%` : 'EMPTY'}`, 500, 584 + s * 20);
    }

    // Rank.
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('RANK', 900, 560);
    ctx.fillStyle = '#e8f0f8';
    ctx.font = '700 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(state.rank, 900, 584);
  }

  function drawTabs() {
    const x = 318, y = 682;
    for (let i = 0; i < tabs.length; i += 1) {
      const sel = i === pauseIndex;
      ctx.fillStyle = sel ? '#ffd27a' : '#2a3242';
      hud.rr(x + i * 92, y, 84, 28, 5); ctx.fill();
      ctx.fillStyle = sel ? '#111826' : '#e8f0f8';
      ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tabs[i], x + i * 92 + 42, y + 8);
      ctx.textAlign = 'left';
    }
  }

  function drawPause(state) {
    if (pauseTab === 'map') drawMap(state);
    else if (pauseTab === 'stats') drawStats(state);
    else {
      ctx.fillStyle = 'rgba(8,10,16,0.9)';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd27a';
      ctx.font = '800 38px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(tabs[pauseIndex], 640, 60);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#b9c4d6';
      ctx.font = '500 17px "Segoe UI", system-ui, sans-serif';
      let lines = [];
      if (pauseTab === 'story') {
        lines = ['ACT I — SALT & STEEL', 'You arrive in Solara Coast with nothing but a favour to repay.', 'Renzo Marín runs the docks; Ines Varela owns the night market.', 'Act II — GLASS & GOLD', 'Kai Okafor wants the towers, and Mara Sol wants out of Palma.', 'Act III — COASTAL CROWN', 'Win the last race and the whole coast answers to you.'];
      } else if (pauseTab === 'crew') {
        lines = CREW.map(c => `${c.name} — ${c.role}: ${c.ability} [${c.key.replace('Key', '')}]${state.crew[c.id] ? ' — RECRUITED' : ' — LOCKED'}`);
      } else if (pauseTab === 'settings') {
        lines = [`VOLUME ${Math.round(state.settings.volume * 100)}`, `MUSIC ${Math.round(state.settings.music * 100)}`, `QUALITY ${state.settings.quality === 1 ? 'HIGH' : 'LOW'}`, `INVERT Y ${state.settings.invertY ? 'ON' : 'OFF'}`, `MINIMAP ${state.settings.minimapLarge ? 'LARGE' : 'SMALL'} — press M to toggle`, 'Use ← → to change · Enter to confirm'];
      } else if (pauseTab === 'controls') {
        lines = ['W A S D — walk / drive', 'F — enter or exit a car', 'MOUSE — aim · LEFT CLICK / SPACE — fire', 'SHIFT — run', 'Q E R — crew abilities', 'TAB — radio · H — horn', 'P / ESC — pause'];
      } else if (pauseTab === 'save') {
        lines = ['1 — save slot 1', '2 — save slot 2', '3 — save slot 3', 'Your career, story, respect and district standing are kept in this browser.'];
      }
      let y = 130;
      for (const line of lines) { ctx.fillText(line, 260, y); y += 44; }
      ctx.fillStyle = '#ffd27a';
      ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Press ESC to resume', 260, 640);
    }
    drawTabs();
  }

  function pointer(x, y) {
    if (screen === 'title') {
      const bx = 500, bw = 280, by = 428, bh = 44;
      for (let i = 0; i < titleButtons.length; i += 1) {
        const yy = by + i * 54;
        if (x >= bx && x <= bx + bw && y >= yy && y <= yy + bh) return { type: 'title', index: i };
      }
    } else if (screen === 'pause') {
      const tx = 318, ty = 682;
      for (let i = 0; i < tabs.length; i += 1) {
        if (x >= tx + i * 92 && x <= tx + i * 92 + 84 && y >= ty && y <= ty + 28) return { type: 'tab', index: i };
      }
    }
    return null;
  }

  function toggleMinimapSize() {
    const next = !save.settings.minimapLarge;
    save.updateSettings({ minimapLarge: next });
    return next;
  }

  return { drawTitle, drawPause, drawTabs, isTitle, isPause,
    get screen() { return screen; },
    get pauseTab() { return pauseTab; },
    get titleIndex() { return titleIndex; },
    get pauseIndex() { return pauseIndex; },
    titleButtons, tabs, pointer, toggleMinimapSize,
    setScreen(s) { screen = s; },
    setTab(t) { pauseTab = t; pauseIndex = tabs.indexOf(t); },
    setTitle(i) { titleIndex = i; },
    setPause(i) { pauseIndex = i; } };
}
