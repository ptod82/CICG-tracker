import { useEffect, useState, type FormEvent } from 'react'
import { CONFIG } from '../config'
import { ControlPanel } from '../components/ControlPanel'
import { useTracker } from '../hooks/useTracker'
import { fetchAuth, unlockWithPin } from '../lib/auth'
import { moneyMillions } from '../lib/format'

export function ControlPage() {
  const tracker = useTracker('control')
  const [gate, setGate] = useState<'loading' | 'locked' | 'open'>('loading')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void fetchAuth().then((auth) => {
      setGate(auth.pinRequired && !auth.unlocked ? 'locked' : 'open')
    })
  }, [])

  const unlock = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const ok = await unlockWithPin(pin)
    if (!ok) {
      setError('That PIN is not correct')
      return
    }
    setGate('open')
  }

  if (gate !== 'open') {
    return (
      <main className="control-page pin-page">
        <p className="brand-kicker">{CONFIG.title}</p>
        <h1>Operator console</h1>
        {gate === 'loading' ? (
          <p className="control-page-lead">Connecting…</p>
        ) : (
          <form className="pin-form" onSubmit={(event) => void unlock(event)}>
            <p className="control-page-lead">Enter the operator PIN to announce pledges.</p>
            <label>
              PIN
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                autoFocus
                autoComplete="off"
              />
            </label>
            {error ? <p className="control-error">{error}</p> : null}
            <button type="submit" className="announce-btn">
              Unlock
            </button>
          </form>
        )}
      </main>
    )
  }

  return (
    <main className="control-page">
      <header className="control-page-head">
        <div>
          <p className="brand-kicker">{CONFIG.title}</p>
          <h1>Operator console</h1>
        </div>
        <a className="ghost-btn" href="/" target="_blank" rel="noreferrer">
          Open TV display
        </a>
      </header>
      <p className="control-page-lead">
        The display is showing <strong>{moneyMillions(tracker.totalMillion)}</strong>. Announce a
        country and amount to play the full-screen animation on the TV.
      </p>
      <ControlPanel
        variant="page"
        snapshot={tracker.snapshot}
        totalMillion={tracker.totalMillion}
        mode={tracker.mode}
        onAdd={tracker.addPledge}
        onUndo={tracker.undo}
        onReset={tracker.reset}
        onSettings={tracker.updateSettings}
      />
    </main>
  )
}
