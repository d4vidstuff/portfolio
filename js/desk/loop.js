/**
 * Bucle principal: corre una vez por cuadro. Avanza animaciones, mueve a Benja,
 * dibuja la escena en baja resolución y la pasa por el post-procesado.
 */
import { THREE } from '../scene/three.js';
import { renderer, scene, camera, rt, postMat, postScene, postCam } from '../scene/renderer.js';
import { parts } from '../scene/parts.js';
import { drawScreen, drawWatch } from '../scene/textures.js';
import { REDUCED_MOTION } from '../core/dom.js';
import { runTweens } from '../core/tween.js';
import { app } from '../core/state.js';
import { sound } from '../audio/sound.js';
import { Cat, catUpdate } from '../cat/benja.js';
import { catBubble } from '../cat/bubble.js';
import { rig } from './camera.js';
import { hoverTick, parT } from './picking.js';
import { drawerAlertTick } from './drawer-alert.js';

/** Paralaje suave: la cámara sigue un poco al mouse. */
const par = new THREE.Vector2();

let paused = false,
  lastScreen = 0,
  lastClock = 0,
  lastT = 0;
export function initLoop() {
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });
  requestAnimationFrame(frame);
}

function frame(now) {
  requestAnimationFrame(frame);
  if (paused || app.textOn) return;
  const t = now / 1000,
    dt = Math.min(0.05, (now - (lastT || now)) / 1000);
  lastT = now;
  runTweens(now);
  catUpdate(now, dt);
  postMat.uniforms.uTime.value = REDUCED_MOTION ? 0 : t;
  if (!REDUCED_MOTION) {
    const br = 1 + Math.sin(t * 1.5) * 0.035;
    parts.catBody.scale.y = 0.08 * br;
    parts.catHead.position.y =
      0.08 + Cat.headUp * 0.022 + Math.sin(t * 1.5) * 0.003 * (1 - Cat.headUp);
    const tw = t % 7.3 < 0.18 ? Math.sin((t % 7.3) * 35) * 0.25 : 0;
    parts.ears[1].rotation.z = -0.35 + tw;
    const jk = parts.joyHit ? Math.max(0, 1 - (now - parts.joyHit) / 500) : 0;
    parts.stick.rotation.z = 0.15 + Math.sin(now / 40) * 0.4 * jk;
  }
  parts.modemLeds.forEach((l, i) =>
    l.material.color.setHex(
      i === 0 || (parts.dialing ? Math.random() < 0.5 : Math.random() < 0.02) ? 0x6aff5a : 0x1a3a1a,
    ),
  );
  if (sound.on) {
    parts.spools.forEach((s) => (s.rotation.y -= 0.06));
    parts.wmLed.material.color.setHex(0xff3a2a);
  } else parts.wmLed.material.color.setHex(0x2a0a0a);
  if (now - lastScreen > 500) {
    lastScreen = now;
    drawScreen(Math.floor(now / 500) % 2 === 0, Cat.typed);
  }
  if (now - lastClock > 1000) {
    lastClock = now;
    drawWatch();
  }
  drawerAlertTick(now);
  // paralaje suave
  if (app.state === 'idle' && !REDUCED_MOTION && !app.mobile) par.lerp(parT, 0.05);
  else par.lerp(new THREE.Vector2(), 0.1);
  camera.position.set(
    rig.view.pos.x + par.x * 0.07,
    rig.view.pos.y + par.y * 0.035,
    rig.view.pos.z,
  );
  camera.lookAt(
    rig.view.target.x + par.x * 0.02,
    rig.view.target.y + par.y * 0.01,
    rig.view.target.z,
  );
  hoverTick();
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
  catBubble();
}
