# Session setup spots: kit drafts

Six spot illustrations for the KaneAI playground's session setup state (spec §6), built with design-context's illustration kit (`illustration-style-kit/skill/lambdatest-illustration`, at `6cfb737`) from parts lifted out of LambdaTest's own drawings. They are drafts: the kit says only Rajat approves them, and nothing was committed to design-context.

| File | Step | Parts | Checker |
|---|---|---|---|
| `kane-allocate.mjs` | Allocating iPhone 18 Pro Max | `phone-r134` at 0.6 (no home button; right edge drawn closed), `sad-magnifier-r138` at 0.3 without face and shadow | PASS, accent 0.135 (the magnifier's grip) |
| `kane-install.mjs` | Installing storefinder_ios.ipa | The same phone, `box-r106` at 0.36 | PASS, accent 0.101 (the box's underside) |
| `kane-settings.mjs` | Applying session settings | The same phone, `gears-r13` at 0.4 (the automation setup's device spot, smaller) | PASS, accent 0.060 (the large gear's hub) |
| `kane-permissions.mjs` | Applying app permissions | `handing-key-r82` at 0.7 | PASS, accent 0.086 (the key) |
| `kane-launch.mjs` | Launching StoreFinder | `rocket-r65` at 0.92 | PASS, accent 0.102 (the window's ring) |
| `kane-failed.mjs` | Applying app permissions, failed (v1; unused since v2, where the step warns and the setup carries on, spec §13.5) | `handing-key-r82` at 0.7, `x-badge-r121` at 0.42 | WARN, line evenness 0.221 from the solid badge (the hands alone: 0.174); accent 0.068 (the key) |

Each `.png` is the kit's 2x preview of its 600 × 500 artboard. `_kane-lib.mjs` holds the shared helpers: `part()` picks layers of a lifted drawing so one drawing can become several moving groups, `phone()` is r134's phone as the automation setup drew it, and `PHONE` is where the three phone spots hold it.

## Rebuild

From a design-context checkout, in `illustration-style-kit/skill/lambdatest-illustration/`:

1. Copy `_kane-lib.mjs` to `gallery/pending/_kane-lib.mjs`.
2. Copy each `kane-<step>.mjs` to `gallery/pending/kane-<step>/scene.mjs`.
3. Run `node scripts/build.mjs gallery/pending/kane-<step>/scene.mjs` for the SVG, the 2x PNG and the check report.
4. Cut it for the page: `node cut.mjs <step> gallery/pending/kane-<step>/scene.svg src/illustrations/kane-<step>.svg` (`cut.mjs` is in this folder). It sets `viewBox="240 193.5 120 113"`, centred on the artboard's (300, 250), and prefixes the group IDs with `su-<step>-` so CSS can move them.

The kit scales a part's geometry and never its 2px line, so the spots are built at the page's size rather than scaled down in the browser.
