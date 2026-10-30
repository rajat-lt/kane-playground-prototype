// Session setup state (spec kane-playground-setup.md): what the KaneAI
// playground shows while a real device app session is set up, before the app
// is on screen. It follows the automation details prototype's setup state as
// reviewed up to its setup v4 (rajat-lt/automation-details-prototype, spec §12
// to §12.14): a centred stage with one looping spot, the current step's name,
// its sub-step typed out with running dots, and the main steps in order below.
// Since v2 (spec §13) the stage sits in the step pane, and the device pane
// shows the device doing each step live (device.jsx), on the same clock.
// The setup is simulated here as the backend would report it (main steps and
// their sub-steps) on a clock, in two flows: one where every step applies, one
// where app permissions finish with failed items, show as a warning for 2
// seconds, then let the setup carry on (v2 item 5). There are no retries
// (brief item 7). Pages read the clock through narrow hooks, so only what
// shows the time re-renders.
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { CircleCheck, CircleDashed, Pause, Play, RotateCcw, SkipForward, TriangleAlert } from 'lucide-react'
import { LTButton, LTLoader, LTTag, announce, cx } from './lt.jsx'
import { LTSegmentedControl } from './overlays.jsx'
import allocateSvg from './illustrations/kane-allocate.svg?raw'
import installSvg from './illustrations/kane-install.svg?raw'
import settingsSvg from './illustrations/kane-settings.svg?raw'
import permissionsSvg from './illustrations/kane-permissions.svg?raw'
import launchSvg from './illustrations/kane-launch.svg?raw'

/* The session, from the PM's screens (brief item 4). Device, OS and app
   stay out of the stage: the device pane's header carries them (spec §13.3). */
export const DEVICE = 'iPhone 18 Pro Max'
export const OS = 'iOS 27'
export const IPA = 'storefinder_ios.ipa'
export const APP = 'StoreFinder'

/* The five main steps are the PM's (brief item 4). Their sub-steps are
   proposals (spec §4): steps 1 to 3 from the backend list of the automation
   setup brief, step 4 from the PM's failure screen (permissions go one at a
   time and the device must confirm each), step 5 from the PM's "Ready when
   the app is on screen". `sec` is each sub-step's length in the prototype,
   long enough for the device to do it on screen (spec §13.4); real setups
   take from seconds to minutes. *Installing your app* runs long here, to show
   the long-step note (brief item 7). */
const STEPS = [
  { id: 'allocate', title: `Allocating ${DEVICE}`, subs: [
    { title: `Finding an available ${DEVICE}`, sec: 3 },
    { title: 'Allocating the device', sec: 3 },
  ] },
  { id: 'install', title: `Installing ${IPA}`, subs: [
    { title: 'Checking your app', sec: 2 },
    { title: 'Installing your app', sec: 14 },
  ] },
  { id: 'settings', title: 'Applying session settings', subs: [
    { title: 'Configuring the device', sec: 3 },
    { title: 'Reading your settings', sec: 2 },
    { title: 'Applying each setting', sec: 4 },
  ] },
  { id: 'permissions', title: 'Applying app permissions', subs: [
    { title: 'Applying each permission', sec: 7 },
    { title: 'Waiting for the device to confirm', sec: 4 },
  ] },
  { id: 'launch', title: `Launching ${APP}`, subs: [
    { title: `Opening ${APP}`, sec: 3 },
    { title: 'Waiting for the app to show on screen', sec: 3 },
  ] },
]
/* The failure flow (v2 item 5, Rajat's answer): app permissions finish with
   2 of their 3 failed, Location and Precise Location, while Camera applies.
   The step holds as a warning for 2 seconds, then the setup carries on and
   the step keeps its count (spec §13.5). */
export const WARNING = { step: 'permissions', title: '2 app permissions failed to apply', count: '2 failed' }
const WARN_SEC = 2
// One looping spot per main step (brief item 10). The warning holds the
// step's own spot still: the kit has no warning badge (spec C19).
const SPOTS = { allocate: allocateSvg, install: installSvg, settings: settingsSvg, permissions: permissionsSvg, launch: launchSvg }

// A finished sub-step shows its tick this long before the next slides in.
const BEAT = 0.5
// When a sub-step counts as long. The prototype's times are compressed; the
// product's threshold is open (spec question 5).
const LONG_SEC = 8
// The automation setup's note (its spec §12.12), unchanged.
const REASSURANCE = 'Still working on this step. It finishes on its own.'

/* One segment per sub-step, in time order, and each main step's span, for
   each flow. A step that warns holds for WARN_SEC after its last sub-step,
   inside its span, before the next step starts. */
function planFor(flow) {
  const segs = [], spans = []
  let t = 0
  for (const [si, step] of STEPS.entries()) {
    const start = t
    for (const [sub, s] of step.subs.entries()) {
      segs.push({ si, sub, start: t, end: t + s.sec })
      t += s.sec
    }
    const hold = flow === 'failure' && step.id === WARNING.step ? { start: t, end: t + WARN_SEC } : null
    if (hold) t = hold.end
    spans.push({ start, end: t, hold })
  }
  // The last tick shows for a beat, then the app is on screen.
  return { flow, segs, spans, end: t + BEAT }
}
const PLANS = { success: planFor('success'), failure: planFor('failure') }

/** A sub-step's segment in a plan, by its main step's id. */
export function segOf(p, id, sub = 0) {
  const si = STEPS.findIndex(s => s.id === id)
  return p.segs.find(s => s.si === si && s.sub === sub)
}
/** When the stage shows a sub-step running: after the previous one's tick,
    or at once after a warning. The device times its actions from here
    (device.jsx), so it never acts ahead of the words (v2 item 4). */
export function shownAt(p, id, sub = 0) {
  const seg = segOf(p, id, sub)
  const prev = p.segs[p.segs.indexOf(seg) - 1]
  return seg.start + (prev && prev.end === seg.start ? BEAT : 0)
}

/* ---------- the clock ---------- */
const store = { start: performance.now(), pausedAt: null, timer: null, flow: 'success', listeners: new Set() }
const plan = () => PLANS[store.flow]
const now = () => performance.now()
const time = () => Math.min(plan().end, Math.max(0, ((store.pausedAt ?? now()) - store.start) / 1000))
const emit = () => store.listeners.forEach(l => l())
const stop = () => { clearInterval(store.timer); store.timer = null }
// It ticks every 50ms, fine enough for a tap on the device (150ms); the stage
// only re-renders on its quarter seconds.
const run = () => {
  if (store.timer || store.pausedAt != null || time() >= plan().end) return
  store.timer = setInterval(() => { emit(); if (time() >= plan().end) stop() }, 50)
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
   finished one's tick), to the moment a long one adds its note, to the
   moment a step warns, and to the end of the flow. Switching the flow starts
   it again. */
const stopsFor = p => [
  ...p.segs.map((s, i) => (i > 0 ? s.start + (p.segs[i - 1].end === s.start ? BEAT : 0) : null)).filter(x => x != null),
  ...p.segs.filter(s => s.end - s.start > LONG_SEC).map(s => s.start + LONG_SEC),
  ...p.spans.filter(s => s.hold).map(s => s.hold.start),
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
/** 'setup' (the stage) or 'ready' (StoreFinder on screen). Both flows end
    ready: a step with failed items no longer stops the setup (v2 item 5). */
export const useSetupPhase = () => useClock(() => (time() < plan().end ? 'setup' : 'ready'))
/** 'success' or 'failure': which flow the prototype plays. */
export const useFlow = () => useClock(() => store.flow)
/** The plan the prototype plays. */
export const useSetupPlan = () => PLANS[useFlow()]
/** The clock in twentieths of a second, for the device (device.jsx). */
export const useDeviceTime = () => useClock(() => Math.floor(time() * 20) / 20)
const useQuarter = () => useClock(() => Math.floor(time() * 4) / 4)
const usePaused = () => useClock(() => store.pausedAt != null)

/* ---------- what the stage shows at a moment ---------- */
function viewAt(t, p) {
  const { segs, spans } = p
  // The warning: a step that finished with failed items holds for WARN_SEC.
  const held = spans.findIndex(s => s.hold && t >= s.hold.start && t < s.hold.end)
  const i = segs.findIndex(s => t < s.end)
  const last = i < 0
  let shown, status, seg = null, inView = 0
  if (held >= 0) {
    shown = segs.filter(s => s.si === held).at(-1)
    status = 'warning'
  } else {
    seg = segs[last ? segs.length - 1 : i]
    const prev = segs[segs.indexOf(seg) - 1]
    // A finished sub-step keeps its tick for a beat, then the next comes in.
    // After a warning the next step comes straight in: the warning was its
    // pause. The last sub-step keeps its tick until the app is on screen.
    const follows = !!prev && prev.end === seg.start
    const beat = !last && follows && t < seg.start + BEAT
    shown = beat ? prev : seg
    status = beat || last ? 'done' : 'current'
    // When the running sub-step came into view: after the previous one's tick.
    inView = seg.start + (follows ? BEAT : 0)
  }
  const step = STEPS[shown.si]
  const list = STEPS.map((st, si) => {
    const sp = spans[si]
    const warned = !!sp.hold && t >= sp.hold.start
    return {
      id: st.id, title: st.title, si,
      status: warned ? 'warning' : t >= sp.end ? 'done' : si === shown.si ? 'current' : 'pending',
      // The step the stage is holding as a warning right now.
      focus: si === held,
      count: warned ? WARNING.count : null,
    }
  })
  const running = status === 'current'
  return {
    step, list, warning: held >= 0,
    title: held >= 0 ? WARNING.title : step.title,
    spot: SPOTS[step.id],
    sub: { key: `${shown.si}:${shown.sub}`, title: step.subs[shown.sub].title, status,
      // Typed out only as it starts, not when the stage is reopened later.
      fresh: running && t - inView < 0.5 },
    long: running && t - seg.start >= LONG_SEC,
  }
}

/* ---------- pieces ---------- */

const STATE_WORDS = { done: 'done', current: 'running', pending: 'pending', warning: 'done' }

/* A sub-step types itself out as it starts, a character at a time once its
   line has risen in, then three dots run at its end. With reduced motion it
   shows whole at once. */
const TYPE_MS = 32
const TYPE_DELAY_MS = 240
// The running dots' cycle, as in styles.css.
const DOTS_MS = 1500
export const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
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
   in front, as the automation setup's v4 does. One that ends its step with
   failed items gains a warning triangle in front instead and loses the dots
   and the shimmer, since it has finished (spec §13.5). The full words, kept
   invisible underneath, hold the line's width, so the typing grows from a
   fixed left edge, and the mark hangs outside that width, so nothing shifts.
   Screen readers get the words whole. */
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
      {status === 'warning' && <TriangleAlert size={16} className="su-type__mark" aria-hidden="true" />}
      <span className="su-type__ghost" aria-hidden="true">{item.title}</span>
      <span className="su-type__text" aria-hidden="true">{item.title.slice(0, shown)}</span>
      <span className="su-type__end" aria-hidden="true">
        {status !== 'warning' && (
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
  warning: <TriangleAlert size={16} />,
}

/** The stage, in the step pane until the app is on screen (spec §13.3). */
export function SetupPanel() {
  const v = viewAt(useQuarter(), useSetupPlan())
  return (
    <div className="su">
      <div className="su-stage">
        <div className={cx('su-hero', v.warning && 'is-warning')}>
          {/* One spot per main step, looping for as long as it runs; held
              still while its step shows a warning. */}
          <span key={v.step.id} className="su-hero__ill" aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: v.spot }} />
          <h2 className="su-hero__title">{v.title}</h2>
          <SubCarousel item={v.sub} />
          <p className={cx('su-hero__note', v.long && 'is-on')} aria-hidden={!v.long}>{REASSURANCE}</p>
        </div>
        <ol className="su-steps" aria-label="Setup steps">
          {v.list.map(r => (
            <li key={r.id} className={cx('su-step', `is-${r.status}`, r.focus && 'is-focus')}
              aria-current={r.status === 'current' ? 'step' : undefined}>
              <span className={cx('su-badge', `is-${r.status}`)} aria-hidden="true">{BADGES[r.status]}</span>
              <span className="su-step__title">{r.title}</span>
              <span className="vh">{`, ${STATE_WORDS[r.status]}${r.count ? ',' : ''}`}</span>
              {r.count && <LTTag text={r.count} variant="attention" labelStyle="outline" size="small" />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* One hidden status line (spec §3 item 8): each main step as it starts, a
   long sub-step once, a warning once, then the outcome. */
export function SetupAnnouncer() {
  const q = useQuarter()
  const phase = useSetupPhase()
  const flow = useFlow()
  const v = viewAt(q, PLANS[flow])
  const prev = useRef({ step: null, long: null, warning: false, phase: null })
  useEffect(() => {
    const p = prev.current
    if (phase !== 'setup') {
      if (p.phase !== phase) announce(`${APP} is on screen.`)
      prev.current = { ...p, phase }
      return
    }
    // Back to the start (Restart or a new flow): the first step is new again.
    const last = p.phase === 'setup' ? p.step : null
    const cur = v.list.find(r => r.status === 'current')
    const stepKey = cur ? cur.id : last
    const longKey = v.long ? v.sub.key : p.long
    if (v.warning && !p.warning) {
      announce(`${WARNING.title}. Setup continues.`)
    } else if (cur && stepKey !== last) {
      announce(`${cur.title}. Step ${v.list.indexOf(cur) + 1} of ${v.list.length}.${v.long ? ` ${REASSURANCE}` : ''}`)
    } else if (v.long && longKey !== p.long) {
      announce(REASSURANCE)
    }
    prev.current = { step: stepKey, long: longKey, warning: v.warning, phase }
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
