# Pacific Crossing Event Planner (VATSIM) — Mini Web App Spec

## Goal

Build a tiny web app that helps VATSIM event organizers and controllers coordinate staffing for multi-facility Pacific flights by:

- Defining **departure and arrival windows** (typically in **Zulu/UTC**)
- Using **flight time assumptions** (average duration, optional buffer)
- Calculating the **required coverage windows** for each facility and for each controller’s **local timezone**
- Handling **date changes / International Date Line** correctly

This is a planning tool (not a flight tracker). Everything is computed from user inputs.

---

## Core Concepts

- **Zulu/UTC is the “source of truth”** for all calculations.
- Users may _display_ times in local timezones (e.g., “America/Los_Angeles”, “Europe/Berlin”), but the math happens in UTC.
- A “window” has:
  - start datetime (UTC)
  - end datetime (UTC)
  - optional “day label” display (local dates will differ)

---

## Primary User Flows

### 1) Create a Plan

User inputs:

- Route / event name (e.g., “VHHH → PGUM”)
- Event date (base date in UTC, e.g., “2026-01-31”)
- Departure window in UTC (e.g., 1100–1500Z)
- Flight time (e.g., 6h) + optional padding/buffer (e.g., +15m taxi / +30m approach)
- Arrival window derived automatically OR user can override/confirm

App outputs:

- Computed **arrival window in UTC**
- Coverage windows for each facility and each controller in local time

### 2) Add Facilities

User adds facility “coverage requirements” along the route:

- Facility name (e.g., “VHHH Hong Kong”, “RPLL Manila”, “PGUM Guam”)
- Facility timezone (IANA name) (e.g., “Asia/Hong_Kong”, “Asia/Manila”, “Pacific/Guam”)
- Facility role in the timeline:
  - **Departure-side** (needs coverage around departures)
  - **Arrival-side** (needs coverage around arrivals)
  - Optional: **Enroute** (needs coverage across a slice of the flight)
- Lead/lag buffers per facility (e.g., “start 30m before dep window begins”)

App outputs:

- Required coverage window for each facility in:
  - UTC
  - facility local time (with correct local date)
  - optional: highlighted if local date differs from UTC date

### 3) Add Controllers / Staff

User adds people (lightweight “availability view”, not full scheduling):

- Controller name/handle
- Controller timezone (IANA)
- Optional: “preferred shift length” (e.g., 2h)
- Optional: availability constraints (simple v1):
  - “earliest local start”
  - “latest local end”

App outputs:

- For a given UTC window, show what that looks like in each controller’s local time
- Split coverage into shift blocks (e.g., 4h window → two 2h shifts)

---

## Computation Rules

### Inputs

- `base_date_utc` (YYYY-MM-DD) — the event’s anchor date in UTC
- `dep_window_start_utc_time` (HH:mm)
- `dep_window_end_utc_time` (HH:mm)
- `flight_duration_minutes` (integer)
- `arrival_offset_minutes` (optional: default 0)
- `facility_lead_minutes` / `facility_lag_minutes` (optional per facility)

### Departure Window → UTC Datetimes

Construct:

- `dep_start_utc = base_date_utc + dep_window_start_utc_time`
- `dep_end_utc   = base_date_utc + dep_window_end_utc_time`
  If end time is “earlier” than start time, treat it as crossing midnight UTC:
- `dep_end_utc += 1 day`

### Arrival Window (Derived)

- `arr_start_utc = dep_start_utc + flight_duration + arrival_offset`
- `arr_end_utc   = dep_end_utc   + flight_duration + arrival_offset`

### Facility Coverage Window

Depending on facility type:

- Departure-side facility:
  - `fac_start_utc = dep_start_utc - lead`
  - `fac_end_utc   = dep_end_utc   + lag`
- Arrival-side facility:
  - `fac_start_utc = arr_start_utc - lead`
  - `fac_end_utc   = arr_end_utc   + lag`
- Enroute facility (optional v1.1):
  - user chooses slice: `[t1%, t2%]` of the flight (e.g., 20%–80%)
  - compute based on dep_start_utc and duration

### Shift Splitting

Given a UTC coverage window and target shift length (default 2 hours):

- Split into contiguous blocks.
- Last block may be shorter; show it explicitly.

### Timezone Conversion

Use IANA timezone conversion (not fixed offsets) via a real library:

- JS: `luxon` or `date-fns-tz` (recommended)
- Always store and compute in UTC, convert for display.

### International Date Line

No special-case logic required if:

- All computations in UTC
- Display conversion uses correct timezone rules
  The “weirdness” shows up naturally as local dates differing; the UI should surface that clearly.

---

## UI Requirements (Minimal but Clear)

### Layout

Single-page app with 3 panels:

1. **Plan Inputs**
2. **Facilities**
3. **Controllers + Output Timeline**

### Plan Inputs Panel

Fields:

- Scenario name
- Base date (UTC)
- Departure window (start/end Zulu time)
- Flight duration (hh:mm)
- Optional buffers (arrival offset)

Computed display:

- Arrival window (UTC)
- Total coverage span (earliest facility start to latest facility end)

### Facilities Panel

Table:

- Name
- Timezone (IANA)
- Type (Departure/Arrival/Enroute)
- Lead minutes
- Lag minutes
- Computed coverage (UTC + Local)

### Controllers Panel

Table:

- Name
- Timezone
- Computed local shifts (for selected facility or for whole plan)

### Output Timeline (MVP)

A simple stacked list is fine:

- **UTC master timeline**: Dep window, Arr window, plus each facility window
- Under each: local times for facility + (optional) local times for each controller

Bonus (nice-to-have):

- A simple horizontal bar visualization using pure HTML/CSS (no chart library needed).

---

## Data Model (In-Memory JSON)

No database required for MVP. Persist to `localStorage`.

Example schema:

```json
{
  "plan": {
    "name": "VHHH to PGUM",
    "baseDateUTC": "2026-01-31",
    "depStart": "11:00",
    "depEnd": "15:00",
    "flightDurationMinutes": 360,
    "arrivalOffsetMinutes": 0,
    "defaultShiftMinutes": 120
  },
  "facilities": [
    {
      "name": "Hong Kong (VHHH)",
      "timezone": "Asia/Hong_Kong",
      "type": "DEPARTURE",
      "leadMinutes": 30,
      "lagMinutes": 0
    },
    {
      "name": "Guam (PGUM)",
      "timezone": "Pacific/Guam",
      "type": "ARRIVAL",
      "leadMinutes": 30,
      "lagMinutes": 30
    }
  ],
  "controllers": [
    { "name": "Jim (PST)", "timezone": "America/Los_Angeles" },
    { "name": "Alex (Germany)", "timezone": "Europe/Berlin" }
  ]
}
```
