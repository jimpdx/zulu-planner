import { DateTime } from 'luxon'
import type { Plan, Facility, TimeWindow, ShiftBlock } from '../types'

const TIME_RE = /^\d{2}:\d{2}$/

// Departure windows longer than this are almost always a typo (e.g. start/end
// swapped, producing an unintended midnight rollover). We warn, not block —
// a genuine long or midnight-crossing window is still valid.
export const LONG_DEP_WINDOW_MINUTES = 720 // 12h

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value)
}

export function windowDurationMinutes(window: TimeWindow): number {
  const start = DateTime.fromISO(window.start, { zone: 'utc' })
  const end = DateTime.fromISO(window.end, { zone: 'utc' })
  return end.diff(start, 'minutes').minutes
}

export function computeDepartureWindow(plan: Plan): TimeWindow {
  const start = DateTime.fromISO(`${plan.baseDateUTC}T${plan.depStart}:00`, { zone: 'utc' })
  let end = DateTime.fromISO(`${plan.baseDateUTC}T${plan.depEnd}:00`, { zone: 'utc' })

  // Handle midnight crossing
  if (end <= start) {
    end = end.plus({ days: 1 })
  }

  return {
    start: start.toISO()!,
    end: end.toISO()!,
  }
}

export function computeArrivalWindow(plan: Plan): TimeWindow {
  const dep = computeDepartureWindow(plan)
  const offset = plan.flightDurationMinutes + plan.arrivalOffsetMinutes

  const start = DateTime.fromISO(dep.start, { zone: 'utc' }).plus({ minutes: offset })
  const end = DateTime.fromISO(dep.end, { zone: 'utc' }).plus({ minutes: offset })

  return {
    start: start.toISO()!,
    end: end.toISO()!,
  }
}

export function computeFacilityCoverage(
  facility: Facility,
  plan: Plan,
  facilities?: Facility[],
): TimeWindow {
  const dep = computeDepartureWindow(plan)
  const arr = computeArrivalWindow(plan)

  let baseStart: DateTime
  let baseEnd: DateTime

  if (facility.type === 'DEPARTURE') {
    baseStart = DateTime.fromISO(dep.start, { zone: 'utc' })
    baseEnd = DateTime.fromISO(dep.end, { zone: 'utc' })
  } else if (facility.type === 'ARRIVAL') {
    baseStart = DateTime.fromISO(arr.start, { zone: 'utc' })
    baseEnd = DateTime.fromISO(arr.end, { zone: 'utc' })
  } else {
    // ENROUTE: divide the cruise into equal sequential sectors, one per enroute
    // facility (in add-order). Sector i of N spans cruise-fraction [i/N, (i+1)/N].
    // The start of each sector is anchored on the departure window START and the
    // end on the departure window END, so a sector widens with the departure
    // window. The first sector therefore begins at the departure phase (overlaps
    // departure-side coverage) and the last ends at the arrival phase (overlaps
    // arrival-side coverage); adjacent sectors meet at the mid-cruise handoff.
    const depStart = DateTime.fromISO(dep.start, { zone: 'utc' })
    const depEnd = DateTime.fromISO(dep.end, { zone: 'utc' })
    const duration = plan.flightDurationMinutes

    const enroute = (facilities ?? [facility]).filter(f => f.type === 'ENROUTE')
    const n = Math.max(enroute.length, 1)
    const i = Math.max(enroute.findIndex(f => f.id === facility.id), 0)

    baseStart = depStart.plus({ minutes: duration * (i / n) })
    baseEnd = depEnd.plus({ minutes: duration * ((i + 1) / n) })
  }

  return {
    start: baseStart.minus({ minutes: facility.leadMinutes }).toISO()!,
    end: baseEnd.plus({ minutes: facility.lagMinutes }).toISO()!,
  }
}

export function splitIntoShifts(window: TimeWindow, shiftMinutes: number): ShiftBlock[] {
  const shifts: ShiftBlock[] = []
  let current = DateTime.fromISO(window.start, { zone: 'utc' })
  const end = DateTime.fromISO(window.end, { zone: 'utc' })

  while (current < end) {
    const shiftEnd = DateTime.min(current.plus({ minutes: shiftMinutes }), end)
    const duration = shiftEnd.diff(current, 'minutes').minutes

    shifts.push({
      start: current.toISO()!,
      end: shiftEnd.toISO()!,
      durationMinutes: Math.round(duration),
    })

    current = shiftEnd
  }

  return shifts
}
