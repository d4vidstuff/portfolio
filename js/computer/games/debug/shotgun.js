/**
 * La escopeta en primera persona, en perspectiva: un modelo 3D low-poly hecho
 * de cajas (culata, cajón, caño, depósito, guardamanos, manos y mangas) que se
 * proyecta con la misma cámara del juego. La parte de atrás entra grande desde
 * abajo a la derecha y el caño se achica hacia el centro de la pantalla.
 *
 * Sombreado plano por cara, como en la PlayStation 1, y caras ordenadas de
 * atrás hacia adelante (algoritmo del pintor).
 *
 * t = segundos desde el último disparo (Infinity en reposo). Cada tiro:
 *   0–0.07    fogonazo, retroceso y el caño sube
 *   0.07–0.3  vuelve a posición
 *   0.3–0.48  bombea hacia atrás (se abre la ventana y salta el cartucho)
 *   0.48–0.66 bombea hacia adelante
 */
export const RELOAD_TIME = 0.7;

const FOCAL = 160 / 0.66; // misma distancia focal que el raycaster (FOV 0.66)
const LIGHT = norm([-0.5, -0.8, -0.35]); // luz de arriba a la izquierda

/* ---------- vectores ---------- */
function add(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function mul(a, k) {
  return [a[0] * k, a[1] * k, a[2] * k];
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function norm(a) {
  return mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
}

/* ---------- colores ---------- */
const COLORS = {
  wood: [107, 61, 31],
  woodDark: [79, 44, 21],
  steel: [43, 48, 54],
  barrel: [29, 32, 36],
  rail: [61, 68, 76],
  skin: [201, 154, 122],
  glove: [44, 45, 40],
  knuckle: [82, 84, 74],
  cuff: [150, 112, 86],
  sleeve: [45, 58, 42],
  brass: [255, 207, 74],
  shell: [158, 20, 28],
  hole: [11, 12, 14],
};

/**
 * Las piezas del arma en coordenadas del arma: u = a lo largo del caño
 * (hacia adelante), v = hacia arriba, w = hacia el costado que ve la cámara.
 * Cada pieza: [centro u, v, w], [mitad del largo, alto, ancho], color.
 */
function gunParts(pump, portOpen) {
  const P = [
    // culata (se ve de muy cerca, por eso es grande en pantalla)
    [[-0.42, -0.02, 0], [0.2, 0.06, 0.04], 'wood'],
    [[-0.6, -0.02, 0], [0.02, 0.07, 0.045], 'woodDark'],
    // empuñadura
    [[-0.17, -0.09, 0], [0.05, 0.07, 0.035], 'woodDark'],
    // cajón de mecanismos y riel de arriba
    [[0.02, 0, 0], [0.17, 0.065, 0.045], 'steel'],
    [[0.02, 0.072, 0], [0.15, 0.008, 0.012], 'rail'],
    // guardamonte
    [[-0.06, -0.075, 0], [0.06, 0.01, 0.012], 'barrel'],
    // caño y tubo depósito
    [[0.68, 0.035, 0], [0.5, 0.022, 0.022], 'barrel'],
    [[0.56, -0.025, 0], [0.38, 0.022, 0.024], 'steel'],
    [[1.17, 0.035, 0], [0.012, 0.02, 0.02], 'hole'], // boca
    [[1.12, 0.064, 0], [0.012, 0.01, 0.006], 'rail'], // mira delantera
    // guardamanos que se bombea, con estrías
    [[0.46 - pump, -0.03, 0], [0.15, 0.045, 0.05], 'wood'],
    ...[-0.1, -0.05, 0, 0.05, 0.1].map((d) => [
      [0.46 - pump + d, -0.03, 0.051],
      [0.006, 0.035, 0.002],
      'woodDark',
    ]),
  ];
  // ventana de expulsión en el costado visible
  P.push([[0.05, 0.015, 0.046], [0.05, 0.022, 0.002], portOpen ? 'hole' : 'rail']);
  if (portOpen) P.push([[0.05, 0.015, 0.047], [0.03, 0.012, 0.002], 'brass']);
  return P;
}

/** Caja orientada: centro y tres semiejes en el espacio de la cámara → 6 caras. */
function boxFaces(c, a, b, d, color, out) {
  const corner = (sa, sb, sd) => add(add(add(c, mul(a, sa)), mul(b, sb)), mul(d, sd));
  const q = [
    [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1], a],
    [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1], mul(a, -1)],
    [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1], b],
    [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1], mul(b, -1)],
    [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1], d],
    [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1], mul(d, -1)],
  ];
  for (const [p0, p1, p2, p3, n] of q) {
    const pts = [p0, p1, p2, p3].map(([x, y, z]) => corner(x, y, z));
    const center = mul(add(add(pts[0], pts[1]), add(pts[2], pts[3])), 0.25);
    const normal = norm(n);
    if (dot(normal, center) >= 0) continue; // cara de espaldas a la cámara
    if (pts.some((p) => p[2] < 0.12)) continue; // detrás de la cámara (la culata en el hombro)
    out.push({ pts, z: center[2], color, light: Math.max(0, dot(normal, LIGHT)) });
  }
}

/** Brazo: caja larga entre dos puntos del espacio de la cámara. */
function limb(from, to, r, color, out) {
  const axis = mul(sub(to, from), 0.5);
  const side = norm(cross(axis, [0, -1, 0]));
  const up = norm(cross(side, axis));
  boxFaces(mul(add(from, to), 0.5), axis, mul(up, r), mul(side, r), color, out);
}

export function drawShotgun(ctx, W, viewH, t, walkBob) {
  const ease = (k) => k * k * (3 - 2 * k);
  let kick = 0;
  let climb = 0;
  let pump = 0;
  let cant = 0;
  if (t < 0.07) {
    kick = 0.09 * (t / 0.07);
    climb = 0.1 * (t / 0.07);
  } else if (t < 0.3) {
    const k = 1 - ease((t - 0.07) / 0.23);
    kick = 0.09 * k;
    climb = 0.1 * k;
  }
  if (t >= 0.3 && t < 0.48) pump = 0.13 * ease((t - 0.3) / 0.18);
  else if (t >= 0.48 && t < 0.66) pump = 0.13 * (1 - ease((t - 0.48) / 0.18));
  if (t >= 0.26 && t < 0.7) cant = Math.sin(((t - 0.26) / 0.44) * Math.PI) * 0.12;

  // posición del arma frente a la cámara: el cajón abajo a la derecha y el caño
  // en diagonal hacia el centro, terminando un poco abajo y a la derecha de la mira
  const origin = [0.23, 0.175 + walkBob * 0.004, 0.46];
  let U = norm([-0.13, -0.1 - climb, 1]); // en diagonal: desde la esquina hacia el centro
  const up0 = norm([cant, -1, 0]);
  let S = norm(cross(up0, U)); // costado que ve la cámara (hacia la izquierda de la pantalla)
  let V = cross(U, S);
  if (S[0] > 0) {
    S = mul(S, -1);
    V = mul(V, -1);
  }
  const O = sub(origin, mul(U, kick));
  const toView = ([u, v, w]) => add(add(add(O, mul(U, u)), mul(V, v)), mul(S, w));

  const faces = [];
  for (const [c, [hu, hv, hw], color] of gunParts(pump, pump > 0.03)) {
    boxFaces(toView(c), mul(U, hu), mul(V, hv), mul(S, hw), color, faces);
  }
  // manos con guantes oscuros: contrastan con la madera y los dedos se ven separados.
  // Van en su propia capa, encima del arma, para que los dedos no queden tapados.
  const hands = [];
  const fingers = (u0, vTop, len, w) =>
    [-1.5, -0.5, 0.5, 1.5].forEach((i) => {
      const u = u0 + i * 0.036;
      boxFaces(
        toView([u, vTop - len / 2, w]),
        mul(U, 0.015),
        mul(V, len / 2),
        mul(S, 0.009),
        'glove',
        hands,
      );
      boxFaces(
        toView([u, vTop - 0.006, w + 0.004]),
        mul(U, 0.015),
        mul(V, 0.008),
        mul(S, 0.008),
        'knuckle',
        hands,
      );
    });
  // mano derecha en la empuñadura
  const gripHand = toView([-0.17, -0.11, 0.005]);
  boxFaces(gripHand, mul(U, 0.055), mul(V, 0.04), mul(S, 0.048), 'glove', hands);
  fingers(-0.1, -0.045, 0.05, 0.045);
  limb(add(gripHand, [0.02, 0.05, -0.02]), [0.75, 0.9, 0.35], 0.07, 'sleeve', faces);
  // mano izquierda: la palma por debajo del guardamanos y los dedos cerrados sobre el costado
  const fu = 0.46 - pump;
  const palm = toView([fu, -0.1, 0.005]);
  boxFaces(palm, mul(U, 0.075), mul(V, 0.026), mul(S, 0.054), 'glove', hands);
  fingers(fu, 0.004, 0.085, 0.06);
  boxFaces(toView([fu, -0.13, 0]), mul(U, 0.05), mul(V, 0.012), mul(S, 0.045), 'cuff', faces); // muñeca
  limb(add(palm, [0, 0.05, -0.03]), [0.05, 1.0, 0.55], 0.065, 'sleeve', faces);
  // cartucho que salta por la ventana
  if (t >= 0.36 && t < 0.62) {
    const k = (t - 0.36) / 0.26;
    const p = add(toView([0.05, 0.03, 0.05]), [0.14 * k, -0.12 * Math.sin(k * Math.PI), -0.04 * k]);
    boxFaces(p, mul(U, 0.03), mul(V, 0.012), mul(S, 0.012), 'shell', faces);
  }

  // pintar de atrás hacia adelante: primero el arma, después las manos encima
  faces.sort((a, b) => b.z - a.z);
  hands.sort((a, b) => b.z - a.z);
  faces.push(...hands);
  const cx = W / 2;
  const cy = viewH / 2;
  for (const f of faces) {
    const [r, g, b] = COLORS[f.color];
    const k = Math.min(1.15, 0.62 + 0.6 * f.light);
    ctx.fillStyle = `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k) | 0})`;
    ctx.beginPath();
    f.pts.forEach((p, i) => {
      const z = Math.max(0.05, p[2]);
      const sx = Math.round(cx + (FOCAL * p[0]) / z);
      const sy = Math.round(cy + (FOCAL * p[1]) / z);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.closePath();
    ctx.fill();
  }

  // fogonazo en la boca del caño
  if (t < 0.07) {
    const m = toView([1.22, 0.035, 0]);
    const sx = cx + (FOCAL * m[0]) / m[2];
    const sy = cy + (FOCAL * m[1]) / m[2];
    const s = (FOCAL * 0.12) / m[2];
    ctx.fillStyle = '#ff8a2a';
    ctx.fillRect(
      Math.round(sx - s),
      Math.round(sy - s * 0.8),
      Math.round(s * 2),
      Math.round(s * 1.6),
    );
    ctx.fillStyle = '#ffcf4a';
    ctx.fillRect(
      Math.round(sx - s * 0.6),
      Math.round(sy - s * 0.5),
      Math.round(s * 1.2),
      Math.round(s),
    );
    ctx.fillStyle = '#fff7d6';
    ctx.fillRect(
      Math.round(sx - s * 0.25),
      Math.round(sy - s * 0.25),
      Math.round(s * 0.5),
      Math.round(s * 0.5),
    );
  }
}
