// Original WebAudio sound: no samples, no copyright. A tiny synth engine builds
// engine hums, gunshots, sirens, chimes, radio jingles and a two-chord ambient pad
// procedurally. Nothing is fetched from the network.

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let engine = null;
  let engineGain = null;
  let radioTimer = 0;
  let jingleTimer = 0;
  let volume = 0.7;
  let musicLevel = 0.55;

  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = musicLevel;
    musicGain.connect(master);
  }

  function tone(freq, dur, type, gain, when = 0, slide = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, gain, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(master);
    src.start(t);
  }

  function setEngine(speedRatio) {
    if (!ctx) return;
    if (!engine) {
      engine = ctx.createOscillator();
      engine.type = 'sawtooth';
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engine.connect(engineGain).connect(master);
      engine.start();
    }
    const freq = 46 + speedRatio * 78;
    engine.frequency.setTargetAtTime(freq, ctx.currentTime, 0.08);
    engineGain.gain.setTargetAtTime(speedRatio > 0.05 ? 0.12 + speedRatio * 0.16 : 0, ctx.currentTime, 0.1);
  }

  function gunshot() { tone(180, 0.12, 'square', 0.3, 0, -140); noise(0.14, 0.35); }
  function punch() { tone(110, 0.08, 'triangle', 0.3, 0, -70); }
  function siren() { tone(820, 0.22, 'triangle', 0.16, 0, 240); tone(620, 0.22, 'triangle', 0.16, 0.22, -180); }
  function hit() { tone(320, 0.1, 'sine', 0.25, 0, -120); }
  function collect() { tone(660, 0.12, 'sine', 0.22, 0, 220); tone(880, 0.16, 'sine', 0.2, 0.1, 240); }
  function mission() { tone(440, 0.16, 'sine', 0.2, 0, 160); tone(554, 0.16, 'sine', 0.2, 0.14, 160); tone(659, 0.3, 'sine', 0.22, 0.28, 120); }
  function busted() { tone(300, 0.5, 'sawtooth', 0.25, 0, -220); tone(200, 0.6, 'sawtooth', 0.2, 0.1, -140); }

  function step(dt, state) {
    if (!ctx) return;
    // Radio: a gentle two-note pad and a jingle every few seconds.
    radioTimer -= dt;
    jingleTimer -= dt;
    if (state.player.inVehicle && state.wanted === 0) {
      if (radioTimer <= 0) {
        const root = 220 + (state.radioIndex % 5) * 24;
        tone(root, 0.8, 'sine', 0.05);
        tone(root * 1.5, 0.8, 'sine', 0.035, 0.4);
        radioTimer = 1.6;
      }
      if (jingleTimer <= 0) {
        tone(392, 0.3, 'triangle', 0.12);
        tone(494, 0.3, 'triangle', 0.12, 0.3);
        tone(587, 0.45, 'triangle', 0.14, 0.6);
        jingleTimer = 8 + Math.random() * 6;
      }
    }
    // Sirens pulse with the wanted level.
    if (state.wanted > 0 && state.sirenTimer <= 0) {
      siren();
      state.sirenTimer = 0.55;
    }
  }

  function setVolume(v) { volume = v; if (master) master.gain.value = v; }
  function setMusic(v) { musicLevel = v; if (musicGain) musicGain.gain.value = v; }

  return { ensure, step, setEngine, gunshot, punch, siren, hit, collect, mission, busted, setVolume, setMusic };
}
