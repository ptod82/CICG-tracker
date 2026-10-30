import { clampPercent, formatDisplayAmount, moneyMillions } from '../lib/format'

type ProgressTrackProps = {
  current: number
  target: number
}

export function ProgressTrack({ current, target }: ProgressTrackProps) {
  const percent = clampPercent(current, target)
  const remaining = Math.max(0, target - current)
  const reached = current >= target
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => part * target)

  return (
    <div className="track">
      <div className="track-meta">
        <span>Raised {moneyMillions(current)}</span>
        <span className={reached ? 'track-reached' : ''}>
          {reached ? 'Target reached' : `${moneyMillions(remaining)} to target`}
        </span>
      </div>
      <div className="track-bar" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`track-fill ${reached ? 'is-complete' : ''}`} style={{ width: `${percent}%` }} />
        <div className="track-head" style={{ left: `${percent}%` }} />
      </div>
      <div className="track-ticks">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${clampPercent(tick, target)}%` }}>
            ${formatDisplayAmount(tick)}M
          </span>
        ))}
      </div>
    </div>
  )
}
