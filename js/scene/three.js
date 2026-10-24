/**
 * Three.js se carga como script clásico desde cdnjs (ver index.html).
 * Este módulo lo reexporta para que el resto lo importe como cualquier dependencia.
 */

export const THREE = window.THREE;
export const V3 = THREE.Vector3;
