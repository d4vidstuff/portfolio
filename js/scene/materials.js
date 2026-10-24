/**
 * Materiales con el "temblor" de vértices de la PlayStation 1:
 * cada vértice se redondea a una grilla de baja resolución en pantalla.
 */
import { THREE } from './three.js';
import { snapRes } from './renderer.js';

function ps1(m) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSnap = snapRes;
    sh.vertexShader =
      'uniform vec2 uSnap;\n' +
      sh.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n{ vec4 sp = gl_Position; sp.xy = floor(sp.xy / sp.w * uSnap + 0.5) / uSnap * sp.w; gl_Position = sp; }',
      );
  };
  return m;
}
function lambert(color, o) {
  o = o || {};
  const p = { color };
  for (const k in o) if (o[k] !== undefined) p[k] = o[k];
  return ps1(new THREE.MeshLambertMaterial(p));
}
function flat(color, o) {
  o = o || {};
  const p = { color };
  for (const k in o) if (o[k] !== undefined) p[k] = o[k];
  return ps1(new THREE.MeshBasicMaterial(p));
}

export { ps1, lambert, flat };
