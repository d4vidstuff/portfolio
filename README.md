# Escritorio 86

Portfolio de **Ignacio David Gonzalez**, desarrollador web frontend de Venado Tuerto, Santa Fe.

Un escritorio retro en 3D (estilo PS1, con dithering) que se recorre con el mouse:

- **PC:** sistema operativo falso con proyectos, "sobre mí" y una terminal (`HELP`).
- **Cajonera:** el CV, en el cajón del medio.
- **Módem:** datos de contacto.
- **Disquetes:** cada uno abre un proyecto.
- **Benja:** duerme al lado del teclado y al minuto se despierta a pedir caricias.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `escritorio-86.html` | Fuente de la página. Todo el contenido está en el objeto `CONTENT`, al principio del script. |
| `index.html` | Documento completo listo para publicar. Se genera con `python3 build.py`. |
| `audio/` | Sonidos: maullido, sacudida (ventanas y alerta del cajón). |

## Tecnologías

Three.js (r128, desde cdnjs), shader GLSL propio para el pixelado y el dithering, Web Audio API y HTML/CSS/JS sin compilación.

## Correr en local

Abrí `index.html` con un servidor estático (los sonidos se cargan con `fetch`):

```
python3 -m http.server
```
