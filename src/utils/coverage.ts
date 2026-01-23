import { DateTime } from 'luxon'
import type { Plan, Facility, TimeWindow, ShiftBlock } from '../types'

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

export function computeFacilityCoverage(facility: Facility, plan: Plan): TimeWindow {
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
    // ENROUTE: cover from dep start + 20% to dep start + 80% of flight
    const depStart = DateTime.fromISO(dep.start, { zone: 'utc' })
    const duration = plan.flightDurationMinutes
    baseStart = depStart.plus({ minutes: duration * 0.2 })
    baseEnd = depStart.plus({ minutes: duration * 0.8 })
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
