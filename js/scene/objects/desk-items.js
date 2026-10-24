/**
 * Cosas sueltas: notas, disquetes, walkman, flor y reloj pulsera.
 */
import { THREE } from '../three.js';
import { scene } from '../renderer.js';
import { lambert, flat, ps1 } from '../materials.js';
import { textures } from '../textures.js';
import { box, cyl } from '../geometry.js';
import { parts, TOP } from '../parts.js';

export function buildDeskItems(mats) {
  // notas adhesivas
  const notes = new THREE.Group();
  scene.add(notes);
  [
    [-0.215, TOP + 0.079, 0.036, 0.048, 0.08],
    [-0.158, TOP + 0.079, 0.036, 0.045, -0.06],
    [0.58, TOP + 0.19, 0.186, 0.05, 0.06],
  ].forEach(([x, y, z, s, r], i) => {
    const n = new THREE.Mesh(
      new THREE.PlaneGeometry(s, s),
      lambert(0xffffff, { map: textures.notes[i], side: THREE.DoubleSide }),
    );
    n.position.set(x, y, z);
    n.rotation.z = r;
    notes.add(n);
  });
  parts.notes = notes;

  // disquetes
  parts.floppies = [];
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Group();
    const side = lambert([0x151515, 0x1b2230, 0x2a1716][i]);
    box(
      0.09,
      0.004,
      0.09,
      [side, side, lambert(0xffffff, { map: textures.floppy[i] }), side, side, side],
      0,
      0,
      0,
      f,
    );
    f.position.set(0.25 + i * 0.04, TOP + 0.002 + i * 0.0045, -0.08 - i * 0.025);
    f.rotation.y = -0.35 + i * 0.32;
    f.userData.home = { p: f.position.clone(), r: f.rotation.clone() };
    scene.add(f);
    parts.floppies.push(f);
  }

  // walkman + auriculares
  const wm = new THREE.Group();
  wm.position.set(0.66, TOP, 0.32);
  wm.rotation.y = -0.25;
  scene.add(wm);
  const wmSide = lambert(0x4a5051);
  box(
    0.13,
    0.03,
    0.095,
    [wmSide, wmSide, lambert(0xffffff, { map: textures.walkman }), wmSide, wmSide, wmSide],
    0,
    0.015,
    0,
    wm,
  );
  parts.spools = [-1, 1].map((s) => {
    const sp = cyl(0.012, 0.012, 0.004, 8, lambert(0xd2cab2), s * 0.026, 0.031, -0.006, wm);
    box(0.018, 0.002, 0.004, mats.black, 0, 0.003, 0, sp);
    return sp;
  });
  for (let i = 0; i < 4; i++)
    box(0.018, 0.009, 0.012, i === 0 ? mats.red : mats.metal, -0.042 + i * 0.028, 0.034, 0.05, wm);
  parts.wmLed = box(0.006, 0.004, 0.004, flat(0x2a0a0a), 0.05, 0.031, 0.03, wm);
  const hp = new THREE.Group();
  hp.position.set(-0.17, 0.005, -0.02);
  wm.add(hp);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.004, 4, 12, Math.PI), mats.metal);
  band.rotation.x = -Math.PI / 2;
  band.castShadow = true;
  hp.add(band);
  cyl(0.02, 0.02, 0.012, 8, lambert(0xc46a2a), -0.055, 0.006, 0, hp);
  cyl(0.02, 0.02, 0.012, 8, lambert(0xc46a2a), 0.055, 0.006, 0, hp);
  parts.walkman = wm;

  // flor tejida en campana de vidrio (regalo)
  const fl = new THREE.Group();
  fl.position.set(-0.41, TOP, -0.17);
  fl.rotation.y = 0.3;
  scene.add(fl);
  cyl(0.062, 0.066, 0.016, 14, lambert(0xc4a272), 0, 0.008, 0, fl);
  const yarn = lambert(0x6cba3c),
    pink = lambert(0xd2708f),
    stemM = lambert(0x8bb050);
  const pom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.048, 1), yarn);
  pom.scale.set(1, 0.72, 1);
  pom.position.y = 0.046;
  pom.castShadow = true;
  fl.add(pom);
  const stemC = cyl(0.0045, 0.0045, 0.15, 5, stemM, 0.004, 0.155, 0, fl);
  stemC.rotation.z = -0.05;
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 4), yarn);
  leaf.scale.set(0.032, 0.006, 0.014);
  leaf.position.set(0.03, 0.16, 0.004);
  leaf.rotation.z = 0.55;
  leaf.castShadow = true;
  fl.add(leaf);
  const sep = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.03, 6), yarn);
  sep.rotation.x = Math.PI;
  sep.position.y = 0.232;
  sep.castShadow = true;
  fl.add(sep);
  const bud = new THREE.Mesh(new THREE.IcosahedronGeometry(0.034, 1), pink);
  bud.scale.set(1.05, 0.78, 1);
  bud.position.y = 0.255;
  bud.castShadow = true;
  fl.add(bud);
  const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.008, 4, 9), lambert(0xb85a78));
  swirl.rotation.x = -Math.PI / 2;
  swirl.position.y = 0.278;
  fl.add(swirl);
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.034, 0.022),
    lambert(0xe8e4d8, { side: THREE.DoubleSide }),
  );
  tag.position.set(-0.012, 0.12, 0.012);
  tag.rotation.set(0, 0.4, -0.25);
  fl.add(tag);
  const glassM = new THREE.MeshLambertMaterial({
    color: 0xd6e6e6,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const dome = cyl(0.062, 0.062, 0.27, 16, ps1(glassM), 0, 0.016 + 0.135, 0, fl, true);
  dome.castShadow = false;
  dome.renderOrder = 2;
  const lid = cyl(0.062, 0.062, 0.004, 16, ps1(glassM.clone()), 0, 0.288, 0, fl);
  lid.castShadow = false;
  lid.renderOrder = 2;
  const shine = new THREE.Mesh(
    new THREE.PlaneGeometry(0.008, 0.2),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  shine.position.set(-0.035, 0.16, 0.05);
  shine.rotation.y = -0.6;
  shine.renderOrder = 3;
  shine.userData.noHull = true;
  fl.add(shine);
  parts.flower = fl;

  // reloj pulsera
  const watch = new THREE.Group();
  watch.position.set(-0.73, TOP, 0.32);
  watch.rotation.y = 0.5;
  scene.add(watch);
  box(0.042, 0.012, 0.048, mats.metal, 0, 0.006, 0, watch);
  const lcd = new THREE.Mesh(
    new THREE.PlaneGeometry(0.032, 0.016),
    flat(0xffffff, { map: textures.watch }),
  );
  lcd.rotation.x = -Math.PI / 2;
  lcd.position.set(0, 0.0125, 0);
  lcd.userData.noHull = true;
  watch.add(lcd);
  box(0.022, 0.004, 0.085, mats.metal, 0, 0.002, 0.065, watch);
  box(0.022, 0.004, 0.085, mats.metal, 0, 0.002, -0.065, watch);
  parts.watch = watch;
}
