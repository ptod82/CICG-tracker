import { CONFIG } from '../config'
import type { Pledge, ServerMessage, TrackerSnapshot } from '../types'

const STORAGE_KEY = 'cicg-tracker-state'
const CHANNEL_NAME = 'cicg-tracker'

export const emptySnapshot = (): TrackerSnapshot => ({
  startMillion: CONFIG.startMillion,
  targetMillion: CONFIG.targetMillion,
  pledges: [],
})

export function loadLocalSnapshot(): TrackerSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptySnapshot()
    const parsed = JSON.parse(raw) as TrackerSnapshot
    if (
      typeof parsed.startMillion !== 'number' ||
      typeof parsed.targetMillion !== 'number' ||
      !Array.isArray(parsed.pledges)
    ) {
      return emptySnapshot()
    }
    return parsed
  } catch {
    return emptySnapshot()
  }
}

export function saveLocalSnapshot(snapshot: TrackerSnapshot): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function openChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(CHANNEL_NAME)
}

export async function fetchState(): Promise<TrackerSnapshot | null> {
  try {
    const res = await fetch('/api/state', { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as TrackerSnapshot
  } catch {
    return null
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

export function connectStream(onMessage: (message: ServerMessage) => void): () => void {
  const source = new EventSource('/api/stream')
  const handler = (event: MessageEvent) => {
    try {
      onMessage(JSON.parse(event.data) as ServerMessage)
    } catch {
      /* ignore malformed events */
    }
  }
  source.addEventListener('message', handler)
  return () => {
    source.removeEventListener('message', handler)
    source.close()
  }
}

export function createPledge(input: Omit<Pledge, 'id' | 'at'>): Pledge {
  return {
    ...input,
    id: crypto.randomUUID(),
    at: Date.now(),
  }
}
