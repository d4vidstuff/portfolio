/**
 * Banda sonora de rock de DEBUG.EXE, generada en vivo con la Web Audio API:
 * guitarra con distorsión (dos sierras en quinta por un waveshaper), bajo,
 * bombo, redoblante y hi-hat. No usa archivos de audio.
 *
 * Es un secuenciador por pasos: cada 25 ms se programan las notas de los
 * próximos 120 ms con el reloj del AudioContext, así el ritmo no depende de
 * los cuadros del juego.
 *
 * Uso: const music = createMusic(sound); music.play(nivel); music.stop();
 */

// Riffs en semitonos sobre Mi grave (E2). null = silencio, '-' = la nota sigue sonando.
// Cada riff son 2 compases de 16 semicorcheas.
const RIFFS = [
  // nivel 1: chugs en Mi
  [
    0,
    0,
    null,
    0,
    3,
    null,
    0,
    null,
    5,
    null,
    3,
    null,
    0,
    -2,
    0,
    null,
    0,
    0,
    null,
    0,
    3,
    null,
    0,
    null,
    7,
    '-',
    5,
    null,
    3,
    null,
    5,
    null,
  ],
  // nivel 2: más movido
  [
    0,
    null,
    0,
    0,
    7,
    null,
    5,
    null,
    0,
    null,
    0,
    0,
    10,
    '-',
    8,
    7,
    0,
    null,
    0,
    0,
    7,
    null,
    5,
    null,
    3,
    '-',
    3,
    5,
    7,
    '-',
    '-',
    null,
  ],
  // nivel 3: pesado y lento
  [
    0,
    '-',
    '-',
    0,
    null,
    0,
    1,
    '-',
    0,
    '-',
    '-',
    0,
    null,
    -2,
    -1,
    '-',
    0,
    '-',
    '-',
    0,
    null,
    0,
    1,
    '-',
    3,
    '-',
    1,
    '-',
    0,
    '-',
    '-',
    null,
  ],
  // jefe: galope
  [
    0,
    0,
    0,
    null,
    0,
    0,
    0,
    null,
    3,
    3,
    3,
    null,
    5,
    5,
    6,
    5,
    0,
    0,
    0,
    null,
    0,
    0,
    0,
    null,
    8,
    8,
    7,
    7,
    5,
    5,
    3,
    3,
  ],
];
const TEMPO = [138, 150, 112, 168];
// batería por paso: k = bombo, s = redoblante, h = hi-hat
const BEATS = [
  'k.h.s.h.k.k.s.h.k.h.s.h.k.hks.hh',
  'k.hkshh.k.hkshh.k.hkshh.kkhks.ss',
  'k...s...k.k.s...k...s...k.k.s.ss',
  'kkkkskkkkkkkskkkkkkkskkkkkkkssss',
];
const E2 = 82.41;

export function createMusic(sound) {
  let bus = null;
  let shaper = null;
  let timer = 0;
  let step = 0;
  let nextTime = 0;
  let level = 0;
  let ducked = false;

  /** Arma la cadena de la guitarra la primera vez que hace falta. */
  function setup() {
    const c = sound.ctx;
    bus = c.createGain();
    bus.gain.value = 0.55;
    bus.connect(sound.sfxBus);
    shaper = c.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) curve[i] = Math.tanh((i / 512 - 1) * 9);
    shaper.curve = curve;
    shaper.oversample = '2x';
    const tone = c.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2400;
    const body = c.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 700;
    body.gain.value = 5;
    const amp = c.createGain();
    amp.gain.value = 0.16;
    shaper.connect(body).connect(tone).connect(amp).connect(bus);
  }

  /** Power chord: fundamental + quinta + octava, con un poco de desafinación. */
  function guitar(t, semi, len) {
    const c = sound.ctx;
    const f = E2 * Math.pow(2, semi / 12);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.9, t + 0.005);
    env.gain.exponentialRampToValueAtTime(0.25, t + len * 0.6);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len);
    env.connect(shaper);
    [
      [f, -6],
      [f * 1.4983, 5],
      [f * 2, 3],
    ].forEach(([freq, det]) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(env);
      o.start(t);
      o.stop(t + len + 0.02);
    });
  }

  function bass(t, semi, len) {
    const c = sound.ctx;
    const o = c.createOscillator();
    o.type = 'square';
    o.frequency.value = (E2 / 2) * Math.pow(2, semi / 12);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    const g = c.createGain();
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(lp).connect(g).connect(bus);
    o.start(t);
    o.stop(t + len + 0.02);
  }

  function drum(t, kind) {
    const c = sound.ctx;
    if (kind === 'k') {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      const g = c.createGain();
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      o.connect(g).connect(bus);
      o.start(t);
      o.stop(t + 0.18);
      return;
    }
    const n = c.createBufferSource();
    n.buffer = sound.white;
    const f = c.createBiquadFilter();
    const g = c.createGain();
    if (kind === 's') {
      f.type = 'bandpass';
      f.frequency.value = 1900;
      f.Q.value = 0.7;
      g.gain.setValueAtTime(0.55, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      const o = c.createOscillator(); // cuerpo del redoblante
      o.frequency.value = 190;
      const og = c.createGain();
      og.gain.setValueAtTime(0.25, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(og).connect(bus);
      o.start(t);
      o.stop(t + 0.1);
    } else {
      f.type = 'highpass';
      f.frequency.value = 7500;
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    }
    n.connect(f).connect(g).connect(bus);
    n.start(t);
    n.stop(t + 0.2);
  }

  /** Programa las notas que caen en los próximos 120 ms. */
  function tick() {
    if (!sound.on || !sound.ctx) return; // sonido apagado: se queda en silencio
    if (!bus) setup();
    if (!ducked) {
      sound.duck(true); // baja el zumbido ambiente mientras suena el rock
      ducked = true;
    }
    const c = sound.ctx;
    const sixteenth = 60 / TEMPO[level] / 4;
    if (nextTime < c.currentTime) nextTime = c.currentTime + 0.05;
    while (nextTime < c.currentTime + 0.12) {
      const riff = RIFFS[level];
      const i = step % riff.length;
      const note = riff[i];
      if (typeof note === 'number') {
        let len = 1; // cuántos pasos dura (los '-' la estiran)
        while (riff[(i + len) % riff.length] === '-') len++;
        const palmMute = len === 1;
        guitar(nextTime, note, sixteenth * len * (palmMute ? 0.8 : 0.95));
        if (i % 2 === 0) bass(nextTime, note, sixteenth * Math.max(2, len) * 0.9);
      }
      const beat = BEATS[level][i % BEATS[level].length];
      if (beat !== '.') drum(nextTime, beat);
      if (beat === 's' || beat === 'k') if (i % 4 === 0) drum(nextTime, 'h');
      nextTime += sixteenth;
      step++;
    }
  }

  return {
    /** Arranca (o cambia) la música del nivel. */
    play(lvl) {
      const changed = lvl !== level;
      level = Math.max(0, Math.min(RIFFS.length - 1, lvl));
      if (changed) step = 0;
      if (!timer) timer = setInterval(tick, 25);
    },
    stop() {
      clearInterval(timer);
      timer = 0;
      if (ducked) sound.duck(false);
      ducked = false;
    },
  };
}
