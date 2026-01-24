import { useState, useCallback } from 'react'
import { publishEvent, fetchEvent, updateEvent } from '../api/events'
import type { PlanState } from '../types'

interface SyncState {
  eventId: string | null
  lastSyncedAt: string | null
  isSyncing: boolean
  error: string | null
}

export function useRemoteSync(
  state: PlanState,
  loadState: (state: PlanState) => void
) {
  const [syncState, setSyncState] = useState<SyncState>({
    eventId: null,
    lastSyncedAt: null,
    isSyncing: false,
    error: null,
  })

  const publish = useCallback(async () => {
    setSyncState((s) => ({ ...s, isSyncing: true, error: null }))
    try {
      const result = await publishEvent(state)
      setSyncState({
        eventId: result.id,
        lastSyncedAt: result.createdAt,
        isSyncing: false,
        error: null,
      })
      // Update URL without reload
      const basePath = import.meta.env.BASE_URL || '/'
      window.history.pushState({}, '', `${basePath}e/${result.id}`)
      return result.id
    } catch (err) {
      setSyncState((s) => ({
        ...s,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
      return null
    }
  }, [state])

  const fetchRemote = useCallback(async (id: string) => {
    setSyncState((s) => ({ ...s, isSyncing: true, error: null }))
    try {
      const result = await fetchEvent(id)
      loadState(result.state)
      setSyncState({
        eventId: id,
        lastSyncedAt: result.updatedAt,
        isSyncing: false,
        error: null,
      })
    } catch (err) {
      setSyncState((s) => ({
        ...s,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [loadState])

  const push = useCallback(async () => {
    if (!syncState.eventId) {
      return publish()
    }

    setSyncState((s) => ({ ...s, isSyncing: true, error: null }))
    try {
      const result = await updateEvent(syncState.eventId, state)
      setSyncState((s) => ({
        ...s,
        lastSyncedAt: result.updatedAt,
        isSyncing: false,
        error: null,
      }))
      return syncState.eventId
    } catch (err) {
      setSyncState((s) => ({
        ...s,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
      return null
    }
  }, [state, syncState.eventId, publish])

  const pull = useCallback(async () => {
    if (!syncState.eventId) {
      setSyncState((s) => ({ ...s, error: 'No event to fetch from' }))
      return
    }
    return fetchRemote(syncState.eventId)
  }, [syncState.eventId, fetchRemote])

  const setEventId = useCallback((id: string | null) => {
    setSyncState((s) => ({ ...s, eventId: id }))
  }, [])

  return {
    ...syncState,
    publish,
    fetchRemote,
    push,
    pull,
    setEventId,
  }
}
