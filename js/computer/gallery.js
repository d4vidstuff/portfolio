/**
 * Galería de fotos de un proyecto, dentro de su ventana.
 *
 * Las fotos se cargan en content.js, en `photos` de cada proyecto:
 *   { src: 'img/proyectos/01/inicio.jpg', alt: 'Inicio con la aurora' }
 * Mientras `src` esté vacío se muestra un recuadro "FOTO n" como placeholder.
 * También acepta videos (ver video-player.js para el formato).
 */
import { esc } from '../core/dom.js';
import { isVideo, videoPlayerHTML, initVideoPlayers, pauseVideos } from './video-player.js';

/** Una foto o su placeholder (para un video: su póster o "VIDEO n", con una marca ▶). */
function photoHTML(photo, i, cls) {
  if (isVideo(photo)) {
    const poster = photo.poster
      ? `<img class="${cls}" src="${esc(photo.poster)}" alt="${esc(photo.alt || '')}" loading="lazy" draggable="false">`
      : `<span class="${cls} ph" role="img" aria-label="${esc(photo.alt || 'Video ' + (i + 1))}">VIDEO ${i + 1}</span>`;
    return `<span class="media-video">${poster}<span class="media-play" aria-hidden="true">▶</span></span>`;
  }
  if (photo.src) {
    return `<img class="${cls}" src="${esc(photo.src)}" alt="${esc(photo.alt || '')}" loading="lazy" draggable="false">`;
  }
  return `<span class="${cls} ph" role="img" aria-label="${esc(photo.alt || 'Foto ' + (i + 1))}">FOTO ${i + 1}</span>`;
}

/** Miniatura para la tarjeta del proyecto en PROYECTOS.EXE (la primera foto). */
export function coverHTML(project) {
  const first = project.photos?.[0] || {};
  return photoHTML(first, 0, 'pcard-img');
}

/** Marcado de la galería: foto grande, flechas, contador, epígrafe y miniaturas. */
export function galleryHTML(project) {
  const photos = project.photos?.length ? project.photos : [{}];
  return `
    <figure class="gal" tabindex="0" aria-label="Fotos de ${esc(project.name)}. Usá las flechas para pasar.">
      <div class="gal-stage">
        ${photos.map((p, i) => `<div class="gal-slide"${i ? ' hidden' : ''}>${isVideo(p) ? videoPlayerHTML(p, i) : photoHTML(p, i, 'gal-img')}</div>`).join('')}
        ${
          photos.length > 1
            ? `<button class="gal-nav gal-prev" aria-label="Foto anterior">◀</button>
               <button class="gal-nav gal-next" aria-label="Foto siguiente">▶</button>`
            : ''
        }
        <span class="gal-count" aria-live="polite">1 / ${photos.length}</span>
      </div>
      <figcaption class="gal-cap">${esc(photos[0].alt || '')}</figcaption>
      ${
        photos.length > 1
          ? `<div class="gal-thumbs">${photos
              .map(
                (p, i) =>
                  `<button class="gal-thumb${i ? '' : ' on'}" data-i="${i}" aria-label="Ver foto ${i + 1}">${photoHTML(p, i, 'gal-thumb-img')}</button>`,
              )
              .join('')}</div>`
          : ''
      }
    </figure>`;
}

/** Conecta flechas, miniaturas y teclado de una galería ya insertada en la página. */
export function initGallery(root, project) {
  const gal = root.querySelector('.gal');
  if (!gal) return;
  const photos = project.photos?.length ? project.photos : [{}];
  const slides = [...gal.querySelectorAll('.gal-slide')];
  const thumbs = [...gal.querySelectorAll('.gal-thumb')];
  let current = 0;

  initVideoPlayers(gal);
  gal.classList.toggle('video-on', isVideo(photos[0]));

  function show(i) {
    pauseVideos(gal); // si había un video sonando, se pausa al cambiar de foto
    current = (i + photos.length) % photos.length;
    slides.forEach((s, k) => (s.hidden = k !== current));
    thumbs.forEach((t, k) => t.classList.toggle('on', k === current));
    gal.querySelector('.gal-count').textContent = `${current + 1} / ${photos.length}`;
    gal.querySelector('.gal-cap').textContent = photos[current].alt || '';
    gal.classList.toggle('video-on', isVideo(photos[current]));
  }

  gal.querySelector('.gal-prev')?.addEventListener('click', () => show(current - 1));
  gal.querySelector('.gal-next')?.addEventListener('click', () => show(current + 1));
  thumbs.forEach((t) => t.addEventListener('click', () => show(+t.dataset.i)));
  gal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
}
