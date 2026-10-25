/**
 * DEBUG.EXE: juego en primera persona dentro de PORTFOLIO-DOS.
 * Cuatro niveles de servidores llenos de bugs, glitches que disparan, tanques
 * (memory leaks) y un jefe final, el KERNEL PANIC. El arma es una escopeta de
 * bombeo: cada tiro tira 7 perdigones y después hay que recargar.
 *
 * Cómo dibuja: es un raycaster como los de los 90. Por cada columna de la
 * pantalla se lanza un rayo, se busca la primera pared con DDA y se pinta una
 * franja de textura cuya altura depende de la distancia. Enemigos, objetos y
 * proyectiles son sprites que miran siempre a la cámara, recortados con el
 * z-buffer de las paredes.
 *
 * Archivos: levels.js (mapas), enemies.js (tipos y movimiento), art.js (gráficos).
 * Uso: const stop = mountDebugGame(contenedor);
 */
import { sound } from '../../../audio/sound.js';
import { LEVELS, WALLS, ENEMY_CHARS } from './levels.js';
import { ENEMY_TYPES, flowField, updateEnemy, separate } from './enemies.js';
import { WALL_TEX, ENEMY_ART, ITEM_ART, drawShotgun, RELOAD_TIME } from './art.js';

const W = 320;
const H = 200;
const VIEW_H = 168; // abajo queda la barra de estado
const FOV = 0.66; // largo del plano de cámara (≈ 66°)
const PELLETS = 7;
const SPREAD = 0.085; // radianes a cada lado

const KEYS = {
  forward: ['KeyW', 'ArrowUp'],
  back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  strafeL: ['KeyQ'],
  strafeR: ['KeyE'],
  fire: ['Space', 'ControlLeft', 'ControlRight'],
  map: ['KeyM', 'Tab'],
};

export function mountDebugGame(root) {
  root.innerHTML = `
    <div class="game-screen">
      <canvas class="game-canvas" width="${W}" height="${H}" tabindex="0"
        aria-label="DEBUG.EXE. Hacé click para jugar. Flechas o WASD para moverte, espacio para disparar, M para el mapa."></canvas>
      <div class="game-touch" aria-hidden="true">
        <button data-k="left">◀</button><button data-k="forward">▲</button><button data-k="back">▼</button><button data-k="right">▶</button>
        <button data-k="map">MAPA</button><button data-k="fire" class="game-fire">FUEGO</button>
      </div>
    </div>
    <p class="game-help">Flechas o WASD: moverse · Q/E: de costado · Espacio o click: disparar · M: mapa</p>`;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const buf = new Uint32Array(img.data.buffer);
  const zbuf = new Float32Array(W);
  const held = new Set();

  /* ---------- estado ---------- */
  const game = {
    state: 'title', // title | intro | play | clear | dead | win
    stateT: 0,
    level: 0,
    t: 0,
    msg: '',
    msgT: 0,
    showMap: false,
    player: null,
    enemies: [],
    items: [],
    bolts: [],
    map: [],
    mapW: 0,
    mapH: 0,
    field: null,
    fieldCell: -1,
    total: 0,
  };

  function loadLevel(i, keepHp) {
    const L = LEVELS[i];
    const hp = keepHp && game.player ? Math.max(game.player.hp, 60) : 100;
    game.level = i;
    game.map = L.map;
    game.mapW = L.map[0].length;
    game.mapH = L.map.length;
    game.enemies = [];
    game.items = [];
    game.bolts = [];
    game.player = {
      x: 1.5,
      y: 1.5,
      dx: 1,
      dy: 0,
      planeX: 0,
      planeY: FOV,
      hp,
      shotT: Infinity,
      hurtT: 0,
    };
    L.map.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const type = ENEMY_CHARS[ch];
        if (type) {
          const T = ENEMY_TYPES[type];
          game.enemies.push({
            type,
            x: x + 0.5,
            y: y + 0.5,
            hp: T.hp,
            max: T.hp,
            hitT: 0,
            cool: 0,
            shootT: 1 + Math.random(),
            awake: false,
          });
        }
        if (ch === '+') game.items.push({ kind: 'health', x: x + 0.5, y: y + 0.5 });
        if (ch === 'P') Object.assign(game.player, { x: x + 0.5, y: y + 0.5 });
      }),
    );
    game.total = game.enemies.length;
    game.fieldCell = -1;
    setState('intro');
  }

  function setState(s) {
    game.state = s;
    game.stateT = 0;
  }

  const isWall = (x, y) => {
    const ch = game.map[y | 0]?.[x | 0];
    return ch === undefined || WALLS.includes(ch);
  };

  /** Mueve con colisión: prueba cada eje por separado para deslizarse por las paredes. */
  function move(obj, mx, my, r = 0.22) {
    if (!isWall(obj.x + mx + Math.sign(mx) * r, obj.y)) obj.x += mx;
    if (!isWall(obj.x, obj.y + my + Math.sign(my) * r)) obj.y += my;
  }

  /** ¿Hay línea de vista entre dos puntos? */
  function sees(ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay);
    const n = Math.ceil(d / 0.2);
    for (let i = 1; i < n; i++)
      if (isWall(ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n)) return false;
    return true;
  }

  function rotate(a) {
    const p = game.player;
    const c = Math.cos(a);
    const s = Math.sin(a);
    [p.dx, p.dy] = [p.dx * c - p.dy * s, p.dx * s + p.dy * c];
    [p.planeX, p.planeY] = [p.planeX * c - p.planeY * s, p.planeX * s + p.planeY * c];
  }

  function say(msg, t = 1.6) {
    game.msg = msg;
    game.msgT = t;
  }

  function hurt(dmg) {
    const p = game.player;
    if (game.state !== 'play') return;
    p.hp = Math.max(0, p.hp - dmg);
    p.hurtT = 0.3;
    sound.sfx('hurt');
    if (p.hp === 0) {
      setState('dead');
      sound.sfx('lose');
    }
  }

  /* ---------- disparos ---------- */
  /** Botón de disparo: arranca/continúa en las pantallas de texto, dispara en el juego. */
  function press() {
    if (game.state === 'title' || game.state === 'win') return loadLevel(0);
    if (game.state === 'dead') return loadLevel(game.level);
    if (game.state === 'intro' && game.stateT > 0.4) return setState('play');
    if (game.state === 'clear' && game.stateT > 0.8) return nextLevel();
    if (game.state === 'play') shoot();
  }

  function shoot() {
    const p = game.player;
    if (p.shotT < RELOAD_TIME) return; // todavía bombeando
    p.shotT = 0;
    sound.sfx('shotgun');
    const hits = new Map();
    for (let i = 0; i < PELLETS; i++) {
      const a = (i / (PELLETS - 1) - 0.5) * 2 * SPREAD + (Math.random() - 0.5) * 0.02;
      const col = Math.round((W / 2) * (1 + Math.tan(a) / FOV));
      if (col < 0 || col >= W) continue;
      // gana el enemigo más cercano que cubra esa columna y esté delante de la pared
      let target = null;
      let best = zbuf[col];
      for (const e of game.enemies) {
        if (e.screenX === undefined) continue;
        if (Math.abs(e.screenX - col) < e.screenW * 0.42 && e.depth < best) {
          best = e.depth;
          target = e;
        }
      }
      if (target) hits.set(target, (hits.get(target) || 0) + (target.depth < 2.5 ? 2 : 1));
    }
    for (const [e, dmg] of hits) {
      e.hp -= dmg;
      e.hitT = 0.14;
      e.awake = true;
      if (e.hp <= 0) kill(e);
      else sound.sfx('bughit');
    }
  }

  function kill(e) {
    const T = ENEMY_TYPES[e.type];
    game.enemies = game.enemies.filter((o) => o !== e);
    game.items.push({ kind: 'shell', x: e.x, y: e.y, life: 0.35 }); // explosión
    if (T.drop) game.items.push({ kind: T.drop, x: e.x, y: e.y });
    sound.sfx(e.type === 'boss' ? 'win' : 'bugdie');
    const left = game.enemies.length;
    if (!left) {
      setState('clear');
      sound.sfx('win');
    } else if (e.type === 'boss') say('KERNEL PANIC resuelto');
    else if (left <= 2) say(`Quedan ${left}. Te vienen a buscar (M: mapa)`, 2.4);
    else say(`${T.label} resuelto. Quedan ${left}`);
  }

  function nextLevel() {
    if (game.level + 1 < LEVELS.length) loadLevel(game.level + 1, true);
    else {
      setState('win');
      sound.sfx('win');
    }
  }

  /* ---------- lógica por cuadro ---------- */
  function update(dt) {
    game.t += dt;
    game.stateT += dt;
    game.msgT = Math.max(0, game.msgT - dt);
    const p = game.player;
    if (game.state === 'intro' && game.stateT > 2.4) setState('play');
    if (game.state !== 'play') return;

    p.shotT += dt;
    p.hurtT = Math.max(0, p.hurtT - dt);
    const on = (k) => KEYS[k].some((c) => held.has(c));
    const sp = 2.7 * dt;
    const rs = 2.5 * dt;
    if (on('forward')) move(p, p.dx * sp, p.dy * sp);
    if (on('back')) move(p, -p.dx * sp, -p.dy * sp);
    if (on('strafeL')) move(p, p.dy * sp, -p.dx * sp);
    if (on('strafeR')) move(p, -p.dy * sp, p.dx * sp);
    if (on('left')) rotate(-rs);
    if (on('right')) rotate(rs);
    if (on('fire')) shoot();

    // mapa de distancias: se recalcula cuando el jugador cambia de celda
    const cell = (p.y | 0) * game.mapW + (p.x | 0);
    if (cell !== game.fieldCell) {
      game.field = flowField(isWall, game.mapW, game.mapH, p.x, p.y);
      game.fieldCell = cell;
    }
    const world = {
      player: p,
      isWall,
      sees,
      move,
      field: game.field,
      mapW: game.mapW,
      hunt: game.enemies.length <= 3,
      hurt,
      shoot: (e, a, s) =>
        game.bolts.push({
          x: e.x + Math.cos(a) * 0.4,
          y: e.y + Math.sin(a) * 0.4,
          vx: Math.cos(a) * s.speed,
          vy: Math.sin(a) * s.speed,
          dmg: s.dmg,
          big: e.type !== 'glitch',
        }),
    };
    for (const e of game.enemies) updateEnemy(e, dt, world);
    separate(game.enemies, move);

    // proyectiles enemigos
    game.bolts = game.bolts.filter((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (isWall(b.x, b.y)) return false;
      if (Math.hypot(b.x - p.x, b.y - p.y) < 0.35) {
        hurt(b.dmg);
        return false;
      }
      return true;
    });

    // objetos: parches de salud y explosiones
    game.items = game.items.filter((it) => {
      if (it.life !== undefined) return (it.life -= dt) > 0;
      if (it.kind === 'health' && p.hp < 100 && Math.hypot(it.x - p.x, it.y - p.y) < 0.5) {
        p.hp = Math.min(100, p.hp + 25);
        sound.sfx('pickup');
        say('Parche aplicado: +25 de salud');
        return false;
      }
      return true;
    });
  }

  /* ---------- dibujo ---------- */
  /** Oscurece un color ABGR (k = 1 sin cambio, 0 negro). */
  function shade(c, k) {
    k = k < 0.08 ? 0.08 : k > 1 ? 1 : k;
    return (
      0xff000000 |
      ((((c >> 16) & 0xff) * k) << 16) |
      ((((c >> 8) & 0xff) * k) << 8) |
      ((c & 0xff) * k)
    );
  }

  function render() {
    const p = game.player;
    // techo y piso con niebla hacia el horizonte (el tono cambia por nivel)
    const ceil = [0xff1a1714, 0xff241a12, 0xff12141a, 0xff100c1a][game.level];
    const floor = [0xff2a2f25, 0xff3a2f22, 0xff22262f, 0xff1c1630][game.level];
    for (let y = 0; y < VIEW_H; y++) {
      const t = Math.abs(y - VIEW_H / 2) / (VIEW_H / 2);
      buf.fill(shade(y < VIEW_H / 2 ? ceil : floor, t), y * W, y * W + W);
    }
    // paredes
    for (let x = 0; x < W; x++) {
      const cam = (2 * x) / W - 1;
      const rx = p.dx + p.planeX * cam;
      const ry = p.dy + p.planeY * cam;
      let mx = p.x | 0;
      let my = p.y | 0;
      const ddx = Math.abs(1 / rx);
      const ddy = Math.abs(1 / ry);
      const stepX = rx < 0 ? -1 : 1;
      const stepY = ry < 0 ? -1 : 1;
      let sx = rx < 0 ? (p.x - mx) * ddx : (mx + 1 - p.x) * ddx;
      let sy = ry < 0 ? (p.y - my) * ddy : (my + 1 - p.y) * ddy;
      let side = 0;
      let ch = '#';
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
        ch = game.map[my]?.[mx];
        if (ch === undefined || WALLS.includes(ch)) break;
      }
      const dist = side ? sy - ddy : sx - ddx;
      zbuf[x] = dist;
      const lineH = VIEW_H / dist;
      const y0 = Math.max(0, ((VIEW_H - lineH) / 2) | 0);
      const y1 = Math.min(VIEW_H, ((VIEW_H + lineH) / 2) | 0);
      let wallX = side ? p.x + dist * rx : p.y + dist * ry;
      wallX -= Math.floor(wallX);
      let tx = (wallX * 32) | 0;
      if ((side === 0 && rx > 0) || (side === 1 && ry < 0)) tx = 31 - tx;
      const tex = (WALL_TEX[ch] || WALL_TEX['#']).data;
      const k = 1 - (Math.min(1, dist / 10) * 0.85 + (side ? 0.12 : 0));
      for (let y = y0; y < y1; y++) {
        const ty = ((((y - (VIEW_H - lineH) / 2) * 32) / lineH) | 0) & 31;
        buf[y * W + x] = shade(tex[ty * 32 + tx], k);
      }
    }
    drawSprites();
    ctx.putImageData(img, 0, 0);
    if (game.state === 'play' || game.state === 'dead') {
      drawShotgun(
        ctx,
        W,
        VIEW_H,
        game.player.shotT,
        game.state === 'play' && isWalking() ? Math.abs(Math.sin(game.t * 7)) * 3 : 0,
      );
      drawCrosshair();
    }
    if (p.hurtT > 0) {
      ctx.fillStyle = `rgba(158,20,28,${p.hurtT * 1.4})`;
      ctx.fillRect(0, 0, W, VIEW_H);
    }
    if (game.showMap && game.state === 'play') drawAutomap();
    drawHud();
  }

  const isWalking = () =>
    ['forward', 'back', 'strafeL', 'strafeR'].some((k) => KEYS[k].some((c) => held.has(c)));

  /** Proyecta y dibuja todos los sprites, del más lejano al más cercano. */
  function drawSprites() {
    const p = game.player;
    const inv = 1 / (p.planeX * p.dy - p.dx * p.planeY);
    const list = [];
    for (const e of game.enemies) {
      const T = ENEMY_TYPES[e.type];
      const art = ENEMY_ART[e.type];
      e.screenX = undefined;
      list.push({
        obj: e,
        x: e.x,
        y: e.y,
        spr: art[e.hitT > 0 ? 2 : ((game.t * (e.awake ? 7 : 2)) | 0) % 2],
        scale: T.scale,
        lift: T.lift + (e.type === 'glitch' ? Math.sin(game.t * 3 + e.x) * 0.04 : 0),
      });
    }
    for (const it of game.items)
      list.push({
        x: it.x,
        y: it.y,
        spr: ITEM_ART[it.kind],
        scale: it.kind === 'shell' ? 0.5 : 0.3,
        lift: it.kind === 'shell' ? 0.15 : 0,
      });
    for (const b of game.bolts)
      list.push({ x: b.x, y: b.y, spr: ITEM_ART.bolt, scale: b.big ? 0.3 : 0.2, lift: 0.32 });

    for (const s of list) {
      const rx = s.x - p.x;
      const ry = s.y - p.y;
      s.tx = inv * (p.dy * rx - p.dx * ry);
      s.depth = inv * (-p.planeY * rx + p.planeX * ry);
    }
    list.sort((a, b) => b.depth - a.depth);
    for (const s of list) {
      if (s.depth <= 0.15) continue;
      const unit = VIEW_H / s.depth; // alto de una pared a esa distancia
      const size = unit * s.scale;
      const cx = (W / 2) * (1 + s.tx / s.depth);
      const bottom = VIEW_H / 2 + unit / 2 - s.lift * unit;
      const top = bottom - size;
      if (s.obj) {
        s.obj.screenX = cx;
        s.obj.screenW = size;
        s.obj.depth = s.depth;
      }
      const n = s.spr.size;
      const data = s.spr.data;
      const k = 1 - Math.min(1, s.depth / 10) * 0.8;
      const x0 = Math.max(0, (cx - size / 2) | 0);
      const x1 = Math.min(W, cx + size / 2);
      const yA = Math.max(0, top | 0);
      const yB = Math.min(VIEW_H, bottom);
      for (let sx = x0; sx < x1; sx++) {
        if (s.depth >= zbuf[sx]) continue;
        const u = (((sx - (cx - size / 2)) / size) * n) | 0;
        for (let sy = yA; sy < yB; sy++) {
          const c = data[((((sy - top) / size) * n) | 0) * n + u];
          if (c >>> 24) buf[sy * W + sx] = shade(c, k);
        }
      }
    }
  }

  function drawCrosshair() {
    ctx.fillStyle = 'rgba(241,230,220,.75)';
    const c = W / 2;
    const m = VIEW_H / 2;
    ctx.fillRect(c - 5, m, 3, 1);
    ctx.fillRect(c + 3, m, 3, 1);
    ctx.fillRect(c, m - 5, 1, 3);
    ctx.fillRect(c, m + 3, 1, 3);
  }

  function drawAutomap() {
    const s = Math.floor(Math.min((W - 24) / game.mapW, (VIEW_H - 24) / game.mapH));
    const ox = (W - s * game.mapW) >> 1;
    const oy = (VIEW_H - s * game.mapH) >> 1;
    ctx.fillStyle = 'rgba(5,12,6,.85)';
    ctx.fillRect(ox - 4, oy - 4, s * game.mapW + 8, s * game.mapH + 8);
    game.map.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (WALLS.includes(ch)) {
          ctx.fillStyle = '#3d6a3a';
          ctx.fillRect(ox + x * s, oy + y * s, s, s);
        }
      }),
    );
    for (const it of game.items) {
      if (it.kind !== 'health') continue;
      ctx.fillStyle = '#d4ccb4';
      ctx.fillRect(ox + it.x * s - 1, oy + it.y * s - 1, 3, 3);
    }
    for (const e of game.enemies) {
      ctx.fillStyle = e.type === 'boss' ? '#ffcf4a' : '#d12b2b';
      const r = e.type === 'tank' || e.type === 'boss' ? 4 : 3;
      ctx.fillRect(ox + e.x * s - r / 2, oy + e.y * s - r / 2, r, r);
    }
    const p = game.player;
    ctx.fillStyle = '#95d68a';
    ctx.fillRect(ox + p.x * s - 2, oy + p.y * s - 2, 4, 4);
    ctx.strokeStyle = '#95d68a';
    ctx.beginPath();
    ctx.moveTo(ox + p.x * s, oy + p.y * s);
    ctx.lineTo(ox + (p.x + p.dx * 1.2) * s, oy + (p.y + p.dy * 1.2) * s);
    ctx.stroke();
  }

  function text(str, x, y, size, color, align = 'center') {
    ctx.font = `${size}px VT323, monospace`;
    ctx.textAlign = align;
    ctx.fillStyle = '#000';
    ctx.fillText(str, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function drawHud() {
    const p = game.player;
    ctx.fillStyle = '#0b0d0b';
    ctx.fillRect(0, VIEW_H, W, H - VIEW_H);
    ctx.fillStyle = '#3d6a3a';
    ctx.fillRect(0, VIEW_H, W, 1);
    if (p) {
      text(`SALUD ${p.hp}%`, 8, H - 11, 13, p.hp > 30 ? '#95d68a' : '#d12b2b', 'left');
      text(`ENEMIGOS ${game.enemies.length}/${game.total}`, W / 2, H - 11, 13, '#d4ccb4');
      text(`NIVEL ${game.level + 1}/${LEVELS.length}`, W - 8, H - 11, 13, '#8b8670', 'right');
      // barra de vida del jefe
      const boss = game.enemies.find((e) => e.type === 'boss' && e.awake);
      if (boss && game.state === 'play') {
        ctx.fillStyle = '#2a0a0c';
        ctx.fillRect(60, 6, W - 120, 5);
        ctx.fillStyle = '#ffcf4a';
        ctx.fillRect(60, 6, ((W - 120) * boss.hp) / boss.max, 5);
        text('KERNEL PANIC', W / 2, 22, 11, '#ffcf4a');
      }
    }
    if (game.msgT > 0 && game.msg && game.state === 'play')
      text(
        game.msg,
        W / 2,
        game.enemies.some((e) => e.type === 'boss' && e.awake) ? 36 : 18,
        12,
        '#f1e6dc',
      );

    const panel = (title, sub, hint) => {
      ctx.fillStyle = 'rgba(5,12,6,.78)';
      ctx.fillRect(0, 0, W, VIEW_H);
      text(title, W / 2, 68, 24, '#95d68a');
      text(sub, W / 2, 92, 12, '#d4ccb4');
      if (hint) text(hint, W / 2, 122, 11, '#8b8670');
    };
    const L = LEVELS[game.level];
    if (game.state === 'title')
      panel(
        'DEBUG.EXE',
        '4 niveles de bugs, glitches y memory leaks',
        '[ click o espacio para empezar ]',
      );
    if (game.state === 'intro')
      panel(`NIVEL ${game.level + 1}: ${L.name}`, L.intro, '[ click para arrancar ]');
    if (game.state === 'clear')
      panel(
        'NIVEL COMPLETO',
        game.level + 1 < LEVELS.length
          ? 'Tests en verde. Siguiente nivel...'
          : 'Último nivel limpio.',
        '[ click para seguir ]',
      );
    if (game.state === 'dead')
      panel(
        'SEGMENTATION FAULT',
        `Caíste en el nivel ${game.level + 1}: ${L.name}`,
        '[ click para reintentar el nivel ]',
      );
    if (game.state === 'win')
      panel('BUILD PASSING', 'Cero bugs. Deploy completo.', '[ click para jugar de nuevo ]');
  }

  /* ---------- controles ---------- */
  const allKeys = new Set(Object.values(KEYS).flat());
  const onKey = (e) => {
    if (!allKeys.has(e.code) && e.code !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'keydown') {
      if (KEYS.map.includes(e.code)) {
        if (!e.repeat) game.showMap = !game.showMap;
        return;
      }
      if (e.code === 'Enter' || KEYS.fire.includes(e.code)) {
        if (!e.repeat) press(); // un toque dispara en el momento; mantener sigue disparando
        if (e.code === 'Enter') return;
      }
      held.add(e.code);
    } else held.delete(e.code);
  };
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('keyup', onKey);
  canvas.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', (e) => {
    canvas.focus({ preventScroll: true });
    if (e.button === 0) press();
  });
  root.querySelectorAll('.game-touch [data-k]').forEach((btn) => {
    const k = btn.dataset.k;
    const code = KEYS[k][0];
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (k === 'map') game.showMap = !game.showMap;
      else if (k === 'fire' || game.state !== 'play') press();
      else held.add(code);
    });
    const up = () => held.delete(code);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  });

  /* ---------- bucle: se apaga solo cuando la ventana se cierra ---------- */
  loadLevel(0);
  setState('title');
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
  // para las pruebas automáticas (tools/smoke.py): acceso al estado y a los controles
  canvas.gameState = () => game;
  canvas.gameControl = { loadLevel, setState, press, kill };

  return () => {
    cancelAnimationFrame(raf);
    held.clear();
  };
}
