/**
 * Punto de entrada.
 *
 * Primero arma lo que no depende de WebGL (modo texto, capas, sonido, HUD).
 * Después carga la escena 3D; si falla (sin WebGL o sin Three.js), queda el modo texto.
 */

import { $ } from './core/dom.js';
import { app } from './core/state.js';
import { initTextMode, setTextMode } from './ui/text-mode.js';
import { initOverlays } from './ui/overlays.js';
import { initSound } from './audio/sound.js';

initTextMode();
initSound();

try {
  if (!window.THREE) throw new Error('No se pudo cargar Three.js');
  const { initDesk } = await import('./desk/start.js');
  const { goBack } = await import('./desk/actions.js');
  const { initHud } = await import('./ui/hud.js');
  initOverlays(goBack);
  initHud();
  initDesk();
} catch (err) {
  console.warn('Escena 3D no disponible, se muestra el modo texto.', err);
  app.glOK = false;
  $('#loader').classList.add('out');
  setTimeout(() => {
    $('#loader').hidden = true;
  }, 600);
  setTextMode(true);
}
