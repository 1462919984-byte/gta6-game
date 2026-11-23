// The day/night clock plus a human-readable clock string for the HUD. One game
// hour passes every 20 real seconds, so the golden hour, the day and the night
// market all come around during a normal play session.
//
// The sky reads `sunset` (0 at noon, 1 at golden hour ~18:00) and `night` (0 in
// the day, 1 at midnight) as two independent ramps, which is what lets the staged
// shots hold a deep orange sunset while the "night" foot shot still goes dark.

export function createClock() {
  let hour = 17.5;          // start near golden hour
  const hourLength = 20;    // real seconds per game hour

  function step(dt) {
    hour += dt / hourLength;
    if (hour >= 24) hour -= 24;
  }

  // 0 in the middle of the day, 1 at 18:00 (golden hour) and again 0 at midnight.
  function sunset() {
    const c = Math.cos(((hour - 18) / 24) * Math.PI * 2);
    return Math.max(0, c);
  }

  // 0 during the day, 1 at midnight, so it rises in the evening and falls at dawn.
  function night() {
    const c = -Math.cos(((hour - 12) / 24) * Math.PI * 2);
    return Math.max(0, Math.min(1, c));
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
    get sunset() { return sunset(); },
    get night() { return night(); },
    get label() { return label(); },
    step,
    reset() { hour = 17.5; },
  };
}
