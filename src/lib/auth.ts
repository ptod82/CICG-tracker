export type AuthStatus = {
  pinRequired: boolean
  unlocked: boolean
}

export async function fetchAuth(): Promise<AuthStatus> {
  try {
    const res = await fetch('/api/auth', { cache: 'no-store' })
    if (!res.ok) return { pinRequired: false, unlocked: true }
    return (await res.json()) as AuthStatus
  } catch {
    return { pinRequired: false, unlocked: true }
  }
}

export async function unlockWithPin(pin: string): Promise<boolean> {
  const res = await fetch('/api/unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  })
  return res.ok
}
