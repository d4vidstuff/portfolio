/**
 * Globo de diálogo de Benja y los corazones que flotan.
 */
import { V3 } from '../scene/three.js';
import { camera } from '../scene/renderer.js';
import { parts } from '../scene/parts.js';
import { $, esc } from '../core/dom.js';
import { app } from '../core/state.js';
import { Cat } from './benja.js';
import { PET_GOAL, MEOWS } from './poses.js';

function hearts(n) {
  const b = $('#catBubble');
  const x = parseFloat(b.style.left) || innerWidth / 2,
    y = parseFloat(b.style.top) || innerHeight / 2;
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = '♥';
    h.setAttribute('aria-hidden', 'true');
    h.style.left = x + Math.random() * 90 - 45 + 'px';
    h.style.top = y + 10 + 'px';
    h.style.animationDelay = i * 0.12 + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 1900 + i * 120);
  }
}

const bubV = new V3(),
  scrA = new V3(),
  scrB = new V3();
function catBubble() {
  const b = $('#catBubble'),
    c = Cat;
  if (parts.cw.g.visible) {
    parts.cw.hd.getWorldPosition(scrA);
    parts.cw.piv.getWorldPosition(scrB);
    scrA.add(scrB).multiplyScalar(0.5);
    scrB.copy(scrA).y += 0.1;
    scrA.project(camera);
    scrB.project(camera);
    const x = ((scrA.x + 1) / 2) * innerWidth,
      y = ((1 - scrA.y) / 2) * innerHeight;
    c.scr = { x, y, r: Math.max(55, Math.abs(((scrA.y - scrB.y) / 2) * innerHeight) * 1.3) };
  } else c.scr = null;
  const offShow =
    c.offended && parts.cw.g.visible && ['getup', 'walk', 'turnHome', 'lie'].includes(c.mode);
  const show =
    (c.mode === 'demand' || c.mode === 'happy' || offShow) && app.state === 'idle' && !app.textOn;
  if (!show) {
    if (!b.hidden) b.hidden = true;
    return;
  }
  parts.cw.hd.getWorldPosition(bubV);
  bubV.y += 0.075;
  bubV.project(camera);
  b.style.left = ((bubV.x + 1) / 2) * innerWidth + 'px';
  b.style.top = ((1 - bubV.y) / 2) * innerHeight + 'px';
  let html;
  if (c.mode === 'happy') html = '<b>Prrrrr ♥</b>';
  else if (offShow) html = '<b>Hmpf.</b>';
  else {
    const n = Math.min(5, Math.round((c.pet / PET_GOAL) * 5));
    html = `<b>${esc(MEOWS[c.msg % MEOWS.length])}</b><span class="meter">${'♥'.repeat(n)}${'♡'.repeat(5 - n)}</span><small>${app.mobile ? 'Tocalo para acariciarlo' : 'Pasá el mouse por su lomo'}</small>`;
  }
  if (b._h !== html) {
    b.innerHTML = html;
    b._h = html;
  }
  b.hidden = false;
}

export { hearts, catBubble };
