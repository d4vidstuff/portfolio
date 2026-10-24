# Escritorio 86

Portfolio de **Ignacio David Gonzalez**, desarrollador web frontend de Venado Tuerto, Santa Fe.

Un escritorio retro en 3D (estilo PS1, con dithering) que se recorre con el mouse:

- **PC:** sistema operativo falso con proyectos, "sobre mí" y una terminal (`HELP`).
- **Cajonera:** el CV, en el cajón del medio. Si nadie lo abre, se sacude.
- **Módem:** datos de contacto.
- **Disquetes:** cada uno abre un proyecto.
- **Benja:** duerme al lado del teclado y al minuto se despierta a pedir caricias.

Sin build ni dependencias: HTML, CSS y módulos de JavaScript que el navegador carga directo.
Three.js r128 viene de cdnjs.

## Cómo está organizado

```
index.html            Solo el marcado. Carga Three.js y js/main.js.
css/                  Un archivo por parte de la interfaz.
  base.css            Colores, tipografías y reset.
  hud.css             Barra superior, etiqueta del mouse, mensajes.
  overlays.css        CV (carpeta), contacto (ficha) y notas.
  computer.css        Monitor CRT y sistema operativo falso.
  cat.css             Globo de Benja y corazones.
  text-mode.css       Modo texto.
  loader.css          Pantalla de carga.
audio/                Maullido y sacudida.
js/
  main.js             Punto de entrada. Si no hay WebGL, muestra el modo texto.
  content.js          TODO el texto: nombre, bio, proyectos, CV, contacto, notas.
  core/               Utilidades: estado compartido (state.js), DOM y animaciones.
  ui/                 Interfaz HTML: mensajes, modo texto, capas y barra superior.
  audio/sound.js      Sonido (Web Audio). Casi todo se genera por código.
  scene/              La escena 3D.
    renderer.js       Renderer, cámara y post-procesado (post-shader.js).
    materials.js      Materiales con el "temblor" de vértices de PS1.
    textures.js       Texturas dibujadas con canvas 2D.
    build.js          Arma la escena llamando a cada archivo de objects/.
    objects/          Un archivo por grupo de objetos (cajonera, PC, pared, Benja...).
  desk/               Interacción con el escritorio.
    start.js          Carga, registro de objetos clickeables y botón ENTRAR.
    loop.js           Lo que pasa en cada cuadro.
    picking.js        Qué objeto hay bajo el mouse.
    actions.js        Qué hace cada objeto al tocarlo.
    camera.js         Movimientos de cámara y adaptación a la pantalla.
    drawer-alert.js   El cajón que se agita.
  cat/                Benja despierto: poses, comportamiento, caricias y globo.
  computer/           PORTFOLIO-DOS: ventanas (os.js) y comandos (terminal.js).
tools/smoke.py        Prueba automática en Chromium (ver abajo).
```

## Tareas comunes

| Quiero... | Archivo |
| --- | --- |
| Cambiar textos, proyectos o el CV | `js/content.js` |
| Agregar un comando a la terminal | `js/computer/terminal.js` |
| Cambiar qué hace un objeto al tocarlo | `js/desk/actions.js` |
| Mover o agregar un objeto 3D | `js/scene/objects/` y registrarlo en `js/desk/start.js` |
| Ajustar cuándo se despierta Benja | `js/desk/start.js` (`Cat.next`) y `js/cat/benja.js` |
| Cambiar colores de la interfaz | `css/base.css` |

## Correr en local

Los módulos y los sonidos necesitan un servidor (no funcionan abriendo el archivo con doble click):

```
python3 -m http.server
```

y abrí http://localhost:8000.

## Calidad de código

```
npx prettier --write .     # formato
npx eslint js              # variables sin definir, imports sin usar
python3 tools/smoke.py . index.html   # prueba en Chromium (requiere Playwright)
```
