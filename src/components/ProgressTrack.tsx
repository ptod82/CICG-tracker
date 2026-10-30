import { clampPercent, formatDisplayAmount, formatRollingAmount, moneyMillions } from '../lib/format'

type ProgressTrackProps = {
  current: number
  target: number
  fractionDigits?: number
}

export function ProgressTrack({ current, target, fractionDigits = 0 }: ProgressTrackProps) {
  const percent = clampPercent(current, target)
  const reached = current >= target
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((part) => part * target)

  return (
    <div className="track">
      <div className="track-meta">
        <span>Raised ${formatRollingAmount(current, fractionDigits)}M</span>
        <span className="track-end">
          <span className="target-chip">Target {moneyMillions(target)}</span>
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
