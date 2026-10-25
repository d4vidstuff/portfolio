/**
 * Reproductor de video con la estética de PORTFOLIO-DOS: controles verdes de
 * fósforo, barra de progreso por bloques y un cartel tipo VHS (▶ PLAY / ❚❚ PAUSA).
 *
 * En content.js un video se carga así dentro de `photos`:
 *   { type: 'video', sources: ['img/proyectos/02/juego.webm', 'img/proyectos/02/juego.mp4'],
 *     poster: 'img/proyectos/02/juego.jpg', alt: 'DEBUG.EXE en acción' }
 * (con `src` en lugar de `sources` también anda). El navegador usa el primer formato que soporte.
 *
 * Teclado con el reproductor enfocado: espacio o K reproduce/pausa, ← → salta 5 s,
 * M silencia y F pone pantalla completa.
 */
import { esc } from '../core/dom.js';

const MIME = { webm: 'video/webm', mp4: 'video/mp4', ogv: 'video/ogg', mov: 'video/quicktime' };

/** ¿Este elemento de `photos` es un video? */
export const isVideo = (item) =>
  item?.type === 'video' || /\.(webm|mp4|ogv|mov)$/i.test(item?.src || '');

const sourcesOf = (item) => (item.sources || (item.src ? [item.src] : [])).filter(Boolean);
const fmt = (s) => {
  if (!isFinite(s)) return '00:00';
  const m = Math.floor(s / 60);
  return String(m).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');
};

/** Marcado del reproductor (o un placeholder "VIDEO n" si todavía no hay archivo). */
export function videoPlayerHTML(item, i) {
  const srcs = sourcesOf(item);
  if (!srcs.length) {
    return `<span class="gal-img ph" role="img" aria-label="${esc(item.alt || 'Video ' + (i + 1))}">▶ VIDEO ${i + 1}</span>`;
  }
  const sources = srcs
    .map((s) => `<source src="${esc(s)}" type="${MIME[s.split('.').pop().toLowerCase()] || ''}">`)
    .join('');
  return `
    <div class="vp" tabindex="0" aria-label="Video: ${esc(item.alt || '')}">
      <video class="vp-video" preload="metadata" playsinline ${item.poster ? `poster="${esc(item.poster)}"` : ''}>${sources}</video>
      <span class="vp-osd" aria-hidden="true">❚❚ PAUSA</span>
      <button class="vp-big" aria-label="Reproducir">▶</button>
      <div class="vp-bar">
        <button class="vp-btn vp-play" aria-label="Reproducir">▶</button>
        <span class="vp-time">00:00</span>
        <div class="vp-track" role="slider" tabindex="0" aria-label="Posición del video" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="vp-fill"></div>
        </div>
        <span class="vp-dur">00:00</span>
        <button class="vp-btn vp-mute" aria-label="Silenciar" aria-pressed="false">VOL</button>
        <button class="vp-btn vp-full" aria-label="Pantalla completa">[ ]</button>
      </div>
    </div>`;
}

/** Conecta los controles de todos los reproductores dentro de root. */
export function initVideoPlayers(root) {
  root.querySelectorAll('.vp').forEach(initOne);
}

/** Pausa todos los videos dentro de root (al cambiar de foto o minimizar). */
export function pauseVideos(root) {
  root.querySelectorAll('video').forEach((v) => v.pause());
}

function initOne(vp) {
  const v = vp.querySelector('video');
  const $ = (s) => vp.querySelector(s);
  const play = $('.vp-play');
  const big = $('.vp-big');
  const osd = $('.vp-osd');
  const track = $('.vp-track');
  const fill = $('.vp-fill');
  let osdTimer = 0;

  const toggle = () => (v.paused || v.ended ? v.play().catch(() => {}) : v.pause());
  const showOsd = (text) => {
    osd.textContent = text;
    osd.classList.add('on');
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => osd.classList.remove('on'), 1400);
  };
  const seek = (t) => {
    if (isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration, t));
  };
  const sync = () => {
    const k = v.duration ? v.currentTime / v.duration : 0;
    fill.style.setProperty('--p', k);
    track.setAttribute('aria-valuenow', Math.round(k * 100));
    $('.vp-time').textContent = fmt(v.currentTime);
  };

  v.addEventListener('loadedmetadata', () => {
    $('.vp-dur').textContent = fmt(v.duration);
    sync();
  });
  v.addEventListener('timeupdate', sync);
  v.addEventListener('play', () => {
    vp.classList.add('playing');
    play.textContent = '❚❚';
    play.setAttribute('aria-label', 'Pausar');
    showOsd('▶ PLAY');
  });
  v.addEventListener('pause', () => {
    vp.classList.remove('playing');
    play.textContent = '▶';
    play.setAttribute('aria-label', 'Reproducir');
    showOsd(v.ended ? '■ FIN' : '❚❚ PAUSA');
  });

  play.addEventListener('click', toggle);
  big.addEventListener('click', toggle);
  v.addEventListener('click', toggle);
  $('.vp-mute').addEventListener('click', (e) => {
    v.muted = !v.muted;
    e.currentTarget.setAttribute('aria-pressed', v.muted);
    e.currentTarget.textContent = v.muted ? 'MUTE' : 'VOL';
  });
  $('.vp-full').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else vp.requestFullscreen?.().catch(() => {}); // algunos visores no lo permiten
  });

  // barra de progreso: click o arrastre para adelantar/atrasar
  track.addEventListener('pointerdown', (e) => {
    track.setPointerCapture(e.pointerId);
    const go = (ev) => {
      const r = track.getBoundingClientRect();
      seek(((ev.clientX - r.left) / r.width) * v.duration);
    };
    go(e);
    const up = () => {
      track.removeEventListener('pointermove', go);
      track.removeEventListener('pointerup', up);
    };
    track.addEventListener('pointermove', go);
    track.addEventListener('pointerup', up);
  });

  vp.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (e.target.closest('button') && (k === ' ' || k === 'enter')) return; // el botón ya hace lo suyo
    if (k === ' ' || k === 'k') toggle();
    else if (e.key === 'ArrowLeft') seek(v.currentTime - 5);
    else if (e.key === 'ArrowRight') seek(v.currentTime + 5);
    else if (k === 'm') $('.vp-mute').click();
    else if (k === 'f') $('.vp-full').click();
    else return;
    e.preventDefault();
    e.stopPropagation(); // que las flechas no cambien de foto en la galería
  });
}
