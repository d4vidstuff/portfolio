/**
 * Alerta del cajón: mientras nadie abrió el CV, cada 20 s el cajón se sacude,
 * suena el shake distorsionado y aparece "El cajón se agita".
 */
import { parts } from '../scene/parts.js';
import { tween } from '../core/tween.js';
import { app } from '../core/state.js';
import { sound } from '../audio/sound.js';
import { toast } from '../ui/toast.js';
import { interactives, getHovered } from './picking.js';

let drawerTouched = false,
  nextAlert = Infinity;
function drawerAlert() {
  sound.play('shake', { dist: true, rate: 0.82, vol: 0.7 });
  toast('El cajón se agita', 'alert');
  const d = parts.drawers[1],
    org = parts.org,
    ox = org.position.x,
    it = interactives.drawer;
  if (it && app.state === 'idle') it.hulls.forEach((h) => (h.visible = true));
  tween(
    1300,
    (k) => {
      if (drawerTouched) {
        org.position.x = ox;
        d.position.x = 0;
        d.rotation.y = 0;
        return;
      }
      const b = Math.max(0, Math.sin(k * Math.PI * 3)) * (1 - k * 0.4);
      d.position.x = Math.sin(k * 140) * 0.012 * b;
      d.position.z = 0.035 * b;
      d.rotation.y = Math.sin(k * 110) * 0.07 * b;
      org.position.x = ox + Math.sin(k * 160) * 0.004 * b;
      if (k >= 1) {
        d.position.x = 0;
        d.rotation.y = 0;
        if (!drawerTouched) d.position.z = 0;
        org.position.x = ox;
        if (it && getHovered() !== it) it.hulls.forEach((h) => (h.visible = false));
      }
    },
    (k) => k,
  );
}

/** Se llama al abrir el cajón: la alerta no vuelve a aparecer. */
const markDrawerTouched = () => {
  drawerTouched = true;
};
/** Programa la primera alerta dentro de ms milisegundos. */
const scheduleDrawerAlert = (ms) => {
  nextAlert = performance.now() + ms;
};

/** Se llama cada cuadro desde el bucle principal. */
function drawerAlertTick(now) {
  if (
    !drawerTouched &&
    !app.busy &&
    app.state !== 'loading' &&
    app.current !== 'drawer' &&
    now > nextAlert
  ) {
    nextAlert = now + 20000;
    drawerAlert();
  }
}

export { markDrawerTouched, scheduleDrawerAlert, drawerAlertTick };
