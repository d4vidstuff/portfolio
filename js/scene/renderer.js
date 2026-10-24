/**
 * Renderer, escena, cámara y el pase de post-procesado.
 * Si el navegador no tiene WebGL, este módulo tira un error al importarse y
 * main.js pasa directo al modo texto.
 */
import { THREE } from './three.js';
import { $ } from '../core/dom.js';
import { postVertex, postFragment } from './post-shader.js';

export const renderer = new THREE.WebGLRenderer({
  canvas: $('#gl'),
  antialias: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050605);
scene.fog = new THREE.Fog(0x050605, 2.4, 6);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.03, 30);

const rt = new THREE.WebGLRenderTarget(320, 180, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
});
const snapRes = { value: new THREE.Vector2(160, 90) };
const postMat = new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: rt.texture },
    uRes: { value: new THREE.Vector2(320, 180) },
    uTime: { value: 0 },
    uGrain: { value: 0.075 },
    uCA: { value: 0 },
    uFlash: { value: 0 },
  },
  vertexShader: postVertex,
  fragmentShader: postFragment,
  depthTest: false,
  depthWrite: false,
});
const postScene = new THREE.Scene(),
  postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
quad.frustumCulled = false;
postScene.add(quad);

export { scene, camera, rt, snapRes, postMat, postScene, postCam };
