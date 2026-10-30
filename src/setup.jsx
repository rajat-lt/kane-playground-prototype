// Session setup state (30 Oct 2026, spec kane-playground-setup.md): what the
// KaneAI playground's device pane shows while a real device app session is
// set up, before the app is on screen. It follows the automation details
// prototype's setup state as reviewed up to its setup v4 (rajat-lt/
// automation-details-prototype, spec §12 to §12.14): a centred stage with one
// looping spot, the current step's name, its sub-step typed out with running
// dots, and the main steps in order below.
// The setup is simulated here as the backend would report it (main steps and
// their sub-steps) on a clock, in two flows: one where StoreFinder reaches the
// screen, one where a step fails (the PM's failure screen). There are no
// retries (brief item 7). Pages read the clock through narrow hooks, so only
// what shows the time re-renders.
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { CircleCheck, CircleDashed, CircleX, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { LTButton, LTLoader, announce, cx } from './lt.jsx'
import { LTSegmentedControl } from './overlays.jsx'
import allocateSvg from './illustrations/kane-allocate.svg?raw'
import installSvg from './illustrations/kane-install.svg?raw'
import settingsSvg from './illustrations/kane-settings.svg?raw'
import permissionsSvg from './illustrations/kane-permissions.svg?raw'
import launchSvg from './illustrations/kane-launch.svg?raw'
import failedSvg from './illustrations/kane-failed.svg?raw'

/* The session, from the PM's screens (brief item 4). Device, OS and app
   version stay out of the stage: the playground shows them elsewhere. */
export const DEVICE = 'iPhone 18 Pro Max'
export const OS = 'iOS 27'
export const APP = 'StoreFinder'

/* The five main steps are the PM's (brief item 4). Their sub-steps are
   proposals (spec §4): steps 1 to 3 from the backend list of the automation
   setup brief, step 4 from the PM's failure screen (permissions go one at a
   time and the device must confirm each), step 5 from the PM's "Ready when
   the app is on screen". `sec` is each sub-step's length in the prototype;
   real setups take from seconds to minutes. *Installing your app* runs long
   here, to show the long-step note (brief item 7). */
const STEPS = [
  { id: 'allocate', title: `Allocating ${DEVICE}`, subs: [
    { title: `Finding an available ${DEVICE}`, sec: 3 },
    { title: 'Allocating the device', sec: 3 },
  ] },
  { id: 'install', title: 'Installing storefinder_ios.ipa', subs: [
    { title: 'Checking your app', sec: 2 },
    { title: 'Installing your app', sec: 14 },
  ] },
  { id: 'settings', title: 'Applying session settings', subs: [
    { title: 'Configuring the device', sec: 3 },
    { title: 'Reading your settings', sec: 2 },
    { title: 'Applying each setting', sec: 4 },
  ] },
  { id: 'permissions', title: 'Applying app permissions', failedTitle: 'App permissions failed to apply', subs: [
    { title: 'Applying each permission', sec: 4 },
    { title: 'Waiting for the device to confirm', sec: 4 },
  ] },
  { id: 'launch', title: `Launching ${APP}`, subs: [
    { title: `Opening ${APP}`, sec: 3 },
    { title: 'Waiting for the app to show on screen', sec: 3 },
  ] },
]
// The failure flow (the PM's failure screen): the device never confirms the
// permission, so step 4 stops 6 seconds into its second sub-step.
const FAILURE = { step: 3, sub: 1, after: 6 }
// One looping spot per main step (brief item 10), and a still one for the
// failed step (spec §6); only Applying app permissions fails here.
const SPOTS = { allocate: allocateSvg, install: installSvg, settings: settingsSvg, permissions: permissionsSvg, launch: launchSvg }
const FAILED_SPOTS = { permissions: failedSvg }

// A finished sub-step shows its tick this long before the next slides in.
const BEAT = 0.5
// When a sub-step counts as long. The prototype's times are compressed; the
// product's threshold is open (spec question 5).
const LONG_SEC = 8
// The automation setup's note (its spec §12.12), unchanged.
const REASSURANCE = 'Still working on this step. It finishes on its own.'

/* One segment per sub-step, in time order, and each main step's span, for
   each flow. A failed segment ends the flow where it fails. */
function planFor(flow) {
  const segs = [], spans = []
  let t = 0, failedAt = null
  steps: for (const [si, step] of STEPS.entries()) {
    const start = t
    for (const [sub, s] of step.subs.entries()) {
      const fails = flow === 'failure' && FAILURE.step === si && FAILURE.sub === sub
      const len = fails ? FAILURE.after : s.sec
      segs.push({ si, sub, start: t, end: t + len, failed: fails })
      t += len
      if (fails) { spans.push({ start, end: t }); failedAt = si; break steps }
    }
    spans.push({ start, end: t })
  }
  // Success: the last tick shows for a beat, then the app is on screen.
  // Failure: the stage holds the failure from the moment it happens.
  return { flow, segs, spans, failedAt, end: failedAt == null ? t + BEAT : t }
}
const PLANS = { success: planFor('success'), failure: planFor('failure') }

/* ---------- the clock ---------- */
const store = { start: performance.now(), pausedAt: null, timer: null, flow: 'success', listeners: new Set() }
const plan = () => PLANS[store.flow]
const now = () => performance.now()
const time = () => Math.min(plan().end, Math.max(0, ((store.pausedAt ?? now()) - store.start) / 1000))
const emit = () => store.listeners.forEach(l => l())
const stop = () => { clearInterval(store.timer); store.timer = null }
const run = () => {
  if (store.timer || store.pausedAt != null || time() >= plan().end) return
  store.timer = setInterval(() => { emit(); if (time() >= plan().end) stop() }, 250)
}
const subscribe = l => {
  store.listeners.add(l); run()
  return () => { store.listeners.delete(l); if (!store.listeners.size) stop() }
}
const jump = to => {
  store.start = (store.pausedAt ?? now()) - to * 1000
  run(); emit()
}
/* The prototype bar's controls (spec §3 item 9), not part of the design.
   Next Step goes to the moment the next sub-step shows as running (after a
   finished one's tick), to the moment a long one adds its note, and to the
   end of the flow. Switching the flow starts it again. */
const stopsFor = p => [
  ...p.segs.map((s, i) => (i > 0 ? s.start + BEAT : null)).filter(x => x != null),
  ...p.segs.filter(s => !s.failed && s.end - s.start > LONG_SEC).map(s => s.start + LONG_SEC),
  p.end,
].sort((a, b) => a - b)
const setupControls = {
  pause: () => { if (store.pausedAt == null) { store.pausedAt = now(); stop(); emit() } },
  play: () => { if (store.pausedAt != null) { store.start += now() - store.pausedAt; store.pausedAt = null; run(); emit() } },
  next: () => { const t = time(); jump(stopsFor(plan()).find(x => x > t + 1e-3) ?? plan().end) },
  restart: () => jump(0),
  flow: f => { if (f !== store.flow && PLANS[f]) { store.flow = f; jump(0) } },
}

const useClock = get => useSyncExternalStore(subscribe, get)
const phaseAt = (t, p) => (t < p.end ? 'setup' : p.failedAt == null ? 'ready' : 'failed')
/** 'setup' (the stage), 'ready' (StoreFinder on screen) or 'failed'. */
export const useSetupPhase = () => useClock(() => phaseAt(time(), plan()))
/** 'success' or 'failure': which flow the prototype plays. */
export const useFlow = () => useClock(() => store.flow)
const useQuarter = () => useClock(() => Math.floor(time() * 4) / 4)
const usePaused = () => useClock(() => store.pausedAt != null)

/* ---------- what the stage shows at a moment ---------- */
function viewAt(t, p) {
  const { segs, spans } = p
  const failed = p.failedAt != null && t >= p.end
  const i = segs.findIndex(s => t < s.end)
  const idx = i < 0 ? segs.length - 1 : i
  const seg = segs[idx]
  const prev = segs[idx - 1]
  // A finished sub-step keeps its tick for a beat, then the next comes in;
  // the last one keeps it until the app is on screen.
  const beat = !failed && !!prev && t < seg.start + BEAT
  const last = !failed && i < 0
  const shown = beat ? prev : seg
  const step = STEPS[shown.si]
  const list = STEPS.map((st, si) => ({
    id: st.id, title: st.title, si,
    status: failed && si === p.failedAt ? 'failed'
      : spans[si] && t >= spans[si].end ? 'done'
      : !failed && si === shown.si ? 'current' : 'pending',
  }))
  // When the running sub-step came into view: after the previous one's tick.
  const inView = seg.start + (prev ? BEAT : 0)
  const settled = beat || last || failed
  return {
    step, list, failed,
    title: failed ? step.failedTitle : step.title,
    spot: failed ? FAILED_SPOTS[step.id] : SPOTS[step.id],
    spotKey: failed ? `${step.id}:failed` : step.id,
    sub: { key: `${shown.si}:${shown.sub}`, title: step.subs[shown.sub].title,
      status: failed ? 'failed' : beat || last ? 'done' : 'current',
      // Typed out only as it starts, not when the stage is reopened later.
      fresh: !settled && t - inView < 0.5 },
    long: !settled && t - seg.start >= LONG_SEC,
  }
}

/* ---------- pieces ---------- */

const STATE_WORDS = { done: 'done', current: 'running', pending: 'pending', failed: 'failed' }

/* A sub-step types itself out as it starts, a character at a time once its
   line has risen in, then three dots run at its end. With reduced motion it
   shows whole at once. */
const TYPE_MS = 32
const TYPE_DELAY_MS = 240
// The running dots' cycle, as in styles.css.
const DOTS_MS = 1500
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
function useTyped(text, type) {
  const [shown, setShown] = useState(() => (type && !reducedMotion() ? 0 : text.length))
  const typing = useRef(shown < text.length)
  useEffect(() => {
    if (!typing.current) return undefined
    let n = 0
    let timer = setTimeout(function tick() {
      n += 1
      setShown(n)
      if (n < text.length) timer = setTimeout(tick, TYPE_MS)
    }, TYPE_DELAY_MS)
    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return shown
}

/* One sub-step's line: the words, shimmering while it runs, then the running
   dots (brief item 8). A finished one keeps its dots and gains a green tick
   in front, as the automation setup's v4 does; a failed one gains a red cross
   in front and loses the dots and the shimmer, since nothing runs any more.
   The full words, kept invisible underneath, hold the line's width, so the
   typing grows from a fixed left edge, and the mark hangs outside that width,
   so nothing shifts. Screen readers get the words whole. */
function SubLine({ item, type = false }) {
  const shown = useTyped(item.title, type)
  // Every line's dots keep one rhythm, so a finished line, drawn afresh as
  // it rises out, carries its dots on mid-cycle.
  const [dotsAt] = useState(() => -(performance.now() % DOTS_MS))
  const { status } = item
  return (
    <span className={cx('su-type', `is-${status}`)}>
      <span className="vh">{`${item.title}, ${STATE_WORDS[status]}`}</span>
      {status === 'done' && <CircleCheck size={16} className="su-type__mark" aria-hidden="true" />}
      {status === 'failed' && <CircleX size={16} className="su-type__mark" aria-hidden="true" />}
      <span className="su-type__ghost" aria-hidden="true">{item.title}</span>
      <span className="su-type__text" aria-hidden="true">{item.title.slice(0, shown)}</span>
      <span className="su-type__end" aria-hidden="true">
        {status !== 'failed' && (
          <span className={cx('su-dots', shown < item.title.length && 'is-waiting')} style={{ '--su-dots-at': `${dotsAt}ms` }}>
            <i>.</i><i>.</i><i>.</i>
          </span>
        )}
      </span>
    </span>
  )
}

/* One sub-step at a time. A finished one shows its tick, then rises out as
   the next rises in; the previous line stays mounted, hidden, until the next
   change. */
function SubCarousel({ item }) {
  const ref = useRef(null)
  if (!ref.current) ref.current = { cur: item, prev: null }
  else if (ref.current.cur.key !== item.key) ref.current = { cur: item, prev: ref.current.cur }
  else ref.current.cur = item
  const { prev } = ref.current
  return (
    <div className="su-carousel">
      {prev && <p key={`out:${prev.key}`} className="su-carousel__item is-out" aria-hidden="true"><SubLine item={prev} /></p>}
      <p key={item.key} className="su-carousel__item is-in"><SubLine item={item} type={item.fresh} /></p>
    </div>
  )
}

const BADGES = {
  done: <CircleCheck size={16} />,
  current: <LTLoader size="small" />,
  pending: <CircleDashed size={16} />,
  failed: <CircleX size={16} />,
}

/** The stage, in the device pane until the app is on screen (spec §3). */
export function SetupPanel() {
  useFlow()
  const v = viewAt(useQuarter(), plan())
  return (
    <div className="su">
      <div className="su-stage">
        <div className={cx('su-hero', v.failed && 'is-failed')}>
          {/* One spot per main step, looping for as long as it runs; the
              failed step's spot holds still. */}
          <span key={v.spotKey} className="su-hero__ill" aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: v.spot }} />
          <h2 className="su-hero__title">{v.title}</h2>
          <SubCarousel item={v.sub} />
          <p className={cx('su-hero__note', v.long && 'is-on')} aria-hidden={!v.long}>{REASSURANCE}</p>
        </div>
        <ol className="su-steps" aria-label="Setup steps">
          {v.list.map(r => (
            <li key={r.id} className={cx('su-step', `is-${r.status}`)}
              aria-current={r.status === 'current' ? 'step' : undefined}>
              <span className={cx('su-badge', `is-${r.status}`)} aria-hidden="true">{BADGES[r.status]}</span>
              <span className="su-step__title">{r.title}</span>
              <span className="vh">{`, ${STATE_WORDS[r.status]}`}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* One hidden status line (spec §3 item 8): each main step as it starts, a
   long sub-step once, then the outcome. */
export function SetupAnnouncer() {
  const q = useQuarter()
  const phase = useSetupPhase()
  const flow = useFlow()
  const v = viewAt(q, PLANS[flow])
  const prev = useRef({ step: null, long: null, phase: null })
  useEffect(() => {
    const p = prev.current
    if (phase !== 'setup') {
      if (p.phase !== phase) announce(phase === 'ready' ? `${APP} is on screen.` : `${v.title}.`)
      prev.current = { ...p, phase }
      return
    }
    // Back to the start (Restart or a new flow): the first step is new again.
    const last = p.phase === 'setup' ? p.step : null
    const cur = v.list.find(r => r.status === 'current')
    const stepKey = cur ? cur.id : last
    const longKey = v.long ? v.sub.key : p.long
    if (cur && stepKey !== last) {
      announce(`${cur.title}. Step ${v.list.indexOf(cur) + 1} of ${v.list.length}.${v.long ? ` ${REASSURANCE}` : ''}`)
    } else if (v.long && longKey !== p.long) {
      announce(REASSURANCE)
    }
    prev.current = { step: stepKey, long: longKey, phase }
  }, [q, phase, flow]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const FLOWS = [{ value: 'success', label: 'Success' }, { value: 'failure', label: 'Failure' }]

/* Prototype only (spec §3 item 9): a dashed bar, not product UI. */
export function SetupControls() {
  const paused = usePaused()
  const flow = useFlow()
  const ended = useSetupPhase() !== 'setup'
  return (
    <div className="proto-bar" role="group" aria-label="Prototype controls">
      <span className="proto-bar__label">Prototype</span>
      <LTSegmentedControl variant="small" ariaLabel="Flow" options={FLOWS} selectedValue={flow} onChange={setupControls.flow} />
      {/* Inactive, not removed, once the flow ends, so keyboard focus stays put. */}
      {paused
        ? <LTButton variant="invisible" size="small" leadingIcon={Play} label="Play" inactive={ended} onClick={setupControls.play} />
        : <LTButton variant="invisible" size="small" leadingIcon={Pause} label="Pause" inactive={ended} onClick={setupControls.pause} />}
      <LTButton variant="invisible" size="small" leadingIcon={SkipForward} label="Next Step" inactive={ended} onClick={setupControls.next} />
      <LTButton variant="invisible" size="small" leadingIcon={RotateCcw} label="Restart" onClick={setupControls.restart} />
    </div>
  )
}
