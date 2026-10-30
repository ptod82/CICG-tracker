import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Pledge, ServerMessage, TrackerSnapshot } from '../types'
import {
  connectStream,
  createPledge,
  emptySnapshot,
  fetchState,
  loadLocalSnapshot,
  openChannel,
  postJson,
  saveLocalSnapshot,
} from '../lib/sync'

export type ConnectionMode = 'connecting' | 'live' | 'local'

type AddPledgeInput = Omit<Pledge, 'id' | 'at'>

export function useTracker(role: 'display' | 'control') {
  const [snapshot, setSnapshot] = useState<TrackerSnapshot>(emptySnapshot)
  const [announcement, setAnnouncement] = useState<Pledge | null>(null)
  const [mode, setMode] = useState<ConnectionMode>('connecting')
  const modeRef = useRef<ConnectionMode>('connecting')
  const channelRef = useRef<BroadcastChannel | null>(null)

  const setModeSafe = (next: ConnectionMode) => {
    modeRef.current = next
    setMode(next)
  }

  const applyLocal = useCallback((next: TrackerSnapshot, announce?: Pledge) => {
    setSnapshot(next)
    saveLocalSnapshot(next)
    const message: ServerMessage = announce
      ? { type: 'pledge', snapshot: next, pledge: announce }
      : { type: 'reset', snapshot: next }
    channelRef.current?.postMessage(message)
    if (announce && role === 'display') {
      setAnnouncement(announce)
    }
  }, [role])

  useEffect(() => {
    let cancelled = false
    let stopStream: (() => void) | undefined
    const channel = openChannel()
    channelRef.current = channel

    const onLocalMessage = (event: MessageEvent) => {
      if (modeRef.current === 'live') return
      const message = event.data as ServerMessage
      if (message.type === 'pledge') {
        setSnapshot(message.snapshot)
        if (role === 'display') setAnnouncement(message.pledge)
      } else {
        setSnapshot(message.snapshot)
      }
    }
    channel?.addEventListener('message', onLocalMessage)

    void (async () => {
      const remote = await fetchState()
      if (cancelled) return
      if (remote) {
        setSnapshot(remote)
        setModeSafe('live')
        stopStream = connectStream((message) => {
          setSnapshot(message.snapshot)
          if (message.type === 'pledge' && role === 'display') {
            setAnnouncement(message.pledge)
          }
        })
      } else {
        setSnapshot(loadLocalSnapshot())
        setModeSafe('local')
      }
    })()

    return () => {
      cancelled = true
      stopStream?.()
      channel?.removeEventListener('message', onLocalMessage)
      channel?.close()
    }
  }, [role])

  const addPledge = useCallback(
    async (input: AddPledgeInput) => {
      if (modeRef.current === 'live') {
        const result = await postJson<ServerMessage & { pledge?: Pledge }>('/api/pledges', input)
        setSnapshot(result.snapshot)
        if (role === 'display' && result.pledge) setAnnouncement(result.pledge)
        return
      }
      const pledge = createPledge(input)
      const next = { ...snapshot, pledges: [...snapshot.pledges, pledge] }
      applyLocal(next, pledge)
    },
    [applyLocal, role, snapshot],
  )

  const undo = useCallback(async () => {
    if (modeRef.current === 'live') {
      const result = await postJson<ServerMessage>('/api/undo', {})
      setSnapshot(result.snapshot)
      setAnnouncement(null)
      return
    }
    applyLocal({ ...snapshot, pledges: snapshot.pledges.slice(0, -1) })
    setAnnouncement(null)
  }, [applyLocal, snapshot])

  const reset = useCallback(async () => {
    if (modeRef.current === 'live') {
      const result = await postJson<ServerMessage>('/api/reset', {})
      setSnapshot(result.snapshot)
      setAnnouncement(null)
      return
    }
    applyLocal({ ...snapshot, pledges: [] })
    setAnnouncement(null)
  }, [applyLocal, snapshot])

  const updateSettings = useCallback(
    async (settings: { startMillion?: number; targetMillion?: number }) => {
      if (modeRef.current === 'live') {
        const result = await postJson<ServerMessage>('/api/settings', settings)
        setSnapshot(result.snapshot)
        return
      }
      applyLocal({ ...snapshot, ...settings })
    },
    [applyLocal, snapshot],
  )

  const dismissAnnouncement = useCallback(() => setAnnouncement(null), [])

  const totalMillion = useMemo(
    () => snapshot.pledges.reduce((sum, pledge) => sum + pledge.amountMillion, snapshot.startMillion),
    [snapshot],
  )

  return {
    snapshot,
    announcement,
    mode,
    totalMillion,
    addPledge,
    undo,
    reset,
    updateSettings,
    dismissAnnouncement,
  }
}
