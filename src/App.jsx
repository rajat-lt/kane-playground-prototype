// KaneAI agent playground (design-context patterns/kane-agent-playground.md),
// for a real device app session, with its session setup state (spec
// kane-playground-setup.md). Four zones: top bar, session bar, the step pane
// (480px) and the device pane, where the setup stage sits until StoreFinder is
// on screen. Mock data only.
import React from 'react'
import { History, Pause, Send, SquareMousePointer, Type, Variable, KeyRound, PanelRight, MapPin } from 'lucide-react'
import { Announcer, LTBlankSlate, LTButton, LTIconButton, LTTag, LTTextarea, cx } from './lt.jsx'
import { PlatformSidebar, TopBar } from './shell.jsx'
import { APP, DEVICE, OS, SetupAnnouncer, SetupControls, SetupPanel, useSetupPhase } from './setup.jsx'

/* Agent status is its own vocabulary (mock-data.md): system idle, running,
   draft, error. It has no word for a session being set up, so *Setting up*
   is proposed (spec C5). */
const AGENT_STATE = { setup: 'Setting up', ready: 'System idle', failed: 'Error' }

/* The session bar: a customised toolbar on an info-blue ground, not an
   LTFlash (pattern §2, §3.1). Its two counters are left out until the
   pattern's open question 1 says what they count (spec C6). Variables and
   secrets have no icons in the pattern (icon={null}), so lucide's Variable
   and KeyRound stand in. Save waits for something to save; Discard Test is
   not wired in this prototype. */
function SessionBar({ phase }) {
  return (
    <div className="session-bar" role="toolbar" aria-label="Session">
      <span className="session-bar__state">{AGENT_STATE[phase]}</span>
      <LTTag text="Adaptive" labelStyle="outline" variant="default" size="small" />
      <div className="session-bar__end">
        <span className="session-bar__env">{`${DEVICE} · ${OS}`}</span>
        <LTIconButton icon={Variable} ariaLabel="Variables and parameters" variant="invisible" size="small" />
        <LTIconButton icon={KeyRound} ariaLabel="Secrets" variant="invisible" size="small" />
        <LTButton variant="danger" size="medium" label="Discard Test" />
        <LTButton variant="primary" size="medium" label="Save" inactive />
      </div>
    </div>
  )
}

/* Empty states (ux-text-guidelines.md §3: the heading says what is
   happening, the body what the user gets). The ready state is the
   pattern's own (§4); the setting-up and failed ones are proposed. */
const EMPTY = {
  setup: { heading: 'Setting up your session', description: `Describe what to test as soon as ${APP} is on screen.` },
  ready: { heading: 'Describe what to test', description: 'Type a step or an objective below, or press / for actions.' },
  failed: { heading: 'Session failed to start', description: 'Describe what to test once a session starts.' },
}

/* The step pane (pattern §3.2): step count, history, Pause Test, the step
   list and the composer pinned at its foot. A new session has no steps, so
   history and Pause Test wait; the composer waits for the app to be on
   screen. */
function StepPane({ phase }) {
  const live = phase === 'ready'
  return (
    <section className="step-pane" aria-label="Steps">
      <div className="step-pane__head">
        <h2 className="step-pane__count">0 steps</h2>
        <div className="step-pane__actions">
          <LTIconButton icon={History} ariaLabel="Step history" variant="outline" size="medium" inactive />
          <LTButton variant="outline" size="medium" label="Pause Test" leadingIcon={Pause} inactive />
        </div>
      </div>
      <div className="step-pane__list">
        <LTBlankSlate heading={EMPTY[phase].heading} description={EMPTY[phase].description} narrow />
      </div>
      <div className={cx('composer', !live && 'is-waiting')}>
        <LTTextarea placeholder="Add a step or an objective or press / for more actions" value="" onChange={() => {}}
          rows={2} resize="none" disabled={!live} id="composer" />
        <div className="composer__row">
          <div className="composer__modes">
            <LTIconButton icon={Type} ariaLabel="Text instruction" variant="outline" size="small" inactive={!live} />
            <LTIconButton icon={SquareMousePointer} ariaLabel="Select an element" variant="outline" size="small" inactive={!live} />
          </div>
          <LTIconButton icon={Send} ariaLabel="Send" variant="primary" size="medium" inactive />
        </div>
      </div>
    </section>
  )
}

/* The device pane: the setup stage until the app is on screen, then the
   device. The device's own chrome is not in design-context (spec §8), so the
   phone is a plain bezel showing the app's name; the foot is the pattern's
   activity readout and Live tag (§3.3). */
function DevicePane({ phase }) {
  return (
    <section className="device-pane" aria-label="Device">
      <div className="device-pane__frame">
        {phase === 'ready' ? (
          <>
            <div className="device-pane__screen is-revealing">
              <div className="phone" role="img" aria-label={`${DEVICE} showing ${APP}`}>
                <span className="phone__island" />
                <div className="phone__app">
                  <MapPin size={32} aria-hidden="true" className="phone__icon" />
                  <span className="phone__name">{APP}</span>
                </div>
              </div>
            </div>
            <div className="device-pane__foot">
              <span>System idle</span>
              <span className="device-pane__live">
                <LTTag text="Live" labelStyle="outline" variant="danger" size="small" />
                <LTIconButton icon={PanelRight} ariaLabel="Toggle device panel" variant="invisible" size="small" />
              </span>
            </div>
          </>
        ) : <SetupPanel />}
      </div>
    </section>
  )
}

export default function App() {
  const phase = useSetupPhase()
  return (
    <div className="app">
      <PlatformSidebar active="kaneai" />
      <div className="main">
        <TopBar />
        <main className="page">
          <h1 className="vh">KaneAI playground</h1>
          <SessionBar phase={phase} />
          <div className="panes">
            <StepPane phase={phase} />
            <DevicePane phase={phase} />
          </div>
        </main>
      </div>
      <Announcer />
      <SetupAnnouncer />
      <SetupControls />
    </div>
  )
}
