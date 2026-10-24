/**
 * Benja: el modelo enroscado durmiendo y el modelo parado con patas y cola.
 */
import { THREE, V3 } from '../three.js';
import { scene } from '../renderer.js';
import { lambert } from '../materials.js';
import { textures } from '../textures.js';
import { cyl, tube } from '../geometry.js';
import { parts, TOP } from '../parts.js';

export function buildBenja(mats) {
  // Benja, enroscado y durmiendo
  const cat = new THREE.Group();
  cat.position.set(-0.42, TOP, 0.25);
  cat.rotation.y = 0.3;
  cat.scale.setScalar(0.88);
  scene.add(cat);
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 8),
    lambert(0xffffff, { map: textures.cat }),
  );
  body.scale.set(0.15, 0.08, 0.125);
  body.position.y = 0.07;
  body.rotation.y = -0.2;
  body.castShadow = body.receiveShadow = true;
  cat.add(body);
  const head = new THREE.Group();
  head.position.set(-0.1, 0.08, 0.075);
  head.rotation.set(0.35, -0.55, 0.2);
  cat.add(head);
  const hm = new THREE.Mesh(
    new THREE.SphereGeometry(0.056, 10, 7),
    lambert(0xffffff, { map: textures.catHead }),
  );
  hm.scale.set(1, 0.86, 1);
  hm.rotation.y = -Math.PI / 2 + 0.1;
  hm.castShadow = true;
  head.add(hm);
  parts.ears = [-1, 1].map((s) => {
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.036, 4), mats.furD);
    e.position.set(s * 0.03, 0.05, -0.006);
    e.rotation.z = -s * 0.35;
    e.castShadow = true;
    head.add(e);
    return e;
  });
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 5), mats.furW);
  paw.scale.set(1.7, 0.5, 1);
  paw.position.set(-0.05, 0.016, 0.13);
  paw.rotation.y = 0.5;
  paw.castShadow = true;
  cat.add(paw);
  tube(
    [
      new V3(0.13, 0.03, -0.07),
      new V3(0.16, 0.02, 0.03),
      new V3(0.11, 0.02, 0.11),
      new V3(0.02, 0.018, 0.14),
      new V3(-0.04, 0.018, 0.13),
    ],
    0.016,
    mats.furD,
    cat,
  );
  parts.cat = cat;
  parts.catBody = body;
  parts.catHead = head;

  // Benja despierto: patas con rodilla, cola articulada y ojos que parpadean
  const cw = new THREE.Group();
  cw.visible = false;
  scene.add(cw);
  const piv = new THREE.Group();
  piv.position.set(-0.06, 0.12, 0);
  cw.add(piv);
  const torso = new THREE.Mesh(
    new THREE.SphereGeometry(1, 10, 7),
    lambert(0xffffff, { map: textures.cat }),
  );
  torso.scale.set(0.105, 0.052, 0.056);
  torso.position.x = 0.065;
  torso.castShadow = true;
  piv.add(torso);
  const hd = new THREE.Group();
  hd.position.set(0.168, 0.05, 0);
  piv.add(hd);
  const eyeMat = lambert(0xffffff, { map: textures.catHeadAwake });
  const hdm = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 7), eyeMat);
  hdm.scale.set(0.95, 0.88, 1);
  hdm.rotation.y = Math.PI / 2;
  hdm.castShadow = true;
  hd.add(hdm);
  const cwEars = [-1, 1].map((sd) => {
    const e = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.036, 4), mats.furD);
    e.position.set(-0.006, 0.045, sd * 0.026);
    e.rotation.x = sd * 0.3;
    e.castShadow = true;
    hd.add(e);
    return e;
  });
  const mkLeg = (x, z, dk) => {
    const hip = new THREE.Group();
    hip.position.set(x, -0.02, z);
    piv.add(hip);
    cyl(0.012, 0.01, 0.055, 5, dk ? mats.furD : mats.furW, 0, -0.0275, 0, hip);
    const knee = new THREE.Group();
    knee.position.y = -0.055;
    hip.add(knee);
    cyl(0.0095, 0.008, 0.045, 5, mats.furW, 0, -0.0225, 0, knee);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 4), mats.furW);
    paw.scale.set(1.35, 0.55, 1);
    paw.position.set(0.004, -0.046, 0);
    paw.castShadow = true;
    knee.add(paw);
    return { hip, knee };
  };
  const legs = {
    fl: mkLeg(0.13, 0.027),
    fr: mkLeg(0.13, -0.027),
    bl: mkLeg(0, 0.03, true),
    br: mkLeg(0, -0.03),
  };
  const tailRoot = new THREE.Group();
  tailRoot.position.set(-0.04, 0.012, 0);
  piv.add(tailRoot);
  const tail = [];
  let tp = tailRoot;
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    if (i) g.position.y = 0.036;
    tp.add(g);
    cyl(0.0105 - i * 0.0013, 0.0118 - i * 0.0013, 0.039, 5, mats.furD, 0, 0.018, 0, g);
    tail.push(g);
    tp = g;
  }
  parts.cw = { g: cw, piv, hd, legs, tail, ears: cwEars, eyes: eyeMat };
}
