/**
 * Todo el texto del portfolio: nombre, bio, proyectos, CV, contacto y notas.
 * Es el único archivo que hay que tocar para cambiar el contenido.
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
      desc: 'Sitio completo para un negocio local de metalmecánica. Interfaz en React 18 sin herramientas de compilación, fondos y efectos animados con WebGL (aurora, degradé con grano, galería deformable, botones con brillo), un panel de administración con Firebase para editar textos, colores y fotos, y SEO técnico con datos estructurados. Publicado en Netlify con dominio propio .com.ar.',
      tech: ['React 18', 'WebGL / OGL', 'Firebase', 'SEO', 'Netlify'],
      link: 'https://lametalica.com.ar',
    },
    {
      id: '02',
      name: 'La Metálica · Panel de administración',
      year: 'Oct 2026',
      desc: 'Panel privado para que el negocio edite su web sin tocar código. Ingreso con Google limitado a una sola cuenta, contenido guardado en Cloud Firestore con reglas de seguridad, fotos comprimidas en el navegador antes de subirlas y vista previa en vivo antes de guardar. La web lee el contenido al cargar y lo guarda en el navegador para abrir rápido la próxima vez.',
      tech: ['Firebase Auth', 'Cloud Firestore', 'React'],
      link: 'https://lametalica.com.ar',
    },
    {
      id: '03',
      name: 'La Metálica · Minijuego',
      year: 'Oct 2026',
      desc: 'Un minijuego dentro del sitio: escenario y tijera en SVG animado a 60 cuadros por segundo, con efectos de sonido y música generados por código con la Web Audio API, sin un solo archivo de audio.',
      tech: ['SVG', 'JavaScript', 'Web Audio API'],
      link: 'https://lametalica.com.ar',
    },
    {
      id: '04',
      name: 'Portafolio',
      year: 'Oct 2026',
      desc: 'Este portfolio: un escritorio retro en 3D con Three.js, post-procesado con dithering en un shader propio, sonidos con la Web Audio API y un gato que pide caricias.',
      tech: ['Three.js', 'GLSL', 'Web Audio API'],
      link: 'https://github.com/d4vidstuff/portfolio',
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
