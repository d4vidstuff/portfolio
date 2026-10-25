/**
 * Capas que se abren encima de la escena: CV (carpeta), contacto (ficha) y notas.
 */
import { CONTENT } from '../content.js';
import { $, esc, linkHTML, REDUCED_MOTION } from '../core/dom.js';
import { toast } from './toast.js';

function renderOverlays() {
  const cv = CONTENT.cv;
  $('#cvPaper').innerHTML = `
    <div class="paper-top"><div><h2>${esc(CONTENT.name)}</h2><p class="sub">${esc(CONTENT.role)} · ${esc(CONTENT.location)}</p><p class="line">${esc(CONTENT.contact.email)}${CONTENT.contact.phone ? ' · ' + esc(CONTENT.contact.phone) : ''}</p>${CONTENT.availability?.open ? `<p class="avail-stamp">${esc(CONTENT.availability.label)}</p>` : ''}</div>
    <button class="paper-close" data-close>Cerrar cajón</button></div>
    <h3>Proyecto destacado</h3>${cv.experience.map((x) => `<div class="item"><strong>${esc(x.role)} — ${esc(x.company)}</strong><span class="when">${esc(x.period)}</span><p>${esc(x.desc)}</p></div>`).join('')}
    <h3>Educación</h3>${cv.education.map((x) => `<div class="item"><strong>${esc(x.title)} — ${esc(x.place)}</strong><span class="when">${esc(x.period)}</span></div>`).join('')}
    <h3>Habilidades</h3><ul class="inline">${cv.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <h3>Idiomas</h3><ul class="inline">${cv.languages.map((l) => `<li>${esc(l.name)}: ${esc(l.level)}</li>`).join('')}</ul>
    ${linkHTML(cv.pdf, 'Descargar PDF', 'stamp')}`;
  $('#contactCard').innerHTML = `
    <h2>Conectado a 2400 baudios</h2>
    ${CONTENT.availability?.open ? `<p class="card-pitch"><span class="hire-dot" aria-hidden="true"></span>${esc(CONTENT.availability.label)}. ${esc(CONTENT.availability.pitch)}</p>` : ''}
    <dl>
      <dt>Email</dt><dd><span id="mailText">${esc(CONTENT.contact.email)}</span><button class="mini" data-copy="mailText" data-what="Email">Copiar</button></dd>
      ${CONTENT.contact.phone ? `<dt>Teléfono</dt><dd><span id="phoneText">${esc(CONTENT.contact.phone)}</span><button class="mini" data-copy="phoneText" data-what="Teléfono">Copiar</button>${CONTENT.contact.whatsapp ? linkHTML('https://wa.me/' + CONTENT.contact.whatsapp, 'WhatsApp') : ''}</dd>` : ''}
      ${CONTENT.contact.links.map((l) => `<dt>${esc(l.label)}</dt><dd>${linkHTML(l.url, l.text)}</dd>`).join('')}
    </dl>
    <p class="foot">El módem tarda, pero llega. Para algo urgente, mejor un email.</p>
    <div class="close-row"><button class="mini" data-close>Cortar conexión</button></div>`;
  $('#notesWrap').innerHTML = CONTENT.notes
    .map((n) => `<div class="note">${esc(n)}</div>`)
    .join('');
  const av = CONTENT.availability;
  if (av?.open) {
    $('#btnHire').hidden = false;
    $('#btnHire .hire-label').textContent = av.label;
    $('#btnHire .hire-cta').textContent = av.cta + ' →';
  }
  $('#tape').innerHTML =
    `${esc(CONTENT.name)}<span class="hud-long"> · ${esc(CONTENT.role)}</span>`;
  // botones "Copiar" (email y teléfono)
  $('#contactCard').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const el = $('#' + btn.dataset.copy);
    const done = () => toast(btn.dataset.what + ' copiado.');
    const fallback = () => {
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      toast('Seleccionado. Copialo con Ctrl+C.');
    };
    try {
      navigator.clipboard.writeText(el.textContent).then(done, fallback);
    } catch (e) {
      fallback();
    }
  });
}

let openOv = null,
  lastFocus = null;
function openOverlay(name) {
  const el = $('#ov-' + name);
  lastFocus = document.activeElement;
  el.hidden = false;
  openOv = el;
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  const f = el.querySelector('[data-close]');
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 60);
}
function closeOverlay() {
  if (!openOv) return;
  const el = openOv;
  openOv = null;
  el.classList.remove('in');
  setTimeout(
    () => {
      el.hidden = true;
    },
    REDUCED_MOTION ? 0 : 260,
  );
}

/** Devuelve el foco al elemento que tenía antes de abrir la capa. */
function restoreFocus() {
  if (lastFocus && document.body.contains(lastFocus) && lastFocus !== document.body) {
    try {
      lastFocus.focus({ preventScroll: true });
    } catch (e) {
      /* el elemento ya no se puede enfocar */
    }
  }
  lastFocus = null;
}

/** onClose: qué hacer al tocar el fondo o un botón [data-close] (vuelve al escritorio). */
function initOverlays(onClose) {
  renderOverlays();
  document.querySelectorAll('.ov').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]') || e.target.hasAttribute('data-backdrop')) onClose();
    });
  });
}

export { initOverlays, openOverlay, closeOverlay, restoreFocus };
