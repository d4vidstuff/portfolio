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

/* ---------- la escopeta (vista de costado, abajo a la derecha) ---------- */
/**
 * La escopeta se dibuja de perfil en un canvas chico, como pixel art sin
 * rotar, y después se pega en pantalla girada en diagonal hacia la mira con
 * suavizado apagado: así se mantienen los píxeles duros.
 *
 * t = segundos desde el último disparo (Infinity en reposo). Cada tiro:
 *   0–0.07    fogonazo, retroceso y el caño sube
 *   0.07–0.3  vuelve a posición
 *   0.3–0.48  bombea hacia atrás (se abre la ventana y salta el cartucho)
 *   0.48–0.66 bombea hacia adelante
 */
export const RELOAD_TIME = 0.7;

const GUN_W = 160; // tamaño del dibujo de perfil (en píxeles del juego)
const GUN_H = 72;
const PIVOT = { x: 60, y: 28 }; // centro del cajón de mecanismos: el punto que se ubica en pantalla
const GUN_SCALE = 1.4;
const gunCanvas = document.createElement('canvas');
gunCanvas.width = GUN_W;
gunCanvas.height = GUN_H;
const gun = gunCanvas.getContext('2d');

/** Perfil de la escopeta mirando a la derecha. pump: cuánto se corrió el guardamanos. */
function drawGunProfile(pump, flash, shellK) {
  const R = (c, x, y, w, h) => {
    gun.fillStyle = c;
    gun.fillRect(x, y, w, h);
  };
  gun.clearRect(0, 0, GUN_W, GUN_H);
  // brazo derecho (manga) que sale por el borde de la pantalla
  R('#2d3a2a', 0, 40, 34, 32);
  R('#3a4a36', 0, 40, 34, 3);
  R('#24301f', 0, 58, 34, 2);
  // culata
  R('#5a3219', 4, 22, 34, 14);
  R('#6b3d1f', 4, 22, 34, 3);
  R('#4a2914', 8, 33, 30, 3);
  R('#1a1c1a', 2, 21, 4, 17); // cantonera de goma
  // empuñadura y mano derecha
  R('#4f2c15', 34, 27, 12, 14);
  R('#c99a7a', 31, 31, 16, 11);
  R('#b5866a', 31, 39, 16, 3);
  R('#d9ad8f', 36, 31, 8, 2);
  // guardamonte y disparador
  R('#1a1d21', 48, 35, 12, 2);
  R('#1a1d21', 48, 35, 2, 6);
  R('#1a1d21', 58, 35, 2, 6);
  R('#1a1d21', 48, 40, 12, 2);
  R('#3d444c', 53, 36, 2, 4);
  // cajón de mecanismos
  R('#2b3036', 44, 19, 34, 17);
  R('#4a525b', 44, 19, 34, 2);
  R('#1a1d21', 44, 34, 34, 2);
  R('#20242a', 47, 23, 4, 8); // tornillos / placa
  R(pump > 3 ? '#0b0c0e' : '#22262b', 60, 22, 12, 6); // ventana de expulsión
  if (pump > 3) R('#ffcf4a', 62, 23, 7, 4);
  // caño grueso y tubo depósito debajo
  R('#1d2024', 76, 19, 70, 8);
  R('#5a636d', 76, 19, 70, 2);
  R('#2b3036', 76, 28, 60, 7);
  R('#3d444c', 76, 28, 60, 1);
  R('#0b0c0e', 145, 18, 3, 10); // boca
  R('#d4ccb4', 140, 16, 3, 3); // mira delantera
  // guardamanos (lo que se bombea) con la mano izquierda abajo
  const fx = 96 - pump;
  R('#6b3d1f', fx, 26, 32, 12);
  R('#8a5230', fx, 26, 32, 2);
  for (let x = fx + 3; x < fx + 31; x += 4) R('#4f2c15', x, 29, 1, 8);
  R('#2d3a2a', fx + 4, 44, 24, 28); // manga izquierda
  R('#3a4a36', fx + 4, 44, 24, 3);
  R('#c99a7a', fx + 1, 35, 28, 10); // mano
  R('#b5866a', fx + 1, 43, 28, 2);
  R('#d9ad8f', fx + 6, 35, 16, 2);
  // fogonazo en la boca
  if (flash) {
    R('#ff8a2a', 148, 10, 12, 26);
    R('#ffcf4a', 148, 14, 9, 18);
    R('#fff7d6', 148, 19, 6, 8);
  }
  // cartucho que salta de la ventana
  if (shellK >= 0) {
    const sx = 64 - shellK * 26;
    const sy = 20 - Math.sin(shellK * Math.PI) * 18;
    R('#9e141c', sx, sy, 8, 4);
    R('#d1a23a', sx, sy, 3, 4);
  }
}

export function drawShotgun(ctx, W, viewH, t, walkBob) {
  const ease = (k) => k * k * (3 - 2 * k);
  let kick = 0; // retroceso a lo largo del caño
  let climb = 0; // el caño sube con el disparo
  let pump = 0;
  let cant = 0; // se inclina mientras bombea
  if (t < 0.07) {
    kick = 10 * (t / 0.07);
    climb = 0.12 * (t / 0.07);
  } else if (t < 0.3) {
    const k = 1 - ease((t - 0.07) / 0.23);
    kick = 10 * k;
    climb = 0.12 * k;
  }
  if (t >= 0.3 && t < 0.48) pump = 16 * ease((t - 0.3) / 0.18);
  else if (t >= 0.48 && t < 0.66) pump = 16 * (1 - ease((t - 0.48) / 0.18));
  if (t >= 0.26 && t < 0.7) cant = Math.sin(((t - 0.26) / 0.44) * Math.PI) * 0.08;
  const shellK = t >= 0.36 && t < 0.62 ? (t - 0.36) / 0.26 : -1;
  drawGunProfile(pump, t < 0.07, shellK);

  // en pantalla: el cajón abajo a la derecha y el caño en diagonal, terminando
  // justo abajo y a la derecha de la mira
  const angle = 0.4 + climb - cant;
  const gx = W - 44 + Math.cos(angle) * kick;
  const gy = viewH - 22 + Math.sin(angle) * kick + walkBob;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(gx), Math.round(gy));
  ctx.rotate(angle);
  ctx.scale(-GUN_SCALE, GUN_SCALE); // el perfil mira a la derecha; en pantalla apunta a la izquierda
  ctx.drawImage(gunCanvas, -PIVOT.x, -PIVOT.y);
  ctx.restore();
}
