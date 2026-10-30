// Cuts a built spot (the kit's 600 x 500 scene.svg) to the page's 120 x 113 window, centred on the
// artboard's (300, 250), and prefixes its group ids with su-<step>- so the page's CSS can move them.
// Usage: node cut.mjs <step> <scene.svg> <out.svg>
import { readFileSync, writeFileSync } from 'node:fs';
const [step, src, out] = process.argv.slice(2);
const svg = readFileSync(src, 'utf8');
const inner = svg.replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s*<title>[\s\S]*?<\/title>/, '')
  .replace(/\bid="([^"]+)"/g, (_, id) => `id="su-${step}-${id}"`);
const head = `<!-- Draft spot for the KaneAI session setup, step "${step}": built with design-context's illustration kit (6cfb737) from lifted parts; module in illustrations/kit-drafts/kane-${step}.mjs. Awaiting Rajat's approval. -->\n`;
writeFileSync(out, `${head}<svg xmlns="http://www.w3.org/2000/svg" viewBox="240 193.5 120 113" width="120" height="113" fill="none" aria-hidden="true" focusable="false" class="su-ill su-ill--${step}">${inner}</svg>\n`);
console.log(out);
