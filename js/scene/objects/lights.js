/**
 * Luces: la de techo (fuera de cuadro), el ambiente y el brillo del CRT.
 */
import { THREE } from '../three.js';
import { scene } from '../renderer.js';
import { parts, TOP } from '../parts.js';

export function buildLights(mats) {
  // luz de techo (fuera de cuadro), brillo del CRT y del teclado
  const spot = new THREE.SpotLight(0xffd59a, 2.4, 0, 0.62, 0.55, 1);
  spot.position.set(0.05, 2.5, 0.4);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.002;
  spot.shadow.camera.near = 0.2;
  spot.shadow.camera.far = 5;
  spot.target.position.set(0, TOP, -0.05);
  scene.add(spot);
  scene.add(spot.target);
  parts.spot = spot;
  parts.amb = new THREE.AmbientLight(0x262c2a, 0.5);
  scene.add(parts.amb);
  parts.crt = new THREE.PointLight(0x6fcf7f, 0.55, 1.4, 1);
  parts.crt.position.set(-0.05, 1.0, 0.25);
  scene.add(parts.crt);
}
