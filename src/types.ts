export type FacilityType = 'DEPARTURE' | 'ARRIVAL' | 'ENROUTE'

export interface Plan {
  name: string
  baseDateUTC: string // YYYY-MM-DD
  depStart: string // HH:mm
  depEnd: string // HH:mm
  flightDurationMinutes: number
  arrivalOffsetMinutes: number
  defaultShiftMinutes: number
}

export interface Facility {
  id: string
  name: string
  timezone: string // IANA
  type: FacilityType
  leadMinutes: number
  lagMinutes: number
}

export interface Controller {
  id: string
  name: string
  timezone: string // IANA
  facilityId: string
  preferredShiftMinutes?: number
  earliestLocalStart?: string // HH:mm
  latestLocalEnd?: string // HH:mm
}

export interface PlanState {
  plan: Plan
  facilities: Facility[]
  controllers: Controller[]
}

export interface TimeWindow {
  start: string // ISO datetime
  end: string // ISO datetime
}

export interface ShiftBlock {
  start: string // ISO datetime
  end: string // ISO datetime
  durationMinutes: number
}
