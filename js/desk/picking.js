/**
 * Qué objeto hay bajo el mouse. Cada objeto clickeable se registra con
 * makeInteractive(id, grupo, etiqueta): se le arma un contorno rojo (hull) que
 * aparece al pasar el mouse.
 */
import { THREE, V3 } from '../scene/three.js';
import { camera } from '../scene/renderer.js';
import { flat } from '../scene/materials.js';
import { $ } from '../core/dom.js';
import { app } from '../core/state.js';
import { activate } from './actions.js';
import { nearCat } from '../cat/petting.js';

const interactives = {},
  rayTargets = [];
const hullMatBack = flat(0xc0141e, { side: THREE.BackSide });
const hullMatFront = flat(0xc0141e);
function makeInteractive(id, group, label, action) {
  const it = { id, group, label, action, hulls: [] };
  const meshes = [];
  group.traverse((o) => {
    if (o.isMesh) meshes.push(o);
  });
  meshes.forEach((m) => {
    m.userData.it = it;
    if (m.userData.noHull) return;
    const g = m.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox,
      size = new V3(),
      c = new V3();
    bb.getSize(size);
    bb.getCenter(c);
    const isPlane = g.type === 'PlaneGeometry';
    const hull = new THREE.Mesh(g, isPlane ? hullMatFront : hullMatBack);
    const e = 0.011,
      ms = m.scale,
      sz = new V3(
        Math.max(size.x * ms.x, 1e-4),
        Math.max(size.y * ms.y, 1e-4),
        Math.max(size.z * ms.z, 1e-4),
      );
    const s = new V3((sz.x + e) / sz.x, (sz.y + e) / sz.y, isPlane ? 1 : (sz.z + e) / sz.z);
    hull.scale.copy(s);
    hull.position.set(c.x - c.x * s.x, c.y - c.y * s.y, isPlane ? -0.0015 : c.z - c.z * s.z);
    hull.visible = false;
    hull.userData.noRay = true;
    hull.raycast = () => {};
    m.add(hull);
    it.hulls.push(hull);
  });
  interactives[id] = it;
  return it;
}

let hovered = null;
/** Objeto con el mouse encima (o null). */
const getHovered = () => hovered;

function setHover(it) {
  if (hovered === it) return;
  if (hovered) hovered.hulls.forEach((h) => (h.visible = false));
  hovered = it;
  const tip = $('#tip'),
    cv = $('#gl');
  if (it) {
    it.hulls.forEach((h) => (h.visible = true));
    tip.textContent = typeof it.label === 'function' ? it.label() : it.label;
    tip.classList.add('on');
    cv.classList.add('hot');
  } else {
    tip.classList.remove('on');
    cv.classList.remove('hot');
  }
}

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2(9, 9),
  mouse = { x: -1, y: -1 };
let pointerDirty = false;
function pick(x, y) {
  ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(rayTargets, false);
  for (const h of hits) {
    let o = h.object,
      vis = true;
    while (o) {
      if (!o.visible) {
        vis = false;
        break;
      }
      o = o.parent;
    }
    if (vis) return h.object.userData.it || null;
  }
  return null;
}

/** Posición del mouse normalizada (-1..1), para el paralaje de la cámara. */
const parT = new THREE.Vector2();
let downAt = null;

export function initPicking() {
  const glc = $('#gl');
  glc.addEventListener('pointermove', (e) => {
    $('#tip').style.left = e.clientX + 'px';
    $('#tip').style.top = e.clientY + 'px';
    parT.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    if (e.pointerType === 'mouse') {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      pointerDirty = true;
    }
  });
  glc.addEventListener('pointerleave', () => {
    parT.set(0, 0);
    setHover(null);
  });
  glc.addEventListener('pointerdown', (e) => {
    downAt = { x: e.clientX, y: e.clientY };
  });
  glc.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    downAt = null;
    if (moved > 8 || app.state !== 'idle') return;
    if (nearCat(e.clientX, e.clientY)) {
      activate('benjaW');
      return;
    }
    const it = pick(e.clientX, e.clientY);
    if (it) activate(it.id);
  });
}

function hoverTick() {
  if (!pointerDirty || app.state !== 'idle' || app.busy) return;
  pointerDirty = false;
  const it = pick(mouse.x, mouse.y);
  setHover(it);
}

export { interactives, rayTargets, makeInteractive, setHover, getHovered, pick, hoverTick, parT };
