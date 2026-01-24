import { useState } from 'react'
import { usePlan } from '../context/PlanContext'
import { savePlan } from '../services/sharePlan'

export function ShareButton() {
  const { state } = usePlan()
  const [status, setStatus] = useState<'idle' | 'saving' | 'copied' | 'error'>('idle')

  async function handleShare() {
    setStatus('saving')
    try {
      const id = await savePlan(state)
      const url = `${window.location.origin}/events/${id}`
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  const label =
    status === 'copied' ? 'Link copied!' :
    status === 'error' ? 'Error' :
    status === 'saving' ? 'Saving...' :
    'Share'

  const className =
    status === 'copied' ? 'text-sm bg-green-700 text-white px-3 py-1 rounded transition-colors' :
    status === 'error' ? 'text-sm bg-red-700 text-white px-3 py-1 rounded transition-colors' :
    'text-sm bg-blue-700 text-white hover:bg-blue-600 px-3 py-1 rounded transition-colors'

  return (
    <button
      onClick={handleShare}
      disabled={status === 'saving'}
      className={className}
    >
      {label}
    </button>
  )
}
