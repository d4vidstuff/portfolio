/**
 * Arma la escena completa: crea los materiales compartidos y llama a cada
 * archivo de objects/. Para agregar un objeto nuevo, creá su archivo y sumalo acá.
 */
import { lambert } from './materials.js';
import { textures } from './textures.js';
import { buildRoom } from './objects/room.js';
import { buildWall } from './objects/wall.js';
import { buildOrganizer } from './objects/organizer.js';
import { buildComputer } from './objects/computer.js';
import { buildModem } from './objects/modem.js';
import { buildDeskItems } from './objects/desk-items.js';
import { buildBenja } from './objects/benja.js';
import { buildLights } from './objects/lights.js';

export function buildScene() {
  const mats = {
    desk: lambert(0xffffff, { map: textures.desk }),
    mat: lambert(0xffffff, { map: textures.mat }),
    white: lambert(0xbfbab0),
    beige: lambert(0xffffff, { map: textures.beige }),
    beigeDk: lambert(0x8c8166, { map: textures.beige }),
    dark: lambert(0xffffff, { map: textures.dark }),
    black: lambert(0x0b0b0b),
    metal: lambert(0x7a7c78),
    plastic: lambert(0x18191a, { map: textures.dark }),
    red: lambert(0x8c1a1f),
    mouse: lambert(0xa3191f),
    wall: lambert(0xffffff, { map: textures.wall }),
    floor: lambert(0xffffff, { map: textures.floor }),
    furW: lambert(0xe6e3da),
    furD: lambert(0x36363b),
  };

  buildRoom(mats);
  buildWall(mats);
  buildOrganizer(mats);
  buildComputer(mats);
  buildModem(mats);
  buildDeskItems(mats);
  buildBenja(mats);
  buildLights(mats);
}
