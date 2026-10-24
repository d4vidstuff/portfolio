/**
 * Cajonera negra (el CV está en el cajón del medio) y las cajas de arriba.
 */
import { THREE } from '../three.js';
import { scene } from '../renderer.js';
import { lambert } from '../materials.js';
import { textures } from '../textures.js';
import { box } from '../geometry.js';
import { parts, TOP } from '../parts.js';

export function buildOrganizer(mats) {
  // cajonera negra (el CV está en el cajón del medio)
  const org = new THREE.Group();
  org.position.set(-0.72, TOP, -0.2);
  scene.add(org);
  box(0.32, 0.01, 0.36, mats.plastic, 0, 0.295, 0, org);
  box(0.32, 0.01, 0.36, mats.plastic, 0, 0.005, 0, org);
  box(0.01, 0.3, 0.36, mats.plastic, -0.155, 0.15, 0, org);
  box(0.01, 0.3, 0.36, mats.plastic, 0.155, 0.15, 0, org);
  box(0.32, 0.3, 0.01, mats.plastic, 0, 0.15, -0.175, org);
  parts.drawers = [];
  [0.055, 0.15, 0.245].forEach((y, i) => {
    const d = new THREE.Group();
    d.position.set(0, y, 0);
    org.add(d);
    box(0.3, 0.085, 0.012, mats.plastic, 0, 0, 0.174, d);
    box(0.08, 0.012, 0.004, mats.black, 0, 0.01, 0.181, d);
    box(0.28, 0.006, 0.33, mats.plastic, 0, -0.038, 0.005, d);
    box(0.006, 0.07, 0.33, mats.plastic, -0.137, -0.006, 0.005, d);
    box(0.006, 0.07, 0.33, mats.plastic, 0.137, -0.006, 0.005, d);
    box(0.28, 0.07, 0.006, mats.plastic, 0, -0.006, -0.158, d);
    if (i === 1) {
      box(
        0.24,
        0.008,
        0.28,
        [
          mats.beigeDk,
          mats.beigeDk,
          lambert(0xffffff, { map: textures.folder }),
          mats.beigeDk,
          mats.beigeDk,
          mats.beigeDk,
        ],
        0,
        -0.03,
        0.03,
        d,
      ).rotation.y = 0.05;
      box(0.22, 0.003, 0.26, lambert(0xd8d0b8), 0.01, -0.024, 0.02, d).rotation.y = -0.04;
    }
    parts.drawers.push(d);
  });
  // cajas sobre la cajonera (decorado)
  box(0.29, 0.07, 0.21, lambert(0x8a1a1c), -0.72, TOP + 0.335, -0.18).rotation.y = 0.04;
  const clear = lambert(0xd8e4e2, { transparent: true, opacity: 0.28, depthWrite: false });
  box(0.3, 0.06, 0.24, clear, -0.73, TOP + 0.4, -0.19).castShadow = false;
  for (let i = 0; i < 12; i++)
    box(
      0.025,
      0.018,
      0.025,
      lambert([0xb3402a, 0xc9a23a, 0x3a7a4a, 0x2a5aa0, 0xd0d0c8][i % 5]),
      -0.845 + (i % 6) * 0.045,
      TOP + 0.385,
      -0.25 + Math.floor(i / 6) * 0.08,
    );
  box(0.3, 0.05, 0.24, clear, -0.725, TOP + 0.455, -0.19).castShadow = false;
  parts.org = org;
}
