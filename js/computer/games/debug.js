/**
 * DEBUG.EXE: un juego en primera persona dentro de PORTFOLIO-DOS.
 * Recorrés un laberinto de servidores y cazás los bugs antes del deploy.
 *
 * Es un raycaster como los de los 90: por cada columna de la pantalla se lanza
 * un rayo, se busca la primera pared con DDA y se dibuja una franja de textura
 * cuya altura depende de la distancia. Los bugs son sprites que miran siempre a
 * la cámara y se recortan con el z-buffer de las paredes.
 *
 * Uso: const stop = mountDebugGame(contenedor);  // stop() lo apaga
 */
import { sound } from '../../audio/sound.js';

const W = 320;
const H = 200;
const VIEW_H = 168; // abajo queda la barra de estado
const FOV = 0.66; // largo del plano de cámara (≈ 66°)

// '#' rack de servidores, '%' pared de ladrillo, 'B' bug, 'P' jugador
const MAP = [
  '################',
  '#P....#........#',
  '#.##..#..%%%.B.#',
  '#.#B.....%.....#',
  '#.#..##..%..##.#',
  '#....#B.......B#',
  '###..#...###...#',
  '#....%...#B....#',
  '#.%%%%...#..%%.#',
  '#.....B..#..%B.#',
  '#..##........%.#',
  '#..#B...##.....#',
  '################',
];

const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  strafeL: ['KeyQ'],
  strafeR: ['KeyE'],
  fire: ['Space', 'ControlLeft', 'ControlRight'],
};

/* ---------- texturas y sprites (dibujados por código, 32x32 y 16x16) ---------- */
function pixels(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  return new Uint32Array(g.getImageData(0, 0, size, size).data.buffer);
}

const TEX = {
  '#': pixels(32, (g) => {
    // rack de servidores: chapa oscura, bandejas y LEDs
    g.fillStyle = '#2b3036';
    g.fillRect(0, 0, 32, 32);
    for (let y = 2; y < 32; y += 6) {
      g.fillStyle = '#1a1d21';
      g.fillRect(2, y, 28, 5);
      g.fillStyle = '#3d444c';
      g.fillRect(2, y, 28, 1);
      g.fillStyle = (y / 6) % 2 ? '#5bd16a' : '#d1a23a';
      g.fillRect(25, y + 2, 2, 1);
      g.fillStyle = '#5bd16a';
      g.fillRect(22, y + 2, 1, 1);
    }
    g.fillStyle = '#121417';
    g.fillRect(0, 0, 1, 32);
    g.fillRect(31, 0, 1, 32);
  }),
  '%': pixels(32, (g) => {
    // ladrillo del taller
    g.fillStyle = '#5a2a22';
    g.fillRect(0, 0, 32, 32);
    g.fillStyle = '#3a1a15';
    for (let y = 0; y < 32; y += 8) {
      g.fillRect(0, y, 32, 1);
      const off = (y / 8) % 2 ? 8 : 0;
      for (let x = off; x < 32; x += 16) g.fillRect(x, y, 1, 8);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = Math.random() < 0.5 ? '#6b342a' : '#4a221c';
      g.fillRect((Math.random() * 32) | 0, (Math.random() * 32) | 0, 1, 1);
    }
  }),
};

/** Dos cuadros de animación del bug (patitas) y uno de "golpeado". */
function bugSprite(frame, hit) {
  return pixels(16, (g) => {
    const body = hit ? '#ffffff' : '#9e141c';
    const dark = hit ? '#dddddd' : '#5a0b10';
    g.fillStyle = dark;
    const legs = frame ? [3, 7, 11] : [4, 8, 12];
    legs.forEach((y) => {
      g.fillRect(2, y, 3, 1);
      g.fillRect(11, y, 3, 1);
    });
    g.fillStyle = body;
    g.fillRect(5, 4, 6, 10);
    g.fillRect(4, 6, 8, 6);
    g.fillStyle = dark;
    g.fillRect(8, 5, 1, 9); // separación de las alas
    g.fillStyle = body;
    g.fillRect(6, 1, 4, 3); // cabeza
    g.fillStyle = '#111111';
    g.fillRect(6, 0, 1, 1); // antenas
    g.fillRect(9, 0, 1, 1);
    g.fillStyle = '#f1e6dc';
    g.fillRect(6, 2, 1, 1); // ojos
    g.fillRect(9, 2, 1, 1);
  });
}
const BUG = [bugSprite(0, false), bugSprite(1, false), bugSprite(0, true)];

/* ---------- juego ---------- */
export function mountDebugGame(root) {
  root.innerHTML = `
    <div class="game-screen">
      <canvas class="game-canvas" width="${W}" height="${H}" tabindex="0"
        aria-label="DEBUG.EXE. Hacé click para jugar. Flechas o WASD para moverte, espacio para disparar."></canvas>
      <div class="game-touch" aria-hidden="true">
        <button data-k="left">◀</button><button data-k="forward">▲</button><button data-k="back">▼</button><button data-k="right">▶</button>
        <button data-k="fire" class="game-fire">DEBUG</button>
      </div>
    </div>
    <p class="game-help">Flechas o WASD: moverse · Q/E: de costado · Espacio o click: disparar</p>`;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const buf = new Uint32Array(img.data.buffer);
  const zbuf = new Float32Array(W);
  const held = new Set();

  let game;
  function reset() {
    const bugs = [];
    let px = 1.5;
    let py = 1.5;
    MAP.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === 'B') bugs.push({ x: x + 0.5, y: y + 0.5, hp: 3, hitT: 0, cool: 0, alive: true });
        if (ch === 'P') [px, py] = [x + 0.5, y + 0.5];
      }),
    );
    game = {
      state: 'title', // 'title' | 'play' | 'win' | 'dead'
      x: px,
      y: py,
      dx: 1,
      dy: 0,
      planeX: 0,
      planeY: FOV,
      hp: 100,
      bugs,
      total: bugs.length,
      shotT: 0,
      hurtT: 0,
      t: 0,
      msg: '',
      msgT: 0,
    };
  }
  reset();

  const isWall = (x, y) => {
    const ch = MAP[y | 0]?.[x | 0];
    return ch === '#' || ch === '%' || ch === undefined;
  };

  function rotate(a) {
    const { dx, dy, planeX, planeY } = game;
    game.dx = dx * Math.cos(a) - dy * Math.sin(a);
    game.dy = dx * Math.sin(a) + dy * Math.cos(a);
    game.planeX = planeX * Math.cos(a) - planeY * Math.sin(a);
    game.planeY = planeX * Math.sin(a) + planeY * Math.cos(a);
  }

  /** Mueve con colisión: prueba cada eje por separado para deslizarse por las paredes. */
  function move(obj, mx, my, r = 0.22) {
    if (!isWall(obj.x + mx + Math.sign(mx) * r, obj.y)) obj.x += mx;
    if (!isWall(obj.x, obj.y + my + Math.sign(my) * r)) obj.y += my;
  }

  /** ¿Hay línea de vista entre dos puntos? (pasos cortos sobre la grilla) */
  function sees(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.ceil(d / 0.2);
    for (let i = 1; i < n; i++) {
      if (isWall(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
    }
    return true;
  }

  function fire() {
    if (game.state !== 'play') {
      if (game.state !== 'title') reset();
      game.state = 'play';
      game.msg = `Cazá los ${game.total} bugs antes del deploy`;
      game.msgT = 2.5;
      return;
    }
    if (game.shotT > 0) return;
    game.shotT = 0.35;
    sound.sfx('shot');
    // el disparo sale por la columna central: gana el bug más cercano que la cubra
    let target = null;
    let best = zbuf[W >> 1];
    for (const b of game.bugs) {
      if (!b.alive || b.screenX === undefined) continue;
      if (Math.abs(b.screenX - W / 2) < b.screenW * 0.45 && b.depth < best) {
        best = b.depth;
        target = b;
      }
    }
    if (target) {
      target.hp--;
      target.hitT = 0.15;
      if (target.hp <= 0) {
        target.alive = false;
        sound.sfx('bugdie');
        const left = game.bugs.filter((b) => b.alive).length;
        game.msg = left ? `Bug resuelto. Quedan ${left}` : '';
        game.msgT = 1.4;
        if (!left) {
          game.state = 'win';
          sound.sfx('win');
        }
      } else sound.sfx('bughit');
    }
  }

  function update(dt) {
    game.t += dt;
    game.shotT = Math.max(0, game.shotT - dt);
    game.hurtT = Math.max(0, game.hurtT - dt);
    game.msgT = Math.max(0, game.msgT - dt);
    if (game.state !== 'play') return;
    const on = (k) => KEYS[k].some((c) => held.has(c));
    const sp = 2.6 * dt;
    const rs = 2.4 * dt;
    if (on('forward')) move(game, game.dx * sp, game.dy * sp);
    if (on('back')) move(game, -game.dx * sp, -game.dy * sp);
    if (on('strafeL')) move(game, game.dy * sp, -game.dx * sp);
    if (on('strafeR')) move(game, -game.dy * sp, game.dx * sp);
    if (on('left')) rotate(-rs);
    if (on('right')) rotate(rs);
    if (on('fire')) fire();

    for (const b of game.bugs) {
      if (!b.alive) continue;
      b.hitT = Math.max(0, b.hitT - dt);
      b.cool = Math.max(0, b.cool - dt);
      const vx = game.x - b.x;
      const vy = game.y - b.y;
      const d = Math.hypot(vx, vy);
      if (d < 0.65) {
        if (b.cool === 0) {
          b.cool = 0.9;
          game.hp -= 12;
          game.hurtT = 0.25;
          sound.sfx('hurt');
          if (game.hp <= 0) {
            game.hp = 0;
            game.state = 'dead';
          }
        }
      } else if (d < 9 && sees(b.x, b.y, game.x, game.y)) {
        move(b, (vx / d) * 1.1 * dt, (vy / d) * 1.1 * dt, 0.25);
      }
    }
  }

  /* ---------- dibujo ---------- */
  function render() {
    // techo y piso con niebla hacia el horizonte
    for (let y = 0; y < VIEW_H; y++) {
      const t = Math.abs(y - VIEW_H / 2) / (VIEW_H / 2);
      const c = y < VIEW_H / 2 ? shade(0xff1a1714, t) : shade(0xff2a2f25, t);
      buf.fill(c, y * W, y * W + W);
    }
    // paredes
    for (let x = 0; x < W; x++) {
      const cam = (2 * x) / W - 1;
      const rx = game.dx + game.planeX * cam;
      const ry = game.dy + game.planeY * cam;
      let mx = game.x | 0;
      let my = game.y | 0;
      const ddx = Math.abs(1 / rx);
      const ddy = Math.abs(1 / ry);
      const stepX = rx < 0 ? -1 : 1;
      const stepY = ry < 0 ? -1 : 1;
      let sx = rx < 0 ? (game.x - mx) * ddx : (mx + 1 - game.x) * ddx;
      let sy = ry < 0 ? (game.y - my) * ddy : (my + 1 - game.y) * ddy;
      let side = 0;
      let ch = '';
      for (let i = 0; i < 64; i++) {
        if (sx < sy) {
          sx += ddx;
          mx += stepX;
          side = 0;
        } else {
          sy += ddy;
          my += stepY;
          side = 1;
        }
        ch = MAP[my]?.[mx];
        if (ch === '#' || ch === '%' || ch === undefined) break;
      }
      const dist = side ? sy - ddy : sx - ddx;
      zbuf[x] = dist;
      const lineH = (VIEW_H / dist) | 0;
      const y0 = Math.max(0, (VIEW_H - lineH) >> 1);
      const y1 = Math.min(VIEW_H, (VIEW_H + lineH) >> 1);
      let wallX = side ? game.x + dist * rx : game.y + dist * ry;
      wallX -= Math.floor(wallX);
      let tx = (wallX * 32) | 0;
      if ((side === 0 && rx > 0) || (side === 1 && ry < 0)) tx = 31 - tx;
      const tex = TEX[ch] || TEX['#'];
      const fog = Math.min(1, dist / 9) * 0.85 + (side ? 0.15 : 0);
      for (let y = y0; y < y1; y++) {
        const ty = ((((y - (VIEW_H - lineH) / 2) * 32) / lineH) | 0) & 31;
        buf[y * W + x] = shade(tex[ty * 32 + tx], 1 - fog);
      }
    }
    drawBugs();
    ctx.putImageData(img, 0, 0);
    drawWeapon();
    drawHud();
  }

  /** Oscurece un color ABGR (k = 1 sin cambio, 0 negro). */
  function shade(c, k) {
    k = Math.max(0.08, Math.min(1, k));
    const r = (c & 0xff) * k;
    const g = ((c >> 8) & 0xff) * k;
    const b = ((c >> 16) & 0xff) * k;
    return 0xff000000 | (b << 16) | (g << 8) | r;
  }

  function drawBugs() {
    const inv = 1 / (game.planeX * game.dy - game.dx * game.planeY);
    const list = game.bugs
      .filter((b) => b.alive)
      .map((b) => {
        const rx = b.x - game.x;
        const ry = b.y - game.y;
        b.tx = inv * (game.dy * rx - game.dx * ry);
        b.depth = inv * (-game.planeY * rx + game.planeX * ry);
        return b;
      })
      .sort((a, b) => b.depth - a.depth);
    for (const b of game.bugs) b.screenX = undefined;
    for (const b of list) {
      if (b.depth <= 0.1) continue;
      const size = Math.abs(VIEW_H / b.depth) * 0.7;
      const cx = (W / 2) * (1 + b.tx / b.depth);
      b.screenX = cx;
      b.screenW = size;
      const bob = Math.sin(game.t * 9 + b.x) * size * 0.03;
      const top = VIEW_H / 2 - size / 2 + size * 0.28 + bob;
      const spr = BUG[b.hitT > 0 ? 2 : ((game.t * 6) | 0) % 2];
      const k = 1 - Math.min(1, b.depth / 9) * 0.8;
      for (let sxp = Math.max(0, (cx - size / 2) | 0); sxp < Math.min(W, cx + size / 2); sxp++) {
        if (b.depth >= zbuf[sxp]) continue;
        const u = (((sxp - (cx - size / 2)) / size) * 16) | 0;
        for (let syp = Math.max(0, top | 0); syp < Math.min(VIEW_H, top + size); syp++) {
          const v = (((syp - top) / size) * 16) | 0;
          const c = spr[v * 16 + u];
          if (c >>> 24) buf[syp * W + sxp] = shade(c, k);
        }
      }
    }
  }

  function drawWeapon() {
    // el "depurador": una pistola de pixeles con lente verde
    const kick = game.shotT > 0.25 ? 6 : 0;
    const bob = game.state === 'play' ? Math.sin(game.t * 6) * 2 : 0;
    const x = W / 2 - 14;
    const y = VIEW_H - 34 + kick + bob;
    ctx.fillStyle = '#3d444c';
    ctx.fillRect(x + 6, y + 10, 16, 24);
    ctx.fillStyle = '#2b3036';
    ctx.fillRect(x, y + 18, 28, 16);
    ctx.fillStyle = '#95d68a';
    ctx.fillRect(x + 10, y + 4, 8, 8);
    ctx.fillStyle = '#d4ccb4';
    ctx.fillRect(x + 12, y + 6, 2, 2);
    if (game.shotT > 0.25) {
      ctx.fillStyle = '#d8ffb0';
      ctx.fillRect(x + 8, y - 8, 12, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 11, y - 5, 6, 5);
    }
    // mira
    ctx.fillStyle = 'rgba(241,230,220,.7)';
    ctx.fillRect(W / 2 - 3, VIEW_H / 2, 2, 1);
    ctx.fillRect(W / 2 + 2, VIEW_H / 2, 2, 1);
    ctx.fillRect(W / 2, VIEW_H / 2 - 3, 1, 2);
    ctx.fillRect(W / 2, VIEW_H / 2 + 2, 1, 2);
    if (game.hurtT > 0) {
      ctx.fillStyle = `rgba(158,20,28,${game.hurtT * 1.6})`;
      ctx.fillRect(0, 0, W, VIEW_H);
    }
  }

  function text(s, x, y, size, color, align = 'center') {
    ctx.font = `${size}px VT323, monospace`;
    ctx.textAlign = align;
    ctx.fillStyle = '#000';
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  function drawHud() {
    ctx.fillStyle = '#0b0d0b';
    ctx.fillRect(0, VIEW_H, W, H - VIEW_H);
    ctx.fillStyle = '#3d6a3a';
    ctx.fillRect(0, VIEW_H, W, 1);
    const left = game.bugs.filter((b) => b.alive).length;
    text(`SALUD ${game.hp}%`, 8, H - 11, 13, game.hp > 30 ? '#95d68a' : '#d12b2b', 'left');
    text(`BUGS ${left}/${game.total}`, W / 2, H - 11, 13, '#d4ccb4');
    text('DEBUG.EXE', W - 8, H - 11, 13, '#3d6a3a', 'right');
    if (game.msgT > 0 && game.msg) text(game.msg, W / 2, 18, 12, '#f1e6dc');

    const overlay = (title, sub) => {
      ctx.fillStyle = 'rgba(5,12,6,.72)';
      ctx.fillRect(0, 0, W, VIEW_H);
      text(title, W / 2, 70, 24, '#95d68a');
      text(sub, W / 2, 94, 12, '#d4ccb4');
      text(
        '[ click o espacio para ' + (game.state === 'title' ? 'empezar' : 'jugar de nuevo') + ' ]',
        W / 2,
        122,
        11,
        '#8b8670',
      );
    };
    if (game.state === 'title')
      overlay('DEBUG.EXE', `${game.total} bugs sueltos en los servidores`);
    if (game.state === 'win') overlay('BUILD PASSING', 'Cero bugs. Ya se puede hacer el deploy.');
    if (game.state === 'dead') overlay('SEGMENTATION FAULT', 'Los bugs ganaron esta vez.');
  }

  /* ---------- controles ---------- */
  const allKeys = new Set(Object.values(KEYS).flat());
  const onKey = (e) => {
    if (!allKeys.has(e.code) && e.code !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'keydown') {
      if (e.code === 'Enter' || (game.state !== 'play' && KEYS.fire.includes(e.code))) {
        if (!e.repeat) fire();
        return;
      }
      // un toque corto dispara en el momento; mantener apretado sigue disparando
      if (KEYS.fire.includes(e.code) && !e.repeat) fire();
      held.add(e.code);
    } else held.delete(e.code);
  };
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('keyup', onKey);
  canvas.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', (e) => {
    canvas.focus({ preventScroll: true });
    if (e.button === 0) fire();
  });
  // botones táctiles: mantener apretado = tecla apretada
  root.querySelectorAll('.game-touch [data-k]').forEach((btn) => {
    const code = KEYS[btn.dataset.k][0];
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (btn.dataset.k === 'fire' || game.state !== 'play') fire();
      else held.add(code);
    });
    const up = () => held.delete(code);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  });

  /* ---------- bucle: se apaga solo cuando la ventana se cierra ---------- */
  let last = performance.now();
  let raf = 0;
  function frame(now) {
    if (!canvas.isConnected) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (canvas.offsetParent === null) return; // ventana minimizada
    update(dt);
    render();
  }
  raf = requestAnimationFrame(frame);
  setTimeout(() => canvas.focus({ preventScroll: true }), 60);
  // para las pruebas automáticas (tools/smoke.py): acceso al estado del juego
  canvas.gameState = () => game;

  return () => {
    cancelAnimationFrame(raf);
    held.clear();
  };
}
