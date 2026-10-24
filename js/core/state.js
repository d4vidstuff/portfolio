/**
 * Estado compartido entre módulos.
 *
 * Los módulos ES no pueden reasignar variables importadas, así que todo lo que
 * varios archivos leen y escriben vive en este objeto.
 */

export const app = {
  /** 'loading' mientras carga, 'idle' en el escritorio, 'focus' con un objeto abierto. */
  state: 'loading',
  /** true mientras corre una animación que no se puede interrumpir (cámara, cajón...). */
  busy: false,
  /** Objeto en foco: 'pc', 'drawer', 'modem', 'notes', 'poster' o 'diego'. */
  current: null,
  /** Pantalla vertical (celular): cambia cámara y controles. */
  mobile: false,
  /** Modo texto activo. */
  textOn: false,
  /** false si el navegador no tiene WebGL; entonces solo existe el modo texto. */
  glOK: true,
  /** Índice del disquete metido en la PC, o -1. */
  insertedFloppy: -1,
};
