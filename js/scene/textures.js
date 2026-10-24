/**
 * Todas las texturas, dibujadas a mano con canvas 2D.
 * drawScreen, drawWatch y drawKeys se redibujan mientras corre la escena.
 */
import { THREE } from './three.js';
import { CONTENT } from '../content.js';
import { pad2 } from '../core/dom.js';
import { canvasTexture, rnd, speckle, heart } from './canvas.js';

export const textures = {};
function buildTextures() {
  textures.desk = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = '#cfcabd';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(90,80,60,${rnd(0.08, 0.2)})`;
      g.beginPath();
      const x = rnd(0, w),
        y = rnd(0, h);
      g.moveTo(x, y);
      g.lineTo(x + rnd(-18, 18), y + rnd(-3, 3));
      g.stroke();
    }
    speckle(g, w, h, 500, ['rgba(60,50,30,.25)', 'rgba(255,255,255,.2)']);
  });
  textures.mat = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = '#121313';
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 600, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.5)']);
    g.strokeStyle = '#2b2b2a';
    g.strokeRect(0.5, 0.5, w - 1, h - 1);
    for (let i = 0; i < 8; i++) {
      g.strokeStyle = 'rgba(160,150,130,.08)';
      g.beginPath();
      const x = rnd(0, w),
        y = rnd(0, h);
      g.moveTo(x, y);
      g.lineTo(x + rnd(-20, 20), y + rnd(-6, 6));
      g.stroke();
    }
  });
  textures.wall = canvasTexture(
    128,
    128,
    (g, w, h) => {
      g.fillStyle = '#aaa596';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 34; i++) {
        const x = rnd(0, w),
          y0 = rnd(0, h),
          len = rnd(20, 100);
        const gr = g.createLinearGradient(0, y0, 0, y0 + len);
        gr.addColorStop(0, 'rgba(70,58,36,.18)');
        gr.addColorStop(1, 'rgba(70,58,36,0)');
        g.fillStyle = gr;
        g.fillRect(x, y0, rnd(1, 3), len);
      }
      for (let i = 0; i < 6; i++) {
        g.fillStyle = 'rgba(80,70,50,.08)';
        g.beginPath();
        g.ellipse(rnd(0, w), rnd(0, h), rnd(6, 20), rnd(4, 12), 0, 0, 7);
        g.fill();
      }
      speckle(g, w, h, 1200, ['rgba(40,35,25,.22)', 'rgba(255,255,250,.12)']);
    },
    [5, 3],
  );
  textures.floor = canvasTexture(
    64,
    64,
    (g, w, h) => {
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++) {
          g.fillStyle = (x + y) % 2 ? '#4a4237' : '#554c40';
          g.fillRect(x * 32, y * 32, 32, 32);
        }
      g.fillStyle = '#2a251f';
      g.fillRect(0, 0, 64, 1);
      g.fillRect(0, 32, 64, 1);
      g.fillRect(0, 0, 1, 64);
      g.fillRect(32, 0, 1, 64);
      speckle(g, w, h, 700, ['rgba(0,0,0,.35)', 'rgba(200,190,160,.08)']);
    },
    [12, 12],
  );
  textures.beige = canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = '#a89b7b';
    g.fillRect(0, 0, w, h);
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(40,30,12,.35)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 500, ['rgba(60,50,30,.35)', 'rgba(230,220,190,.18)']);
    for (let i = 0; i < 5; i++) {
      g.fillStyle = 'rgba(50,38,20,.14)';
      g.beginPath();
      g.ellipse(rnd(0, w), rnd(0, h), rnd(3, 9), rnd(2, 5), rnd(0, 3), 0, 7);
      g.fill();
    }
  });
  textures.dark = canvasTexture(32, 32, (g, w, h) => {
    g.fillStyle = '#1a1c1a';
    g.fillRect(0, 0, w, h);
    speckle(g, w, h, 160, ['rgba(255,255,255,.05)', 'rgba(0,0,0,.4)']);
  });
  textures.keys = canvasTexture(128, 40, () => {});
  textures.screen = canvasTexture(160, 120, () => {});
  textures.watch = canvasTexture(48, 20, () => {});
  textures.turbo = canvasTexture(32, 16, (g) => {
    g.fillStyle = '#0b0606';
    g.fillRect(0, 0, 32, 16);
    g.font = '16px VT323, monospace';
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(140,20,20,.25)';
    g.fillText('88', 6, 9);
    g.fillStyle = '#e2361f';
    g.fillText('66', 6, 9);
  });
  textures.floppy = CONTENT.projects.map((_, i) =>
    canvasTexture(64, 64, (g) => {
      g.fillStyle = ['#151515', '#1b2230', '#2a1716'][i % 3];
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = '#d9d1b8';
      g.fillRect(6, 5, 52, 24);
      g.strokeStyle = 'rgba(40,40,60,.35)';
      for (let y = 13; y < 28; y += 5) {
        g.beginPath();
        g.moveTo(9, y);
        g.lineTo(55, y);
        g.stroke();
      }
      g.fillStyle = '#1e2433';
      g.font = '13px "Permanent Marker", cursive';
      g.fillText('P-0' + (i + 1), 11, 21);
      g.fillStyle = '#0c0c0c';
      g.beginPath();
      g.arc(32, 45, 10, 0, 7);
      g.fill();
      g.fillStyle = '#6b6b66';
      g.beginPath();
      g.arc(32, 45, 4, 0, 7);
      g.fill();
      g.fillStyle = '#0c0c0c';
      g.fillRect(29, 56, 6, 8);
    }),
  );
  textures.folder = canvasTexture(64, 64, (g) => {
    g.fillStyle = '#ad8d4d';
    g.fillRect(0, 0, 64, 64);
    speckle(g, 64, 64, 200, ['rgba(60,40,10,.3)', 'rgba(255,240,200,.1)']);
    g.fillStyle = '#e6dfca';
    g.fillRect(10, 8, 30, 14);
    g.fillStyle = '#7a1218';
    g.font = '13px "Permanent Marker", cursive';
    g.fillText('CV', 16, 20);
  });
  const MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][
    new Date().getMonth()
  ];
  textures.cal = canvasTexture(64, 88, (g) => {
    g.fillStyle = '#c9c1a6';
    g.fillRect(0, 0, 64, 88);
    g.fillStyle = '#5b1015';
    g.fillRect(0, 0, 64, 22);
    g.fillStyle = '#e8dccb';
    g.font = '18px VT323, monospace';
    g.fillText(MES, 5, 16);
    g.font = '11px VT323, monospace';
    g.fillText(CONTENT.calendarYear, 34, 15);
    g.fillStyle = '#3a352a';
    g.font = '9px VT323, monospace';
    for (let r = 0; r < 5; r++)
      for (let d = 0; d < 7; d++) {
        const n = r * 7 + d + 1;
        if (n > 31) continue;
        const x = 4 + d * 8.4,
          y = 34 + r * 11;
        g.fillText(String(n), x, y);
        if (d === 4) {
          g.strokeStyle = '#8c1a1f';
          g.beginPath();
          g.moveTo(x - 1, y - 7);
          g.lineTo(x + 7, y + 1);
          g.moveTo(x + 7, y - 7);
          g.lineTo(x - 1, y + 1);
          g.stroke();
        }
      }
    speckle(g, 64, 88, 150, ['rgba(60,45,20,.25)']);
  });
  textures.walkman = canvasTexture(64, 48, (g) => {
    g.fillStyle = '#585f60';
    g.fillRect(0, 0, 64, 48);
    g.fillStyle = '#0b0c0c';
    g.fillRect(8, 8, 48, 26);
    g.fillStyle = '#8c1a1f';
    g.fillRect(8, 38, 48, 3);
    g.fillStyle = '#c9c4b0';
    g.font = '8px VT323, monospace';
    g.fillText('WALK-TAPE  II', 10, 47);
    speckle(g, 64, 48, 120, ['rgba(0,0,0,.3)', 'rgba(255,255,255,.08)']);
  });
  textures.modem = canvasTexture(64, 16, (g) => {
    g.fillStyle = '#cfc9b6';
    g.fillRect(0, 0, 64, 16);
    g.fillStyle = '#2a2a28';
    g.font = '8px VT323, monospace';
    g.fillText('MODEM 2400', 3, 7);
    g.fillStyle = '#6a6458';
    g.fillText('TR CD RD SD OH', 3, 14);
  });
  // Benja: blanco con manchas gris oscuro y un corazón en el lomo
  textures.cat = canvasTexture(128, 64, (g, w, h) => {
    g.fillStyle = '#e6e3da';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#36363b';
    const blob = (x, y, rx, ry, r) => {
      g.beginPath();
      g.ellipse(x, y, rx, ry, r || 0, 0, 7);
      g.fill();
    };
    blob(96, 20, 24, 15, 0.3);
    blob(116, 28, 16, 14);
    blob(4, 24, 12, 13);
    blob(74, 36, 9, 7, 0.5);
    blob(60, 8, 30, 6);
    heart(g, 36, 21, 9);
    speckle(g, w, h, 500, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.2)']);
  });
  textures.catHeadAwake = canvasTexture(64, 32, (g) => {
    g.fillStyle = '#36363b';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#e6e3da';
    g.fillRect(0, 19, 64, 13);
    g.beginPath();
    g.moveTo(12, 32);
    g.lineTo(16, 8);
    g.lineTo(20, 32);
    g.fill();
    g.beginPath();
    g.ellipse(16, 23, 9, 6, 0, 0, 7);
    g.fill();
    g.fillStyle = '#c9d36a';
    g.fillRect(8, 14, 5, 4);
    g.fillRect(19, 14, 5, 4);
    g.fillStyle = '#0d0d0f';
    g.fillRect(10, 14, 2, 4);
    g.fillRect(21, 14, 2, 4);
    g.fillStyle = '#c9888a';
    g.fillRect(15, 21, 3, 2);
  });
  textures.catHead = canvasTexture(64, 32, (g) => {
    g.fillStyle = '#36363b';
    g.fillRect(0, 0, 64, 32);
    g.fillStyle = '#e6e3da';
    g.fillRect(0, 19, 64, 13);
    g.beginPath();
    g.moveTo(12, 32);
    g.lineTo(16, 8);
    g.lineTo(20, 32);
    g.fill();
    g.beginPath();
    g.ellipse(16, 23, 9, 6, 0, 0, 7);
    g.fill();
    g.strokeStyle = '#151517';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(9, 17);
    g.quadraticCurveTo(11, 19, 13, 17);
    g.moveTo(19, 17);
    g.quadraticCurveTo(21, 19, 23, 17);
    g.stroke();
    g.fillStyle = '#c9888a';
    g.fillRect(15, 21, 3, 2);
  });
  const noteTex = (bg, txt) =>
    canvasTexture(64, 64, (g) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = 'rgba(0,0,0,.12)';
      g.fillRect(0, 0, 64, 8);
      g.fillStyle = '#1f1d18';
      g.font = '11px "Permanent Marker", cursive';
      const words = txt.split(' ');
      let line = '',
        y = 24;
      words.forEach((wd) => {
        const t = line ? line + ' ' + wd : wd;
        if (g.measureText(t).width > 54 && line) {
          g.fillText(line, 5, y);
          y += 13;
          line = wd;
        } else line = t;
      });
      g.fillText(line, 5, y);
    });
  textures.notes = [
    noteTex('#d6c05a', CONTENT.notes[0]),
    noteTex('#c98b8a', CONTENT.notes[1]),
    noteTex('#9fb47c', CONTENT.notes[2]),
  ];
  // póster con el nombre (textura cuadrada para poder usar mipmaps y que se lea de lejos)
  const fitText = (g, txt, x, y, size, maxW, family) => {
    g.font = `${size}px ${family}`;
    const w = g.measureText(txt).width;
    if (w > maxW) g.font = `${Math.floor((size * maxW) / w)}px ${family}`;
    g.fillText(txt, x, y);
  };
  textures.poster = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#8a161c';
    g.fillRect(0, 0, 256, 256);
    speckle(g, 256, 256, 900, ['rgba(0,0,0,.18)', 'rgba(255,230,200,.06)']);
    g.strokeStyle = '#eadfc4';
    g.lineWidth = 4;
    g.strokeRect(9, 9, 238, 238);
    g.fillStyle = '#eadfc4';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    const parts = CONTENT.name.toUpperCase().split(' '),
      last = parts.pop(),
      first = parts.join(' ');
    fitText(g, 'PORTFOLIO DE', 128, 44, 28, 200, 'VT323, monospace');
    fitText(g, first, 128, 88, 46, 224, 'VT323, monospace');
    fitText(g, last, 128, 140, 66, 224, 'VT323, monospace');
    // ilustración: el CRT con Benja echado arriba
    g.fillStyle = '#eadfc4';
    g.fillRect(96, 162, 64, 48);
    g.fillRect(112, 210, 32, 6);
    g.fillRect(88, 220, 80, 6);
    g.fillStyle = '#2a0809';
    g.fillRect(102, 167, 52, 36);
    g.fillStyle = '#9fd68c';
    g.font = '13px VT323, monospace';
    g.textAlign = 'left';
    g.fillText('C:\\>_', 107, 182);
    g.fillStyle = '#1b0506';
    g.beginPath();
    g.ellipse(130, 155, 22, 8, 0, 0, 7);
    g.fill();
    g.beginPath();
    g.arc(111, 151, 8, 0, 7);
    g.fill();
    g.beginPath();
    g.moveTo(104, 147);
    g.lineTo(106, 138);
    g.lineTo(110, 145);
    g.fill();
    g.beginPath();
    g.moveTo(112, 145);
    g.lineTo(117, 138);
    g.lineTo(118, 147);
    g.fill();
    g.strokeStyle = '#1b0506';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(151, 157);
    g.quadraticCurveTo(164, 160, 160, 170);
    g.stroke();
    g.fillStyle = '#eadfc4';
    heart(g, 132, 152, 4);
    g.textAlign = 'center';
    g.font = '17px VT323, monospace';
    g.fillText('VENADO TUERTO · ' + CONTENT.calendarYear, 128, 242);
  });
  textures.poster.minFilter = THREE.LinearMipmapLinearFilter;
  textures.poster.generateMipmaps = true;

  // diario enmarcado: ilustración del gol del siglo (México 86)
  textures.diario = canvasTexture(128, 160, (g) => {
    const gr = g.createLinearGradient(0, 0, 128, 160);
    gr.addColorStop(0, '#ddd3b6');
    gr.addColorStop(1, '#c7b98f');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = '#1d1b17';
    g.textAlign = 'center';
    g.font = '18px "Special Elite", monospace';
    g.fillText('LA HOJA', 64, 18);
    g.fillRect(6, 22, 116, 1);
    g.fillRect(6, 30, 116, 1);
    g.font = '7px "IBM Plex Mono", monospace';
    g.fillText('LUNES 23 DE JUNIO DE 1986', 64, 28);
    g.font = '600 15px "IBM Plex Mono", monospace';
    g.fillText('¡EL GOL', 64, 46);
    g.fillText('DEL SIGLO!', 64, 61);
    // foto en blanco y negro
    g.fillStyle = '#8c8a80';
    g.fillRect(8, 67, 112, 56);
    g.fillStyle = '#a5a398';
    g.fillRect(8, 98, 112, 25);
    g.fillStyle = '#3a3935';
    [
      [30, 84, -0.5],
      [46, 90, 0.7],
    ].forEach(([x, y, r]) => {
      g.save();
      g.translate(x, y);
      g.rotate(r);
      g.fillRect(-4, -12, 8, 18);
      g.beginPath();
      g.arc(0, -16, 4, 0, 7);
      g.fill();
      g.restore();
    });
    g.save();
    g.translate(78, 88);
    g.rotate(-0.18);
    g.fillStyle = '#f2efe6';
    g.fillRect(-6, -14, 12, 16);
    g.fillStyle = '#6f7d8a';
    g.fillRect(-4, -14, 2, 16);
    g.fillRect(1, -14, 2, 16);
    g.fillStyle = '#1d1b17';
    g.font = '8px VT323, monospace';
    g.fillText('10', 0, -3);
    g.fillStyle = '#2a2925';
    g.fillRect(-6, 2, 12, 6);
    g.beginPath();
    g.arc(0, -19, 5, 0, 7);
    g.fill();
    g.strokeStyle = '#2a2925';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-3, 8);
    g.lineTo(-10, 18);
    g.moveTo(3, 8);
    g.lineTo(9, 14);
    g.lineTo(14, 20);
    g.stroke();
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-6, -11);
    g.lineTo(-13, -4);
    g.moveTo(6, -11);
    g.lineTo(13, -16);
    g.stroke();
    g.restore();
    g.fillStyle = '#f5f2ea';
    g.beginPath();
    g.arc(98, 111, 4, 0, 7);
    g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)';
    for (let y = 68; y < 123; y += 3) for (let x = 9; x < 120; x += 3) g.fillRect(x, y, 1, 1);
    g.fillStyle = '#1d1b17';
    g.font = '7px "IBM Plex Mono", monospace';
    g.fillText('ARGENTINA 2 · INGLATERRA 1', 64, 132);
    g.fillStyle = 'rgba(30,28,24,.55)';
    for (let col = 0; col < 3; col++)
      for (let l = 0; l < 6; l++) g.fillRect(8 + col * 39, 138 + l * 3.4, l === 5 ? 20 : 34, 1.6);
    speckle(g, 128, 160, 300, ['rgba(80,60,20,.15)']);
  });
  textures.diario.minFilter = THREE.LinearFilter;
}

function drawScreen(blink, typed = '') {
  const g = textures.screen.userData.g;
  g.fillStyle = '#061009';
  g.fillRect(0, 0, 160, 120);
  g.font = '14px VT323, monospace';
  g.fillStyle = '#86d98a';
  const last = 'C:\\> ' + (typed || 'PORTFOLIO');
  const nm = CONTENT.name.toUpperCase().split(' ');
  const lines = [
    nm[0] + ' ' + nm[nm.length - 1],
    'C:\\> DIR',
    ' PORTFOLIO EXE   48K',
    ' PROYECTOS DAT   12K',
    ' BENJA     GAT    4K',
    '',
    last,
  ];
  lines.forEach((l, i) => g.fillText(l, 8, 16 + i * 13));
  if (blink) g.fillRect(10 + g.measureText(last).width, 16 + 6 * 13 - 10, 6, 11);
  textures.screen.needsUpdate = true;
}
function drawWatch() {
  const g = textures.watch.userData.g,
    d = new Date();
  g.fillStyle = '#8e9a7a';
  g.fillRect(0, 0, 48, 20);
  g.font = '18px VT323, monospace';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(30,36,24,.14)';
  g.fillText('88:88', 4, 11);
  g.fillStyle = '#1b2016';
  g.fillText(pad2(d.getHours()) + (d.getSeconds() % 2 ? ':' : ' ') + pad2(d.getMinutes()), 4, 11);
  textures.watch.needsUpdate = true;
}
function drawKeys() {
  const g = textures.keys.userData.g;
  g.fillStyle = '#7c7258';
  g.fillRect(0, 0, 128, 40);
  for (let r = 0; r < 5; r++)
    for (let k = 0; k < 15; k++) {
      const x = 2 + k * 8.4,
        y = 2 + r * 7.6;
      g.fillStyle = k > 12 || r === 0 || k === 0 ? '#5f5743' : '#b8ac8a';
      if (r === 4 && k > 3 && k < 11) {
        if (k === 4) {
          g.fillStyle = '#b8ac8a';
          g.fillRect(x, y, 8.4 * 7 - 1, 6.4);
        }
        continue;
      }
      g.fillRect(x, y, 7.2, 6.4);
      g.fillStyle = 'rgba(0,0,0,.28)';
      g.fillRect(x, y + 5.4, 7.2, 1);
    }
  textures.keys.needsUpdate = true;
}

export { buildTextures, drawScreen, drawWatch, drawKeys };
