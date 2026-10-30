// Draft: the KaneAI session setup step "Installing storefinder_ios.ipa" (kane-playground prototype,
// 30 Oct 2026). The same phone as the allocate step, with r106's box above its top right corner:
// the app, packed, on its way in. In the page the box drops into the phone and fades, again and again.
// The one accent: the box's solid underside; the app being installed is the story.
import { place } from '../../../scripts/lib/house.mjs';
import { part, phone, PHONE } from '../_kane-lib.mjs';

const BOX = { x: 318, y: 222, s: 0.36 };

export default {
  title: 'A box dropping into a phone',
  kind: 'spot',
  items: [
    place(phone(), { ...PHONE, id: 'phone' }),
    // Paper, solid underside (accent), outline, top edge, front edge, hand hole, right edge.
    place(part('box-r106', { pick: [0, 1, 2, 3, 4, 5, 6], accent: [1] }), { ...BOX, id: 'box' }),
  ],
};
