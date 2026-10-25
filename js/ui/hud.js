/**
 * Barra superior (volver, sonido, modo texto), pista inicial y botones de objetos
 * para teclado y celular.
 */
import { $, esc } from '../core/dom.js';
import { CONTENT } from '../content.js';
import { app } from '../core/state.js';
import { setTextMode } from './text-mode.js';
import { go, goBack } from '../desk/actions.js';

function showBack(on) {
  $('#btnBack').hidden = !on;
  document.body.classList.toggle('focused', on);
}
let hinted = false;
function markInteracted() {
  if (hinted) return;
  hinted = true;
  const h = $('#hint');
  h.style.opacity = 0;
  setTimeout(() => (h.hidden = true), 700);
}

const NAV = [
  ['pc', 'PC · Proyectos'],
  ['drawer', 'Cajonera · CV'],
  ['modem', 'Módem · Contacto'],
  ...CONTENT.projects.map((p, i) => ['floppy' + i, 'Disquete · ' + p.name]),
  ['notes', 'Notas'],
  ['walkman', 'Walkman · Sonido'],
  ['benja', 'Benja'],
];

export function initHud() {
  // "Disponible para trabajar": lleva al contacto del módem
  $('#btnHire').addEventListener('click', () => go('modem'));
  $('#objnav').innerHTML = NAV.map(([id, l]) => `<button data-go="${id}">${esc(l)}</button>`).join(
    '',
  );
  $('#objnav').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) go(b.dataset.go);
  });
  $('#btnBack').addEventListener('click', goBack);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (app.textOn && app.glOK) {
        setTextMode(false);
        return;
      }
      goBack();
    }
  });
}

export { showBack, markInteracted };
