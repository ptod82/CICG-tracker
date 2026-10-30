export function formatDisplayAmount(n: number): string {
  const rounded = Math.round(n * 10) / 10
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString('en-US')
  }
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

/** Fixed decimal places so a counting number does not change width mid-roll. */
export function formatRollingAmount(n: number, fractionDigits: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function moneyMillions(n: number): string {
  return `$${formatDisplayAmount(n)}M`
}

export function totalOf(startMillion: number, pledges: { amountMillion: number }[]): number {
  return pledges.reduce((sum, pledge) => sum + pledge.amountMillion, startMillion)
}

export function clampPercent(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(0, Math.min(100, (value / max) * 100))
}
