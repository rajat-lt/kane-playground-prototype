// Draft: the KaneAI session setup step "Applying app permissions" (kane-playground prototype,
// 30 Oct 2026). r82 whole: a hand dangles a key over an open hand, granting access. In the page the
// key swings gently from the fist while the open hand waits, as the device must confirm each permission.
// Two groups: the hands (with the whole silhouette's paper) and the key (chain, bow, shaft and bit,
// with a paper in its bow), so the key can swing on its own.
// The one accent: the key, the permission being handed over.
import { place } from '../../../scripts/lib/house.mjs';
import { part, data } from '../_kane-lib.mjs';

const AT = { x: 300, y: 250, s: 0.7 };
const bow = data('handing-key-r82').layers[14].d;

export default {
  title: 'A hand passing a key to an open hand',
  kind: 'spot',
  items: [
    // Paper (whole silhouette), the open hand in grey, the fist and its sleeve.
    place(part('handing-key-r82', { pick: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16] }), { ...AT, id: 'hands' }),
    place({ name: 'key', layers: [{ kind: 'paper', d: bow }, ...part('handing-key-r82', { pick: [13, 14, 15, 17], accentLine: [13, 14, 15], accent: [17] }).layers] }, { ...AT, id: 'key' }),
  ],
};
