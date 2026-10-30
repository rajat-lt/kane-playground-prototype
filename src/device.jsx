// The device pane (spec §13): K3's header over the device, live while the
// session sets up. The device is drawn from the setup's own clock, so it
// always does what the step pane names (v2 item 4): every action below is
// timed from the sub-step it belongs to (segOf), and the whole screen is a
// function of the time, so Pause, Next Step and Restart keep both panes in
// step.
// What it shows (spec §13.4): no device while one is found, the Apple logo
// while it is brought up, the home screen once it is live, StoreFinder
// installing on it, the home screen unchanged while session settings apply
// (Rajat's answer), Settings setting StoreFinder's permissions (TestMu AI's
// iOS App Settings doc), then StoreFinder opening. The screens follow iOS 18's
// Settings app and home screen, drawn with lucide glyphs on coloured tiles,
// not Apple's icons; iOS 27's own screens are unknown here (spec §13.8).
// Sizes inside the phone are iOS points: the phone is drawn at its real
// proportions (a 440 by 956 point screen) and scaled down to fit the pane.
import React, { useLayoutEffect, useRef, useState } from 'react'
import {
  Accessibility, Antenna, BatteryFull, Bell, Bluetooth, CalendarDays, Camera, Check, ChevronLeft, ChevronRight,
  Clock, Cloud, CloudSun, Compass, Gamepad2, Hand, Hourglass, Image, Images, LayoutGrid, Map, MapPin, MessageCircle,
  Mic, Moon, Music, Navigation, NotebookPen, Phone, Plane, RefreshCw, ScanFace, Search, Settings, Signal,
  SlidersHorizontal, SunMedium, Volume2, Wallet, Wifi,
} from 'lucide-react'
import { LTTag, cx } from './lt.jsx'
import { APP, DEVICE, IPA, OS, segOf, shownAt, useDeviceTime, useSetupPlan } from './setup.jsx'

/* ---------- the device's own colours ----------
   These belong to the device, not the page, so they are not tokens (spec
   §13.8): iOS's system colours in its light appearance, and StoreFinder's
   placeholder brand colour. */
const IOS = {
  blue: '#007aff', green: '#34c759', red: '#ff3b30', orange: '#ff9500', pink: '#ff2d55', yellow: '#ffcc00',
  indigo: '#5856d6', cyan: '#32ade6', gray: '#8e8e93', black: '#1c1c1e', white: '#ffffff',
}
const BRAND = '#0f766e'

/* ---------- the home screen ---------- */
// The grid, in points: four columns from 24pt in, a row every 106pt from 78pt
// down. App windows grow out of their icon's centre and shrink back to it.
const GRID = { top: 78, left: 24, col: 98, row: 106, icon: 64 }
const SCREEN = { w: 440, h: 956 }
const iconCentre = (row, col) => ({ x: GRID.left + GRID.col * (col + 0.5), y: GRID.top + GRID.row * row + GRID.icon / 2 })
const HOME_APPS = [
  { id: 'calendar', name: 'Calendar', Icon: CalendarDays, bg: IOS.white, fg: IOS.red },
  { id: 'photos', name: 'Photos', Icon: Images, bg: IOS.white, fg: IOS.orange },
  { id: 'camera', name: 'Camera', Icon: Camera, bg: '#d1d1d6', fg: IOS.black },
  { id: 'clock', name: 'Clock', Icon: Clock, bg: IOS.black, fg: IOS.white },
  { id: 'maps', name: 'Maps', Icon: Map, bg: '#e3f4e6', fg: '#248a3d' },
  { id: 'weather', name: 'Weather', Icon: CloudSun, bg: '#2f7de1', fg: IOS.white },
  { id: 'notes', name: 'Notes', Icon: NotebookPen, bg: IOS.white, fg: '#d4a800' },
  { id: 'settings', name: 'Settings', Icon: Settings, bg: IOS.gray, fg: IOS.white, at: [1, 3] },
]
const STOREFINDER = { id: 'storefinder', name: APP, Icon: MapPin, bg: BRAND, fg: IOS.white, at: [2, 0] }
const SETTINGS_APP = HOME_APPS.find(a => a.id === 'settings')
const DOCK_APPS = [
  { id: 'phone', name: 'Phone', Icon: Phone, bg: IOS.green, fg: IOS.white },
  { id: 'safari', name: 'Safari', Icon: Compass, bg: IOS.white, fg: IOS.blue },
  { id: 'messages', name: 'Messages', Icon: MessageCircle, bg: IOS.green, fg: IOS.white },
  { id: 'music', name: 'Music', Icon: Music, bg: IOS.pink, fg: IOS.white },
]

/* ---------- the device at a moment ---------- */
const clamp01 = x => Math.max(0, Math.min(1, x))
/* Everything the screen shows at time t, timed from the sub-steps (spec
   §13.4). Offsets are seconds from when the step pane shows their sub-step
   running (shownAt), so the device never acts ahead of the words. */
function deviceAt(t, p) {
  const failure = p.flow === 'failure'
  const A = shownAt(p, 'allocate', 1)
  const H = shownAt(p, 'install', 0)
  const I = shownAt(p, 'install', 1)
  const done = segOf(p, 'install', 1).end
  const P = shownAt(p, 'permissions', 0)
  const L = shownAt(p, 'launch', 0)
  const W = shownAt(p, 'launch', 1)
  const during = (at, len) => t >= at && t < at + len

  // Applying each permission: Settings opens from its icon, scrolls to Apps,
  // opens StoreFinder, then Location, picks While Using the App, turns
  // Precise Location on, goes back and turns Camera on. In the failure flow
  // StoreFinder's page has no Location row, since the app has yet to ask for
  // it (the iOS App Settings doc), so only Camera turns on.
  const moves = [
    { at: P + 1.8, push: 'apps' },
    { at: P + 2.7, push: 'storefinder' },
    ...(failure ? [] : [{ at: P + 3.6, push: 'location' }, { at: P + 5.4, pop: true }]),
  ]
  let stack = ['root'], move = null
  for (const m of moves) {
    if (t < m.at) break
    const from = stack.at(-1)
    stack = m.pop ? stack.slice(0, -1) : [...stack, m.push]
    move = { at: m.at, kind: m.pop ? 'pop' : 'push', from }
  }
  // A tapped row greys for 0.15s, as iOS greys a row under a finger.
  const taps = [
    { at: P + 1.6, row: 'root:apps' },
    { at: P + 2.5, row: 'apps:storefinder' },
    ...(failure ? [] : [{ at: P + 3.4, row: 'storefinder:location' }, { at: P + 4.2, row: 'location:while' }]),
  ]
  const tap = taps.find(x => during(x.at, 0.15))
  // StoreFinder installs: its icon comes in dimmed with a ring that fills,
  // and shows whole as the step pane ticks the sub-step.
  const iconAt = I + 0.2
  return {
    present: t >= A,
    screen: t < A ? 'off' : t < H ? 'boot' : 'home',
    storefinder: t < iconAt ? null : t < done ? clamp01((t - iconAt - 0.3) / (done - iconAt - 0.6)) : 'ready',
    pressed: during(P + 0.1, 0.15) ? 'settings' : during(L + 0.9, 0.15) ? 'storefinder' : null,
    settings: t >= P + 0.25 && t < L + 0.1 ? 'open' : during(L + 0.1, 0.35) ? 'closing' : null,
    set: {
      stack, move: move && t - move.at < 0.35 ? move : null,
      scrolled: t >= P + 0.9,
      tap: tap ? tap.row : null,
      hasLocation: !failure,
      location: t >= P + 4.25 ? 'while' : 'ask',
      precise: t >= P + 4.8,
      camera: t >= P + (failure ? 3.9 : 5.9),
    },
    app: t >= L + 1.1 ? (t < W + 1.2 ? 'launch' : 'main') : null,
  }
}

/* What the screen shows, for the phone's accessible name. */
const PAGES = { root: 'Settings', apps: 'Settings, Apps', storefinder: `Settings, ${APP}`, location: `Settings, ${APP}, Location` }
function describe(d) {
  if (d.screen === 'off') return 'no device yet'
  if (d.screen === 'boot') return 'starting up'
  if (d.app) return d.app === 'main' ? `${APP} on screen` : `${APP} opening`
  if (d.settings === 'open') return PAGES[d.set.stack.at(-1)]
  if (typeof d.storefinder === 'number') return `home screen, ${APP} installing`
  return 'home screen'
}

// The boot screen's Apple logo is the system font's own glyph (U+F8FF), which
// only Apple's systems draw; elsewhere the screen stays black (spec §13.8).
const APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)

/* ---------- iOS pieces ---------- */
function StatusBar({ tone }) {
  const d = new Date()
  const time = `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
  return (
    <div className={cx('ios-status', `is-${tone}`)}>
      <span className="ios-status__ear">{time}</span>
      <span className="ios-status__ear ios-status__icons">
        <Signal size={19} strokeWidth={2.6} /><Wifi size={19} strokeWidth={2.6} /><BatteryFull size={26} strokeWidth={2} />
      </span>
    </div>
  )
}

function AppIcon({ app, pressed = false, install, label = true }) {
  const installing = typeof install === 'number'
  return (
    <span className={cx('ios-app', pressed && 'is-pressed', install != null && 'is-new')}>
      <span className="ios-app__tile" style={{ background: app.bg, color: app.fg }}>
        <app.Icon size={34} strokeWidth={2} />
        <span className={cx('ios-app__veil', installing && 'is-on')}>
          {installing && (
            <svg viewBox="0 0 36 36" width="36" height="36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="6" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="12"
                strokeDasharray={`${install * 2 * Math.PI * 6} ${2 * Math.PI * 6}`} transform="rotate(-90 18 18)" />
            </svg>
          )}
        </span>
      </span>
      {label && <span className="ios-app__name">{installing ? 'Installing…' : app.name}</span>}
    </span>
  )
}

function Home({ d }) {
  return (
    <div className="ios-home">
      <div className="ios-home__grid">
        {HOME_APPS.map(a => <AppIcon key={a.id} app={a} pressed={d.pressed === a.id} />)}
        {d.storefinder != null && <AppIcon app={STOREFINDER} pressed={d.pressed === 'storefinder'} install={d.storefinder} />}
      </div>
      <span className="ios-home__search"><Search size={13} strokeWidth={2.6} />Search</span>
      <div className="ios-home__dock">
        {DOCK_APPS.map(a => <AppIcon key={a.id} app={a} label={false} />)}
      </div>
    </div>
  )
}

/* An app's window grows out of its icon and shrinks back into it. */
function AppWindow({ app, closing = false, children }) {
  const c = iconCentre(...app.at)
  return (
    <div className={cx('ios-window', closing && 'is-closing')}
      style={{ '--dx': `${c.x - SCREEN.w / 2}px`, '--dy': `${c.y - SCREEN.h / 2}px` }}>
      {children}
    </div>
  )
}

function Switch({ on }) {
  return <span className={cx('ios-switch', on && 'is-on')}><span className="ios-switch__knob" /></span>
}

/* A Settings row: an icon tile, the label, then a value, a switch, a tick or
   a chevron. */
function Row({ id, tap, Icon, tile, glyph = IOS.white, label, value, on, check, chevron = true }) {
  return (
    <div className={cx('ios-row', Icon && 'has-icon', tap === id && 'is-tapped')}>
      {Icon && <span className="ios-row__icon" style={{ background: tile, color: glyph }}><Icon size={18} strokeWidth={2.2} /></span>}
      <span className="ios-row__label">{label}</span>
      {value && <span className="ios-row__value">{value}</span>}
      {on != null ? <Switch on={on} />
        : check != null ? (check && <Check size={22} strokeWidth={2.6} className="ios-row__check" />)
          : chevron && <ChevronRight size={20} strokeWidth={2.6} className="ios-row__chevron" />}
    </div>
  )
}

function Group({ header, children }) {
  return (
    <div className="ios-group">
      {header && <div className="ios-group__header">{header}</div>}
      <div className="ios-group__rows">{children}</div>
    </div>
  )
}

function NavBar({ back, title }) {
  return (
    <div className="ios-nav">
      <span className="ios-nav__back"><ChevronLeft size={30} strokeWidth={2.4} />{back}</span>
      <span className="ios-nav__title">{title}</span>
    </div>
  )
}

/* Settings' first page, as iOS 18 lists it (trimmed); Apps comes last. */
const ROOT = [
  [['airplane', 'Airplane Mode', Plane, IOS.orange, { on: false }], ['wifi', 'Wi-Fi', Wifi, IOS.blue], ['bluetooth', 'Bluetooth', Bluetooth, IOS.blue, { value: 'On' }], ['cellular', 'Cellular', Antenna, IOS.green], ['battery', 'Battery', BatteryFull, IOS.green]],
  [['general', 'General', Settings, IOS.gray], ['accessibility', 'Accessibility', Accessibility, IOS.blue], ['camera', 'Camera', Camera, IOS.gray], ['control', 'Control Center', SlidersHorizontal, IOS.gray], ['display', 'Display & Brightness', SunMedium, IOS.blue], ['homescreen', 'Home Screen & App Library', LayoutGrid, IOS.indigo], ['search', 'Search', Search, IOS.gray], ['siri', 'Siri', Mic, IOS.black], ['standby', 'StandBy', Clock, IOS.black], ['wallpaper', 'Wallpaper', Image, IOS.cyan]],
  [['notifications', 'Notifications', Bell, IOS.red], ['sounds', 'Sounds & Haptics', Volume2, IOS.pink], ['focus', 'Focus', Moon, IOS.indigo], ['screentime', 'Screen Time', Hourglass, IOS.indigo]],
  [['faceid', 'Face ID & Passcode', ScanFace, IOS.green], ['sos', 'Emergency SOS', Phone, IOS.red], ['privacy', 'Privacy & Security', Hand, IOS.blue]],
  [['gamecenter', 'Game Center', Gamepad2, IOS.pink], ['icloud', 'iCloud', Cloud, IOS.blue], ['wallet', 'Wallet & Apple Pay', Wallet, IOS.black]],
  [['apps', 'Apps', LayoutGrid, IOS.indigo]],
]
// The Apps page lists the device's apps by name, Settings aside.
const APPS_LIST = [...HOME_APPS, ...DOCK_APPS, STOREFINDER].filter(a => a.id !== 'settings').sort((a, b) => a.name.localeCompare(b.name))

function SettingsPage({ id, s }) {
  if (id === 'root') {
    return (
      <>
        <div className={cx('ios-scroll', s.scrolled && 'is-scrolled')}>
          <div className="ios-large">Settings</div>
          <div className="ios-searchfield"><Search size={17} strokeWidth={2.4} />Search</div>
          {ROOT.map((rows, i) => (
            <Group key={i}>
              {rows.map(([rid, label, Icon, tile, extra]) => (
                <Row key={rid} id={`root:${rid}`} tap={s.tap} Icon={Icon} tile={tile} label={label} {...extra} />
              ))}
            </Group>
          ))}
        </div>
        {/* Scrolled, the large title gives way to the bar's own. */}
        <div className={cx('ios-bar', s.scrolled && 'is-on')}><span className="ios-nav__title">Settings</span></div>
      </>
    )
  }
  if (id === 'apps') {
    return (
      <div className="ios-scroll">
        <NavBar back="Settings" title="Apps" />
        <div className="ios-searchfield"><Search size={17} strokeWidth={2.4} />Search</div>
        <Group><Row id="apps:default" tap={s.tap} label="Default Apps" /></Group>
        <Group>
          {APPS_LIST.map(a => (
            <Row key={a.id} id={`apps:${a.id}`} tap={s.tap} Icon={a.Icon} tile={a.bg} glyph={a.fg} label={a.name} />
          ))}
        </Group>
      </div>
    )
  }
  if (id === 'storefinder') {
    return (
      <div className="ios-scroll">
        <NavBar back="Apps" title={APP} />
        <Group header={`Allow ${APP} to access`}>
          {s.hasLocation && (
            <Row id="storefinder:location" tap={s.tap} Icon={Navigation} tile={IOS.blue} label="Location"
              value={s.location === 'while' ? 'While Using' : 'Ask'} />
          )}
          <Row id="storefinder:camera" Icon={Camera} tile={IOS.gray} label="Camera" on={s.camera} />
          <Row id="storefinder:refresh" Icon={RefreshCw} tile={IOS.gray} label="Background App Refresh" on />
          <Row id="storefinder:cellular" Icon={Antenna} tile={IOS.green} label="Cellular Data" on />
        </Group>
      </div>
    )
  }
  return (
    <div className="ios-scroll">
      <NavBar back={APP} title="Location" />
      <Group header="Allow location access">
        <Row id="location:never" tap={s.tap} label="Never" check={false} />
        <Row id="location:ask" tap={s.tap} label="Ask Next Time Or When I Share" check={s.location === 'ask'} />
        <Row id="location:while" tap={s.tap} label="While Using the App" check={s.location === 'while'} />
      </Group>
      <Group>
        <Row id="location:precise" label="Precise Location" on={s.precise} />
      </Group>
    </div>
  )
}

/* Pages slide in from the right and back out to it, as iOS's do; the page
   left behind stays drawn while the move runs. */
function SettingsApp({ s }) {
  const top = s.stack.at(-1)
  const m = s.move
  return (
    <div className="ios-settings">
      {m && (
        <div key={`out:${m.from}`} className={cx('ios-page', m.kind === 'push' ? 'is-behind' : 'is-leaving')}>
          <SettingsPage id={m.from} s={s} />
        </div>
      )}
      <div key={top} className={cx('ios-page', m && (m.kind === 'push' ? 'is-arriving' : 'is-returning'))}>
        <SettingsPage id={top} s={s} />
      </div>
    </div>
  )
}

/* StoreFinder: its launch screen, then its first screen. Its content is a
   placeholder: mock-data.md has no app content (spec §13.8). */
function StoreFinderApp({ screen }) {
  return (
    <div className="sf">
      <div className="sf-launch" style={{ background: BRAND }}>
        <MapPin size={84} strokeWidth={1.8} />
        <span className="sf-launch__name">{APP}</span>
      </div>
      {screen === 'main' && (
        <div className="sf-main">
          <div className="sf-main__title">Stores near you</div>
          <div className="ios-searchfield"><Search size={17} strokeWidth={2.4} />Search by city or ZIP code</div>
          <div className="sf-map" aria-hidden="true">
            <span className="sf-map__road is-a" /><span className="sf-map__road is-b" /><span className="sf-map__road is-c" />
            <span className="sf-map__park" />
            <MapPin className="sf-map__pin is-1" size={34} strokeWidth={2.2} />
            <MapPin className="sf-map__pin is-2" size={34} strokeWidth={2.2} />
            <MapPin className="sf-map__pin is-3" size={34} strokeWidth={2.2} />
            <span className="sf-map__you" />
          </div>
          <Group header="Nearby">
            <Row id="sf:1" Icon={MapPin} tile={BRAND} label="Main Street" value="0.4 mi" />
            <Row id="sf:2" Icon={MapPin} tile={BRAND} label="Riverside" value="1.2 mi" />
          </Group>
        </div>
      )}
    </div>
  )
}

/* The screen: dark until a device is allocated, the Apple logo while it
   starts, then the home screen with any open app above it. */
function Screen({ d }) {
  if (d.screen === 'off') return <div className="ios is-off" />
  if (d.screen === 'boot') return <div className="ios is-boot">{APPLE && <span className="ios-boot__logo">{''}</span>}</div>
  const tone = d.app ? (d.app === 'main' ? 'dark' : 'light') : d.settings ? 'dark' : 'light'
  return (
    <div className="ios">
      <Home d={d} />
      {d.settings && (
        <AppWindow key={d.settings} app={SETTINGS_APP} closing={d.settings === 'closing'}>
          <SettingsApp s={d.set} />
        </AppWindow>
      )}
      {d.app && <AppWindow key="storefinder" app={STOREFINDER}><StoreFinderApp screen={d.app} /></AppWindow>}
      <StatusBar tone={tone} />
      <span className={cx('ios-home-indicator', `is-${tone}`)} />
    </div>
  )
}
/* The phone, at its real proportions, scaled to the largest size the pane
   allows: 24px above it, room for the cable below, never past 0.8. */
const PHONE = { w: 466, h: 982 }
const FIT = { top: 24, bottom: 40, side: 24, max: 0.8 }
function DeviceStage({ d }) {
  const stage = useRef(null)
  const [s, setS] = useState(0.6)
  useLayoutEffect(() => {
    const el = stage.current
    const fit = () => {
      const r = el.getBoundingClientRect()
      setS(Math.max(0.2, Math.min((r.height - FIT.top - FIT.bottom) / PHONE.h, (r.width - 2 * FIT.side) / PHONE.w, FIT.max)))
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className="device-stage" ref={stage}>
      <div className="iphone-fit" style={{ width: PHONE.w * s, height: PHONE.h * s }}>
        <div className={cx('iphone', !d.present && 'is-absent')} style={{ transform: `scale(${s})` }}
          role="img" aria-label={`${DEVICE} screen: ${describe(d)}`}>
          <span className="iphone__button is-action" /><span className="iphone__button is-up" />
          <span className="iphone__button is-down" /><span className="iphone__button is-side" />
          <span className="iphone__cable" />
          <div className="iphone__screen"><Screen d={d} /></div>
          <span className="iphone__island" />
        </div>
      </div>
    </div>
  )
}

/** The device pane: K3's header (the session's facts and its cloud), then
    the device, live (spec §13.3). The header's right side stays empty while
    setting up: nothing records yet (spec C15). */
export function DevicePane() {
  const d = deviceAt(useDeviceTime(), useSetupPlan())
  return (
    <section className="device-pane" aria-label="Device">
      <div className="device-pane__frame">
        <div className="device-head">
          <span className="device-head__facts">{`${DEVICE} · ${OS} · ${IPA}`}</span>
          <LTTag text="Private Cloud" variant="default" labelStyle="outline" size="small" />
        </div>
        <DeviceStage d={d} />
      </div>
    </section>
  )
}
