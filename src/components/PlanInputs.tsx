import { usePlan } from '../context/PlanContext'
import { computeDepartureWindow, computeArrivalWindow } from '../utils/coverage'
import { formatUtcWindow } from '../utils/timezone'

export function PlanInputs() {
  const { state, dispatch } = usePlan()
  const { plan } = state

  const update = (payload: Partial<typeof plan>) => {
    dispatch({ type: 'UPDATE_PLAN', payload })
  }

  const hasValidInputs = plan.baseDateUTC && plan.depStart && plan.depEnd && plan.flightDurationMinutes > 0

  let depDisplay = ''
  let arrDisplay = ''
  if (hasValidInputs) {
    try {
      const dep = computeDepartureWindow(plan)
      const arr = computeArrivalWindow(plan)
      depDisplay = formatUtcWindow(dep.start, dep.end)
      arrDisplay = formatUtcWindow(arr.start, arr.end)
    } catch { /* incomplete inputs */ }
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-accent">Plan Inputs</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-text/70 mb-1">Event Name</label>
          <input
            type="text"
            value={plan.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="e.g., VHHH → PGUM"
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Event Date</label>
          <input
            type="date"
            value={plan.baseDateUTC}
            onChange={e => update({ baseDateUTC: e.target.value })}
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
              placeholder="HH:mm"
              pattern="[0-2]\d:[0-5]\d"
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
              placeholder="HH:mm"
              pattern="[0-2]\d:[0-5]\d"
              maxLength={5}
              className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm font-mono text-text"
            />
            <span className="text-sm font-bold text-accent">Z</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text/70 mb-1">Flight Duration (minutes)</label>
          <input
            type="number"
            value={plan.flightDurationMinutes}
            onChange={e => update({ flightDurationMinutes: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full bg-input border border-primary/50 rounded px-3 py-1.5 text-sm text-text"
          />
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
    </div>
  )
}
