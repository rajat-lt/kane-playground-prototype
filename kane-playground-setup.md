# Pattern: KaneAI playground, session setup state

What the KaneAI agent playground shows while a real device app session is set up, from the moment the session opens until the app is on screen, and when a setup step fails. Built 30 Oct 2026 from Rajat's brief and the PM's two prototype screens, on top of `design-context/patterns/kane-agent-playground.md` and the automation details prototype's setup state as Rajat reviewed it up to its setup v4 (`rajat-lt/automation-details-prototype`, spec §12 to §12.14).

Every component and prop below was read from `design-context/COMPONENTS.md` at `6cfb737`. Tokens are generated from `data/tokens.json` on design-context `main` (`scripts/tokens.mjs`, 135 tokens). Icons are lucide 1.58.0, each name checked in the installed package. Mock data only. Items marked **[proposed]** are decisions, not observations, and wait for Rajat.

---

## 1. The brief (30 Oct 2026)

Rajat's brief, written *item 1* to *item 12* below:

1. Inside KaneAI's playground, build a loading state like the automation details page's, showing the initial setup.
2. The two attached screens come from the PM's prototype: one while the session sets up, one when it fails.
3. The steps are much like the automation setup's, without Apple Pay, which this one skips.
4. Use the steps on the screens. Leave out the details in their helper lines for now: the playground shows them elsewhere.
5. Make the animated illustration a little smaller.
6. Build the failure state too, without the banner, the details at the end and the buttons: Rajat adds those as separate components.
7. There are no retries here, so leave them out, but say when a sub-step takes unusually long.
8. Show three dots at the end of the sub-step's words, and check that they really show. They still do not show in the automation prototype; leave that one as it is and focus on this one.
9. Create another KaneAI playground repo (not the tldraw one) if none exists, using design-context's components.
10. Revise the illustrations, or make new ones, to fit these steps, and animate them in an auto-playing loop, like a GIF.
11. Do not invent anything while making, revising or animating them.
12. Use the motion library shared earlier (oil-motion).

**The PM's screens** (reference, as the brief says):
- *K1, setting up:* a dark card titled *Setting up your session* with a spinner, a meta line (*iPhone 18 Pro Max · iOS 27 · storefinder_ios.ipa v2.4*) and five steps on a rail: three done (blue discs with white ticks), *Applying app permissions* running (a ring spinner, bold), *Launching StoreFinder* pending (a numbered circle, muted). Each step has a grey helper line: *iOS 27 · real device*, *v2.4*, *Auto-Accept Alerts*, *Location: While using the app · Precise Location: On*, *Ready when the app is on screen*.
- *K2, failed:* a red banner (*Couldn't start the session*, an *R6* badge, a paragraph on why), the same five steps with *Applying app permissions* failed (a red disc with a cross, red text, *Location was not applied*), three buttons (*Return to Advanced Settings*, *Retry*, *Exit*) and a details table (App, Device, Permission, Not attempted, Reason).

**Rajat's answers to the build questions** (30 Oct 2026, binding):
- The five steps are **main steps, each with its own sub-steps**: the title is the current step, and the line under it types its sub-steps, as on the automation stage.
- The sub-steps are the ones proposed in §4, marked [proposed].
- The spots are **kit drawings moved in CSS**, not oil-motion (C1).
- The stage sits **in the device pane**, where the app will appear; the step pane shows its empty list, and the composer waits until the app is on screen.
- A failure gets **its own spot**: the failed step's drawing with the kit's x badge, still.
- *A little smaller* means **smaller at the same shape**: about 120 × 113, rebuilt in the kit at that size so the line stays 2px.

## 2. Structure

The playground's four zones (`kane-agent-playground.md` §1) stay as they are; the setup lives in the device pane.

| Zone | While setting up | Once the app is on screen | When a step fails |
|---|---|---|---|
| Top bar | `KaneAI`, bell, avatar, `Upgrade Now` | same | same |
| Session bar | Agent state *Setting up* [proposed], `Adaptive`, *iPhone 18 Pro Max · iOS 27*, variables, secrets, `Discard Test`, `Save` (inactive) | *System idle* | *Error* |
| Step pane | *0 steps*, history and `Pause Test` inactive, empty state *Setting up your session*, composer inactive | Empty state *Describe what to test* (the pattern's), composer available | Empty state *Session failed to start*, composer inactive |
| Device pane | **The setup stage** | The device, StoreFinder on screen, foot *System idle* · `Live` | **The stage, failed** |

**The stage**, top to bottom, centred in the pane:
1. The current main step's spot, 120 × 113, looping.
2. The main step's name, 16px bold (an `h2`).
3. One line, the current sub-step, typed out, shimmering, with three running dots after it.
4. A reserved line for the long-step note.
5. The five main steps on one rail: green tick done, blue spinner running, dashed circle pending, red cross failed.

### Component inventory

| Component | Role | Notes |
|---|---|---|
| `LTLoader` | The running main step's spinner | `size="small"`; its look is the automation spec's Primer spinner (§12.8 there) |
| `LTBlankSlate` | The step pane's empty states | `heading`, `description`, `narrow` |
| `LTTextarea` | The composer | `disabled` while the app is not on screen (documented prop) |
| `LTIconButton` | History, composer modes, Send, variables, secrets, bell, device panel toggle | Every one has `ariaLabel` and a tooltip; Send is `variant="primary"` |
| `LTButton` | `Pause Test`, `Discard Test`, `Save`, `Upgrade Now` | `inactive` where it waits |
| `LTTag` | `Adaptive` (`variant="default"`), `Live` (`variant="danger"`) | `labelStyle="outline"`, `size="small"` |
| `LTSegmentedControl` | The prototype bar's flow switch only | Not product UI |

**Custom:** the stage (spot, sub-step carousel, step list), the device frame and the session bar (a customised toolbar, as the pattern says, not an `LTFlash`).

## 3. Behaviour, item by item

1. **Five main steps with sub-steps** (items 3 and 4, Rajat's answer). The main steps are the PM's, in the PM's words. Each has its own sub-steps (§4), shown one at a time under the step's name, as the automation stage does: a sub-step rises in and types itself out; when it finishes it shows a green tick in front of its words for half a second, keeps its dots, then rises out as the next rises in (the automation setup's v3 and v4).
2. **The helper lines are left out** (item 4). Device, OS, app version, settings and permissions are not on the stage; the session bar carries the device and OS, as the pattern's environment slot does.
3. **The spot is a little smaller** (item 5): 120 × 113 against the automation stage's 144 × 136, the same shape. Each spot is built in the kit at this size, since the kit scales a part's geometry and never its 2px line (`SKILL.md`), and cut to a 120 × 113 window centred on the artboard's (300, 250).
4. **The failure state** (item 6), without the banner, the details and the buttons:
   - The failed step's spot holds still, with the kit's x badge (§6).
   - The title states the failure: *App permissions failed to apply* [proposed], in `danger.fg`.
   - The line keeps the failed sub-step, *Waiting for the device to confirm*, in `danger.fg` with a red cross in front, where a finished sub-step shows its tick. No dots and no shimmer, since nothing runs any more.
   - The list marks the step with a red cross and its name in `danger.fg`, semibold; *Launching StoreFinder* stays pending.
   - Screen readers hear *App permissions failed to apply.* once; the line reads *Waiting for the device to confirm, failed*.
   - The stage stays as it is until something else happens; Rajat's banner, details and buttons go with it.
5. **No retries; long sub-steps get the note** (item 7). There is no attempt line. A sub-step that runs past the threshold (8 seconds in the prototype, question 5 for the product) keeps shimmering and adds the automation setup's note below it, unchanged: *Still working on this step. It finishes on its own.* Screen readers hear it once. In the demo, *Installing your app* runs 14 seconds.
6. **Three dots at the end of the sub-step's words** (item 8):
   - Running, the dots appear one by one, hold, and fade together every 1.5 seconds, after the words have typed out. Done, they keep running beside the tick until the line rises out (as the automation setup's v4 built it; question 3). Failed, they are gone.
   - **Why the automation prototype's dots never showed:** its CSS set them with `animation: 1.5s ease-in-out infinite both` and the names on separate rules. Vite's build minifies CSS, and the minifier rewrote that name-less shorthand as `animation: none`. The built rule kept only the names, so each dot ran a 0-second animation once and stayed at its base opacity of 0. Measured on the live site, 30 Oct 2026: `animation-duration: 0s`, `animation-iteration-count: 1`, `opacity: 0`, no running animation. The dev server does not minify, which is where they were checked before. Left alone there, as the brief asks.
   - **Here** the dots use longhand properties, which the minifier keeps. Checked on the production build, served locally (30 Oct 2026): each dot runs `su-dot-1` to `su-dot-3`, 1.5s, infinite, fill `both`; sampled through the cycle, their opacities go 0 0 0 at 5%, 0.77 0 0 at 20%, 1 0.77 0 at 40%, 1 1 0.77 at 60%, 1 1 1 at 75% and 0.23 0.23 0.23 at 95%. Every other animation in the built CSS keeps its name and timing.
7. **The spots and their motion** (items 10 to 12). One spot per main step, from parts lifted out of LambdaTest's own drawings, built and checked with design-context's illustration kit at `6cfb737` (§6). Each loops for as long as its step runs, in CSS: transform and opacity only, on the groups the kit draws. With reduced motion they stay still in the pose the kit drew. oil-motion is not used (C1).
8. **Announcements**: one hidden status line says each main step as it starts (*Installing storefinder_ios.ipa. Step 2 of 5.*), the long-step note once, then the outcome (*StoreFinder is on screen.* or *App permissions failed to apply.*). The list is not live, as in the automation setup (its C74).
9. **The prototype bar** (not product UI): a dashed bar with the flow (*Success*, *Failure*), Pause or Play, Next Step and Restart. Next Step goes to the next sub-step as it starts, to the moment a long sub-step adds its note, and to the end of the flow. Switching the flow starts it again.
10. **The playground around it** [proposed]:
    - The step pane's empty state names what is happening and what the user gets (`ux-text-guidelines.md` §3, Empty states): *Setting up your session*, *Describe what to test as soon as StoreFinder is on screen.* The PM's card title lives on here.
    - The composer and its mode buttons wait (inactive) until the app is on screen; history and `Pause Test` wait for a first step; `Save` waits for something to save. `Discard Test` stays available, though not wired in the prototype.
    - Once the app is on screen, the stage fades out and the device fades in: a plain phone bezel showing StoreFinder's name (§8), with the pattern's foot, *System idle* and `Live`.

## 4. Sub-steps [proposed]

Rajat chose these on 30 Oct 2026 as proposals, to be checked against KaneAI's backend.

| Main step (the PM's) | Sub-steps | Source |
|---|---|---|
| Allocating iPhone 18 Pro Max | Finding an available iPhone 18 Pro Max · Allocating the device | The automation setup brief's backend list: the system checks the device's availability, then queues it (worded as the automation stage words them) |
| Installing storefinder_ios.ipa | Checking your app · Installing your app | The same list: it checks the app, then installs it |
| Applying session settings | Configuring the device · Reading your settings · Applying each setting | The same list: it sets up the config, lists the settings, then applies them one by one |
| Applying app permissions | Applying each permission · Waiting for the device to confirm | The PM's failure screen: permissions go one at a time (*Not attempted: Precise Location*), and the device must confirm each before launch |
| Launching StoreFinder | Opening StoreFinder · Waiting for the app to show on screen | The PM's helper line *Ready when the app is on screen* |

The failure flow stops 6 seconds into *Waiting for the device to confirm*, as the PM's failure screen describes.

## 5. States

| State | Stage | Elsewhere |
|---|---|---|
| Setting up | The step's spot looping, its name, the sub-step typing then shimmering with dots, the list | Session bar *Setting up*; step pane *Setting up your session*; composer inactive |
| A long sub-step | As above, plus the note | One announcement of the note |
| A sub-step done | Its tick in front, dots still running, for half a second, then it rises out | |
| A step done | Its tick in the list; the next step's spot and name come in with its first sub-step | One announcement per step |
| Failed | The failed spot still, *App permissions failed to apply* in red, the failed sub-step with a red cross, the list with the failed step red | Session bar *Error*; step pane *Session failed to start*; composer inactive |
| Ready | Gone; the device with StoreFinder on screen | Session bar *System idle*; the pattern's empty state; composer available |
| Reduced motion | Spots still; words whole, no typing; no shimmer; the dots and the spinner keep going, as Primer asks of loading indicators | |

## 6. The illustrations

Built in a detached scratch copy of design-context (nothing committed there), each from lifted parts with `place()`, checked with the kit's checker as a spot, looked at at 3x and 1x, then cut to the page's 120 × 113 window. Modules, the shared helpers, the cut script and 2x previews are in `illustrations/kit-drafts/`; the cut SVGs in `src/illustrations/`. They are drafts: the kit says only Rajat approves.

| Step | Parts | The one accent | Check | Motion in the page |
|---|---|---|---|---|
| Allocating iPhone 18 Pro Max | `phone-r134` at 0.6 (no home button, its open right edge drawn closed, as in the automation's device spot) and `sad-magnifier-r138` at 0.3 without its face and shadow, at the phone's lower right, as the house draws a search in r105 | The magnifier's grip, a solid shape, as the kit puts it on a wrench's grip: 0.135 | PASS | The magnifier circles at the corner, 3.2s |
| Installing storefinder_ios.ipa | The same phone in the same place, `box-r106` at 0.36 over its top right corner | The box's solid underside: 0.101 | PASS | The box fades in, holds, then drops into the phone and fades, 2.4s |
| Applying session settings | The same phone, `gears-r13` at 0.4: the automation's device spot, smaller | The large gear's hub: 0.060 | PASS | The gears turn without end, the small ones twice as fast the other way, 8s |
| Applying app permissions | `handing-key-r82` at 0.7: a hand dangles a key over an open grey hand | The key (chain, bow, shaft and bit): 0.086 | PASS | The key swings 8° each way about the top of its chain, 2.4s |
| Launching StoreFinder | `rocket-r65` at 0.92, with its smoke and motion marks | The window's ring: 0.102 | PASS | The rocket bobs 2px along its line of flight (1.6s), the motion marks flicker (0.8s), the six smoke puffs drift back and fade one after another (2.4s) |
| Failed: Applying app permissions | The permissions spot as drawn, with `x-badge-r121` at 0.42 in the open space left of the key | The key: 0.068 | WARN, line evenness 0.221: the solid badge's edges; the same hands without it measure 0.174 | Still |

- **The phone holds still across the first three spots**, at the same place and size, so the device stays put while what happens to it changes.
- **Every motion loops on the kit's own groups**, with rigid transforms only: nothing in a drawing is redrawn, bent or added. The loops were checked frame by frame at 0%, 25%, 50% and 75% of each cycle (the browser pane does not play animations while hidden).
- **Subject sizes**: 0.185 to 0.214 of the artboard's height, a 100px band; every spot is centred within 0.013.

## 7. Conflicts recorded

| # | Topic | Brief or reference | Guideline or source | Built | Why |
|---|---|---|---|---|---|
| C1 | oil-motion (item 12) | Use oil-motion | oil-motion's own `SKILL.md` and README, read 30 Oct 2026: it turns AI-generated video into scroll, pointer or state driven web animation; it is not for motion that CSS, JS, SVG or Lottie can do, nor for one-off illustrations; generating needs a ZenMux key and every generation is billed; its local route needs FFmpeg, absent here | Kit drawings moved in CSS | Rajat's answer, 30 Oct 2026 |
| C2 | Theme | K1 and K2 are dark | `ux-persona.md`: light theme only; `guidelines/README.md` §1 | Light | Reference only |
| C3 | Step marks | K1: blue discs with white ticks, a ring spinner, a numbered circle for pending | Rajat's automation setup v2 item 5: green tick done, blue spinner running, dashed circle pending | The automation set, plus a red cross for failed | Rajat's own rule for this pattern |
| C4 | The card's title | K1's *Setting up your session* over the steps | Rajat's answer: the title is the current main step | The step's name on the stage; *Setting up your session* is the step pane's empty-state heading | Both kept, each where it says something |
| C5 | Agent status while setting up | Outside the brief | `mock-data.md`: agent status is `system idle`, `running`, `draft`, `error`, with no word for a session being set up | *Setting up* [proposed]; *Error* on failure | Question 2 |
| C6 | Session bar counters | The pattern shows two unlabelled counters | `kane-agent-playground.md` open question 1: what they count is unknown | Left out | An unlabelled count of 0 tells the user nothing |
| C7 | Looping spots (item 10) | Loop like a GIF | WCAG 2.2.2 (Level A): motion that starts by itself, lasts over 5 seconds and sits beside other content needs a way to pause, stop or hide it, unless essential | Loops while the step runs; still with reduced motion; no pause control | Brief wins; question 4, as the automation setup's C80 |
| C8 | Shimmer on every running sub-step | The automation setup's v3 item 5 | The same criterion | On every running sub-step; none with reduced motion | As the automation setup's C81 |
| C9 | Dots beside a tick | The automation setup's v4 item 2 | The dots mean running; the tick means done | Both, for half a second | Question 3, the automation setup's question 93 |
| C10 | The PM's failure words | K2: *Couldn't start the session*, *Location was not applied*, *Permission not confirmed by the device before launch* | `ux-text-guidelines.md` §1 rule 2, no negation; §5, *{object} failed to {verb}* | Not built (Rajat adds the banner and the details) | For those components: *Session failed to start*, *Location failed to apply*, *The device failed to confirm it before launch* |
| C11 | Top bar product buttons | Outside the brief | `topbar.md` §2: KaneAI has announcements only; `kane-agent-playground.md` §1: a tunnel; neither defines the control | Both left out | Nothing to build them from |

## 8. Gaps found in design-context

- **No device pane.** `kane-agent-playground.md` describes a live browser; a real device app session's pane (bezel, rotate, home, device controls) is not described. The prototype shows a plain bezel with the app's name.
- **No devices or apps in `mock-data.md`.** *iPhone 18 Pro Max*, *iOS 27*, *storefinder_ios.ipa* and *StoreFinder* come from the PM's screens.
- **The pane's 8px corner is not a token.** The pattern's live browser has `borderRadius: "8px"`; Primer's radii are 3, 6 and 100. The device pane uses `radius.2`, 6px.
- **No agent status for setting up** (C5).
- **The session bar's icon buttons have no icons** (`icon={null}` in the pattern). Lucide's `Variable` and `KeyRound` stand in for variables and secrets; the composer's modes use `Type` and `SquareMousePointer`, Send uses `Send`, history uses `History`.
- **No guideline for setup or loading states with steps.** The automation spec's §12.10 checklist applies here too.

## 9. Design decisions [proposed]

- **The PM's *Setting up your session* becomes the step pane's empty state**, with *Describe what to test as soon as StoreFinder is on screen.* It tells the user why the composer waits and when it opens. *Rejected:* a title above the stage, which would compete with the step's name.
- **The failure title is the step's own failure**, *App permissions failed to apply*. *Rejected:* keeping *Applying app permissions*, which reads as still running; *Session failed to start* on the stage, which Rajat's banner will say (one narrator per screen).
- **A failed sub-step shows a cross where a finished one shows its tick**, in front, hung outside the line, so the words stay where they were.
- **The failure spot is the failed step's own drawing, still, with the kit's x badge.** Only *Applying app permissions* has one; the other four would follow the same recipe (question 7).
- **One phone across the first three spots**, at one place and size.
- **The composer waits** until the app is on screen. *Rejected:* letting the user type an objective during setup, which may be worth it later (question 8).
- **`Save` waits** for something to save; **`Discard Test` stays available**, since leaving a session that is setting up is a fair thing to want.
- **The prototype bar sits over the device foot's empty middle**, clear of the activity on its left and the `Live` tag on its right.

## 10. Copy

Every string follows `ux-text-guidelines.md`: sentence case, no negation, no em-dashes, full stops on body text only.

| Where | Text | Notes |
|---|---|---|
| Main steps | *Allocating iPhone 18 Pro Max*, *Installing storefinder_ios.ipa*, *Applying session settings*, *Applying app permissions*, *Launching StoreFinder* | The PM's; user values keep their casing (§2) |
| Sub-steps | §4 | No punctuation of their own; the dots are drawn after them |
| Long-step note | *Still working on this step. It finishes on its own.* | The automation setup's, unchanged |
| Failed title | *App permissions failed to apply* | §5: *{object} failed to {verb}* |
| Step pane, setting up | *Setting up your session* · *Describe what to test as soon as StoreFinder is on screen.* | §3 Empty states, the guide's own example shape (*Setting up your device · Logs stream here as soon as the device is ready.*) |
| Step pane, ready | *Describe what to test* · *Type a step or an objective below, or press / for actions.* | The pattern's §4 |
| Step pane, failed | *Session failed to start* · *Describe what to test once a session starts.* | [proposed] |
| Agent state | *Setting up* [proposed], *System idle*, *Error* | `mock-data.md`'s vocabulary in sentence case |
| Announcements | *{step}. Step {n} of 5.*, the note, *StoreFinder is on screen.*, *App permissions failed to apply.* | §3: announce what visuals hide |

**Finalists for the failed title** (§8 format):

| | Text | Why | When to pick it |
|---|---|---|---|
| **Recommended** | *App permissions failed to apply* | Names the step's object and what happened; one clause; §5 | Rajat's banner carries the session-level message |
| | *Permissions failed to apply* | Shorter | The step's name is already beside it in the list |
| | *Applying app permissions failed* | Keeps the step's exact words | The title must match the list word for word |

**Finalists for the step pane while setting up:**

| | Heading · description | Why | When to pick it |
|---|---|---|---|
| **Recommended** | *Setting up your session* · *Describe what to test as soon as StoreFinder is on screen.* | What is happening, then what the user gets; keeps the PM's words | Default |
| | *Setting up your session* · *Your steps show here once StoreFinder is on screen.* | Points at the list | The composer moves elsewhere |
| | *Getting StoreFinder ready* · *Describe what to test as soon as it is on screen.* | Names the app | The session bar already says the session is setting up |

## 11. Open questions

1. **Sub-steps:** confirm §4 against KaneAI's backend, steps 3 to 5 above all.
2. **Agent status while setting up** (C5): add *setting up* to the vocabulary in `mock-data.md`, or show *system idle* until the app is on screen?
3. **Dots beside a tick** (C9): keep them running for the half second the tick shows, as built, or hold them still once it shows?
4. **A pause control** for the looping spots (C7): add one beside the stage, or treat the loop as part of the loading indicator?
5. **The long-step threshold** for the product: the prototype uses 8 seconds (the automation spec proposes 30, its question 86).
6. **The failed title and your banner:** keep both, or drop the stage's title once the banner is above it?
7. **Failure spots for the other four steps:** build them now, same recipe, or wait for real failures to be listed?
8. **The composer during setup:** let the user write an objective while the device sets up, sent once the app is on screen?
9. **`Discard Test` during setup:** does it cancel the setup and close the session, with the pattern's confirmation?
10. **The device pane** (§8): its chrome for app sessions is undescribed; who owns it?

## 12. When this ships into design-context/

- [ ] `patterns/kane-agent-playground.md`: a *Session setup* state in §4, pointing here; a device pane beside the live browser (§8).
- [ ] `mock-data.md`: a real device, its OS and an app (§8); the agent status for setting up, once question 2 is answered.
- [ ] The spots, once Rajat approves them, into the kit's `gallery/approved/` with their notes.
- [ ] `guidelines/`: setup and loading states with steps, shared with the automation setup (its §12.10).
- [ ] The CSS lesson for whoever builds this: set `animation` with its name, or in longhands, and check animations on the built site (§3 item 6).
