import { clampPercent, formatDisplayAmount, formatRollingAmount } from '../lib/format'

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
      </div>
      <div className="track-bar" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`track-fill ${reached ? 'is-complete' : ''}`} style={{ width: `${percent}%` }} />
        <div className="track-head" style={{ left: `${percent}%` }} />
      </div>
      <div className="track-ticks">
        {ticks.map((tick, index) => {
          const isTarget = index === ticks.length - 1
          return (
            <span key={tick} className={isTarget ? 'is-target' : undefined} style={{ left: `${clampPercent(tick, target)}%` }}>
              {isTarget ? (
                <>
                  <span className="target-chip">Target</span>
                  <span className="target-stem" aria-hidden="true" />
                </>
              ) : null}
              ${formatDisplayAmount(tick)}M
            </span>
          )
        })}
      </div>
    </div>
  )
}
