import { useMemo, useState, type FormEvent } from 'react'
import { COUNTRIES, PLEDGE_COUNTRY_CODES } from '../data/countries'
import { moneyMillions } from '../lib/format'
import type { TrackerSnapshot } from '../types'
import { Flag } from './Flag'

const PLEDGE_COUNTRIES = PLEDGE_COUNTRY_CODES.map((code) =>
  COUNTRIES.find((country) => country.code === code),
).filter((country): country is (typeof COUNTRIES)[number] => Boolean(country))

type ControlPanelProps = {
  variant: 'page' | 'overlay'
  snapshot: TrackerSnapshot
  busy?: boolean
  onClose?: () => void
  onAdd: (input: {
    countryCode: string
    countryName: string
    shortName: string
    amountMillion: number
  }) => Promise<void>
  onUndo: () => Promise<void>
  onReset: () => Promise<void>
  onSettings: (settings: { startMillion?: number; targetMillion?: number }) => Promise<void>
}

export function ControlPanel({
  variant,
  snapshot,
  onClose,
  onAdd,
  onUndo,
  onReset,
  onSettings,
}: ControlPanelProps) {
  const [query, setQuery] = useState('')
  const [selectedCode, setSelectedCode] = useState('gb')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [startValue, setStartValue] = useState(String(snapshot.startMillion))
  const [targetValue, setTargetValue] = useState(String(snapshot.targetMillion))
  const [submitting, setSubmitting] = useState(false)

  const selected = PLEDGE_COUNTRIES.find((country) => country.code === selectedCode) ?? PLEDGE_COUNTRIES[0]
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/\./g, '')
    if (!needle) return PLEDGE_COUNTRIES
    return PLEDGE_COUNTRIES.filter((country) => {
      const haystack = `${country.name} ${country.shortName} ${country.code}`.toLowerCase().replace(/\./g, '')
      return haystack.includes(needle)
    })
  }, [query])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const amountMillion = Number(amount)
    if (!Number.isFinite(amountMillion) || amountMillion <= 0) {
      setError('Enter a pledge amount in millions, for example 90')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onAdd({
        countryCode: selected.code,
        countryName: selected.name,
        shortName: selected.shortName,
        amountMillion,
      })
      setAmount('')
      onClose?.()
    } catch {
      setError('Could not send the pledge. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const saveSettings = async () => {
    const startMillion = Number(startValue)
    const targetMillion = Number(targetValue)
    if (!Number.isFinite(startMillion) || !Number.isFinite(targetMillion) || targetMillion <= 0) {
      setError('Start and target must be valid numbers')
      return
    }
    setError('')
    await onSettings({ startMillion, targetMillion })
  }

  return (
    <aside className={`control ${variant}`}>
      <form onSubmit={submit} className="control-form">
        <label>
          Country / donor
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search…"
            autoComplete="off"
          />
        </label>

        <div className="country-list">
          {matches.slice(0, 12).map((country) => (
            <button
              key={country.code}
              type="button"
              className={country.code === selected.code ? 'is-selected' : ''}
              onClick={() => {
                setSelectedCode(country.code)
                setQuery(country.name)
              }}
            >
              <Flag code={country.code} name={country.name} />
              <span>{country.name}</span>
            </button>
          ))}
        </div>

        <label>
          Amount pledged
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder=""
          />
        </label>

        {error ? <p className="control-error">{error}</p> : null}

        <button type="submit" className="announce-btn" disabled={submitting}>
          {submitting ? 'Sending…' : `Announce ${selected.shortName} ${amount ? `$${amount}M` : ''}`}
        </button>
      </form>

      <section className="control-history">
        <div className="control-row">
          <h3>Pledges</h3>
          <div className="control-row-actions">
            <button type="button" className="ghost-btn" onClick={() => void onUndo()} disabled={!snapshot.pledges.length}>
              Undo last
            </button>
            <button
              type="button"
              className="ghost-btn danger"
              onClick={() => {
                if (window.confirm('Reset the tracker amount?')) {
                  void onReset()
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
        {snapshot.pledges.length === 0 ? (
          <p className="muted">No pledges yet. Starting figure is {moneyMillions(snapshot.startMillion)}.</p>
        ) : (
          <ul>
            {[...snapshot.pledges].reverse().map((pledge) => (
              <li key={pledge.id}>
                <Flag code={pledge.countryCode} name={pledge.countryName} />
                <span>{pledge.shortName}</span>
                <strong>{moneyMillions(pledge.amountMillion)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="control-settings">
        <h3>Tracker figures</h3>
        <div className="settings-grid">
          <label>
            Start
            <input value={startValue} onChange={(event) => setStartValue(event.target.value)} />
          </label>
          <label>
            Target
            <input value={targetValue} onChange={(event) => setTargetValue(event.target.value)} />
          </label>
        </div>
        <button type="button" className="ghost-btn" onClick={() => void saveSettings()}>
          Save figures
        </button>
      </section>
    </aside>
  )
}
