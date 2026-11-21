// Title and pause screens, all drawn on the same HUD canvas. The title floats over
// the living 3D city at sunset; the pause screen has map / story / stats / crew /
// settings / controls / save tabs. Buttons are pointer-hit-tested so they work with
// a mouse, and the whole thing is keyboard-navigable with arrows and Enter.

import { CITY, CREW, DISTRICTS } from './config.js';

export function createMenus(hud, save) {
  const ctx = hud.canvas.getContext('2d');
  let screen = 'title';   // 'title' | 'pause' | 'none'
  let pauseTab = 'map';
  let titleIndex = 0;
  let pauseIndex = 0;
  let hover = -1;

  const titleButtons = ['CONTINUE', 'NEW GAME', 'LOAD GAME', 'SETTINGS'];
  const tabs = ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE'];

  function isTitle() { return screen === 'title'; }
  function isPause() { return screen === 'pause'; }

  function drawTitle(state) {
    const W = 1280, H = 720;
    // Big gradient city title.
    ctx.fillStyle = 'rgba(8,10,16,0.35)';
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 150, 0, 260);
    grad.addColorStop(0, '#ffd27a');
    grad.addColorStop(0.5, '#f6a24a');
    grad.addColorStop(1, '#c94f6a');
    ctx.font = '900 96px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = grad;
    ctx.fillText('SOLARA', W / 2, 150);
    ctx.fillText('COAST', W / 2, 258);
    ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#e8f0f8';
    ctx.fillText('An open-world crime saga under a golden sky', W / 2, 372);

    // Buttons.
    for (let i = 0; i < titleButtons.length; i += 1) {
      const y = 420 + i * 56;
      const sel = i === titleIndex;
      ctx.fillStyle = sel ? 'rgba(255,210,122,0.92)' : 'rgba(12,16,26,0.8)';
      hud.rr(500, y, 280, 44, 8); ctx.fill();
      ctx.fillStyle = sel ? '#111826' : '#e8f0f8';
      ctx.font = '700 17px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(titleButtons[i], W / 2, y + 13);
    }

    // Save slots summary.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b9c4d6';
    ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SAVE SLOTS', 520, 668);
    for (let s = 0; s < 3; s += 1) {
      const slot = save.slots[s];
      const label = slot ? `Act ${slot.act} · Mission ${slot.mission} · ${slot.completion}%` : 'EMPTY';
      ctx.fillStyle = slot ? '#7fd48a' : '#556070';
      ctx.fillText(`${s + 1}. ${label}`, 520, 690 + s * 18);
    }
  }

  function drawMap(state) {
    const W = 1280, H = 720;
    ctx.fillStyle = 'rgba(8,10,16,0.88)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '800 40px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SOLARA COAST', W / 2, 56);
    ctx.font = '500 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#b9c4d6';
    ctx.fillText('DISTRICT STANDING', W / 2, 84);

    // A stylised full-city map.
    const mx = 120, my = 120, mw = 1040, mh = 430;
    ctx.fillStyle = '#101622';
    hud.rr(mx, my, mw, mh, 10); ctx.fill();
    ctx.strokeStyle = '#3a3f4c';
    hud.rr(mx, my, mw, mh, 10); ctx.stroke();
    // Water on the south edge.
    ctx.fillStyle = '#1d6d8c';
    ctx.fillRect(mx, my + mh - 70, mw, 70);
    // District blocks.
    const centres = {
      mariposa: [mx + 250, my + 230], vista: [mx + 520, my + 90], coral: [mx + 760, my + 260],
      palma: [mx + 420, my + 180], mirador: [mx + 880, my + 150], puerto: [mx + 820, my + 330],
    };
    for (const d of DISTRICTS) {
      const [x, y] = centres[d.id];
      const standing = state.standing[d.id] ?? 0;
      const col = standing >= 60 ? '#6ed27a' : standing >= 30 ? '#e0c07a' : '#e05a5a';
      ctx.fillStyle = col + '55';
      hud.rr(x - 80, y - 40, 160, 80, 8); ctx.fill();
      ctx.strokeStyle = col;
      hud.rr(x - 80, y - 40, 160, 80, 8); ctx.stroke();
      ctx.fillStyle = '#e8f0f8';
      ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(d.name, x, y - 12);
      ctx.fillStyle = col;
      ctx.font = '600 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${standing >= 60 ? 'FRIENDLY' : standing >= 30 ? 'NEUTRAL' : 'HOSTILE'} · ${standing}`, x, y + 12);
    }
    // Legend.
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b9c4d6';
    ctx.font = '500 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('GREEN — friendly · AMBER — neutral · RED — hostile', mx + 20, my + mh - 26);
  }

  function drawStats(state) {
    const W = 1280, H = 720;
    ctx.fillStyle = 'rgba(8,10,16,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd27a';
    ctx.font = '800 38px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('CAREER', W / 2, 52);

    // Completion ring.
    const cx = 340, cy = 320, r = 110;
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
    ctx.font = '800 44px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`${state.completion.toFixed(1)}%`, cx, cy - 10);
    ctx.font = '600 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('COMPLETE', cx, cy + 36);

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
    let sy = 180;
    for (const [name, value] of stats) {
      ctx.fillStyle = '#556070';
      ctx.font = '600 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(name, 520, sy);
      ctx.fillStyle = '#e8f0f8';
      ctx.font = '700 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(String(value), 760, sy - 4);
      sy += 46;
    }

    // Mission ratings.
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('MISSION RATINGS', 920, 180);
    for (let m = 0; m < 8; m += 1) {
      const rating = state.ratings[m];
      const col = rating === 'GOLD' ? '#ffd27a' : rating === 'SILVER' ? '#c9d2d8' : rating === 'BRONZE' ? '#c98a5a' : '#556070';
      ctx.fillStyle = col;
      ctx.font = '700 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`M${m + 1} ${rating ?? '—'}`, 920, 206 + m * 26);
    }

    // Save slots.
    ctx.fillStyle = '#ffd27a';
    ctx.font = '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('SAVE SLOTS', 520, 560);
    for (let s = 0; s < 3; s += 1) {
      const slot = save.slots[s];
      ctx.fillStyle = slot ? '#7fd48a' : '#556070';
      ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${s + 1}. ${slot ? `Act ${slot.act} · Mission ${slot.mission} · ${slot.completion}%` : 'EMPTY'}`, 520, 584 + s * 20);
    }
  }

  function drawTabs() {
    const x = 340, y = 680;
    for (let i = 0; i < tabs.length; i += 1) {
      const sel = i === pauseIndex;
      ctx.fillStyle = sel ? '#ffd27a' : '#2a3242';
      hud.rr(x + i * 86, y, 78, 26, 5); ctx.fill();
      ctx.fillStyle = sel ? '#111826' : '#e8f0f8';
      ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tabs[i], x + i * 86 + 39, y + 8);
      ctx.textAlign = 'left';
    }
  }

  function drawPause(state) {
    if (pauseTab === 'map') drawMap(state);
    else if (pauseTab === 'stats') drawStats(state);
    else {
      // Story / crew / settings / controls / save share this layout.
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
      const bx = 500, bw = 280, by = 420, bh = 44;
      for (let i = 0; i < titleButtons.length; i += 1) {
        const yy = by + i * 56;
        if (x >= bx && x <= bx + bw && y >= yy && y <= yy + bh) return { type: 'title', index: i };
      }
    } else if (screen === 'pause') {
      const tx = 340, ty = 680;
      for (let i = 0; i < tabs.length; i += 1) {
        if (x >= tx + i * 86 && x <= tx + i * 86 + 78 && y >= ty && y <= ty + 26) return { type: 'tab', index: i };
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
