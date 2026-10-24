/**
 * Utilidades chicas de DOM y formato.
 */
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const sleep = (ms) => new Promise((r) => setTimeout(r, REDUCED_MOTION ? Math.min(ms, 60) : ms));
const isPh = (u) => !u || u === '#';
const pad2 = (n) => String(n).padStart(2, '0');
function linkHTML(url, label, cls) {
  cls = cls || '';
  if (isPh(url)) return `<a class="${cls}" href="#" data-ph="1">${esc(label)}</a>`;
  return `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
}

export { REDUCED_MOTION, $, esc, sleep, pad2, linkHTML };
