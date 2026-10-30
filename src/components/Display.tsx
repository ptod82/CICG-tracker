import { useCallback, useEffect, useRef, useState } from 'react'
import { CONFIG } from '../config'
import { formatDisplayAmount, moneyMillions } from '../lib/format'
import { useTracker } from '../hooks/useTracker'
import { Announcement } from './Announcement'
import { ControlPanel } from './ControlPanel'
import { Flag } from './Flag'
import { ProgressTrack } from './ProgressTrack'
import { fetchAuth } from '../lib/auth'
import type { Pledge } from '../types'

const seenIds = new Set<string>()
const absorbedIds = new Set<string>()

export function Display() {
  const tracker = useTracker('display')
  const { snapshot, announcement, totalMillion, dismissAnnouncement } = tracker
  const [shown, setShown] = useState(totalMillion)
  const [panelOpen, setPanelOpen] = useState(false)
  const [idle, setIdle] = useState(false)
  const [queue, setQueue] = useState<Pledge[]>([])
  const [allowLocalControl, setAllowLocalControl] = useState(true)
  const shownRef = useRef(shown)
  const idleTimer = useRef<number>(0)

  useEffect(() => {
    shownRef.current = shown
  }, [shown])

  useEffect(() => {
    if (!announcement) return
    if (seenIds.has(announcement.id)) return
    seenIds.add(announcement.id)
    setQueue((current) => [...current, announcement])
  }, [announcement])

  useEffect(() => {
    if (queue.length > 0) return
    setShown(totalMillion)
  }, [queue.length, totalMillion])

  useEffect(() => {
    void fetchAuth().then((auth) => {
      if (auth.pinRequired) setAllowLocalControl(false)
    })
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (allowLocalControl && (event.key === 'p' || event.key === 'P' || event.key === '+')) {
        event.preventDefault()
        setPanelOpen((open) => !open)
      }
      if (event.key === 'f' || event.key === 'F') {
        void document.documentElement.requestFullscreen?.()
      }
      if (event.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allowLocalControl])

  useEffect(() => {
    const bump = () => {
      setIdle(false)
      window.clearTimeout(idleTimer.current)
      idleTimer.current = window.setTimeout(() => setIdle(true), 4000)
    }
    bump()
    window.addEventListener('mousemove', bump)
    window.addEventListener('keydown', bump)
    return () => {
      window.clearTimeout(idleTimer.current)
      window.removeEventListener('mousemove', bump)
      window.removeEventListener('keydown', bump)
    }
  }, [])

  const currentAnnouncement = queue[0] ?? null

  const animateBy = useCallback((pledge: Pledge) => {
    if (absorbedIds.has(pledge.id)) return
    absorbedIds.add(pledge.id)
    const from = shownRef.current
    const to = from + pledge.amountMillion
    const duration = 1600
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(from + (to - from) * eased)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

  const finishAnnouncement = useCallback(() => {
    setQueue((current) => current.slice(1))
    dismissAnnouncement()
  }, [dismissAnnouncement])

  const recent = [...snapshot.pledges].slice(-6).reverse()

  return (
    <main className={`display ${idle && !panelOpen ? 'is-idle' : ''}`}>
      <div className="display-bg" />
      <header className="display-header">
        <div>
          <p className="brand-kicker">{CONFIG.title}</p>
          <h1>{CONFIG.subtitle}</h1>
        </div>
        <div className="header-actions">
          {allowLocalControl && !panelOpen && !idle ? (
            <button type="button" className="open-panel" onClick={() => setPanelOpen(true)}>
              Add pledge (P)
            </button>
          ) : null}
          <p className="target-chip">Target {moneyMillions(snapshot.targetMillion)}</p>
        </div>
      </header>

      <section className="hero-total">
        <p className="currency-prefix">USD</p>
        <p className="total-number">
          <span className="dollar">$</span>
          {formatDisplayAmount(shown)}
        </p>
        <p className="total-unit">Million raised</p>
      </section>

      <ProgressTrack current={shown} target={snapshot.targetMillion} />

      {recent.length > 0 ? (
        <ul className="recent-row">
          {recent.map((pledge) => (
            <li key={pledge.id}>
              <Flag code={pledge.countryCode} name={pledge.countryName} />
              <span>{pledge.shortName}</span>
              <strong>{moneyMillions(pledge.amountMillion)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="waiting">Waiting for the next pledge</p>
      )}

      {currentAnnouncement ? (
        <Announcement
          key={currentAnnouncement.id}
          pledge={currentAnnouncement}
          onAbsorb={() => animateBy(currentAnnouncement)}
          onDone={finishAnnouncement}
        />
      ) : null}

      {panelOpen ? (
        <ControlPanel
          variant="overlay"
          snapshot={snapshot}
          totalMillion={totalMillion}
          mode={tracker.mode}
          onClose={() => setPanelOpen(false)}
          onAdd={tracker.addPledge}
          onUndo={tracker.undo}
          onReset={tracker.reset}
          onSettings={tracker.updateSettings}
        />
      ) : null}

    </main>
  )
}
