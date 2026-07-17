import { useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { usePlan } from '../context/PlanContext'
import { computeDepartureWindow, computeArrivalWindow, computeFacilityCoverage, isValidTime } from '../utils/coverage'

const SNAP_MINUTES = 30
const MIN_WINDOW_MINUTES = SNAP_MINUTES // a bar can't be narrower than one snap step

type DragMode = 'move' | 'start' | 'end'

interface DragState {
  facilityId: string
  mode: DragMode
  // Frozen axis captured at drag start so the timeline doesn't rescale mid-drag.
  axisStart: DateTime
  axisMinutes: number
  // Pointer x (client px) at grab, and px-per-minute for converting travel.
  originClientX: number
  pxPerMinute: number
  // Origin window as absolute snapped wall-clock times (independent of the axis,
  // so fractional axis padding can never leak a few minutes into the result).
  origStart: DateTime
  origEnd: DateTime
  // Live preview as absolute times while dragging.
  previewStart: DateTime
  previewEnd: DateTime
  // True once the pointer has moved enough to change the snapped window. A bare
  // grab (no real movement) leaves this false and commits nothing.
  moved: boolean
}

interface Win {
  label: string
  start: DateTime
  end: DateTime
  color: string
  timezone?: string
  facilityId?: string // present => draggable
  overridden?: boolean
}

// Round an absolute time to the nearest 30-min wall-clock boundary (:00 / :30).
// Works on the real datetime, so it never inherits fractional axis offsets.
function snapDateTime(dt: DateTime): DateTime {
  const ms = dt.toMillis()
  const step = SNAP_MINUTES * 60 * 1000
  return DateTime.fromMillis(Math.round(ms / step) * step, { zone: 'utc' })
}

export function Timeline() {
  const { state, dispatch } = usePlan()
  const { plan, facilities } = state
  const trackRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

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

  // Build all windows. `timezone`/`facilityId` are set only for facility bars.
  const windows: Win[] = [
    {
      label: 'Departure Window',
      start: DateTime.fromISO(dep.start, { zone: 'utc' }),
      end: DateTime.fromISO(dep.end, { zone: 'utc' }),
      color: 'bg-green-500',
    },
    {
      label: 'Arrival Window',
      start: DateTime.fromISO(arr.start, { zone: 'utc' }),
      end: DateTime.fromISO(arr.end, { zone: 'utc' }),
      color: 'bg-amber-500',
    },
  ]

  for (const facility of facilities) {
    try {
      const cov = computeFacilityCoverage(facility, plan, facilities)
      let start = DateTime.fromISO(cov.start, { zone: 'utc' })
      let end = DateTime.fromISO(cov.end, { zone: 'utc' })
      // While this bar is being dragged, show the live preview instead of the
      // committed window so it follows the cursor smoothly.
      if (drag && drag.facilityId === facility.id) {
        start = drag.previewStart
        end = drag.previewEnd
      }
      windows.push({
        label: facility.name,
        start,
        end,
        color: facility.type === 'DEPARTURE' ? 'bg-green-600' : facility.type === 'ARRIVAL' ? 'bg-amber-600' : 'bg-purple-600',
        timezone: facility.timezone,
        facilityId: facility.id,
        overridden: !!facility.manualWindow,
      })
    } catch { /* skip invalid */ }
  }

  // Local coverage range for a facility bar, e.g. "1500-2100 local".
  function localRange(w: Win): string | null {
    if (!w.timezone) return null
    const s = w.start.setZone(w.timezone)
    const e = w.end.setZone(w.timezone)
    if (!s.isValid || !e.isValid) return null
    return `${s.toFormat('HHmm')}-${e.toFormat('HHmm')} local`
  }

  // Overall span. During a drag we keep the axis frozen (captured at drag start)
  // so the timeline doesn't rescale under the cursor; it recomputes on release.
  const earliest = DateTime.min(...windows.map(w => w.start))!
  const latest = DateTime.max(...windows.map(w => w.end))!
  const totalMinutes = latest.diff(earliest, 'minutes').minutes

  if (totalMinutes <= 0) return null

  let timelineStart: DateTime
  let timelineMinutes: number
  if (drag) {
    timelineStart = drag.axisStart
    timelineMinutes = drag.axisMinutes
  } else {
    const paddingMinutes = Math.max(totalMinutes * 0.05, 15)
    timelineStart = earliest.minus({ minutes: paddingMinutes })
    const timelineEnd = latest.plus({ minutes: paddingMinutes })
    timelineMinutes = timelineEnd.diff(timelineStart, 'minutes').minutes
  }

  function getPosition(dt: DateTime) {
    const offset = dt.diff(timelineStart, 'minutes').minutes
    return (offset / timelineMinutes) * 100
  }

  // Hour markers
  const hourMarkers: { label: string; position: number }[] = []
  let marker = timelineStart.startOf('hour').plus({ hours: 1 })
  const markerEnd = timelineStart.plus({ minutes: timelineMinutes })
  while (marker < markerEnd) {
    hourMarkers.push({ label: marker.toFormat('HH:mm') + 'Z', position: getPosition(marker) })
    marker = marker.plus({ hours: 1 })
  }

  // A single pointerdown on the bar decides the mode from where you grabbed:
  // near the left/right edge => resize that end; in the middle => move. This
  // avoids nested edge handlers (whose ephemeral DOM nodes broke pointer capture
  // and event ordering). Pointer capture goes on the stable track container.
  const EDGE_PX = 10
  // Decide, from where the pointer sits relative to a bar, whether it's over the
  // left edge ('start'), right edge ('end'), or middle ('move'). Shared by the
  // drag handler and the hover-cursor handler so the two always agree.
  function detectMode(clientX: number, w: Win): DragMode {
    const track = trackRef.current
    if (!track) return 'move'
    const rect = track.getBoundingClientRect()
    const pxPerMinute = rect.width / timelineMinutes
    const barLeftPx = w.start.diff(timelineStart, 'minutes').minutes * pxPerMinute + rect.left
    const barRightPx = w.end.diff(timelineStart, 'minutes').minutes * pxPerMinute + rect.left
    if (barRightPx - barLeftPx > EDGE_PX * 3) {
      if (clientX - barLeftPx <= EDGE_PX) return 'start'
      if (barRightPx - clientX <= EDGE_PX) return 'end'
    }
    return 'move'
  }

  function beginDrag(e: React.PointerEvent, w: Win) {
    if (!w.facilityId || !trackRef.current) return
    e.preventDefault()
    const track = trackRef.current
    const rect = track.getBoundingClientRect()
    const pxPerMinute = rect.width / timelineMinutes
    const mode = detectMode(e.clientX, w)

    // Snap the origin to the 30-min wall-clock grid at grab time, so the bar is
    // grid-aligned (:00/:30) before any movement and dragging advances in clean
    // 30-min steps with no spurious offset.
    const origStart = snapDateTime(w.start)
    const origEnd = snapDateTime(w.end)
    track.setPointerCapture?.(e.pointerId)
    setDrag({
      facilityId: w.facilityId,
      mode,
      axisStart: timelineStart,
      axisMinutes: timelineMinutes,
      originClientX: e.clientX,
      pxPerMinute,
      origStart,
      origEnd,
      previewStart: origStart,
      previewEnd: origEnd,
      moved: false,
    })
  }

  // Ignore pointer travel smaller than this; a click emits tiny jitter and must
  // not count as a drag (which previously nudged the snapped time by a few min).
  const DRAG_DEADZONE_PX = 4
  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return
    const deltaPx = e.clientX - drag.originClientX
    if (!drag.moved && Math.abs(deltaPx) < DRAG_DEADZONE_PX) return
    // Quantize the pointer TRAVEL into whole 30-min steps, then apply it to the
    // origin snapped to the grid. Measuring steps from the origin (rather than
    // snapping the absolute result) means the bar never jumps backwards on the
    // first move: a small rightward drag is +0 or +30, never a pull to grid.
    // Quantize pointer travel into whole 30-min steps, applied to the already-
    // grid-snapped origin times. Everything is absolute wall-clock, so there is
    // no axis-offset term and a 0-step move leaves the times exactly unchanged.
    const steps = Math.round(deltaPx / drag.pxPerMinute / SNAP_MINUTES)
    const deltaMin = steps * SNAP_MINUTES
    let s = drag.origStart
    let en = drag.origEnd
    if (drag.mode === 'move') {
      s = drag.origStart.plus({ minutes: deltaMin })
      en = drag.origEnd.plus({ minutes: deltaMin })
    } else if (drag.mode === 'start') {
      s = DateTime.min(drag.origStart.plus({ minutes: deltaMin }), drag.origEnd.minus({ minutes: MIN_WINDOW_MINUTES }))
    } else {
      en = DateTime.max(drag.origEnd.plus({ minutes: deltaMin }), drag.origStart.plus({ minutes: MIN_WINDOW_MINUTES }))
    }
    if (!drag.moved || +s !== +drag.previewStart || +en !== +drag.previewEnd) {
      setDrag({ ...drag, previewStart: s, previewEnd: en, moved: true })
    }
  }

  function endDrag() {
    if (!drag) return
    // A bare grab with no real movement commits nothing — leaves the bar as-is.
    if (!drag.moved) { setDrag(null); return }
    let end = drag.previewEnd
    if (end.diff(drag.previewStart, 'minutes').minutes < MIN_WINDOW_MINUTES) {
      end = drag.previewStart.plus({ minutes: MIN_WINDOW_MINUTES })
    }
    const facility = facilities.find(f => f.id === drag.facilityId)
    if (facility) {
      dispatch({
        type: 'UPDATE_FACILITY',
        payload: { ...facility, manualWindow: { start: drag.previewStart.toISO()!, end: end.toISO()! } },
      })
    }
    setDrag(null)
  }

  function resetToAuto(facilityId: string) {
    const facility = facilities.find(f => f.id === facilityId)
    if (!facility) return
    const { manualWindow, ...rest } = facility
    void manualWindow
    dispatch({ type: 'UPDATE_FACILITY', payload: rest })
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3 text-accent">Timeline</h2>

      <div
        ref={trackRef}
        className="space-y-2"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
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
          const draggable = !!w.facilityId
          const range = localRange(w)

          return (
            <div key={i} className="relative h-9 flex items-center">
              <div className="absolute inset-0 bg-base rounded" />
              <div
                className={`absolute h-7 rounded ${w.color} opacity-80 flex items-center px-2 ${draggable ? 'cursor-grab' : ''} ${drag?.facilityId === w.facilityId ? 'opacity-100 ring-2 ring-white/60' : ''}`}
                style={{ left: `${left}%`, width: `${width}%`, touchAction: 'none' }}
                onPointerDown={draggable ? e => beginDrag(e, w) : undefined}
                onPointerMove={draggable && !drag ? e => {
                  // Show a resize cursor over the edges, grab cursor in the middle.
                  // Set directly on the node to avoid re-rendering on every move.
                  const m = detectMode(e.clientX, w)
                  e.currentTarget.style.cursor = m === 'move' ? 'grab' : 'ew-resize'
                } : undefined}
              >
                <span className="text-sm font-medium text-white truncate pointer-events-none">
                  {w.label}
                  {range ? <span className="font-normal text-white/80"> ({range})</span> : null}
                  {w.overridden ? <span className="font-normal text-white/60"> ✎</span> : null}
                </span>
              </div>
              {w.overridden && (
                <button
                  onClick={() => resetToAuto(w.facilityId!)}
                  className="absolute right-1 text-[10px] text-accent hover:text-text bg-base/80 rounded px-1 pointer-events-auto"
                  title="Reset this bar to the auto-computed window"
                >
                  reset
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-2 text-xs text-text">
        Span: {earliest.toFormat('yyyy-MM-dd HH:mm')}Z to{' '}
        {earliest.hasSame(latest, 'day') ? latest.toFormat('HH:mm') : latest.toFormat('yyyy-MM-dd HH:mm')}Z
        {' '}({Math.round(totalMinutes / 60 * 10) / 10}h)
      </div>
      {facilities.some(f => f.manualWindow) && (
        <div className="mt-1 text-[11px] text-accent/60">
          Drag a facility bar's edges to resize or its body to move (snaps to 30 min). ✎ marks manually adjusted bars.
        </div>
      )}
    </div>
  )
}
