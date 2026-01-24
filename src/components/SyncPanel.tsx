import { useEffect, useState } from 'react'
import { usePlan } from '../context/PlanContext'
import { useRemoteSync } from '../hooks/useRemoteSync'

export function SyncPanel() {
  const { state, dispatch } = usePlan()
  const [copied, setCopied] = useState(false)

  const loadState = (newState: typeof state) => {
    dispatch({ type: 'LOAD_STATE', payload: newState })
  }

  const sync = useRemoteSync(state, loadState)

  // Check URL for event ID on mount
  useEffect(() => {
    const basePath = import.meta.env.BASE_URL || '/'
    const pattern = new RegExp(`^${basePath}e/([a-zA-Z0-9_-]+)`)
    const match = window.location.pathname.match(pattern)
    if (match) {
      sync.setEventId(match[1])
      sync.fetchRemote(match[1])
    }
  }, [])

  const handlePublish = async () => {
    const id = await sync.publish()
    if (id) {
      setCopied(false)
    }
  }

  const handlePush = async () => {
    await sync.push()
  }

  const handlePull = async () => {
    await sync.pull()
  }

  const copyLink = () => {
    const basePath = import.meta.env.BASE_URL || '/'
    const url = `${window.location.origin}${basePath}e/${sync.eventId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-accent">Share & Sync</h2>

      {sync.error && (
        <div className="mb-3 p-2 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm">
          {sync.error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {!sync.eventId ? (
          <button
            onClick={handlePublish}
            disabled={sync.isSyncing}
            className="bg-accent text-base hover:bg-accent/80 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {sync.isSyncing ? 'Publishing...' : 'Publish & Get Link'}
          </button>
        ) : (
          <>
            <button
              onClick={handlePush}
              disabled={sync.isSyncing}
              className="bg-green-600 text-white hover:bg-green-500 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              {sync.isSyncing ? 'Pushing...' : 'Push Changes'}
            </button>
            <button
              onClick={handlePull}
              disabled={sync.isSyncing}
              className="bg-amber-600 text-white hover:bg-amber-500 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              {sync.isSyncing ? 'Pulling...' : 'Pull Latest'}
            </button>
            <button
              onClick={copyLink}
              className="bg-primary text-text hover:bg-primary/80 px-4 py-2 rounded text-sm transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </>
        )}
      </div>

      {sync.eventId && (
        <div className="mt-3 text-xs text-accent/70">
          <span>Event ID: </span>
          <code className="bg-base px-1 py-0.5 rounded font-mono">{sync.eventId}</code>
          {sync.lastSyncedAt && (
            <span className="ml-2">
              Last synced: {new Date(sync.lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-accent/50">
        Your data is saved locally automatically. Use "Publish" to create a shareable link,
        then "Push" to upload changes or "Pull" to download the latest version.
      </p>
    </div>
  )
}
