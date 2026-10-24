/**
 * Cámara: dónde mira en el escritorio (base), a dónde va al enfocar un objeto
 * (FOCUS) y cómo se adapta al tamaño de la ventana (layout).
 */
import { V3 } from '../scene/three.js';
import { renderer, scene, camera, rt, snapRes, postMat } from '../scene/renderer.js';
import { TOP } from '../scene/parts.js';
import { tween } from '../core/tween.js';
import { app } from '../core/state.js';

/** Posición actual de la cámara (view) y la vista general del escritorio (base). */
export const rig = {
  view: { pos: new V3(0, 1.3, 1.4), target: new V3(0, 0.92, -0.05) },
  base: { pos: new V3(), target: new V3() },
};

const FOCUS = {
  pc: { target: new V3(-0.05, TOP + 0.24, 0.034), dir: new V3(0, 0.02, 1), w: 0.19, h: 0.145 },
  drawer: { target: new V3(-0.72, TOP + 0.15, 0.1), dir: new V3(0.05, 0.8, 0.6), w: 0.24, h: 0.19 },
  modem: {
    target: new V3(0.64, TOP + 0.56, -0.04),
    dir: new V3(-0.25, 0.45, 0.86),
    w: 0.2,
    h: 0.15,
  },
  notes: { target: new V3(0.18, TOP + 0.14, 0.1), dir: new V3(0, 0.1, 1), w: 0.5, h: 0.16 },
  poster: { target: new V3(0.21, 1.39, -0.553), dir: new V3(0, -0.05, 1), w: 0.3, h: 0.27 },
  diego: { target: new V3(-0.37, 1.38, -0.536), dir: new V3(0, -0.05, 1), w: 0.19, h: 0.23 },
};
function focusView(f) {
  const vf = (camera.fov * Math.PI) / 180,
    hf = Math.atan(Math.tan(vf / 2) * camera.aspect);
  const d = Math.max(f.w / Math.tan(hf), f.h / Math.tan(vf / 2));
  return {
    pos: f.target.clone().addScaledVector(f.dir.clone().normalize(), d),
    target: f.target.clone(),
  };
}

function moveCam(to, dur) {
  const p0 = rig.view.pos.clone(),
    t0 = rig.view.target.clone();
  return tween(dur, (k) => {
    rig.view.pos.lerpVectors(p0, to.pos, k);
    rig.view.target.lerpVectors(t0, to.target, k);
  });
}

function layout() {
  const w = innerWidth,
    h = innerHeight,
    asp = w / h;
  app.mobile = asp < 0.9;
  document.body.classList.toggle('mobile', app.mobile);
  renderer.setSize(w, h);
  const lowH = app.mobile ? 360 : Math.round(Math.min(320, Math.max(220, h / 3.2)));
  const lowW = Math.round(lowH * asp);
  rt.setSize(lowW, lowH);
  postMat.uniforms.uRes.value.set(lowW, lowH);
  snapRes.value.set(lowW * 0.5, lowH * 0.5);
  camera.fov = app.mobile ? 55 : 50;
  camera.aspect = asp;
  camera.updateProjectionMatrix();
  const vf = (camera.fov * Math.PI) / 180,
    hf = Math.atan(Math.tan(vf / 2) * asp);
  const target = app.mobile ? new V3(0, 0.8, 0) : new V3(0, 0.92, -0.05);
  const dir = app.mobile ? new V3(0, 0.62, 0.78).normalize() : new V3(0, 0.36, 1.35).normalize();
  const d = Math.max(app.mobile ? 1.6 : 1.42, 0.98 / Math.tan(hf) + 0.3);
  rig.base = { pos: target.clone().addScaledVector(dir, d), target };
  scene.fog.near = d + 0.4;
  scene.fog.far = d + 4.2;
  if (app.state === 'idle' || app.state === 'loading') {
    rig.view.pos.copy(rig.base.pos);
    rig.view.target.copy(rig.base.target);
  } else if (app.current) {
    const f = app.current === 'pc' ? FOCUS.pc : FOCUS[app.current];
    if (f && !app.busy) {
      const v = focusView(f);
      rig.view.pos.copy(v.pos);
      rig.view.target.copy(v.target);
    }
  }
}

export { FOCUS, focusView, moveCam, layout };
