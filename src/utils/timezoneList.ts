import { DateTime } from 'luxon'

export interface TimezoneOption {
  value: string
  label: string
}

interface TimezoneEntry {
  value: string
  city: string
}

const entries: TimezoneEntry[] = [
  // Pacific / Oceania
  { value: 'Pacific/Auckland', city: 'Auckland' },
  { value: 'Pacific/Fiji', city: 'Fiji' },
  { value: 'Pacific/Guam', city: 'Guam' },
  { value: 'Pacific/Honolulu', city: 'Honolulu' },
  { value: 'Pacific/Majuro', city: 'Majuro' },
  { value: 'Pacific/Noumea', city: 'Noumea' },
  { value: 'Pacific/Pago_Pago', city: 'Pago Pago' },
  { value: 'Pacific/Port_Moresby', city: 'Port Moresby' },
  { value: 'Pacific/Tarawa', city: 'Tarawa' },
  { value: 'Pacific/Tongatapu', city: 'Tongatapu' },

  // Asia
  { value: 'Asia/Hong_Kong', city: 'Hong Kong' },
  { value: 'Asia/Jakarta', city: 'Jakarta' },
  { value: 'Asia/Kolkata', city: 'Kolkata' },
  { value: 'Asia/Manila', city: 'Manila' },
  { value: 'Asia/Seoul', city: 'Seoul' },
  { value: 'Asia/Shanghai', city: 'Shanghai' },
  { value: 'Asia/Singapore', city: 'Singapore' },
  { value: 'Asia/Taipei', city: 'Taipei' },
  { value: 'Asia/Tokyo', city: 'Tokyo' },

  // Australia
  { value: 'Australia/Adelaide', city: 'Adelaide' },
  { value: 'Australia/Brisbane', city: 'Brisbane' },
  { value: 'Australia/Darwin', city: 'Darwin' },
  { value: 'Australia/Melbourne', city: 'Melbourne' },
  { value: 'Australia/Perth', city: 'Perth' },
  { value: 'Australia/Sydney', city: 'Sydney' },

  // Americas
  { value: 'America/Anchorage', city: 'Anchorage' },
  { value: 'America/Chicago', city: 'Chicago' },
  { value: 'America/Denver', city: 'Denver' },
  { value: 'America/Los_Angeles', city: 'Los Angeles' },
  { value: 'America/New_York', city: 'New York' },
  { value: 'America/Phoenix', city: 'Phoenix' },
  { value: 'America/Toronto', city: 'Toronto' },
  { value: 'America/Vancouver', city: 'Vancouver' },

  // Europe
  { value: 'Europe/Berlin', city: 'Berlin' },
  { value: 'Europe/London', city: 'London' },
  { value: 'Europe/Paris', city: 'Paris' },

  // UTC
  { value: 'UTC', city: 'UTC / Zulu' },
]

function formatOffset(zone: string): string {
  const offset = DateTime.now().setZone(zone).offset
  if (offset === 0) return 'UTC'
  const sign = offset > 0 ? '+' : '-'
  const abs = Math.abs(offset)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  return minutes === 0 ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`
}

export function getTimezones(): TimezoneOption[] {
  return entries
    .map(entry => ({
      value: entry.value,
      label: `${entry.city} (${formatOffset(entry.value)})`,
      offset: DateTime.now().setZone(entry.value).offset,
    }))
    .sort((a, b) => b.offset - a.offset)
    .map(({ value, label }) => ({ value, label }))
}

// Pre-computed for static use
export const timezones: TimezoneOption[] = getTimezones()
