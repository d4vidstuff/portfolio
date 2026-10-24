/**
 * Módem con antenas (contacto) y joystick arriba.
 */
import { THREE } from '../three.js';
import { scene } from '../renderer.js';
import { lambert, flat } from '../materials.js';
import { textures } from '../textures.js';
import { box, cyl } from '../geometry.js';
import { parts, TOP } from '../parts.js';

export function buildModem(mats) {
  // módem con antenas sobre la torre (contacto)
  const modem = new THREE.Group();
  modem.position.set(0.66, TOP + 0.5, -0.07);
  scene.add(modem);
  const mBody = lambert(0xcfc9b6);
  box(
    0.24,
    0.045,
    0.17,
    [mBody, mBody, mBody, mBody, lambert(0xffffff, { map: textures.modem }), mBody],
    0,
    0.0225,
    0,
    modem,
  );
  parts.modemLeds = [];
  for (let i = 0; i < 5; i++)
    parts.modemLeds.push(
      box(0.008, 0.005, 0.003, flat(0x1a3a1a), -0.105 + i * 0.022, 0.008, 0.086, modem),
    );
  [-0.09, -0.03, 0.03, 0.09].forEach((x, i) => {
    const a = cyl(0.004, 0.003, 0.2, 4, mats.black, x, 0.045 + 0.095, -0.075, modem);
    a.rotation.set(-0.22, 0, (i - 1.5) * 0.08);
  });
  parts.modem = modem;
  // joystick arriba del módem
  const joy = new THREE.Group();
  joy.position.set(0.0, TOP + 0.545, -0.04);
  joy.position.x = 0.64;
  scene.add(joy);
  box(0.1, 0.025, 0.09, mats.black, 0, 0.0125, 0, joy);
  const stick = cyl(0.005, 0.006, 0.06, 5, mats.dark, -0.015, 0.055, 0, joy);
  stick.rotation.z = 0.15;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 5), mats.red);
  knob.position.set(-0.02, 0.088, 0);
  knob.castShadow = true;
  joy.add(knob);
  cyl(0.01, 0.01, 0.008, 8, mats.red, 0.03, 0.028, 0.02, joy);
  joy.rotation.y = -0.3;
  parts.joy = joy;
  parts.stick = stick;
}
