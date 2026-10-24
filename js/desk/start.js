/**
 * Arranque de la escena 3D: pantalla de carga, construcción de la escena,
 * registro de objetos clickeables y la entrada con el botón [ ENTRAR ].
 */
import { V3 } from '../scene/three.js';
import { scene, postMat } from '../scene/renderer.js';
import { parts } from '../scene/parts.js';
import { buildTextures, drawScreen, drawWatch, drawKeys } from '../scene/textures.js';
import { buildScene } from '../scene/build.js';
import { CONTENT } from '../content.js';
import { $, sleep, REDUCED_MOTION } from '../core/dom.js';
import { tween } from '../core/tween.js';
import { app } from '../core/state.js';
import { sound } from '../audio/sound.js';
import { setTextMode } from '../ui/text-mode.js';
import { initComputer } from '../computer/os.js';
import { Cat } from '../cat/benja.js';
import { initPetting } from '../cat/petting.js';
import { rig, moveCam, layout } from './camera.js';
import { makeInteractive, rayTargets, initPicking } from './picking.js';
import { initLoop } from './loop.js';
import { scheduleDrawerAlert } from './drawer-alert.js';

async function start() {
  // barra de carga
  const bar = $('#ldbar'),
    N = 20;
  let k = 0;
  const step = () => {
    bar.style.setProperty('--p', k / N);
    bar.setAttribute('aria-valuenow', Math.round((k / N) * 100));
  };
  const fontsReady = Promise.race([
    Promise.all(
      [
        '16px VT323',
        '16px "Permanent Marker"',
        '16px "Special Elite"',
        '600 16px "IBM Plex Mono"',
        '16px "IBM Plex Mono"',
      ].map((f) => (document.fonts ? document.fonts.load(f) : 0)),
    ),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});
  const fill = (async () => {
    for (; k <= N; k++) {
      step();
      await sleep(45);
    }
  })();
  await fontsReady;
  buildTextures();
  buildScene();
  makeInteractive('pc', parts.pc, 'PC · Proyectos');
  makeInteractive('drawer', parts.org, 'Cajonera · CV');
  makeInteractive('modem', parts.modem, 'Módem · Contacto');
  parts.floppies.forEach((f, i) =>
    makeInteractive('floppy' + i, f, () => 'Disquete · ' + CONTENT.projects[i].name),
  );
  makeInteractive('walkman', parts.walkman, () => 'Walkman · Sonido ' + (sound.on ? 'on' : 'off'));
  makeInteractive('notes', parts.notes, 'Notas');
  makeInteractive('benja', parts.cat, 'Benja · Durmiendo');
  makeInteractive('benjaW', parts.cw.g, () =>
    Cat.mode === 'demand' ? 'Benja · Quiere caricias' : 'Benja',
  );
  makeInteractive('joy', parts.joy, 'Joystick');
  makeInteractive('cal', parts.cal, 'Calendario');
  makeInteractive('watch', parts.watch, 'Reloj pulsera');
  makeInteractive('flower', parts.flower, 'Un regalo de mi novia');
  makeInteractive('poster', parts.poster, 'Póster');
  makeInteractive('diego', parts.diego, 'El gol del siglo');
  scene.traverse((o) => {
    if (o.isMesh && !o.userData.noRay) rayTargets.push(o);
  });
  layout();
  drawScreen(true);
  drawWatch();
  drawKeys();
  initLoop();
  await fill;
  $('#ldMsg').textContent = 'DISQUETE LEÍDO.';
  $('#ldMsg').classList.remove('blink');
  const en = $('#enter');
  en.hidden = false;
  en.focus({ preventScroll: true });
}

export function initDesk() {
  addEventListener('resize', layout);
  initPicking();
  initPetting();
  initComputer();
  start();

  $('#enter').addEventListener('click', async () => {
    $('#loader').classList.add('out');
    setTimeout(() => ($('#loader').hidden = true), 700);
    $('#hud').hidden = false;
    $('#objnav').hidden = false;
    $('#hint').hidden = false;
    const from = {
      pos: rig.base.pos.clone().add(new V3(0, 0.25, 1.1)),
      target: rig.base.target.clone().add(new V3(0, 0.05, 0)),
    };
    rig.view.pos.copy(from.pos);
    rig.view.target.copy(from.target);
    postMat.uniforms.uFlash.value = REDUCED_MOTION ? 0 : 0.25;
    tween(600, (k) => (postMat.uniforms.uFlash.value = 0.25 * (1 - k)));
    await moveCam(rig.base, 1800);
    app.state = 'idle';
    scheduleDrawerAlert(25000);
    Cat.next = performance.now() + 60000;
  });
  $('#enterText').addEventListener('click', () => {
    $('#loader').classList.add('out');
    setTimeout(() => ($('#loader').hidden = true), 700);
    $('#hud').hidden = false;
    $('#objnav').hidden = false;
    app.state = 'idle';
    setTextMode(true);
  });
}
