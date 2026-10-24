/**
 * Piso, pared, cables y el escritorio blanco con el pad negro.
 */
import { THREE, V3 } from '../three.js';
import { scene } from '../renderer.js';
import { lambert } from '../materials.js';
import { box, tube } from '../geometry.js';
import { TOP } from '../parts.js';

export function buildRoom(mats) {
  // habitación
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), mats.wall);
  wall.position.set(0, 3, -0.56);
  wall.receiveShadow = true;
  scene.add(wall);
  box(0.62, 0.4, 0.012, lambert(0xd3cfc2), -0.5, 1.4, -0.553); // panel blanco en la pared
  tube(
    [
      new V3(-0.13, 2.4, -0.552),
      new V3(-0.12, 1.6, -0.552),
      new V3(-0.1, 1.15, -0.54),
      new V3(-0.04, 0.95, -0.46),
    ],
    0.006,
    mats.black,
  );
  tube(
    [
      new V3(0.55, 2.4, -0.552),
      new V3(0.56, 1.5, -0.552),
      new V3(0.58, 1.32, -0.5),
      new V3(0.64, 1.3, -0.3),
    ],
    0.005,
    mats.black,
  );

  // escritorio blanco con pad negro
  // tablero blanco con el pad negro como cara superior (una sola pieza, sin superposiciones)
  box(
    1.8,
    0.04,
    0.85,
    [mats.desk, mats.desk, mats.mat, mats.desk, mats.desk, mats.desk],
    0,
    TOP - 0.02,
    0,
  );
  [
    [-0.86, 0.38],
    [0.86, 0.38],
    [-0.86, -0.38],
    [0.86, -0.38],
  ].forEach(([x, z]) => box(0.04, TOP - 0.04, 0.04, mats.white, x, (TOP - 0.04) / 2, z));
  box(1.72, 0.03, 0.03, mats.white, 0, TOP - 0.06, 0.4);
}
