// Draft: the KaneAI session setup step "Launching StoreFinder" (kane-playground prototype,
// 30 Oct 2026). r65 whole: a rocket climbing out of its smoke. In the page the rocket bobs along its
// line of flight, its motion marks flicker, and the smoke puffs drift back and fade, one after another.
// Groups: the rocket (paper without smoke and motion, body, fins, nozzle, window), the motion marks,
// and each smoke puff on its own.
// The one accent: the rocket's window ring; the app taking off is the story.
import { place } from '../../../scripts/lib/house.mjs';
import { part } from '../_kane-lib.mjs';

const AT = { x: 300, y: 250, s: 0.92 };

export default {
  title: 'A rocket taking off',
  kind: 'spot',
  items: [
    ...[11, 12, 13, 14, 15, 16].map((i, n) => place(part('rocket-r65', { pick: [i] }), { ...AT, id: `smoke-${n + 1}` })),
    place(part('rocket-r65', { pick: [17, 18, 19] }), { ...AT, id: 'motion' }),
    place(part('rocket-r65', { pick: [3, 4, 5, 6, 7, 8, 9, 10, 20], accentLine: [20] }), { ...AT, id: 'rocket' }),
  ],
};
