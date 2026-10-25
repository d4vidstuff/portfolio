/**
 * PORTFOLIO-DOS: el sistema operativo falso que arranca al hacer zoom en la PC.
 * Arranque, íconos del escritorio y el contenido de cada ventana (proyectos,
 * "sobre mí", terminal). Cómo se mueven y cambian de tamaño: windows.js.
 */
import { CONTENT } from '../content.js';
import { $, esc, sleep, pad2, linkHTML, REDUCED_MOTION } from '../core/dom.js';
import { sound } from '../audio/sound.js';
import { go, goBack } from '../desk/actions.js';
import { runCommand } from './terminal.js';
import { createWindowManager } from './windows.js';
import { coverHTML, galleryHTML, initGallery } from './gallery.js';
import { mountDebugGame } from './games/debug/index.js';

const ICONS = {
  folder: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 3h5l2 2h7v9H1z"/></svg>',
  doc: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1h7l3 3v11H3z"/><path d="M5 6h6v1H5zM5 8h6v1H5zM5 10h6v1H5zM5 12h4v1H5z" fill="#050c06"/></svg>',
  term: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2h14v12H1z"/><path d="M3 5h1v1H3zM4 6h1v1H4zM5 7h1v1H5zM4 8h1v1H4zM3 9h1v1H3zM7 10h4v1H7z" fill="#050c06"/></svg>',
  drawer:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 3h14v11H1z"/><path d="M2 8h12v1H2zM6 5h4v1H6zM6 10h4v1H6z" fill="#050c06"/></svg>',
  phone:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 4h14v3h-3V5H4v2H1zM4 8h8v6H4z"/><path d="M7 10h2v2H7z" fill="#050c06"/></svg>',
  bug: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h1v1h2V1h1v2h1v2h2v1h-2v2h2v1h-2v2h2v1h-2v1H9v1H7v-1H5v-1H3v-1h2V9H3V8h2V6H3V5h2V3h1z"/><path d="M8 4h0v9h0z" fill="#050c06"/><path d="M7.5 5h1v8h-1z" fill="#050c06"/></svg>',
  power:
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 1h2v7H7zM3 4h2v2H4v4h1v1h1v1h4v-1h1v-1h1V6h-1V4h2v1h1v6h-1v1h-1v1h-1v1H5v-1H4v-1H3v-1H2V5h1z"/></svg>',
};
const OS = {
  booted: false,
  token: 0,
  /** Administrador de ventanas; se crea en initComputer(). */
  wm: null,
  els() {
    return {
      os: $('#os'),
      boot: $('#boot'),
      desk: $('#osDesk'),
      area: $('#osArea'),
      icons: $('#osIcons'),
    };
  },
  async open(pid) {
    const E = this.els();
    const tok = ++this.token;
    E.os.hidden = false;
    E.os.classList.remove('off');
    requestAnimationFrame(() => E.os.classList.add('in'));
    sound.sfx('crton');
    E.desk.hidden = true;
    E.boot.hidden = false;
    E.boot.textContent = '';
    const out = (s) => {
      E.boot.textContent += s;
    };
    if (!this.booted) {
      const lines = ['MIKROTEK BIOS v1.08   (C) 1986\n', 'CPU 8088 a 4.77 MHz\n', '\n'];
      for (const l of lines) {
        if (tok !== this.token) return;
        out(l);
        await sleep(140);
      }
      for (let k = 0; k <= 640; k += 64) {
        if (tok !== this.token) return;
        E.boot.textContent = E.boot.textContent.replace(/Memoria: \d+K.*\n?$/, '');
        out(`Memoria: ${String(k).padStart(6, '0')}K${k === 640 ? ' OK' : ''}\n`);
        await sleep(55);
      }
      for (const l of [
        'Unidad A: ......... LISTA\n',
        'Unidad C: ......... LISTA\n',
        '\n',
        'C:\\> PORTFOLIO.EXE\n',
        'Cargando ',
      ]) {
        if (tok !== this.token) return;
        out(l);
        await sleep(180);
      }
      sound.sfx('beep');
      for (let i = 0; i < 12; i++) {
        if (tok !== this.token) return;
        out('█');
        await sleep(45);
      }
      await sleep(260);
    } else {
      out('C:\\> PORTFOLIO.EXE\nCargando ');
      for (let i = 0; i < 6; i++) {
        if (tok !== this.token) return;
        out('█');
        await sleep(40);
      }
    }
    if (tok !== this.token) return;
    this.booted = true;
    E.boot.hidden = true;
    E.desk.hidden = false;
    $('#osTitle').innerHTML =
      `PORTFOLIO-DOS v1.0<span class="hud-long"> · ${esc(CONTENT.name)}</span>`;
    if (pid) this.openWin('project', pid);
    else {
      this.openWin('about');
      this.openWin('projects');
    }
  },
  async close() {
    const E = this.els();
    this.token++;
    if (E.os.hidden) return;
    sound.sfx('crtoff');
    E.os.classList.add('off');
    await sleep(430);
    E.os.classList.remove('in');
    await sleep(REDUCED_MOTION ? 0 : 260);
    E.os.hidden = true;
    E.os.classList.remove('off');
    this.wm.closeAll();
  },
  buildIcons() {
    const list = [
      ['projects', 'PROYECTOS', 'folder'],
      ['about', 'SOBRE_MI.TXT', 'doc'],
      ['terminal', 'TERMINAL', 'term'],
      ['cv', 'CV.LNK', 'drawer'],
      ['contact', 'CONTACTO', 'phone'],
      ['debug', 'DEBUG.EXE', 'bug'],
      ['off', 'APAGAR', 'power'],
    ];
    $('#osIcons').innerHTML = list
      .map(
        ([k, l, ic]) =>
          `<button class="os-icon" data-k="${k}">${ICONS[ic]}<span>${l}</span></button>`,
      )
      .join('');
    $('#osIcons').addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'off') goBack();
      else if (k === 'cv') go('drawer');
      else if (k === 'contact') go('modem');
      else this.openWin(k);
    });
  },
  /** Título, ancho y contenido de cada tipo de ventana. */
  def(key, arg) {
    if (key === 'projects')
      return {
        title: 'PROYECTOS.EXE',
        width: 660,
        x: 248,
        html: `<p>${CONTENT.projects.length} archivos encontrados. Elegí uno para abrirlo.</p>
          <div class="pgrid">${CONTENT.projects
            .map(
              (p) => `<button class="pcard" data-pid="${esc(p.id)}">
                ${coverHTML(p)}
                <span>${esc(p.name)}</span>
                <span class="meta">${esc(p.year)} · ${p.photos?.length || 0} fotos</span>
              </button>`,
            )
            .join('')}</div>`,
      };
    if (key === 'about')
      return {
        title: 'SOBRE_MI.TXT',
        width: 460,
        html: `<h3>${esc(CONTENT.name)}</h3>
          <p class="meta">${esc(CONTENT.role)} · ${esc(CONTENT.location)}</p>
          <p>${esc(CONTENT.bio)}</p>
          ${CONTENT.availability?.open ? `<p class="os-hire">● ${esc(CONTENT.availability.label)}. <button class="os-link" data-k="contact">${esc(CONTENT.availability.cta).toUpperCase()} →</button></p>` : ''}
          <p class="meta">Tip: abrí TERMINAL y escribí HELP.</p>`,
      };
    if (key === 'debug')
      return {
        title: 'DEBUG.EXE',
        width: 680,
        height: 520,
        bodyClass: 'win-body--game',
        x: 200,
        y: 24,
        html: '<div class="game"></div>',
      };
    if (key === 'terminal')
      return {
        title: 'TERMINAL.EXE',
        width: 540,
        html: `<div class="term"><pre class="term-out" aria-live="polite"></pre><form class="term-line"><label for="termIn">C:\\&gt;</label><input id="termIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando"></form></div>`,
      };
    if (key === 'project') {
      const p = CONTENT.projects.find((x) => x.id === arg);
      if (!p) return null;
      return {
        title: `PROYECTO_${p.id}.DSK`,
        width: 680,
        // ancha (maximizada o estirada): fotos a la izquierda y texto a la derecha (ver computer.css)
        html: `<div class="proj">
          <div class="proj-media">${galleryHTML(p)}</div>
          <div class="proj-info">
            <h3>${esc(p.name)}</h3>
            <p class="meta">${esc(p.year)}</p>
            <p>${esc(p.desc)}</p>
            <ul class="chips">${p.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <p>${linkHTML(p.link, 'VER PROYECTO →', 'os-link')}</p>
          </div>
        </div>`,
      };
    }
  },
  /** Abre (o trae al frente) una ventana y conecta lo que tenga adentro. */
  openWin(key, arg) {
    const id = key + (arg ? '-' + arg : '');
    if (this.wm.has(id)) {
      this.wm.restore(id);
      return;
    }
    const d = this.def(key, arg);
    if (!d) return;
    const w = this.wm.open(id, d);
    w.querySelectorAll('[data-k="contact"]').forEach((b) =>
      b.addEventListener('click', () => go('modem')),
    );
    w.querySelectorAll('[data-pid]').forEach((b) =>
      b.addEventListener('click', () => this.openWin('project', b.dataset.pid)),
    );
    if (key === 'project')
      initGallery(
        w,
        CONTENT.projects.find((x) => x.id === arg),
      );
    if (key === 'debug') mountDebugGame(w.querySelector('.game'));
    if (key === 'terminal') this.terminal(w);
    else setTimeout(() => w.querySelector('.win-x').focus({ preventScroll: true }), 30);
  },
  terminal(w) {
    const out = w.querySelector('.term-out'),
      form = w.querySelector('form'),
      inp = w.querySelector('input'),
      body = w.querySelector('.win-body');
    const print = (s) => {
      out.textContent += s + '\n';
      body.scrollTop = body.scrollHeight;
    };
    print('PORTFOLIO-DOS v1.0. Escribí HELP para ver los comandos.\n');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = inp.value.trim();
      inp.value = '';
      print('C:\\> ' + raw);
      runCommand(raw, {
        print,
        clear: () => {
          out.textContent = '';
        },
        openProject: (id) => this.openWin('project', id),
        openApp: (key) => this.openWin(key),
      });
    });
    w.querySelector('.win-body').addEventListener('click', () => inp.focus());
    setTimeout(() => inp.focus({ preventScroll: true }), 40);
  },
};

export function initComputer() {
  OS.wm = createWindowManager($('#osArea'), $('#osTaskbar'));
  OS.buildIcons();
  setInterval(() => {
    const d = new Date();
    $('#osClock').textContent = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }, 1000);
}

export { OS };
