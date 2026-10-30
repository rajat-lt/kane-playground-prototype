// Platform shell: the 56px rail and the top bar, from design-context
// patterns/platform-sidebar.md and patterns/topbar.md, as in the automation
// details and notification center prototypes, so the demos read as one
// product. KaneAI is the active product here. Nav icons are lucide names
// verified in the installed version and chosen by intent:
// platform-sidebar.md does not name them (its open question 3), so they are
// placeholders, not decisions.
import React, { useCallback, useRef, useState } from 'react'
import {
  House, Bot, SquareTerminal, ClipboardList, TestTubes, Monitor, Smartphone, Workflow, ScanEye,
  Zap, ChartColumn, Accessibility, Globe, Ellipsis, Settings, CircleHelp, KeyRound, ChevronRight, Bell,
} from 'lucide-react'
import { LTTooltip, LTIconButton, LTButton, LTAvatar, cx } from './lt.jsx'

const PRIMARY_NAV = [
  ['home', 'Home', House], ['kaneai', 'KaneAI', Bot, true], ['kane-cli', 'Kane CLI', SquareTerminal],
  ['test-manager', 'Test Manager', ClipboardList, true], ['agent-testing', 'Agent Testing', TestTubes],
  ['real-time', 'Real Time', Monitor, true], ['real-device', 'Real Device', Smartphone, true],
  ['automation', 'Automation', Workflow, true], ['smartui', 'SmartUI', ScanEye],
  ['hyperexecute', 'HyperExecute', Zap, true], ['insights', 'Insights', ChartColumn, true],
  ['accessibility', 'Accessibility', Accessibility, true], ['web-scanner', 'Web Scanner', Globe, true],
  ['more-tools', 'More Tools', Ellipsis, true], ['settings', 'Settings', Settings, true],
]
const SECONDARY_NAV = [['help', 'Help', CircleHelp, true], ['credentials', 'Credentials', KeyRound, true], ['quick-actions', 'Quick Actions', Zap, true]]

function NavItem({ item: [id, label, Icon, sub], active }) {
  return (
    <li>
      <a className={cx('navitem', active && 'active')} href="#nav" aria-current={active ? 'page' : undefined}
        onClick={e => e.preventDefault()}>
        <Icon size={16} aria-hidden="true" className="navitem-icon" />
        <span className="navitem-label">{label}</span>
        {sub && <ChevronRight size={16} aria-hidden="true" className="navitem-caret" />}
      </a>
    </li>
  )
}

/**
 * The rail expands on hover into a 320px panel that overlays the page, never
 * pushing it (platform-sidebar.md §1). The brand mark also opens it from the
 * keyboard, the pattern's recorded recommendation. The collapsed rail carries
 * product-specific icons (§1); KaneAI's are not documented, so it shows
 * KaneAI's own only.
 */
export function PlatformSidebar({ active = 'kaneai' }) {
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const wrap = useRef(null)
  const brand = useRef(null)
  const open = hover || pinned
  const close = useCallback(() => { setPinned(false); setHover(false) }, [])
  return (
    <>
      <div className="rail-slot" />
      <div ref={wrap} className={cx('rail', open && 'open')}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onKeyDown={e => { if (e.key === 'Escape' && open) { close(); brand.current?.focus() } }}
        onBlurCapture={e => { if (!wrap.current?.contains(e.relatedTarget)) setPinned(false) }}>
        <div className="rail-corner">
          <button ref={brand} type="button" className="rail-brand" aria-expanded={open}
            aria-label="TestMu AI, open platform navigation"
            onFocus={() => setPinned(true)} onClick={() => setPinned(v => !v)}>
            <span className="rail-mark" aria-hidden="true">T</span>
          </button>
        </div>
        {open ? (
          <>
            <div className="rail-word"><strong>TestMu AI</strong><em>Formerly LambdaTest</em></div>
            <nav className="rail-nav" aria-label="Products">
              <ul>{PRIMARY_NAV.map(i => <NavItem key={i[0]} item={i} active={i[0] === active} />)}</ul>
            </nav>
            <hr className="rail-div" />
            <nav className="rail-secondary" aria-label="Support">
              <ul>{SECONDARY_NAV.map(i => <NavItem key={i[0]} item={i} />)}</ul>
            </nav>
            <button type="button" className="lt-btn lt-btn--orange lt-btn--large rail-upgrade">Upgrade Now</button>
          </>
        ) : (
          <div className="rail-icons">
            <LTTooltip text="KaneAI" direction="right">
              <a className="rail-icon active" href="#nav" aria-label="KaneAI" aria-current="page"
                onClick={e => e.preventDefault()}><Bot size={16} aria-hidden="true" /></a>
            </LTTooltip>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * Top bar. One level deep, so the product label in LTText SMALL_BOLD, not a
 * breadcrumb (topbar.md §3). KaneAI has no quota module (§2). Its product
 * buttons differ between topbar.md (announcements only) and
 * kane-agent-playground.md (a tunnel control), and neither defines the
 * control, so both are left out (spec C11). The bell, the avatar and the
 * orange Upgrade Now are constant, Upgrade Now rightmost.
 */
export function TopBar() {
  return (
    <header className="topbar">
      <span className="topbar-product">KaneAI</span>
      <div className="topbar-right">
        <LTIconButton icon={Bell} ariaLabel="Notifications" variant="outline"
          onClick={() => window.open('https://rajat-lt.github.io/notification-center-prototype/', '_blank', 'noopener')} />
        <LTAvatar initials="RS" name="Ritika Sharma" size={32} />
        <LTButton variant="orange" size="medium" label="Upgrade Now" />
      </div>
    </header>
  )
}
