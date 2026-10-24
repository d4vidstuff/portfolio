/**
 * Sonido con la Web Audio API. Arranca silenciado.
 *
 * Casi todo se genera por código (zumbido, música, clicks, módem, ronroneo).
 * Los sonidos grabados están en audio/ y se cargan al activar el sonido.
 */
import { $ } from '../core/dom.js';
import { toast } from '../ui/toast.js';

const sound = {
  ctx: null,
  on: false,
  init() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    this.master.gain.value = 0;
    this.master.connect(c.destination);
    this.sfxBus = c.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    this.amb = c.createGain();
    this.amb.gain.value = 0.75;
    this.amb.connect(this.master);
    const len = c.sampleRate * 2,
      wb = c.createBuffer(1, len, c.sampleRate),
      wd = wb.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;
    this.white = wb;
    // zumbido eléctrico
    [
      [50, 0.03],
      [100, 0.012],
      [150, 0.005],
    ].forEach(([f, g]) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      const gn = c.createGain();
      gn.gain.value = g;
      o.connect(gn).connect(this.amb);
      o.start();
    });
    // drone grave
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 5;
    const dg = c.createGain();
    dg.gain.value = 0.045;
    lp.connect(dg).connect(this.amb);
    [55, 55.4, 82.41].forEach((f) => {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(lp);
      o.start();
    });
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = c.createGain();
    lg.gain.value = 110;
    lfo.connect(lg).connect(lp.frequency);
    lfo.start();
    // siseo y crujidos
    const cb = c.createBuffer(1, len, c.sampleRate),
      cd = cb.getChannelData(0);
    for (let i = 0; i < len; i++)
      cd[i] = (Math.random() * 2 - 1) * (Math.random() < 0.0015 ? 1 : 0.07);
    const n = c.createBufferSource();
    n.buffer = cb;
    n.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600;
    const ng = c.createGain();
    ng.gain.value = 0.05;
    n.connect(hp).connect(ng).connect(this.amb);
    n.start();
    // pad con eco
    const del = c.createDelay(2);
    del.delayTime.value = 0.48;
    const fb = c.createGain();
    fb.gain.value = 0.38;
    const dl = c.createBiquadFilter();
    dl.type = 'lowpass';
    dl.frequency.value = 1300;
    del.connect(dl).connect(fb).connect(del);
    dl.connect(this.amb);
    this.padIn = c.createGain();
    this.padIn.connect(this.amb);
    this.padIn.connect(del);
    this.load();
    return true;
  },
  pad() {
    const c = this.ctx,
      notes = [110, 130.81, 98, 146.83, 123.47, 87.31, 164.81];
    const f = notes[(Math.random() * notes.length) | 0],
      t = c.currentTime;
    [
      [1, 0.028],
      [1.498, 0.01],
    ].forEach(([m, v]) => {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f * m;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 720;
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 1.8);
      g.gain.linearRampToValueAtTime(0, t + 5.6);
      o.connect(lp).connect(g).connect(this.padIn);
      o.start(t);
      o.stop(t + 6);
    });
  },
  async set(on) {
    if (!this.init()) {
      toast('Este navegador no reproduce audio.');
      return;
    }
    this.on = on;
    const c = this.ctx;
    if (on) {
      try {
        await c.resume();
      } catch (e) {}
      this.master.gain.cancelScheduledValues(c.currentTime);
      this.master.gain.setTargetAtTime(0.8, c.currentTime, 0.3);
      this.pad();
      clearInterval(this.padT);
      this.padT = setInterval(() => this.pad(), 4200);
    } else {
      this.master.gain.setTargetAtTime(0, c.currentTime, 0.12);
      clearInterval(this.padT);
      setTimeout(() => {
        if (!this.on) c.suspend();
      }, 800);
    }
    const b = $('#btnSound');
    b.textContent = 'Sonido: ' + (on ? 'on' : 'off');
    b.setAttribute('aria-pressed', on);
  },
  noise(dur, type, f0, f1, vol, q, delay) {
    const c = this.ctx,
      t = c.currentTime + (delay || 0),
      s = c.createBufferSource();
    s.buffer = this.white;
    const bp = c.createBiquadFilter();
    bp.type = type;
    bp.Q.value = q || 1;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(bp).connect(g).connect(this.sfxBus);
    s.start(t);
    s.stop(t + dur + 0.05);
  },
  tone(type, f0, f1, dur, vol, delay) {
    const c = this.ctx,
      t = c.currentTime + (delay || 0),
      o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(this.sfxBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  // sonidos grabados (se publican junto a la página en audio/)
  bufs: {},
  async load() {
    if (this.loading) return;
    this.loading = true;
    const files = { meow: 'audio/meow.mp3', shake: 'audio/shake.wav' };
    await Promise.all(
      Object.entries(files).map(async ([k, u]) => {
        try {
          const ab = await (await fetch(u)).arrayBuffer();
          this.bufs[k] = await new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej));
        } catch (e) {}
      }),
    );
  },
  play(name, o) {
    o = o || {};
    if (!this.on || !this.ctx || !this.bufs[name]) return;
    const c = this.ctx,
      s = c.createBufferSource();
    s.buffer = this.bufs[name];
    if (o.rate) s.playbackRate.value = o.rate;
    const g = c.createGain();
    g.gain.value = o.vol == null ? 1 : o.vol;
    let out = s;
    if (o.dist) {
      // distorsión: saturación fuerte, bits recortados y banda angosta
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 160;
      const ws = c.createWaveShaper();
      const cv = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        const x = i / 256 - 1;
        cv[i] = Math.round(Math.tanh(x * 7) * 7) / 7;
      }
      ws.curve = cv;
      ws.oversample = 'none';
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2600;
      lp.Q.value = 3;
      const pk = c.createBiquadFilter();
      pk.type = 'peaking';
      pk.frequency.value = 900;
      pk.gain.value = 8;
      out = s.connect(hp).connect(ws).connect(pk).connect(lp);
    }
    if (o.crt) {
      // tono CRT: banda angosta, un poco de saturación y el silbido agudo del tubo
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 380;
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2800;
      lp.Q.value = 2;
      const pk = c.createBiquadFilter();
      pk.type = 'peaking';
      pk.frequency.value = 1500;
      pk.gain.value = 7;
      pk.Q.value = 1.4;
      const ws = c.createWaveShaper();
      const cv = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = i / 128 - 1;
        cv[i] = Math.round(Math.tanh(x * 2.2) * 12) / 12;
      }
      ws.curve = cv;
      out = s.connect(hp).connect(pk).connect(ws).connect(lp);
      this.tone('sine', 15600, 15600, s.buffer.duration / (o.rate || 1) + 0.1, 0.006);
    }
    out.connect(g).connect(this.sfxBus);
    s.start();
  },
  sfx(name) {
    if (!this.on || !this.ctx) return;
    switch (name) {
      case 'click':
        this.noise(0.04, 'bandpass', 2400, 1800, 0.5, 2);
        break;
      case 'switch':
        this.noise(0.05, 'bandpass', 1400, 900, 0.6, 3);
        this.tone('square', 120, 60, 0.05, 0.05);
        break;
      case 'drawer':
        this.noise(0.75, 'bandpass', 260, 900, 0.45, 3);
        this.noise(0.12, 'lowpass', 400, 120, 0.5);
        break;
      case 'beep':
        this.tone('square', 880, 880, 0.22, 0.05);
        break;
      case 'modem':
        this.tone('sine', 425, 425, 0.6, 0.05);
        [0, 1, 2, 3, 4, 5, 6].forEach((i) =>
          this.tone(
            'sine',
            [941, 1336, 1209, 1477, 852, 1633, 697][i],
            [941, 1336, 1209, 1477, 852, 1633, 697][i],
            0.07,
            0.04,
            0.7 + i * 0.1,
          ),
        );
        this.tone('sine', 2100, 2100, 0.6, 0.045, 1.5);
        this.tone('sawtooth', 980, 1650, 0.5, 0.015, 2.15);
        this.noise(0.8, 'bandpass', 1400, 2600, 0.22, 1.2, 2.6);
        break;
      case 'purr': {
        const c = this.ctx,
          t = c.currentTime,
          s = c.createBufferSource();
        s.buffer = this.white;
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 170;
        const am = c.createGain();
        am.gain.value = 0;
        const lfo = c.createOscillator();
        lfo.frequency.value = 24;
        const lg = c.createGain();
        lg.gain.value = 0.9;
        lfo.connect(lg).connect(am.gain);
        const env = c.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(1, t + 0.4);
        env.gain.linearRampToValueAtTime(0, t + 2.4);
        s.connect(lp).connect(am).connect(env).connect(this.sfxBus);
        s.start(t);
        s.stop(t + 2.5);
        lfo.start(t);
        lfo.stop(t + 2.5);
        break;
      }
      case 'joy':
        [523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.09, 0.04, i * 0.09));
        break;
      case 'insert':
        this.noise(0.05, 'bandpass', 1800, 1200, 0.5, 2);
        this.tone('sine', 110, 45, 0.18, 0.25, 0.25);
        this.tone('sawtooth', 62, 58, 0.7, 0.02, 0.3);
        break;
      case 'crtoff':
        this.tone('sine', 1400, 60, 0.4, 0.05);
        break;
      case 'crton':
        this.noise(0.3, 'highpass', 6000, 9000, 0.2);
        this.tone('sine', 60, 15600, 0.25, 0.015);
        break;
    }
  },
};

export function initSound() {
  $('#btnSound').addEventListener('click', () => sound.set(!sound.on));
}

export { sound };
