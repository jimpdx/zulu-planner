import { DateTime } from 'luxon'

export interface LocalTimeDisplay {
  dateTime: string // formatted local datetime
  date: string // local date
  time: string // local time
  timezone: string // IANA timezone name
  datesDiffer: boolean // true if local date differs from UTC date
}

export function toLocalDisplay(isoUtc: string, timezone: string): LocalTimeDisplay {
  const utc = DateTime.fromISO(isoUtc, { zone: 'utc' })
  const local = utc.setZone(timezone)

  return {
    dateTime: local.toFormat('yyyy-MM-dd HH:mm'),
    date: local.toFormat('yyyy-MM-dd'),
    time: local.toFormat('HH:mm'),
    timezone,
    datesDiffer: utc.toFormat('yyyy-MM-dd') !== local.toFormat('yyyy-MM-dd'),
  }
}

export function formatUtcWindow(start: string, end: string): string {
  const s = DateTime.fromISO(start, { zone: 'utc' })
  const e = DateTime.fromISO(end, { zone: 'utc' })

  if (s.toFormat('yyyy-MM-dd') === e.toFormat('yyyy-MM-dd')) {
    return `${s.toFormat('yyyy-MM-dd')} ${s.toFormat('HH:mm')}Z – ${e.toFormat('HH:mm')}Z`
  }
  return `${s.toFormat('yyyy-MM-dd HH:mm')}Z – ${e.toFormat('yyyy-MM-dd HH:mm')}Z`
}

export function formatShiftLocal(start: string, end: string, timezone: string): string {
  const s = DateTime.fromISO(start, { zone: 'utc' }).setZone(timezone)
  const e = DateTime.fromISO(end, { zone: 'utc' }).setZone(timezone)
  const abbr = s.offsetNameShort
  return `${s.toFormat('HH:mm')} to ${e.toFormat('HH:mm')} ${abbr}`
}

export function formatLocalWindow(start: string, end: string, timezone: string): string {
  const s = DateTime.fromISO(start, { zone: 'utc' }).setZone(timezone)
  const e = DateTime.fromISO(end, { zone: 'utc' }).setZone(timezone)

  if (s.toFormat('yyyy-MM-dd') === e.toFormat('yyyy-MM-dd')) {
    return `${s.toFormat('yyyy-MM-dd')} ${s.toFormat('HH:mm')} – ${e.toFormat('HH:mm')}`
  }
  return `${s.toFormat('yyyy-MM-dd HH:mm')} – ${e.toFormat('yyyy-MM-dd HH:mm')}`
}
