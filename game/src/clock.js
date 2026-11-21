// The day/night clock plus a human-readable clock string for the HUD. One game
// hour passes every 20 real seconds, so the golden hour, the day and the night
// market all come around during a normal play session. `night` is 0 at noon and
// 1 at midnight, used by the sky to fade to deep blue.

export function createClock() {
  let hour = 16.5;          // start at golden hour
  const hourLength = 20;    // real seconds per game hour

  function step(dt) {
    hour += dt / hourLength;
    if (hour >= 24) hour -= 24;
  }

  function night() {
    // 0 at noon, 1 at midnight.
    const c = Math.cos(((hour - 12) / 24) * Math.PI * 2);
    return Math.max(0, c);
  }

  function label() {
    const h = Math.floor(hour) % 24;
    const m = Math.floor((hour % 1) * 60);
    const phase = hour >= 6 && hour < 19 ? 'DAY' : 'NIGHT';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${phase}`;
  }

  return {
    get hour() { return hour; },
    set hour(v) { hour = v; },
    get minute() { return (hour % 1) * 60; },
    get night() { return night(); },
    get label() { return label(); },
    step,
    reset() { hour = 16.5; },
  };
}
