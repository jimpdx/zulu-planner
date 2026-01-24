import { DateTime } from 'luxon'
import { usePlan } from '../context/PlanContext'
import { computeDepartureWindow, computeArrivalWindow, computeFacilityCoverage, isValidTime } from '../utils/coverage'

export function Timeline() {
  const { state } = usePlan()
  const { plan, facilities } = state

  const hasValidPlan = plan.baseDateUTC && isValidTime(plan.depStart) && isValidTime(plan.depEnd) && plan.flightDurationMinutes > 0

  if (!hasValidPlan) {
    return (
      <div className="bg-surface rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3 text-accent">Timeline</h2>
        <p className="text-sm text-accent/50 italic">Enter plan details to see the timeline.</p>
      </div>
    )
  }

  const dep = computeDepartureWindow(plan)
  const arr = computeArrivalWindow(plan)

  // Compute all windows
  const windows: { label: string; start: DateTime; end: DateTime; color: string }[] = [
    {
      label: 'Departures',
      start: DateTime.fromISO(dep.start, { zone: 'utc' }),
      end: DateTime.fromISO(dep.end, { zone: 'utc' }),
      color: 'bg-green-500',
    },
    {
      label: 'Arrivals',
      start: DateTime.fromISO(arr.start, { zone: 'utc' }),
      end: DateTime.fromISO(arr.end, { zone: 'utc' }),
      color: 'bg-amber-500',
    },
  ]

  for (const facility of facilities) {
    try {
      const cov = computeFacilityCoverage(facility, plan)
      windows.push({
        label: facility.name,
        start: DateTime.fromISO(cov.start, { zone: 'utc' }),
        end: DateTime.fromISO(cov.end, { zone: 'utc' }),
        color: facility.type === 'DEPARTURE' ? 'bg-green-600' : facility.type === 'ARRIVAL' ? 'bg-amber-600' : 'bg-purple-600',
      })
    } catch { /* skip invalid */ }
  }

  // Find overall span
  const allStarts = windows.map(w => w.start)
  const allEnds = windows.map(w => w.end)
  const earliest = DateTime.min(...allStarts)!
  const latest = DateTime.max(...allEnds)!
  const totalMinutes = latest.diff(earliest, 'minutes').minutes

  if (totalMinutes <= 0) return null

  // Pad the timeline range so bars don't sit flush at edges
  const paddingMinutes = Math.max(totalMinutes * 0.05, 15)
  const timelineStart = earliest.minus({ minutes: paddingMinutes })
  const timelineEnd = latest.plus({ minutes: paddingMinutes })
  const timelineMinutes = timelineEnd.diff(timelineStart, 'minutes').minutes

  function getPosition(dt: DateTime) {
    const offset = dt.diff(timelineStart, 'minutes').minutes
    return (offset / timelineMinutes) * 100
  }

  // Generate hour markers
  const hourMarkers: { label: string; position: number }[] = []
  let marker = timelineStart.startOf('hour').plus({ hours: 1 })
  while (marker < timelineEnd) {
    hourMarkers.push({
      label: marker.toFormat('HH:mm') + 'Z',
      position: getPosition(marker),
    })
    marker = marker.plus({ hours: 1 })
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-accent">Timeline</h2>

      <div className="space-y-2">
        {/* Hour markers */}
        <div className="relative h-5 mb-1">
          {hourMarkers.map((m, i) => (
            <div
              key={i}
              className="absolute text-xs text-text -translate-x-1/2"
              style={{ left: `${m.position}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>

        {/* Bars */}
        {windows.map((w, i) => {
          const left = getPosition(w.start)
          const width = getPosition(w.end) - left

          return (
            <div key={i} className="relative h-9 flex items-center">
              <div className="absolute inset-0 bg-base rounded" />
              <div
                className={`absolute h-7 rounded ${w.color} opacity-80 flex items-center px-2`}
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span className="text-sm font-medium text-white truncate">
                  {w.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-2 text-xs text-text">
        Span: {earliest.toFormat('yyyy-MM-dd HH:mm')}Z to {latest.toFormat('HH:mm')}Z
        ({Math.round(totalMinutes / 60 * 10) / 10}h)
      </div>
    </div>
  )
}
