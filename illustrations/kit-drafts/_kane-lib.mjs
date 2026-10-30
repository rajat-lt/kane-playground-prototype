// Helpers for the KaneAI playground's session setup spots (kane-playground prototype, 30 Oct 2026).
// Draft only. Same as the automation setup's _setup-lib.mjs: part(name, { pick, accent, accentLine,
// greyAsInk }) builds a part from chosen layers of a lifted drawing, so one drawing can become several
// groups that move on their own in the page; `accent` turns the listed solid layers into the accent fill
// and `accentLine` the listed lines into accent lines (the one accent, on the key object).
import { readFileSync } from 'node:fs';
import { ellipse } from '../../scripts/lib/house.mjs';
const dir = new URL('../../parts/lifted/', import.meta.url);
export const data = (name) => JSON.parse(readFileSync(new URL(name + '.json', dir), 'utf8'));
export function part(name, { pick, accent = [], accentLine = [], greyAsInk = false, label } = {}) {
  const d = data(name);
  const idx = pick ?? d.layers.map((_, i) => i).filter((i) => !d.layers[i].silhouette && !d.layers[i].tag);
  const remap = { grey: 'line', greySolid: 'solid' };
  const layers = idx.map((i) => {
    const L = d.layers[i];
    let k = greyAsInk && remap[L.kind] ? remap[L.kind] : L.kind;
    if (accent.includes(i)) k = 'accent';
    if (accentLine.includes(i)) k = 'accentLine';
    return k === 'accent' || k === 'accentLine' ? { kind: k, d: L.d, step: 100 } : { kind: k, d: L.d };
  });
  return { name: label ?? name, layers };
}
// A white disc under a turning part, so it hides what is behind it at every angle.
export const disc = (r, label = 'disc') => ({ name: label, layers: [{ kind: 'paper', d: ellipse(0, 0, r, r) }] });
// r134's phone, as in the automation setup's device spot: no home button (an iPhone 18 Pro Max has
// none), and its right edge, open where r134's plus badge sat, drawn closed and straight.
export function phone() {
  const p = part('phone-r134', { pick: [0, 2, 3] });
  p.layers[1] = { ...p.layers[1], d: p.layers[1].d + 'L43.85 -36.51Z' };
  return p;
}
// One place for the phone in the three spots that show it (allocate, install, settings), so the
// device holds still from step to step while what happens to it changes.
export const PHONE = { x: 284, y: 250, s: 0.6 };
