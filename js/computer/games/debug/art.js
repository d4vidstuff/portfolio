/**
 * Gráficos de DEBUG.EXE, todos dibujados por código:
 * texturas de pared (32x32), sprites de enemigos y objetos (16x16 o 24x24)
 * y la escopeta en primera persona con su animación de disparo y recarga.
 */

/** Dibuja en un canvas chico y devuelve sus píxeles (formato ABGR de getImageData). */
function pixels(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  return { size, data: new Uint32Array(g.getImageData(0, 0, size, size).data.buffer) };
}
const px = (g, color, x, y, w = 1, h = 1) => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};
const noise = (g, size, n, colors) => {
  for (let i = 0; i < n; i++)
    px(g, colors[i % colors.length], (Math.random() * size) | 0, (Math.random() * size) | 0);
};

/* ---------- paredes ---------- */
export const WALL_TEX = {
  // rack de servidores: bandejas y LEDs
  '#': pixels(32, (g) => {
    px(g, '#2b3036', 0, 0, 32, 32);
    for (let y = 2; y < 32; y += 6) {
      px(g, '#1a1d21', 2, y, 28, 5);
      px(g, '#3d444c', 2, y, 28, 1);
      px(g, (y / 6) % 2 ? '#5bd16a' : '#d1a23a', 25, y + 2, 2, 1);
      px(g, '#5bd16a', 22, y + 2);
    }
    px(g, '#121417', 0, 0, 1, 32);
    px(g, '#121417', 31, 0, 1, 32);
  }),
  // ladrillo del taller
  '%': pixels(32, (g) => {
    px(g, '#5a2a22', 0, 0, 32, 32);
    for (let y = 0; y < 32; y += 8) {
      px(g, '#3a1a15', 0, y, 32, 1);
      for (let x = (y / 8) % 2 ? 8 : 0; x < 32; x += 16) px(g, '#3a1a15', x, y, 1, 8);
    }
    noise(g, 32, 70, ['#6b342a', '#4a221c']);
  }),
  // chapa azul con remaches
  '=': pixels(32, (g) => {
    px(g, '#26395a', 0, 0, 32, 32);
    px(g, '#1a2840', 0, 15, 32, 2);
    px(g, '#334c75', 0, 0, 32, 1);
    [3, 28].forEach((x) => [3, 12, 20, 28].forEach((y) => px(g, '#7b8fb3', x, y)));
    noise(g, 32, 40, ['#2c4268', '#1f304d']);
  }),
};

/* ---------- enemigos (cada uno con 2 cuadros y uno "golpeado") ---------- */
function bug(frame, hit) {
  return pixels(16, (g) => {
    const body = hit ? '#ffffff' : '#9e141c';
    const dark = hit ? '#d0d0d0' : '#5a0b10';
    (frame ? [3, 7, 11] : [4, 8, 12]).forEach((y) => {
      px(g, dark, 2, y, 3);
      px(g, dark, 11, y, 3);
    });
    px(g, body, 5, 4, 6, 10);
    px(g, body, 4, 6, 8, 6);
    px(g, dark, 8, 5, 1, 9);
    px(g, body, 6, 1, 4, 3);
    px(g, '#111', 6, 0);
    px(g, '#111', 9, 0);
    px(g, '#f1e6dc', 6, 2);
    px(g, '#f1e6dc', 9, 2);
  });
}

/** Glitch: un rombo flotante con un ojo, que dispara. */
function glitch(frame, hit) {
  return pixels(16, (g) => {
    const a = hit ? '#ffffff' : '#7a3fd1';
    const b = hit ? '#dddddd' : '#c06cf0';
    for (let y = 0; y < 16; y++) {
      const half = 8 - Math.abs(y - 7.5) + 0.5;
      const shift = frame && y % 4 === 1 ? 1 : 0; // líneas corridas: el "glitch"
      px(g, y % 3 ? a : b, 8 - half + shift, y, half * 2);
    }
    px(g, '#f1e6dc', 5, 6, 6, 4);
    px(g, '#0d0d10', 7 + (frame ? 1 : 0), 7, 2, 2);
    px(g, '#ff4fd8', 3, 12, 1, 1);
    px(g, '#ff4fd8', 12, 3, 1, 1);
  });
}

/** Memory leak: un tanque con orugas y cañón. */
function tank(frame, hit, boss) {
  return pixels(24, (g) => {
    const hull = hit ? '#ffffff' : boss ? '#5e1016' : '#4d5a3a';
    const light = hit ? '#eeeeee' : boss ? '#9e141c' : '#6f7d55';
    const tread = hit ? '#cccccc' : '#1a1c1a';
    px(g, tread, 1, 15, 22, 7);
    for (let x = 2 + (frame ? 1 : 0); x < 22; x += 3) px(g, '#3a3d3a', x, 16, 1, 5);
    px(g, hull, 3, 9, 18, 7);
    px(g, light, 3, 9, 18, 1);
    px(g, hull, 7, 4, 10, 6); // torreta
    px(g, light, 7, 4, 10, 1);
    px(g, '#111', 10, 10, 4, 4); // boca del cañón, mirando a cámara
    px(g, boss ? '#ffcf4a' : '#d12b2b', 9, 6, 2, 2); // ojos / sensores
    px(g, boss ? '#ffcf4a' : '#d12b2b', 13, 6, 2, 2);
    if (boss) {
      px(g, '#ffcf4a', 6, 1, 12, 2); // corona de "pánico"
      px(g, '#ffcf4a', 6, 0, 2, 1);
      px(g, '#ffcf4a', 11, 0, 2, 1);
      px(g, '#ffcf4a', 16, 0, 2, 1);
    }
  });
}

export const ENEMY_ART = {
  bug: [bug(0, 0), bug(1, 0), bug(0, 1)],
  glitch: [glitch(0, 0), glitch(1, 0), glitch(0, 1)],
  tank: [tank(0, 0, 0), tank(1, 0, 0), tank(0, 1, 0)],
  boss: [tank(0, 0, 1), tank(1, 0, 1), tank(0, 1, 1)],
};

/* ---------- objetos ---------- */
export const ITEM_ART = {
  health: pixels(16, (g) => {
    px(g, '#d4ccb4', 3, 4, 10, 9);
    px(g, '#8b8670', 3, 12, 10, 1);
    px(g, '#2f8f3a', 7, 5, 2, 7);
    px(g, '#2f8f3a', 5, 7, 6, 2);
  }),
  bolt: pixels(16, (g) => {
    px(g, '#ff4fd8', 5, 5, 6, 6);
    px(g, '#ffd0f5', 6, 6, 4, 4);
    px(g, '#ff4fd8', 7, 3, 2, 10);
    px(g, '#ff4fd8', 3, 7, 10, 2);
  }),
  shell: pixels(16, (g) => {
    px(g, '#ffcf4a', 4, 4, 8, 8);
    px(g, '#fff3c4', 6, 6, 4, 4);
    px(g, '#ff8a2a', 2, 7, 12, 2);
  }),
};

/* ---------- la escopeta ---------- */
/**
 * Dibuja la escopeta de acción de bombeo. t = segundos desde el último disparo
 * (o Infinity si está en reposo). Línea de tiempo de cada tiro:
 *   0–0.07  fogonazo y retroceso
 *   0.07–0.3  vuelve a posición
 *   0.3–0.48  bombea hacia atrás (cae el cartucho)
 *   0.48–0.66 bombea hacia adelante
 */
export const RELOAD_TIME = 0.7;
export function drawShotgun(ctx, W, viewH, t, walkBob) {
  const ease = (k) => k * k * (3 - 2 * k);
  let kick = 0;
  let pump = 0;
  let tilt = 0;
  if (t < 0.07) kick = 12 * (t / 0.07);
  else if (t < 0.3) kick = 12 * (1 - ease((t - 0.07) / 0.23));
  if (t >= 0.3 && t < 0.48) pump = 10 * ease((t - 0.3) / 0.18);
  else if (t >= 0.48 && t < 0.66) pump = 10 * (1 - ease((t - 0.48) / 0.18));
  if (t >= 0.26 && t < 0.7) tilt = Math.sin(((t - 0.26) / 0.44) * Math.PI) * 6;

  const cx = W / 2 + 8 + tilt;
  const by = viewH + kick * 0.6 + walkBob;
  const R = (c, x, y, w, h) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(cx + x), Math.round(by + y), w, h);
  };
  // caño: el cañón arriba y el tubo del depósito pegado
  R('#1d2024', -6, -78 + kick * 0.4, 13, 50);
  R('#4a525b', -5, -78 + kick * 0.4, 3, 50);
  R('#2b3036', 2, -78 + kick * 0.4, 1, 50);
  R('#0b0c0e', -5, -80 + kick * 0.4, 11, 3);
  // guardamanos (lo que se bombea), con la mano
  R('#6b3d1f', -13, -46 + pump, 27, 18);
  R('#8a5230', -13, -46 + pump, 27, 2);
  [-41, -37, -33].forEach((y) => R('#4f2c15', -13, y + pump, 27, 1));
  R('#c99a7a', -17, -40 + pump, 7, 12); // dedos izquierda
  R('#b5866a', 10, -40 + pump, 6, 10); // pulgar
  // cajón de mecanismos
  R('#2b3036', -15, -28, 31, 15);
  R('#3d444c', -15, -28, 31, 2);
  R('#1a1d21', -15, -16, 31, 2);
  if (pump > 3) R('#ffcf4a', 12, -25, 5, 4); // ventana de expulsión abierta
  // culata y mano derecha
  R('#5a3219', -21, -13, 43, 16);
  R('#6b3d1f', -21, -13, 43, 3);
  R('#c99a7a', 6, -19, 15, 11);

  // fogonazo
  if (t < 0.07) {
    const fy = -98 + kick * 0.4;
    R('#ff8a2a', -17, fy, 35, 20);
    R('#ffcf4a', -11, fy + 3, 23, 15);
    R('#fff7d6', -5, fy + 7, 11, 8);
  }
  // cartucho saliendo durante el bombeo
  if (t >= 0.36 && t < 0.62) {
    const k = (t - 0.36) / 0.26;
    R('#9e141c', 14 + k * 26, -26 - Math.sin(k * Math.PI) * 26, 6, 3);
    R('#d1a23a', 14 + k * 26, -26 - Math.sin(k * Math.PI) * 26, 2, 3);
  }
}
