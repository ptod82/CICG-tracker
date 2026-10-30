import { useState } from 'react'
import { flagUrl } from '../data/countries'

type FlagProps = {
  code: string
  name: string
  className?: string
}

export function Flag({ code, name, className }: FlagProps) {
  const [failed, setFailed] = useState(false)

  if (code === 'other' || failed) {
    return (
      <div className={`flag-fallback ${className ?? ''}`} aria-hidden="true">
        <svg viewBox="0 0 64 42" preserveAspectRatio="xMidYMid meet">
          <rect width="64" height="42" rx="2" fill="#1a2744" />
          <circle cx="32" cy="21" r="11" fill="none" stroke="#e8c547" strokeWidth="1.6" />
          <ellipse cx="32" cy="21" rx="5" ry="11" fill="none" stroke="#e8c547" strokeWidth="1.2" />
          <line x1="21" y1="21" x2="43" y2="21" stroke="#e8c547" strokeWidth="1.2" />
        </svg>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={flagUrl(code)}
      alt={name}
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}
