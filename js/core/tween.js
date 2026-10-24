/**
 * Animaciones por tiempo. tween() devuelve una promesa que se resuelve al terminar.
 * runTweens(now) se llama una vez por cuadro desde el bucle principal.
 */
import { REDUCED_MOTION } from './dom.js';

const tweens = new Set();
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
function tween(dur, fn, ez) {
  return new Promise((res) => {
    if (REDUCED_MOTION || dur <= 0) {
      fn(1);
      res();
      return;
    }
    tweens.add({ t0: performance.now(), dur, fn, ez: ez || ease, res });
  });
}
function runTweens(now) {
  for (const tw of tweens) {
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(tw.ez(k));
    if (k >= 1) {
      tweens.delete(tw);
      tw.res();
    }
  }
}

export { ease, tween, runTweens };
