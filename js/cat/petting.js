/**
 * Caricias: alrededor de Benja hay una zona en pantalla (no hace falta apuntar
 * justo al modelo). Mover el mouse adentro llena el medidor de corazones.
 */
import { $ } from '../core/dom.js';
import { app } from '../core/state.js';
import { Cat } from './benja.js';
import { hearts } from './bubble.js';

let petLast = null;

// zona de caricias en pantalla alrededor de Benja (no depende de apuntar justo al modelo)
const nearCat = (x, y) =>
  Cat.mode === 'demand' &&
  app.state === 'idle' &&
  Cat.scr &&
  Math.hypot(x - Cat.scr.x, y - Cat.scr.y) < Cat.scr.r;
export function initPetting() {
  const glc = $('#gl');
  glc.addEventListener('pointermove', (e) => {
    const near = nearCat(e.clientX, e.clientY);
    glc.classList.toggle('pet', near);
    if (near && petLast) {
      const before = Cat.pet,
        mv = Math.min(60, Math.hypot(e.clientX - petLast.x, e.clientY - petLast.y));
      Cat.pet += mv;
      if (mv > 1) Cat.petPulse = 1;
      if (Math.floor(Cat.pet / 150) > Math.floor(before / 150)) hearts(1);
    }
    petLast = { x: e.clientX, y: e.clientY };
  });
}

export { nearCat };
