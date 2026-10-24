/**
 * Poses y recorridos de Benja.
 *
 * Cada pose es un conjunto de ángulos. El gato mira hacia +x y los ángulos son
 * relativos al cuerpo: H = cadera y K = rodilla de cada pata (fl, fr, bl, br),
 * hP/hY/hT = cabeza (arriba, costado, inclinación) y tA/tC/tW = cola.
 */

const POSE_KEYS = [
  'y',
  'x',
  'pitch',
  'roll',
  'flH',
  'flK',
  'frH',
  'frK',
  'blH',
  'blK',
  'brH',
  'brK',
  'hP',
  'hY',
  'hT',
  'tA',
  'tC',
  'tW',
  'ear',
];
const mkPose = (o) => {
  const p = {};
  POSE_KEYS.forEach((k) => (p[k] = o[k] || 0));
  return p;
};
const POSES = {
  STAND: mkPose({
    y: 0.12,
    x: -0.06,
    blH: -0.08,
    blK: 0.15,
    brH: -0.08,
    brK: 0.15,
    tA: 0.5,
    tC: -0.18,
    ear: 0.2,
  }),
  SIT: mkPose({
    y: 0.047,
    x: -0.085,
    pitch: 0.6,
    flH: -0.6,
    frH: -0.6,
    blH: 0.78,
    blK: -2.3,
    brH: 0.78,
    brK: -2.3,
    hP: -0.42,
    tA: 1.05,
    tC: 0.05,
    tW: 0.45,
    ear: 0.4,
  }),
  LOAF: mkPose({
    y: 0.052,
    x: -0.06,
    flH: 1.25,
    flK: -2.4,
    frH: 1.25,
    frK: -2.4,
    blH: 0.95,
    blK: -2.3,
    brH: 0.95,
    brK: -2.3,
    hP: -0.12,
    tA: 1.45,
    tC: 0.1,
    tW: 0.42,
  }),
  BOW: mkPose({
    y: 0.1,
    x: -0.05,
    pitch: -0.32,
    flH: 1.5,
    flK: -0.35,
    frH: 1.5,
    frK: -0.35,
    blH: 0.3,
    blK: 0.05,
    brH: 0.3,
    brK: 0.05,
    hP: 0.55,
    tA: 0.05,
    tC: -0.12,
    ear: -0.2,
  }),
};
const SPRING = { body: [75, 12], head: [95, 13], tail: [32, 7] };
const springOf = (k) =>
  k[0] === 't' ? SPRING.tail : k[0] === 'h' || k === 'ear' ? SPRING.head : SPRING.body;

const CAT_HOME = [-0.42, 0.25];
const CAT_OUT = [
  [-0.42, 0.25],
  [-0.33, 0.335],
  [-0.18, 0.348],
  [-0.08, 0.3],
  [-0.04, 0.25],
];
const CAT_BACK = [
  [-0.04, 0.25],
  [-0.12, 0.335],
  [-0.28, 0.348],
  [-0.38, 0.3],
  [-0.42, 0.25],
];
const PET_GOAL = 600;
const MEOWS = [
  'Miau. Caricias, ahora.',
  'Miau. Sigo esperando.',
  'MIAU.',
  'Caricias o tiro algo del escritorio.',
];
const angTo = (dx, dz) => Math.atan2(-dz, dx);
const angDiff = (a, b) =>
  ((((b - a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
const HOME_HEAD = angTo(-0.073, 0.101);
const kbY = (x, z) => (x > -0.25 && x < 0.21 && z > 0.16 && z < 0.32 ? 0.031 : 0);
const ezIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export {
  POSE_KEYS,
  mkPose,
  POSES,
  springOf,
  CAT_HOME,
  CAT_OUT,
  CAT_BACK,
  PET_GOAL,
  MEOWS,
  angTo,
  angDiff,
  HOME_HEAD,
  kbY,
  ezIO,
};
