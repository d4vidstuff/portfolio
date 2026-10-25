/**
 * Ventanas de PORTFOLIO-DOS: abrir, traer al frente, arrastrar, cambiar de
 * tamaño, minimizar, maximizar y cerrar. Cada ventana abierta tiene su botón
 * en la barra de tareas de abajo.
 *
 * Uso:
 *   const wm = createWindowManager($('#osArea'), $('#osTaskbar'));
 *   const el = wm.open('about', { title: 'SOBRE_MI.TXT', html: '<p>...</p>', width: 460 });
 */
import { esc } from '../core/dom.js';
import { sound } from '../audio/sound.js';

const MIN_W = 240;
const MIN_H = 150;
const isPhone = () => matchMedia('(max-width: 640px)').matches;

export function createWindowManager(area, taskbar) {
  /** id → { el, tab, title } */
  const wins = new Map();
  let zTop = 5;
  let cascade = 0;

  function open(id, { title, html, width = 460, height, x, y, bodyClass = '' }) {
    if (wins.has(id)) {
      restore(id);
      return wins.get(id).el;
    }
    const el = document.createElement('div');
    el.className = 'win';
    el.dataset.win = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.innerHTML = `
      <div class="win-bar">
        <span class="win-title">${esc(title)}</span>
        <div class="win-btns">
          <button class="win-btn" data-act="min" aria-label="Minimizar ${esc(title)}">_</button>
          <button class="win-btn" data-act="max" aria-label="Maximizar ${esc(title)}">□</button>
          <button class="win-btn win-x" data-act="close" aria-label="Cerrar ${esc(title)}">X</button>
        </div>
      </div>
      <div class="win-body ${bodyClass}">${html}</div>
      <div class="win-rs win-rs-e" data-rs="e" aria-hidden="true"></div>
      <div class="win-rs win-rs-s" data-rs="s" aria-hidden="true"></div>
      <div class="win-rs win-rs-se" data-rs="se" aria-hidden="true"></div>`;

    // posición inicial: en cascada, sin salirse del escritorio
    const W = area.clientWidth;
    const H = area.clientHeight;
    const w = Math.max(MIN_W, Math.min(width, W - 140));
    const n = cascade++ % 6;
    el.style.width = w + 'px';
    if (height) el.style.height = Math.min(height, H - 24) + 'px';
    el.style.left = Math.max(8, Math.min(W - w - 12, x ?? 128 + n * 34)) + 'px';
    el.style.top = Math.max(8, Math.min(H - 200, y ?? 16 + n * 30)) + 'px';
    area.appendChild(el);
    // si no entra hacia abajo, se achica hasta el borde del escritorio
    const room = H - el.offsetTop - 8;
    if (el.offsetHeight > room) el.style.height = Math.max(MIN_H, room) + 'px';

    const tab = document.createElement('button');
    tab.className = 'os-tab';
    tab.textContent = title;
    tab.addEventListener('click', () => onTab(id));
    taskbar.appendChild(tab);

    wins.set(id, { el, tab, title });
    focus(id);

    el.addEventListener('pointerdown', () => focus(id));
    el.querySelector('.win-btns').addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'min') minimize(id);
      if (act === 'max') toggleMax(id);
      if (act === 'close') close(id);
    });
    const bar = el.querySelector('.win-bar');
    bar.addEventListener('dblclick', (e) => {
      if (!e.target.closest('button')) toggleMax(id);
    });
    enableDrag(el, bar);
    el.querySelectorAll('[data-rs]').forEach((h) => enableResize(el, h, h.dataset.rs));
    return el;
  }

  /** Trae la ventana al frente y marca su botón en la barra de tareas. */
  function focus(id) {
    const win = wins.get(id);
    if (!win) return;
    win.el.style.zIndex = ++zTop;
    for (const [other, w] of wins) w.tab.classList.toggle('on', other === id && !w.el.hidden);
  }

  function minimize(id) {
    const win = wins.get(id);
    if (!win) return;
    sound.sfx('click');
    win.el.querySelectorAll('video').forEach((v) => v.pause()); // que no siga sonando escondido
    win.el.hidden = true;
    win.tab.classList.remove('on');
    win.tab.classList.add('min');
  }

  function restore(id) {
    const win = wins.get(id);
    if (!win) return;
    if (win.el.hidden) {
      win.el.hidden = false;
      win.tab.classList.remove('min');
      win.el.classList.remove('pop');
      void win.el.offsetWidth; // reinicia la animación
      win.el.classList.add('pop');
    }
    focus(id);
  }

  function toggleMax(id) {
    const win = wins.get(id);
    if (!win) return;
    const max = win.el.classList.toggle('is-max');
    const btn = win.el.querySelector('[data-act="max"]');
    btn.textContent = max ? '❐' : '□';
    btn.setAttribute('aria-label', (max ? 'Restaurar ' : 'Maximizar ') + win.title);
    sound.sfx('click');
    focus(id);
  }

  /** Botón de la barra de tareas: restaura, minimiza si ya está al frente, o la trae al frente. */
  function onTab(id) {
    const win = wins.get(id);
    if (win.el.hidden) restore(id);
    else if (win.tab.classList.contains('on')) minimize(id);
    else focus(id);
  }

  function close(id) {
    const win = wins.get(id);
    if (!win) return;
    sound.play('shake', { vol: 0.8 });
    win.el.remove();
    win.tab.remove();
    wins.delete(id);
  }

  function closeAll() {
    for (const { el, tab } of wins.values()) {
      el.remove();
      tab.remove();
    }
    wins.clear();
    cascade = 0;
  }

  /** Arrastrar desde la barra de título. */
  function enableDrag(el, bar) {
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || isPhone() || el.classList.contains('is-max')) return;
      const box = area.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const ox = e.clientX - r.left;
      const oy = e.clientY - r.top;
      track(bar, e, (ev) => {
        el.style.left = clamp(ev.clientX - box.left - ox, 0, box.width - 80) + 'px';
        el.style.top = clamp(ev.clientY - box.top - oy, 0, box.height - 30) + 'px';
      });
    });
  }

  /** Cambiar de tamaño desde el borde derecho (e), el de abajo (s) o la esquina (se). */
  function enableResize(el, handle, dir) {
    handle.addEventListener('pointerdown', (e) => {
      if (isPhone() || el.classList.contains('is-max')) return;
      e.stopPropagation();
      const box = area.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      track(handle, e, (ev) => {
        if (dir.includes('e')) {
          el.style.width = clamp(ev.clientX - r.left, MIN_W, box.right - r.left) + 'px';
        }
        if (dir.includes('s')) {
          el.style.height = clamp(ev.clientY - r.top, MIN_H, box.bottom - r.top) + 'px';
        }
      });
    });
  }

  return { open, focus, minimize, restore, toggleMax, close, closeAll, has: (id) => wins.has(id) };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Sigue el puntero hasta que se suelta, llamando a move en cada movimiento. */
function track(target, downEvent, move) {
  downEvent.preventDefault();
  target.setPointerCapture(downEvent.pointerId);
  const up = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', up);
    target.removeEventListener('pointercancel', up);
  };
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
}
