/**
 * Benja despierto: una máquina de estados.
 *
 * sleep → wakeup → loaf → stretch → rise → walk → turn → sit → demand
 *   → happy (lo acariciaste) o getup ofendido (lo ignoraste 40 s)
 *   → walk de vuelta → turnHome → lie → settle → sleep
 *
 * Cada cuadro, catUpdate() elige una pose objetivo según el estado y unos
 * resortes la alcanzan de forma suave. Encima se suma el ciclo de caminata.
 */
import { THREE, V3 } from '../scene/three.js';
import { camera } from '../scene/renderer.js';
import { parts, TOP } from '../scene/parts.js';
import { textures } from '../scene/textures.js';
import { REDUCED_MOTION } from '../core/dom.js';
import { app } from '../core/state.js';
import { sound } from '../audio/sound.js';
import { setHover, getHovered, parT } from '../desk/picking.js';
import { hearts } from './bubble.js';
import {
  POSE_KEYS,
  mkPose,
  POSES,
  springOf,
  CAT_HOME,
  CAT_OUT,
  CAT_BACK,
  PET_GOAL,
  angTo,
  angDiff,
  HOME_HEAD,
  kbY,
  ezIO,
} from './poses.js';

const Cat = {
  mode: 'sleep',
  next: Infinity,
  t0: 0,
  offended: false,
  pos: new V3(-0.42, 0, 0.25),
  head: 0,
  headV: 0,
  headT: 0,
  cur: mkPose({}),
  vel: mkPose({}),
  tgt: mkPose({}),
  walkW: 0,
  ph: 0,
  v: 0,
  curve: null,
  len: 1,
  s: 0,
  back: false,
  gy: 0,
  hopT: -1,
  hopFrom: 0,
  hopTo: 0,
  pet: 0,
  petPulse: 0,
  since: 0,
  lastMeow: 0,
  meowPulse: 0,
  msg: 0,
  typed: '',
  lastType: 0,
  blinkAt: 0,
  blinkEnd: 0,
  tilt: 0,
  tiltAt: 0,
  pawAt: 0,
  pawEnd: 0,
  flickAt: 0,
  flickEar: 0,
  headUp: 0,
  look: 0,
};
const catPose = (name) => {
  Cat.tgt = Object.assign({}, POSES[name]);
};
const catSnap = (name) => {
  Object.assign(Cat.cur, POSES[name]);
  POSE_KEYS.forEach((k) => (Cat.vel[k] = 0));
  catPose(name);
};
const catMode = (m, now) => {
  Cat.mode = m;
  Cat.t0 = now;
};
function catPath(pts) {
  Cat.curve = new THREE.CatmullRomCurve3(
    pts.map((q) => new V3(q[0], 0, q[1])),
    false,
    'centripetal',
  );
  Cat.len = Cat.curve.getLength();
  Cat.s = 0;
  Cat.v = 0;
}

function catUpdate(now, dt) {
  const c = Cat,
    W = parts.cw,
    el = now - c.t0;
  const camAng = angTo(camera.position.x - c.pos.x, camera.position.z - c.pos.z);
  let eyes = null; // null: parpadeo automático
  c.petPulse = Math.max(0, c.petPulse - dt * 1.1);
  c.meowPulse = Math.max(0, c.meowPulse - dt * 2.5);

  switch (c.mode) {
    case 'sleep':
      if (now > c.next && app.state === 'idle' && !app.busy) {
        c.offended = false;
        catMode('wakeup', now);
      }
      break;
    case 'wakeup': // todavía enroscado: levanta la cabeza y mira alrededor
      c.headUp = ezIO(Math.min(1, el / 700));
      c.look = el > 700 ? Math.sin(((el - 700) / 1000) * 3.6) * Math.min(1, (el - 700) / 300) : 0;
      if (el > 1800) {
        if (getHovered() && getHovered().id === 'benja') setHover(null);
        parts.cat.visible = false;
        W.g.visible = true;
        c.pos.set(CAT_HOME[0], 0, CAT_HOME[1]);
        c.head = c.headT = HOME_HEAD;
        c.headV = 0;
        c.gy = 0;
        c.hopTo = 0;
        c.hopT = -1;
        catSnap('LOAF');
        c.walkW = 0;
        c.blinkAt = now + 600;
        catMode('loaf', now);
      }
      break;
    case 'loaf':
      eyes = el < 280;
      if (el > 500) {
        catPose('BOW');
        catMode('stretch', now);
      }
      break;
    case 'stretch': // se estira con un bostezo
      eyes = el > 180 && el < 1050;
      if (el > 1200) {
        catPose('STAND');
        catMode('rise', now);
        sound.play('meow', { vol: 0.45, rate: 1.2 });
      }
      break;
    case 'rise':
      if (el > 520) {
        catPath(CAT_OUT);
        c.back = false;
        catMode('walk', now);
      }
      break;
    case 'walk': {
      const rem = c.len - c.s,
        vmax = c.offended ? 0.19 : 0.13;
      const want = rem < 0.09 ? vmax * Math.max(0.18, rem / 0.09) : vmax;
      c.v += (want - c.v) * Math.min(1, dt * 3);
      c.s = Math.min(c.len, c.s + (REDUCED_MOTION ? c.len : c.v * dt));
      const u = c.s / c.len,
        p = c.curve.getPointAt(u),
        tn = c.curve.getTangentAt(Math.min(0.995, u));
      c.pos.x = p.x;
      c.pos.z = p.z;
      c.headT = angTo(tn.x, tn.z);
      c.ph += ((c.v * dt) / 0.1) * Math.PI * 2;
      if (c.s >= c.len - 1e-4) {
        c.v = 0;
        catMode(c.back ? 'turnHome' : 'turn', now);
      }
      break;
    }
    case 'turn':
      c.headT = camAng;
      if (Math.abs(angDiff(c.head, c.headT)) < 0.1 || el > 1300) {
        catPose('SIT');
        catMode('sit', now);
      }
      break;
    case 'sit':
      c.headT = camAng;
      if (el > 700) {
        c.since = now;
        c.pet = 0;
        c.lastMeow = now - 5400;
        c.msg = 0;
        c.tiltAt = now + 1400;
        c.pawAt = now + 5500;
        catMode('demand', now);
      }
      break;
    case 'demand': {
      c.headT = camAng;
      if (now - c.lastMeow > 7000) {
        c.lastMeow = now;
        c.meowPulse = 1;
        sound.play('meow', { vol: 0.8 });
        if (now - c.since > 3000) c.msg++;
      }
      if (now > c.tiltAt) {
        c.tilt = Math.random() < 0.3 ? 0 : c.tilt > 0 ? -0.32 : 0.32;
        c.tiltAt = now + 1700 + Math.random() * 1800;
      }
      if (now > c.pawAt) {
        c.pawEnd = now + 950;
        c.pawAt = now + 6500 + Math.random() * 4000;
      }
      const t = Object.assign({}, POSES.SIT);
      t.hT = c.tilt;
      t.hY = REDUCED_MOTION ? 0 : parT.x * 0.4;
      t.hP += (REDUCED_MOTION ? 0 : parT.y * 0.15) + c.meowPulse * 0.32;
      t.ear = 0.5;
      if (now < c.pawEnd) {
        t.frH = 0.5;
        t.frK = -1.35;
        t.roll = -0.05;
        t.hT = 0.18;
      } // pide con la patita
      if (c.petPulse > 0.05) {
        const q = c.petPulse;
        t.hP += 0.2 * q;
        t.hT = 0.28 * q;
        t.roll += 0.05 * q;
        t.ear = 0.5 - 1.1 * q;
        eyes = true;
      }
      c.tgt = t;
      if (c.pet >= PET_GOAL) {
        catMode('happy', now);
        sound.sfx('purr');
        setTimeout(() => sound.sfx('purr'), 2200);
        hearts(8);
      } else if (now - c.since > 40000) {
        c.offended = true;
        catPose('STAND');
        catMode('getup', now);
      }
      break;
    }
    case 'happy': {
      // amasa con las patitas y parpadea lento
      c.headT = camAng;
      const t = Object.assign({}, POSES.SIT),
        kn = Math.sin((el / 1000) * 6.5);
      t.flK = -1 * Math.max(0, kn);
      t.frK = -1 * Math.max(0, -kn);
      t.flH += 0.15 * Math.max(0, kn);
      t.frH += 0.15 * Math.max(0, -kn);
      t.hP += 0.16;
      t.hT = Math.sin(el / 900) * 0.2;
      t.ear = -0.1;
      t.roll = Math.sin((el / 1000) * 3.25) * 0.03;
      c.tgt = t;
      eyes = el % 1900 > 450;
      if (el > 4400) {
        catPose('STAND');
        catMode('getup', now);
      }
      break;
    }
    case 'getup':
      if (c.offended) {
        c.tgt.ear = -1;
        c.tgt.tA = 1.1;
        c.tgt.tC = 0;
      }
      if (el > 520) {
        catPath(CAT_BACK);
        c.back = true;
        catMode('walk', now);
      }
      break;
    case 'turnHome':
      c.headT = HOME_HEAD;
      if (Math.abs(angDiff(c.head, c.headT)) < 0.1 || el > 1300) {
        catPose('LOAF');
        catMode('lie', now);
      }
      break;
    case 'lie':
      eyes = el > 450;
      if (el > 950) {
        W.g.visible = false;
        parts.cat.visible = true;
        c.headUp = 1;
        c.look = 0;
        c.typed = '';
        if (getHovered() && getHovered().id === 'benjaW') setHover(null);
        catMode('settle', now);
      }
      break;
    case 'settle': // vuelve a enroscarse y baja la cabeza
      c.headUp = 1 - ezIO(Math.min(1, el / 1000));
      if (el > 1000) {
        c.next = now + (c.offended ? 60000 : 90000);
        catMode('sleep', now);
      }
      break;
  }

  // cabeza del Benja enroscado
  parts.catHead.rotation.x = 0.35 - 0.5 * c.headUp;
  parts.catHead.rotation.y = -0.55 + c.look * 0.35;
  if (!W.g.visible) return;

  // Benja tipea sobre el teclado mientras espera
  if (
    (c.mode === 'demand' || c.mode === 'happy') &&
    kbY(c.pos.x, c.pos.z) &&
    now - c.lastType > 380 &&
    c.typed.length < 18
  ) {
    c.lastType = now;
    c.typed += 'jkañsdlf;'[(Math.random() * 9) | 0];
  }

  // resortes: transiciones suaves con un pequeño rebote
  if (REDUCED_MOTION) {
    Object.assign(c.cur, c.tgt);
    c.head = c.headT;
  } else {
    const steps = 2,
      h = dt / steps;
    for (let s = 0; s < steps; s++) {
      for (const k of POSE_KEYS) {
        const [K, D] = springOf(k);
        const a = K * (c.tgt[k] - c.cur[k]) - D * c.vel[k];
        c.vel[k] += a * h;
        c.cur[k] += c.vel[k] * h;
      }
      const a = 42 * angDiff(c.head, c.headT) - 11 * c.headV;
      c.headV += a * h;
      c.head += c.headV * h;
    }
  }
  // pasos: al caminar según la velocidad, y pasitos en el lugar cuando gira
  const turning = c.mode !== 'walk' ? Math.min(0.6, Math.abs(c.headV) * 0.45) : 0;
  const wTarget = c.mode === 'walk' ? Math.min(1, c.v / 0.11) : turning;
  c.walkW += (wTarget - c.walkW) * Math.min(1, dt * 8);
  if (c.mode !== 'walk') c.ph += Math.abs(c.headV) * dt * 1.6;

  // saltito al subir o bajar del teclado
  const g = kbY(c.pos.x, c.pos.z);
  if (g !== c.hopTo) {
    c.hopFrom = c.gy;
    c.hopTo = g;
    c.hopT = now;
  }
  let hopY = 0,
    hopP = 0;
  if (c.hopT >= 0) {
    const k = Math.min(1, (now - c.hopT) / 340),
      up = c.hopTo > c.hopFrom;
    c.gy = c.hopFrom + (c.hopTo - c.hopFrom) * ezIO(k);
    hopY = Math.sin(Math.PI * k) * (up ? 0.03 : 0.012);
    hopP = Math.sin(Math.PI * k) * (up ? 0.2 : -0.12);
    if (k >= 1) c.hopT = -1;
  }

  // pose final = pose con resortes + ciclo de caminata
  const F = Object.assign({}, c.cur),
    w = REDUCED_MOTION ? 0 : c.walkW,
    ph = c.ph;
  const step = (off) => {
    F[off[0] + 'H'] += Math.sin(ph + off[1]) * 0.45 * w;
    F[off[0] + 'K'] -= Math.max(0, Math.cos(ph + off[1])) * 0.75 * w;
  };
  [
    ['br', 0],
    ['fr', Math.PI / 2],
    ['bl', Math.PI],
    ['fl', Math.PI * 1.5],
  ].forEach(step);
  F.y += Math.sin(ph * 2) * 0.0045 * w;
  F.roll += Math.sin(ph) * 0.035 * w;
  F.pitch += Math.sin(ph * 2 + 0.6) * 0.018 * w + hopP;
  F.hP -= Math.sin(ph * 2 + 0.6) * 0.03 * w;
  F.hY += c.mode === 'walk' ? Math.max(-0.35, Math.min(0.35, c.headV * 0.25)) : 0; // mira hacia donde gira

  W.g.position.set(c.pos.x, TOP + c.gy + hopY, c.pos.z);
  W.g.rotation.y = c.head;
  W.piv.position.set(F.x, F.y, 0);
  W.piv.rotation.set(F.roll, 0, F.pitch);
  ['fl', 'fr', 'bl', 'br'].forEach((k) => {
    W.legs[k].hip.rotation.z = F[k + 'H'];
    W.legs[k].knee.rotation.z = F[k + 'K'];
  });
  W.hd.rotation.set(F.hT, F.hY, F.hP);
  if (!REDUCED_MOTION && now > c.flickAt) {
    c.flickAt = now + 2500 + Math.random() * 4000;
    c.flickEar = now;
  }
  const fk = now - c.flickEar < 200 ? Math.sin(((now - c.flickEar) / 200) * Math.PI * 2) * 0.5 : 0;
  W.ears.forEach((e, i) => {
    const sd = i ? 1 : -1;
    e.rotation.z = -F.ear * 0.45;
    e.rotation.x = sd * (0.3 + Math.max(0, -F.ear) * 0.55) + (i ? fk : 0);
  });
  const swayAmp = c.mode === 'happy' ? 0.28 : c.offended ? 0.34 : w > 0.3 ? 0.2 : 0.1,
    swayF = c.offended ? 6 : c.mode === 'happy' ? 1.6 : 2.4;
  W.tail.forEach((sg, i) => {
    sg.rotation.z = i ? F.tC : F.tA;
    sg.rotation.x =
      (i ? F.tW * 0.55 : 0) +
      (REDUCED_MOTION ? 0 : Math.sin((now / 1000) * swayF - i * 0.8) * swayAmp * (0.3 + i * 0.22));
  });
  // ojos
  if (eyes === null) {
    if (now > c.blinkAt) {
      c.blinkEnd = now + 120;
      c.blinkAt = now + (Math.random() < 0.2 ? 260 : 2400 + Math.random() * 3200);
    }
    eyes = now < c.blinkEnd;
  }
  const map = eyes ? textures.catHead : textures.catHeadAwake;
  if (W.eyes.map !== map) W.eyes.map = map;
}

export { Cat, catUpdate };
