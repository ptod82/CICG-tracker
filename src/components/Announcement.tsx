import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Pledge } from '../types'
import { moneyMillions } from '../lib/format'
import { Flag } from './Flag'

type AnnouncementProps = {
  pledge: Pledge
  onAbsorb: () => void
  onDone: () => void
}

const SPARKS = Array.from({ length: 22 }, (_, i) => i)

export function Announcement({ pledge, onAbsorb, onDone }: AnnouncementProps) {
  const [phase, setPhase] = useState<'enter' | 'exit'>('enter')
  const onAbsorbRef = useRef(onAbsorb)
  const onDoneRef = useRef(onDone)
  onAbsorbRef.current = onAbsorb
  onDoneRef.current = onDone

  useEffect(() => {
    const absorbTimer = window.setTimeout(() => {
      setPhase('exit')
      onAbsorbRef.current()
    }, 4200)
    const doneTimer = window.setTimeout(() => onDoneRef.current(), 6200)
    return () => {
      window.clearTimeout(absorbTimer)
      window.clearTimeout(doneTimer)
    }
  }, [pledge.id])

  return (
    <div className={`announce ${phase}`} role="dialog" aria-label="New pledge">
      <div className="announce-wash" />
      <div className="announce-rays" />
      <div className="announce-vignette" />
      {SPARKS.map((i) => (
        <span key={i} className="spark" style={{ '--i': i } as CSSProperties} />
      ))}
      <div className="announce-stage">
        <div className="flag-frame">
          <Flag code={pledge.countryCode} name={pledge.countryName} className="announce-flag" />
        </div>
        <p className="announce-country">{pledge.shortName}</p>
        <div className="announce-rule" />
        <p className="announce-amount">{moneyMillions(pledge.amountMillion)}</p>
        <p className="announce-currency">USD pledged</p>
      </div>
    </div>
  )
}
