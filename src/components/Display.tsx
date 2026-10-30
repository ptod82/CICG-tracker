import { useCallback, useEffect, useRef, useState } from 'react'
import { formatRollingAmount, moneyMillions } from '../lib/format'
import { useTracker } from '../hooks/useTracker'
import { Announcement } from './Announcement'
import { Flag } from './Flag'
import { ProgressTrack } from './ProgressTrack'
import type { Pledge } from '../types'

const seenIds = new Set<string>()
const absorbedIds = new Set<string>()

export function Display() {
  const tracker = useTracker('display')
  const { snapshot, announcement, totalMillion, dismissAnnouncement } = tracker
  const [shown, setShown] = useState(totalMillion)
  const [idle, setIdle] = useState(false)
  const [queue, setQueue] = useState<Pledge[]>([])
  const shownRef = useRef(shown)
  const idleTimer = useRef<number>(0)
  const rollFrame = useRef(0)

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
    if (queue.length > 0 || announcement) return
    setShown(totalMillion)
  }, [announcement, queue.length, totalMillion])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'f' || event.key === 'F') {
        void document.documentElement.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    const delta = Math.abs(to - from)
    const duration = Math.min(1900, Math.max(1400, 1000 + delta * 6))
    const start = performance.now()
    window.cancelAnimationFrame(rollFrame.current)
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const value = t === 1 ? to : from + (to - from) * eased
      shownRef.current = value
      setShown(value)
      if (t < 1) rollFrame.current = requestAnimationFrame(tick)
    }
    rollFrame.current = requestAnimationFrame(tick)
  }, [])

  const finishAnnouncement = useCallback(() => {
    setQueue((current) => current.slice(1))
    dismissAnnouncement()
  }, [dismissAnnouncement])

  const recent = [...snapshot.pledges].slice(-6).reverse()

  return (
    <main className={`display ${idle ? 'is-idle' : ''}`}>
      <div className="display-bg" />
      <header className="display-header">
        <div className="logo-lockup">
          <img className="hsh-logo" src="/hsh-logo.svg" alt="Hope Starts Here" />
          <span className="logo-rule" aria-hidden="true" />
          <img className="brand-logo" src="/ecw-logo.png" alt="Education Cannot Wait" />
        </div>
        <p className="event-tag">#HLRC26</p>
      </header>

      <section className="hero-total">
        <p className="currency-prefix">USD</p>
        <p className="total-number">
          <span className="dollar">$</span>
          {formatRollingAmount(shown, Number.isInteger(totalMillion) ? 0 : 1)}
        </p>
        <p className="total-unit">Million raised</p>
      </section>

      <ProgressTrack
        current={shown}
        target={snapshot.targetMillion}
        fractionDigits={Number.isInteger(totalMillion) ? 0 : 1}
      />

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
        <p className="waiting">#HopeStartsHere</p>
      )}

      {currentAnnouncement ? (
        <Announcement
          key={currentAnnouncement.id}
          pledge={currentAnnouncement}
          onAbsorb={() => animateBy(currentAnnouncement)}
          onDone={finishAnnouncement}
        />
      ) : null}
    </main>
  )
}
