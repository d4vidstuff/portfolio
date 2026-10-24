/**
 * Comandos de la terminal de PORTFOLIO-DOS (HELP, PROJECTS, OPEN 1, CV, ...).
 * Para agregar uno, sumá un case al switch y una línea en HELP.
 */
import { CONTENT } from '../content.js';
import { go, goBack } from '../desk/actions.js';

/**
 * @param {string} raw lo que escribió la persona
 * @param {{ print: (s: string) => void, clear: () => void, openProject: (id: string) => void }} io
 */
export function runCommand(raw, { print, clear, openProject }) {
  const [cmd, ...args] = raw.toLowerCase().split(/\s+/);
  switch (cmd) {
    case '':
      return;
    case 'help':
    case 'ayuda':
      print(
        [
          'Comandos:',
          '  ABOUT       quién soy',
          '  PROJECTS    lista de proyectos',
          '  OPEN <n>    abre un proyecto (ej. OPEN 1)',
          '  CONTACT     datos de contacto',
          '  CV          ir al cajón del CV',
          '  DATE        fecha y hora',
          '  CLS         limpiar la pantalla',
          '  EXIT        apagar y volver al escritorio',
          '',
        ].join('\n'),
      );
      break;
    case 'about':
    case 'sobre':
    case 'whoami':
      print(CONTENT.name + ' · ' + CONTENT.role + ' · ' + CONTENT.location);
      print(CONTENT.bio + '\n');
      break;
    case 'projects':
    case 'proyectos':
    case 'dir':
    case 'ls':
      CONTENT.projects.forEach((p) => print(`  ${p.id}  ${p.name}  (${p.year})`));
      print('Usá OPEN <número> para abrir uno.\n');
      break;
    case 'open':
    case 'abrir': {
      const q = args[0] || '';
      const p = CONTENT.projects.find((x) => x.id === q || x.id === q.padStart(2, '0'));
      if (p) {
        print('Abriendo ' + p.name + '...\n');
        openProject(p.id);
      } else print('Proyecto no encontrado. Probá PROJECTS.\n');
      break;
    }
    case 'contact':
    case 'contacto':
      print('  EMAIL     ' + CONTENT.contact.email);
      CONTENT.contact.links.forEach((l) => print('  ' + l.label.toUpperCase().padEnd(10) + l.text));
      print('');
      break;
    case 'cv':
      print('El CV está en la cajonera. Apagando...\n');
      setTimeout(() => go('drawer'), 700);
      break;
    case 'benja':
    case 'gato':
      print('BENJA.GAT: proceso en segundo plano. Estado: durmiendo.\n');
      break;
    case 'date':
    case 'fecha':
      print(new Date().toLocaleString('es-AR') + '\n');
      break;
    case 'cls':
    case 'clear':
      clear();
      break;
    case 'exit':
    case 'apagar':
    case 'salir':
      goBack();
      break;
    default:
      print('Comando o nombre de archivo incorrecto.\n');
  }
}
