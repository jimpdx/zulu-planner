import { usePlan } from '../context/PlanContext'
import { computeDepartureWindow, computeArrivalWindow, isValidTime, windowDurationMinutes, LONG_DEP_WINDOW_MINUTES } from '../utils/coverage'
import { formatUtcWindow } from '../utils/timezone'
import { ShareButton } from './ShareButton'

export function PlanInputs() {
  const { state, dispatch, isSharedPlan, resetPlan } = usePlan()
  const { plan } = state

  const update = (payload: Partial<typeof plan>) => {
    dispatch({ type: 'UPDATE_PLAN', payload })
  }

  function formatTime(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (digits.length === 0) return ''
    if (digits.length <= 2) return digits.padStart(2, '0') + ':00'
    if (digits.length === 3) return '0' + digits[0] + ':' + digits.slice(1)
    return digits.slice(0, 2) + ':' + digits.slice(2, 4)
  }

  const hasValidInputs = plan.baseDateUTC && isValidTime(plan.depStart) && isValidTime(plan.depEnd) && plan.flightDurationMinutes > 0

  let depDisplay = ''
  let arrDisplay = ''
  let longDepWindowHours = 0
  if (hasValidInputs) {
    try {
      const dep = computeDepartureWindow(plan)
      const arr = computeArrivalWindow(plan)
      depDisplay = formatUtcWindow(dep.start, dep.end)
      arrDisplay = formatUtcWindow(arr.start, arr.end)
      const depMinutes = windowDurationMinutes(dep)
      if (depMinutes > LONG_DEP_WINDOW_MINUTES) {
        longDepWindowHours = Math.round(depMinutes / 60 * 10) / 10
      }
    } catch { /* incomplete inputs */ }
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-accent">Plan Inputs</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetPlan}
            className="text-sm bg-gray-600 text-white hover:bg-gray-500 px-3 py-1 rounded transition-colors"
          >
            New Plan
          </button>
          <ShareButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-text/70 mb-1">Event Name</label>
          <input
            type="text"
            value={plan.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="KABC → CXYZ"
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Event Date</label>
          <input
            type="date"
            value={plan.baseDateUTC}
            onChange={e => update({ baseDateUTC: e.target.value })}
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">
            {isSharedPlan ? 'Shared by' : 'Created by'}
          </label>
          <input
            type="text"
            value={plan.createdBy}
            onChange={e => update({ createdBy: e.target.value.slice(0, 50) })}
            placeholder="Your Username / Facility"
            maxLength={50}
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Average Flight Duration (minutes)</label>
          <input
            type="number"
            value={plan.flightDurationMinutes}
            onChange={e => update({ flightDurationMinutes: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Departure Start</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={plan.depStart}
              onChange={e => update({ depStart: e.target.value })}
              onBlur={e => update({ depStart: formatTime(e.target.value) })}
              placeholder="HHmm"
              maxLength={5}
              className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm font-mono text-text"
            />
            <span className="text-sm font-bold text-accent">Z</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Departure End</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={plan.depEnd}
              onChange={e => update({ depEnd: e.target.value })}
              onBlur={e => update({ depEnd: formatTime(e.target.value) })}
              placeholder="HHmm"
              maxLength={5}
              className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm font-mono text-text"
            />
            <span className="text-sm font-bold text-accent">Z</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Arrival Offset (minutes)</label>
          <input
            type="number"
            value={plan.arrivalOffsetMinutes}
            onChange={e => update({ arrivalOffsetMinutes: parseInt(e.target.value) || 0 })}
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Default Shift Length (minutes)</label>
          <input
            type="number"
            value={plan.defaultShiftMinutes}
            onChange={e => update({ defaultShiftMinutes: parseInt(e.target.value) || 120 })}
            min={15}
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
        </div>
      </div>

      {hasValidInputs && (
        <div className="mt-4 flex gap-4">
          <div className="flex-1 bg-green-500/20 border border-green-500/50 rounded-full py-3 px-6 text-center">
            <div className="text-base font-semibold text-green-400">Departures Window</div>
            <div className="text-sm font-mono text-green-300/80">{depDisplay}</div>
          </div>
          <div className="flex-1 bg-amber-500/20 border border-amber-500/50 rounded-full py-3 px-6 text-center">
            <div className="text-base font-semibold text-white">Arrivals Window</div>
            <div className="text-sm font-mono text-amber-300/80">{arrDisplay}</div>
          </div>
        </div>
      )}

      {longDepWindowHours > 0 && (
        <div className="mt-2 text-sm text-amber-400 text-center">
          Departure window is {longDepWindowHours}h — did you mean to cross midnight? Check your start/end times.
        </div>
      )}
    </div>
  )
}
