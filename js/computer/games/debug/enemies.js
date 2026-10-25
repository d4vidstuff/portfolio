/**
 * Enemigos de DEBUG.EXE: estadísticas de cada tipo y cómo se mueven.
 *
 * Para encontrar al jugador aunque no lo vean, cada enemigo sigue un "mapa de
 * distancias" (flow field): un recorrido en anchura desde la celda del jugador
 * que marca cuántos pasos hay desde cada celda libre. Bajando por ese mapa se
 * llega siempre, doblando las esquinas del laberinto.
 */

/**
 * scale: alto del sprite (1 = alto de una pared)   lift: cuánto flota del piso
 * keep: distancia que intenta mantener (los que disparan)
 * shoot: { every: segundos entre disparos, speed, dmg, spread: proyectiles por disparo }
 */
export const ENEMY_TYPES = {
  bug: { label: 'BUG', hp: 4, speed: 1.3, scale: 0.6, lift: 0, melee: 12 },
  glitch: {
    label: 'GLITCH',
    hp: 5,
    speed: 1.05,
    scale: 0.5,
    lift: 0.28,
    melee: 8,
    keep: 4,
    shoot: { every: 1.8, speed: 4.6, dmg: 9, spread: 1 },
  },
  tank: {
    label: 'MEMORY LEAK',
    hp: 16,
    speed: 0.55,
    scale: 0.9,
    lift: 0,
    melee: 20,
    keep: 2.5,
    shoot: { every: 2.6, speed: 3.3, dmg: 15, spread: 1 },
    drop: 'health',
  },
  boss: {
    label: 'KERNEL PANIC',
    hp: 42,
    speed: 0.62,
    scale: 1.3,
    lift: 0,
    melee: 25,
    keep: 3,
    shoot: { every: 1.5, speed: 3.7, dmg: 12, spread: 3 },
    drop: 'health',
  },
};

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Distancia en pasos desde la celda del jugador a cada celda libre. */
export function flowField(isWall, w, h, px, py) {
  const dist = new Int16Array(w * h).fill(-1);
  const q = [[px | 0, py | 0]];
  dist[(py | 0) * w + (px | 0)] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    const d = dist[y * w + x];
    for (const [dx, dy] of STEPS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || isWall(nx, ny) || dist[ny * w + nx] >= 0)
        continue;
      dist[ny * w + nx] = d + 1;
      q.push([nx, ny]);
    }
  }
  return dist;
}

/**
 * Mueve y hace disparar a un enemigo. world trae lo que necesita del juego:
 * { player, isWall, sees, move, field, mapW, hunt, shoot(e, angle), hurt(dmg) }
 */
export function updateEnemy(e, dt, world) {
  const T = ENEMY_TYPES[e.type];
  const p = world.player;
  e.hitT = Math.max(0, e.hitT - dt);
  e.cool = Math.max(0, e.cool - dt);
  e.shootT = Math.max(0, e.shootT - dt);

  const vx = p.x - e.x;
  const vy = p.y - e.y;
  const d = Math.hypot(vx, vy);
  const visible = d < 12 && world.sees(e.x, e.y, p.x, p.y);
  if (visible || world.hunt) e.awake = true;
  if (!e.awake) return;

  // cuerpo a cuerpo
  if (d < 0.7) {
    if (e.cool === 0) {
      e.cool = 0.9;
      world.hurt(T.melee);
    }
    return;
  }

  // disparo
  if (T.shoot && visible && d < 11 && e.shootT === 0) {
    e.shootT = T.shoot.every * (0.8 + Math.random() * 0.4);
    const a = Math.atan2(vy, vx);
    const n = T.shoot.spread;
    for (let i = 0; i < n; i++) world.shoot(e, a + (i - (n - 1) / 2) * 0.22, T.shoot);
  }

  // hacia dónde ir: directo si lo ve; si no, siguiendo el mapa de distancias
  let tx = p.x;
  let ty = p.y;
  if (!visible) {
    const cx = e.x | 0;
    const cy = e.y | 0;
    let best = world.field[cy * world.mapW + cx];
    for (const [dx, dy] of STEPS) {
      const v = world.field[(cy + dy) * world.mapW + (cx + dx)];
      if (v >= 0 && (best < 0 || v < best)) {
        best = v;
        tx = cx + dx + 0.5;
        ty = cy + dy + 0.5;
      }
    }
  }
  let dirX = tx - e.x;
  let dirY = ty - e.y;
  const len = Math.hypot(dirX, dirY) || 1;
  dirX /= len;
  dirY /= len;
  // los que disparan se quedan a cierta distancia
  if (T.keep && visible) {
    if (d < T.keep - 0.8) {
      dirX = -dirX;
      dirY = -dirY;
    } else if (d < T.keep + 0.8) return;
  }
  world.move(e, dirX * T.speed * dt, dirY * T.speed * dt, 0.28);
}

/** Separa a los enemigos que se pisan, para que no se apilen en un pasillo. */
export function separate(enemies, move) {
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d > 0 && d < 0.55) {
        const push = (0.55 - d) * 0.5;
        move(a, (-dx / d) * push, (-dy / d) * push, 0.25);
        move(b, (dx / d) * push, (dy / d) * push, 0.25);
      }
    }
  }
}
