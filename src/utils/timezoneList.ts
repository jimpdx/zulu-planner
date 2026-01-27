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
  { value: 'Pacific/Tongatapu', city: 'Tongatapu' },       // UTC+13
  { value: 'Pacific/Auckland', city: 'Auckland' },          // UTC+12
  { value: 'Pacific/Noumea', city: 'Noumea' },             // UTC+11
  { value: 'Pacific/Pago_Pago', city: 'Pago Pago' },       // UTC-11
  { value: 'Pacific/Honolulu', city: 'Honolulu' },         // UTC-10

  // Australia
  { value: 'Australia/Sydney', city: 'Sydney' },            // UTC+10
  { value: 'Australia/Adelaide', city: 'Adelaide' },        // UTC+9:30

  // Asia
  { value: 'Asia/Tokyo', city: 'Tokyo' },                  // UTC+9
  { value: 'Asia/Singapore', city: 'Singapore' },          // UTC+8
  { value: 'Asia/Jakarta', city: 'Jakarta' },              // UTC+7
  { value: 'Asia/Dhaka', city: 'Dhaka' },                  // UTC+6
  { value: 'Asia/Kolkata', city: 'Kolkata' },              // UTC+5:30
  { value: 'Asia/Karachi', city: 'Karachi' },              // UTC+5
  { value: 'Asia/Dubai', city: 'Dubai' },                  // UTC+4

  // Europe / Africa
  { value: 'Europe/Moscow', city: 'Moscow' },              // UTC+3
  { value: 'Africa/Cairo', city: 'Cairo' },                // UTC+2
  { value: 'Europe/Berlin', city: 'Berlin' },              // UTC+1
  // Atlantic
  { value: 'Atlantic/Cape_Verde', city: 'Cape Verde' },    // UTC-1

  // Americas
  { value: 'Atlantic/South_Georgia', city: 'South Georgia' }, // UTC-2
  { value: 'America/Sao_Paulo', city: 'São Paulo' },       // UTC-3
  { value: 'America/Halifax', city: 'Halifax' },            // UTC-4
  { value: 'America/New_York', city: 'New York' },         // UTC-5
  { value: 'America/Chicago', city: 'Chicago' },           // UTC-6
  { value: 'America/Denver', city: 'Denver' },             // UTC-7
  { value: 'America/Los_Angeles', city: 'Los Angeles' },   // UTC-8
  { value: 'America/Anchorage', city: 'Anchorage' },       // UTC-9

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
