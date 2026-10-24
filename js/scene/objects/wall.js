/**
 * Lo que cuelga de la pared: póster, diario del gol del siglo y calendario.
 */
import { THREE } from '../three.js';
import { scene } from '../renderer.js';
import { lambert, flat } from '../materials.js';
import { textures } from '../textures.js';
import { box, cyl } from '../geometry.js';
import { parts } from '../parts.js';

export function buildWall(mats) {
  // póster grande detrás del escritorio
  const poster = new THREE.Group();
  poster.position.set(0.21, 1.39, -0.553);
  poster.rotation.z = -0.012;
  scene.add(poster);
  const pm = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.48),
    flat(0xd2c9b2, { map: textures.poster }),
  );
  pm.receiveShadow = true;
  poster.add(pm);
  const tapeM = flat(0xcfc6a8, { transparent: true, opacity: 0.75 });
  [
    [-0.23, 0.23, 0.6],
    [0.23, 0.23, -0.6],
    [-0.23, -0.23, -0.6],
    [0.23, -0.23, 0.6],
  ].forEach(([x, y, r]) => {
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.02), tapeM);
    tp.position.set(x, y, 0.002);
    tp.rotation.z = r;
    tp.userData.noHull = true;
    poster.add(tp);
  });
  parts.poster = poster;

  // diario enmarcado y colgado en el panel blanco
  const dg = new THREE.Group();
  dg.position.set(-0.37, 1.38, -0.538);
  dg.rotation.z = 0.025;
  scene.add(dg);
  const frameM = lambert(0x2a1d14);
  box(0.3, 0.025, 0.02, frameM, 0, 0.19, 0, dg);
  box(0.3, 0.025, 0.02, frameM, 0, -0.19, 0, dg);
  box(0.025, 0.405, 0.02, frameM, -0.1375, 0, 0, dg);
  box(0.025, 0.405, 0.02, frameM, 0.1375, 0, 0, dg);
  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 0.3125),
    flat(0xc9c2ac, { map: textures.diario }),
  );
  paper.position.z = 0.002;
  dg.add(paper);
  const gl = new THREE.Mesh(
    new THREE.PlaneGeometry(0.012, 0.3),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  gl.position.set(-0.08, 0, 0.006);
  gl.rotation.z = 0.5;
  gl.userData.noHull = true;
  dg.add(gl);
  // clavo e hilo del que cuelga
  const nail = new THREE.Mesh(new THREE.SphereGeometry(0.006, 5, 4), mats.metal);
  nail.position.set(0, 0.3, -0.004);
  nail.userData.noHull = true;
  dg.add(nail);
  [-1, 1].forEach((sd) => {
    const h = cyl(0.0015, 0.0015, 0.145, 3, mats.black, sd * 0.055, 0.245, -0.004, dg);
    h.rotation.z = sd * 0.82;
    h.userData.noHull = true;
  });
  parts.diego = dg;

  // calendario en el panel de la pared
  const calG = new THREE.Group();
  scene.add(calG);
  const cal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.27),
    lambert(0xffffff, { map: textures.cal }),
  );
  cal.position.set(-0.68, 1.38, -0.545);
  calG.add(cal);
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.007, 5, 4), mats.red);
  pin.position.set(-0.68, 1.51, -0.542);
  calG.add(pin);
  parts.cal = calG;
}
