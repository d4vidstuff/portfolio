/**
 * Niveles de DEBUG.EXE.
 *
 * Paredes:  # rack de servidores   % ladrillo   = chapa azul
 * Cosas:    P jugador   + parche de salud
 * Enemigos: b bug   g glitch (dispara)   t memory leak (tanque)   K kernel panic (jefe)
 *
 * Todas las celdas libres tienen que poder alcanzarse desde P (lo verifica tools/smoke.py).
 */
export const LEVELS = [
  {
    name: 'SERVIDORES',
    intro: 'Cazá los bugs antes del deploy',
    map: [
      '################',
      '#P....#........#',
      '#.##..#..%%%.b.#',
      '#.#b.....%.....#',
      '#.#..##..%..##.#',
      '#....#b.....+.b#',
      '###..#...###...#',
      '#....%...#b....#',
      '#.%%%%...#..%%.#',
      '#.....b..#..%b.#',
      '#..##........%.#',
      '#..#b...##..+..#',
      '################',
    ],
  },
  {
    name: 'LA RED',
    intro: 'Cuidado: los glitches disparan',
    map: [
      '==================',
      '=P.....=.....g...=',
      '=.===..=..====...=',
      '=.=b...=..=..b...=',
      '=.=..+.......=====',
      '=...====..g.....+=',
      '===....=..===....=',
      '=.b....=....=..b.=',
      '=..===.====.=..===',
      '=..=g.......=....=',
      '=..=....b...g..b.=',
      '==================',
    ],
  },
  {
    name: 'EL TALLER',
    intro: 'Llegaron los tanques: memory leaks',
    map: [
      '%%%%%%%%%%%%%%%%%%%%',
      '%P.....%.....%.....%',
      '%......%..g..%..t..%',
      '%..%%..%.....%.....%',
      '%..%+.....b......+.%',
      '%..%%%%%%..%%%%%%..%',
      '%.....g.......b....%',
      '%..%%%%..%%%%..%%%.%',
      '%..%.t...%..%....%.%',
      '%..%.....%g.%..b.%.%',
      '%.....b.....+......%',
      '%%%%%%%%%%%%%%%%%%%%',
    ],
  },
  {
    name: 'EL KERNEL',
    intro: 'Derrotá al KERNEL PANIC',
    map: [
      '####################',
      '#P..+#.......g.....#',
      '#....#..===...===..#',
      '#..b.#..=.......=..#',
      '#....+..=...K...=..#',
      '##.###..=.......=..#',
      '#....g..===...===..#',
      '#..t...........t...#',
      '#.###..%%%..%%%..+.#',
      '#.b....%.g..g.%..b.#',
      '#......%......%....#',
      '####################',
    ],
  },
];

/** Qué es cada letra del mapa. */
export const WALLS = '#%=';
export const ENEMY_CHARS = { b: 'bug', g: 'glitch', t: 'tank', K: 'boss' };
