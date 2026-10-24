/**
 * Atajos para crear piezas: box, cyl y tube crean la malla, la ubican y la agregan
 * a parent (o a la escena). Todas proyectan y reciben sombra.
 */
import { THREE } from './three.js';
import { scene } from './renderer.js';

function box(w, h, d, m, x, y, z, parent) {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  me.position.set(x, y, z);
  me.castShadow = me.receiveShadow = true;
  (parent || scene).add(me);
  return me;
}
function cyl(rt, rb, h, seg, m, x, y, z, parent, open) {
  const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!open), m);
  me.position.set(x, y, z);
  me.castShadow = me.receiveShadow = true;
  (parent || scene).add(me);
  return me;
}
function tube(points, r, m, parent) {
  const me = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), points.length * 4, r, 4, false),
    m,
  );
  me.castShadow = true;
  (parent || scene).add(me);
  return me;
}

export { box, cyl, tube };
