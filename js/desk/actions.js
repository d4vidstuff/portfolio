/**
 * Qué pasa al tocar cada objeto (activate) y cómo se vuelve al escritorio (goBack).
 */
import { V3 } from '../scene/three.js';
import { parts, TOP } from '../scene/parts.js';
import { CONTENT } from '../content.js';
import { sleep, pad2 } from '../core/dom.js';
import { tween } from '../core/tween.js';
import { app } from '../core/state.js';
import { sound } from '../audio/sound.js';
import { toast } from '../ui/toast.js';
import { openOverlay, closeOverlay, restoreFocus } from '../ui/overlays.js';
import { showBack, markInteracted } from '../ui/hud.js';
import { OS } from '../computer/os.js';
import { Cat } from '../cat/benja.js';
import { hearts } from '../cat/bubble.js';
import { interactives, setHover } from './picking.js';
import { rig, FOCUS, focusView, moveCam } from './camera.js';
import { markDrawerTouched } from './drawer-alert.js';

async function activate(id) {
  if (app.busy || app.state !== 'idle') return;
  const it = interactives[id];
  if (!it) return;
  setHover(null);
  markInteracted();
  if (id.startsWith('floppy')) return insertFloppy(+id.slice(6));
  switch (id) {
    case 'pc':
      app.busy = true;
      app.state = 'focus';
      app.current = 'pc';
      sound.sfx('click');
      showBack(true);
      await moveCam(focusView(FOCUS.pc), 1000);
      app.busy = false;
      OS.open();
      break;
    case 'drawer':
      markDrawerTouched();
      app.busy = true;
      app.state = 'focus';
      app.current = 'drawer';
      sound.sfx('drawer');
      showBack(true);
      await Promise.all([
        moveCam(focusView(FOCUS.drawer), 950),
        tween(750, (k) => (parts.drawers[1].position.z = 0.22 * k)),
      ]);
      await sleep(260);
      openOverlay('cv');
      app.busy = false;
      break;
    case 'modem':
      app.busy = true;
      app.state = 'focus';
      app.current = 'modem';
      parts.dialing = true;
      sound.sfx('modem');
      showBack(true);
      await moveCam(focusView(FOCUS.modem), 900);
      await sleep(700);
      openOverlay('contact');
      app.busy = false;
      break;
    case 'poster':
    case 'diego':
      app.busy = true;
      app.state = 'focus';
      app.current = id;
      showBack(true);
      await moveCam(focusView(FOCUS[id]), 900);
      app.busy = false;
      break;
    case 'notes':
      app.busy = true;
      app.state = 'focus';
      app.current = 'notes';
      showBack(true);
      await moveCam(focusView(FOCUS.notes), 900);
      openOverlay('notes');
      app.busy = false;
      break;
    case 'walkman':
      await sound.set(!sound.on);
      toast(sound.on ? 'Sonido activado. Subí el volumen.' : 'Sonido silenciado.');
      break;
    case 'benja': {
      const n = performance.now();
      if (n - benjaLast < 2500) break; // cooldown del maullido
      benjaLast = n;
      sound.play('meow', { vol: 0.9 });
      parts.purr = n;
      toast(BENJA[benjaN++ % BENJA.length]);
      break;
    }
    case 'joy':
      sound.sfx('joy');
      parts.joyHit = performance.now();
      toast('INSERT COIN. Créditos: 0.');
      break;
    case 'benjaW':
      if (Cat.mode === 'demand') {
        Cat.pet += 160;
        Cat.petPulse = 1;
        hearts(1);
      } else if (Cat.mode === 'happy') hearts(2);
      else toast('Benja está de paseo.');
      break;
    case 'flower':
      toast('Un regalo de mi novia.');
      break;
    case 'cal':
      toast(`Calendario ${CONTENT.calendarYear}. Alguien tachó todos los viernes.`);
      break;
    case 'watch': {
      const d = new Date();
      toast(
        `Son las ${pad2(d.getHours())}:${pad2(d.getMinutes())}. El reloj pulsera sigue en hora.`,
      );
      break;
    }
  }
}

const BENJA = [
  'Benja está durmiendo. Ronronea igual.',
  'Benja tiene un corazón en el lomo. Literal.',
  'Benja no participa del portfolio. Solo lo supervisa.',
  'No lo despiertes, que después pide comida.',
];
let benjaN = 0,
  benjaLast = -1e9;

async function insertFloppy(i) {
  app.busy = true;
  app.state = 'focus';
  app.current = 'pc';
  app.insertedFloppy = i;
  showBack(true);
  const f = parts.floppies[i],
    p0 = f.position.clone(),
    r0 = f.rotation.clone();
  const slot = new V3(0.66, TOP + 0.445, 0.32);
  sound.sfx('click');
  await tween(650, (k) => {
    f.position.lerpVectors(p0, slot, k);
    f.position.y += Math.sin(k * Math.PI) * 0.08;
    f.rotation.set(r0.x * (1 - k), r0.y * (1 - k), r0.z * (1 - k));
  });
  sound.sfx('insert');
  await tween(320, (k) => {
    f.position.z = 0.32 - 0.2 * k;
  });
  f.visible = false;
  parts.driveLed.material.color.setHex(0x9cff6a);
  await moveCam(focusView(FOCUS.pc), 900);
  app.busy = false;
  OS.open(CONTENT.projects[i].id);
}

async function goBack() {
  if (app.busy || app.state === 'idle') return;
  app.busy = true;
  const tasks = [];
  if (app.current === 'pc') await OS.close();
  else closeOverlay();
  tasks.push(moveCam(rig.base, 950));
  if (app.current === 'drawer') {
    sound.sfx('drawer');
    const d = parts.drawers[1],
      z0 = d.position.z;
    tasks.push(tween(650, (k) => (d.position.z = z0 * (1 - k))));
  }
  if (app.current === 'modem') parts.dialing = false;
  if (app.insertedFloppy >= 0) {
    const f = parts.floppies[app.insertedFloppy],
      h = f.userData.home;
    f.position.copy(h.p);
    f.rotation.copy(h.r);
    f.visible = true;
    app.insertedFloppy = -1;
    parts.driveLed.material.color.setHex(0x3a7a3a);
  }
  await Promise.all(tasks);
  app.state = 'idle';
  app.current = null;
  showBack(false);
  app.busy = false;
  restoreFocus();
}
async function go(id) {
  if (app.state !== 'idle') {
    await goBack();
  }
  activate(id);
}

export { activate, goBack, go };
