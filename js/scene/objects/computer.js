/**
 * Monitor CRT, teclado, torre, mouse y vaso.
 */
import { THREE, V3 } from '../three.js';
import { scene } from '../renderer.js';
import { lambert, flat } from '../materials.js';
import { textures } from '../textures.js';
import { box, cyl, tube } from '../geometry.js';
import { parts, TOP } from '../parts.js';

export function buildComputer(mats) {
  // PC: monitor CRT, teclado y gabinete torre
  const pc = new THREE.Group();
  scene.add(pc);
  cyl(0.09, 0.11, 0.02, 10, mats.beige, -0.05, TOP + 0.01, -0.13, pc);
  box(0.12, 0.03, 0.1, mats.beige, -0.05, TOP + 0.035, -0.13, pc);
  box(0.42, 0.36, 0.3, mats.beige, -0.05, TOP + 0.05 + 0.18, -0.12, pc);
  box(0.3, 0.26, 0.17, mats.beige, -0.05, TOP + 0.05 + 0.17, -0.355, pc);
  box(0.34, 0.265, 0.005, mats.black, -0.05, TOP + 0.05 + 0.19, 0.03, pc);
  const scr = new THREE.Mesh(
    new THREE.PlaneGeometry(0.31, 0.232),
    flat(0xffffff, { map: textures.screen }),
  );
  scr.position.set(-0.05, TOP + 0.05 + 0.19, 0.0335);
  scr.userData.noHull = true;
  pc.add(scr);
  for (let i = 0; i < 3; i++)
    cyl(0.008, 0.008, 0.01, 6, mats.dark, 0.05 + i * 0.03, TOP + 0.075, 0.032, pc).rotation.x =
      Math.PI / 2;
  const kb = new THREE.Group();
  kb.position.set(-0.02, TOP, 0.24);
  kb.rotation.x = 0.06;
  pc.add(kb);
  box(0.44, 0.022, 0.15, lambert(0xcfcabd), 0, 0.011, 0, kb);
  box(
    0.415,
    0.007,
    0.12,
    [
      mats.beigeDk,
      mats.beigeDk,
      lambert(0xffffff, { map: textures.keys }),
      mats.beigeDk,
      mats.beigeDk,
      mats.beigeDk,
    ],
    0,
    0.025,
    -0.004,
    kb,
  );
  // torre
  const tw = new THREE.Group();
  tw.position.set(0.66, TOP, -0.05);
  pc.add(tw);
  box(0.26, 0.5, 0.46, mats.beige, 0, 0.25, 0, tw);
  box(0.24, 0.045, 0.004, mats.beigeDk, 0, 0.44, 0.231, tw);
  box(0.17, 0.007, 0.004, mats.black, 0, 0.445, 0.234, tw);
  box(0.24, 0.045, 0.004, mats.beigeDk, 0, 0.39, 0.231, tw);
  box(0.17, 0.007, 0.004, mats.black, 0, 0.395, 0.234, tw);
  const turbo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.025),
    flat(0xffffff, { map: textures.turbo }),
  );
  turbo.position.set(-0.06, 0.34, 0.2315);
  turbo.userData.noHull = true;
  tw.add(turbo);
  box(0.03, 0.02, 0.006, mats.red, 0.06, 0.34, 0.232, tw);
  parts.driveLed = box(0.012, 0.005, 0.003, flat(0x3a7a3a), 0.1, 0.43, 0.234, tw);
  for (let i = 0; i < 9; i++)
    box(0.15, 0.006, 0.003, mats.beigeDk, 0.04, 0.08 + i * 0.024, 0.231, tw); // rejilla de ventilación
  parts.tower = tw;
  parts.pc = pc;

  // mouse rojo con cable
  const ms = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mats.mouse);
  ms.scale.set(0.032, 0.018, 0.05);
  ms.position.set(0.32, TOP + 0.01, 0.24);
  ms.rotation.y = -0.15;
  ms.castShadow = true;
  scene.add(ms);
  box(0.001, 0.004, 0.03, mats.black, 0.32, TOP + 0.026, 0.22);
  tube(
    [
      new V3(0.32, TOP + 0.006, 0.19),
      new V3(0.37, TOP + 0.003, 0.1),
      new V3(0.46, TOP + 0.003, 0.03),
      new V3(0.52, TOP + 0.003, -0.03),
    ],
    0.003,
    mats.black,
  );
  // vaso
  const glass = cyl(
    0.022,
    0.018,
    0.055,
    8,
    lambert(0xb8c4c4, { transparent: true, opacity: 0.35, depthWrite: false }),
    0.42,
    TOP + 0.028,
    -0.2,
  );
  glass.castShadow = false;
}
