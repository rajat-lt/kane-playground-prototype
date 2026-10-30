// Draft: the KaneAI session setup step "Allocating iPhone 18 Pro Max" (kane-playground prototype,
// 30 Oct 2026). r134's phone with r138's magnifier at its lower right, as the house draws a search
// in r105 (a folder with a magnifier at its corner). r138 without its face and its floor shadow:
// lens, neck and grip. In the page the magnifier searches in a small loop at the corner.
// The one accent: the magnifier's grip, a solid shape, as the kit's own examples put it on a
// wrench's grip; finding a device is the story of this step.
import { place } from '../../../scripts/lib/house.mjs';
import { part, phone, PHONE } from '../_kane-lib.mjs';

const MAG = { x: 321, y: 272, s: 0.3, r: 0 };

export default {
  title: 'A phone with a magnifier at its corner',
  kind: 'spot',
  items: [
    place(phone(), { ...PHONE, id: 'phone' }),
    // Paper (no face, no shadow), lens, neck, grip.
    place(part('sad-magnifier-r138', { pick: [3, 4, 11, 5], accent: [5] }), { ...MAG, id: 'magnifier' }),
  ],
};
