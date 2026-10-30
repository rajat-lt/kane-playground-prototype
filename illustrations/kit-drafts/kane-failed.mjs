// Draft: the KaneAI session setup's failure spot, here for "Applying app permissions" (kane-playground
// prototype, 30 Oct 2026). The permissions spot as drawn, held still, with r121's x badge in the open
// space left of the key: the hand-over did not complete. Shown still in the page.
// The one accent stays the key, as in the running spot; the badge is solid black, as r121 draws it.
import { place } from '../../../scripts/lib/house.mjs';
import { part, data } from '../_kane-lib.mjs';

const AT = { x: 300, y: 250, s: 0.7 };
const bow = data('handing-key-r82').layers[14].d;
const BADGE = { x: 277, y: 244, s: 0.42 };

export default {
  title: 'A hand passing a key to an open hand, with a cross badge',
  kind: 'spot',
  items: [
    place(part('handing-key-r82', { pick: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16] }), { ...AT, id: 'hands' }),
    place({ name: 'key', layers: [{ kind: 'paper', d: bow }, ...part('handing-key-r82', { pick: [13, 14, 15, 17], accentLine: [13, 14, 15], accent: [17] }).layers] }, { ...AT, id: 'key' }),
    place(part('x-badge-r121', { pick: [0] }), { ...BADGE, id: 'badge' }),
  ],
};
