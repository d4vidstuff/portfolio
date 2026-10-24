/**
 * Modo texto: todo el portfolio como una página HTML simple.
 * Sirve para reclutadores apurados, lectores de pantalla y navegadores sin WebGL.
 */
import { CONTENT } from '../content.js';
import { $, esc, linkHTML } from '../core/dom.js';
import { app } from '../core/state.js';

function cvHTML() {
  const cv = CONTENT.cv;
  return `
  <section><h2>Proyecto destacado</h2>${cv.experience.map((x) => `<div class="tm-item"><h3>${esc(x.role)} · ${esc(x.company)} <span>${esc(x.period)}</span></h3><p>${esc(x.desc)}</p></div>`).join('')}</section>
  <section><h2>Educación</h2>${cv.education.map((x) => `<h3>${esc(x.title)} · ${esc(x.place)} <span>${esc(x.period)}</span></h3>`).join('')}</section>
  <section><h2>Habilidades</h2><p>${cv.skills.map(esc).join(' · ')}</p></section>
  <section><h2>Idiomas</h2><p>${cv.languages.map((l) => esc(l.name) + ' (' + esc(l.level) + ')').join(' · ')}</p><p>${linkHTML(cv.pdf, 'Descargar CV en PDF')}</p></section>`;
}
/** Fotos ya cargadas del proyecto (los placeholders sin src no se muestran). */
const photosHTML = (p) => {
  const real = (p.photos || []).filter((f) => f.src);
  if (!real.length) return '';
  return `<div class="tm-photos">${real.map((f) => `<img src="${esc(f.src)}" alt="${esc(f.alt || '')}" loading="lazy">`).join('')}</div>`;
};

function renderTextMode() {
  $('#tm').innerHTML = `
  <div class="tm-top"><span class="tape">Portafolio · modo texto</span><button class="btn" id="tmBack">Volver al escritorio 3D</button></div>
  <header><h1>${esc(CONTENT.name)}</h1><p class="role">${esc(CONTENT.role)} · ${esc(CONTENT.location)}</p></header>
  <section><h2>Sobre mí</h2><p>${esc(CONTENT.bio)}</p></section>
  <section><h2>Proyectos</h2><ul>${CONTENT.projects.map((p) => `<li><h3>${esc(p.name)} <span>${esc(p.year)}</span></h3><p>${esc(p.desc)}</p><p class="tech">${p.tech.map(esc).join(' · ')}</p>${photosHTML(p)}<p>${linkHTML(p.link, 'Ver proyecto')}</p></li>`).join('')}</ul></section>
  ${cvHTML()}
  <section><h2>Contacto</h2><dl><dt>Email</dt><dd>${esc(CONTENT.contact.email)}</dd>${CONTENT.contact.links.map((l) => `<dt>${esc(l.label)}</dt><dd>${linkHTML(l.url, l.text)}</dd>`).join('')}</dl></section>
  <section><h2>Notas sueltas</h2><ul>${CONTENT.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></section>`;
  $('#tmBack').addEventListener('click', () => setTextMode(false));
}

function setTextMode(on) {
  app.textOn = on;
  document.body.classList.toggle('text-on', on);
  $('#textmode').classList.toggle('sr-only', !on);
  const back = $('#tmBack');
  if (back) back.hidden = !app.glOK;
  if (on) {
    window.scrollTo(0, 0);
    const h = $('#tm h1');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  } else {
    const b = $('#btnText');
    if (b) b.focus({ preventScroll: true });
  }
}

export function initTextMode() {
  renderTextMode();
  $('#btnText').addEventListener('click', () => setTextMode(true));
}

export { setTextMode };
