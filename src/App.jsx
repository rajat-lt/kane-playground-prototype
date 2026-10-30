// KaneAI agent playground (design-context patterns/kane-agent-playground.md),
// for a real device app session, with its session setup state (spec
// kane-playground-setup.md). Four zones: top bar, session bar, the step pane
// (480px), where the setup stage sits until StoreFinder is on screen, and the
// device pane, where the device shows each setup step live (spec §13). Mock
// data only.
import React from 'react'
import { History, Pause, Send, SquareMousePointer, Type, Variable, KeyRound } from 'lucide-react'
import { Announcer, LTBlankSlate, LTButton, LTIconButton, LTTag, LTTextarea, cx } from './lt.jsx'
import { PlatformSidebar, TopBar } from './shell.jsx'
import { SetupAnnouncer, SetupControls, SetupPanel, useSetupPhase } from './setup.jsx'
import { DevicePane } from './device.jsx'

/* Agent status is its own vocabulary (mock-data.md): system idle, running,
   draft, error. KaneAI's docs name the session's first state *Setting up*
   (spec §13.2). A step with failed items no longer stops the setup (v2 item
   5), so both flows end ready. */
const AGENT_STATE = { setup: 'Setting up', ready: 'System idle' }

/* The session bar: a customised toolbar on an info-blue ground, not an
   LTFlash (pattern §2, §3.1). Its two counters are left out until the
   pattern's open question 1 says what they count (spec C6). The environment
   slot shows the pattern's fallback: the device pane's header carries the
   device and OS since v2 (spec C24). Variables and secrets have no icons in
   the pattern (icon={null}), so lucide's Variable and KeyRound stand in.
   Save waits for something to save; Discard Test is not wired in this
   prototype. */
function SessionBar({ phase }) {
  return (
    <div className="session-bar" role="toolbar" aria-label="Session">
      <span className="session-bar__state">{AGENT_STATE[phase]}</span>
      <LTTag text="Adaptive" labelStyle="outline" variant="default" size="small" />
      <div className="session-bar__end">
        <span className="session-bar__env">Environment unset</span>
        <LTIconButton icon={Variable} ariaLabel="Variables and parameters" variant="invisible" size="small" />
        <LTIconButton icon={KeyRound} ariaLabel="Secrets" variant="invisible" size="small" />
        <LTButton variant="danger" size="medium" label="Discard Test" />
        <LTButton variant="primary" size="medium" label="Save" inactive />
      </div>
    </div>
  )
}

/* The step pane (pattern §3.2): step count, history, Pause Test, the step
   list and the composer pinned at its foot. While the session sets up, the
   setup stage takes the list's place and the header steps aside, as K3
   shows and as KaneAI's docs put the counts above the list only once
   authoring starts (spec C16); the composer waits, since nothing is
   interactive while setting up (C22). Once the app is on screen, the pattern's
   empty state (§4) and the composer take over. */
function StepPane({ phase }) {
  const live = phase === 'ready'
  return (
    <section className="step-pane" aria-label="Steps">
      {live && (
        <div className="step-pane__head is-revealing">
          <h2 className="step-pane__count">0 steps</h2>
          <div className="step-pane__actions">
            <LTIconButton icon={History} ariaLabel="Step history" variant="outline" size="medium" inactive />
            <LTButton variant="outline" size="medium" label="Pause Test" leadingIcon={Pause} inactive />
          </div>
        </div>
      )}
      <div className={cx('step-pane__list', !live && 'is-setup')}>
        {live
          ? <div className="is-revealing"><LTBlankSlate heading="Describe what to test" description="Type a step or an objective below, or press / for actions." narrow /></div>
          : <SetupPanel />}
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
            <DevicePane />
          </div>
        </main>
      </div>
      <Announcer />
      <SetupAnnouncer />
      <SetupControls />
    </div>
  )
}
