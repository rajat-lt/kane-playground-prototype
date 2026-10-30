// Draft: the KaneAI session setup step "Applying session settings" (kane-playground prototype,
// 30 Oct 2026). The automation setup's device spot (r134's phone with r13's three gears at its lower
// right), rebuilt smaller and with the phone where the allocate and install steps hold it. In the page
// the gears turn without end, the small ones twice as fast the other way.
// Each gear is its own group over a white disc, so it hides the phone's edge behind it at any angle.
// The one accent: the large gear's hub, the drive of the set-up.
import { place } from '../../../scripts/lib/house.mjs';
import { part, disc, data, phone, PHONE } from '../_kane-lib.mjs';

const S = 0.4;                       // gears' scale (geometry only; the line stays 2 px)
const BIG = [306, 284];              // the large gear's centre on the artboard
const g = data('gears-r13');
const box = (i) => { const n = (g.layers[i].d.match(/-?\d+(\.\d+)?/g) || []).map(Number); const xs = n.filter((_, j) => j % 2 === 0), ys = n.filter((_, j) => j % 2 === 1); return { cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, r: (Math.max(...xs) - Math.min(...xs)) / 2 }; };
const L = box(1), M = box(9), Sm = box(11);
const at = (c) => [BIG[0] + (c.cx - L.cx) * S, BIG[1] + (c.cy - L.cy) * S];
const gear = (c, layers, opts, id) => {
  const centred = place(part('gears-r13', { pick: layers, ...opts }), { x: -c.cx, y: -c.cy });
  const [x, y] = at(c);
  return [place(disc(c.r + 1 / S), { x, y, s: S, id: `${id}-disc` }), place(centred, { x, y, s: S, id })];
};

export default {
  title: 'A phone being set up, its gears turning',
  kind: 'spot',
  items: [
    place(phone(), { ...PHONE, id: 'phone' }),
    ...gear(M, [9, 10, 5, 6], {}, 'gear-mid'),
    ...gear(Sm, [11, 12, 7, 8], {}, 'gear-small'),            // grey in r13, kept grey
    ...gear(L, [1, 2, 3, 4], { accentLine: [3, 4] }, 'gear-big'),
  ],
};
