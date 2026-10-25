/**
 * Mensajes cortos abajo de la pantalla.
 */
import { $ } from '../core/dom.js';

let toastTimer;
function toast(msg, kind) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('alert');
  void t.offsetWidth;
  if (kind) t.classList.add(kind);
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2800);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-ph]');
  if (a) {
    e.preventDefault();
    toast('Link de ejemplo. Reemplazalo en content.js.');
  }
});

export { toast };
