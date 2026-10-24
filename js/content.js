/**
 * Todo el texto del portfolio: nombre, bio, proyectos, CV, contacto y notas.
 * Es el único archivo que hay que tocar para cambiar el contenido.
 *
 * Fotos de proyectos: guardalas en img/proyectos/<id>/ y poné la ruta en `src`,
 * por ejemplo { src: 'img/proyectos/01/inicio.jpg', alt: 'Inicio con la aurora' }.
 * Mientras `src` esté vacío se muestra un recuadro "FOTO n".
 */
export const CONTENT = {
  name: 'Ignacio David Gonzalez',
  role: 'Desarrollador web frontend',
  location: 'Venado Tuerto, Santa Fe',
  bio: 'Soy Técnico Superior en Desarrollo de Software, recibido en ICES, y vivo en Venado Tuerto. Hago sitios web de punta a punta: interfaz, efectos visuales, panel de administración, SEO y publicación. Todavía no tuve un trabajo formal en el rubro. Mi carta de presentación es lametalica.com.ar, un sitio real para un negocio local que construí completo. Busco mi primera oportunidad como desarrollador frontend.',
  projects: [
    {
      id: '01',
      name: 'La Metálica',
      year: 'Oct 2026',
      desc: 'Sitio completo para un negocio local de metalmecánica, hecho de punta a punta. La interfaz está en React 18 sin herramientas de compilación, con fondos y efectos animados en WebGL: la aurora del inicio, un degradé con grano, una galería deformable y botones con brillo. Tiene un panel de administración privado (ingreso con Google para una sola cuenta) donde el negocio edita textos, colores y fotos con vista previa en vivo; todo se guarda en Cloud Firestore y las fotos se comprimen en el navegador antes de subirse. Incluye un minijuego en SVG animado con sonido generado por código. SEO técnico con datos estructurados, Open Graph y sitemap, publicado en Netlify con dominio propio .com.ar.',
      tech: ['React 18', 'WebGL / OGL', 'Firebase', 'Web Audio API', 'SEO', 'Netlify'],
      link: 'https://lametalica.com.ar',
      photos: [
        { src: 'img/proyectos/01/1-inicio.jpg', alt: 'Inicio con la aurora animada' },
        {
          src: 'img/proyectos/01/2-minijuego.jpg',
          alt: 'Minijuego "Jornada en altura" en SVG animado',
        },
        {
          src: 'img/proyectos/01/3-metalmecanica.jpg',
          alt: 'Sección Metalmecánica con trabajos realizados',
        },
        {
          src: 'img/proyectos/01/4-metalmecanica-hero.jpg',
          alt: 'Encabezado de Metalmecánica con degradé y grano',
        },
        { src: 'img/proyectos/01/5-equipos.jpg', alt: 'Selector de equipos por altura' },
      ],
    },
    {
      id: '02',
      name: 'Portafolio',
      year: 'Oct 2026',
      desc: 'Este portafolio: un escritorio retro en 3D con Three.js, post-procesado con dithering en un shader propio, un sistema operativo falso con ventanas que se mueven, agrandan y minimizan, sonidos con la Web Audio API y un gato que pide caricias. Código en módulos ES, sin build.',
      tech: ['Three.js', 'GLSL', 'Web Audio API', 'JavaScript'],
      link: 'https://github.com/d4vidstuff/portfolio',
      photos: [
        {
          src: 'img/proyectos/02/1-escritorio.jpg',
          alt: 'El escritorio en 3D con Benja durmiendo',
        },
        { src: 'img/proyectos/02/2-modo-texto.jpg', alt: 'Modo texto, para leer todo de corrido' },
        { src: 'img/proyectos/02/3-contacto.jpg', alt: 'Contacto en la ficha del módem' },
        {
          src: 'img/proyectos/02/4-portfolio-dos.jpg',
          alt: 'PORTFOLIO-DOS con las ventanas abiertas',
        },
        { src: 'img/proyectos/02/5-cv.jpg', alt: 'El CV en la carpeta del cajón' },
      ],
    },
  ],
  cv: {
    experience: [
      {
        role: 'Desarrollo web completo (proyecto propio)',
        company: 'La Metálica · lametalica.com.ar',
        period: 'Oct 2026',
        desc: 'Diseñé, programé y publiqué el sitio de un negocio local: interfaz en React con efectos WebGL, panel de administración con Firebase, SEO técnico (JSON-LD, Open Graph, sitemap) y dominio .com.ar en Netlify con HTTPS. También preparé las fotos de obra con Python y Pillow.',
      },
    ],
    education: [
      { title: 'Técnico Superior en Desarrollo de Software', place: 'ICES', period: 'Recibido' },
    ],
    skills: [
      'HTML, CSS y JavaScript',
      'React',
      'WebGL (OGL, Three.js)',
      'Canvas 2D y SVG',
      'Firebase (Auth y Firestore)',
      'SEO técnico',
      'Netlify, DNS y dominios',
      'Web Audio API',
      'Python (Pillow)',
    ],
    languages: [
      { name: 'Español', level: 'Nativo' },
      { name: 'Inglés', level: 'Intermedio' },
    ],
    pdf: '#',
  },
  contact: {
    email: 'nachog.david@gmail.com',
    links: [
      {
        label: 'LinkedIn',
        text: 'ignacio-david-gonzalez',
        url: 'https://www.linkedin.com/in/ignacio-david-gonzalez-752027261/',
      },
      { label: 'GitHub', text: 'd4vidstuff', url: 'https://github.com/d4vidstuff' },
    ],
  },
  notes: ['La Metálica: online', 'Benja no toca el teclado (mentira)', 'Próximo: primer trabajo'],
  calendarYear: '2026',
};
