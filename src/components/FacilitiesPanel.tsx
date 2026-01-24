import { useState } from 'react'
import { usePlan } from '../context/PlanContext'
import { computeFacilityCoverage, isValidTime } from '../utils/coverage'
import { formatUtcWindow, formatLocalWindow, toLocalDisplay } from '../utils/timezone'
import { timezones } from '../utils/timezoneList'
import type { Facility, FacilityType } from '../types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const emptyFacility: Omit<Facility, 'id'> = {
  name: '',
  timezone: '',
  type: 'DEPARTURE',
  leadMinutes: 30,
  lagMinutes: 0,
}

export function FacilitiesPanel() {
  const { state, dispatch } = usePlan()
  const { plan, facilities } = state
  const [editing, setEditing] = useState<Omit<Facility, 'id'> & { id?: string }>(emptyFacility)
  const [showForm, setShowForm] = useState(false)

  const hasValidPlan = plan.baseDateUTC && isValidTime(plan.depStart) && isValidTime(plan.depEnd) && plan.flightDurationMinutes > 0

  function handleSave() {
    if (!editing.name || !editing.timezone) return

    if (editing.id) {
      dispatch({ type: 'UPDATE_FACILITY', payload: editing as Facility })
    } else {
      dispatch({ type: 'ADD_FACILITY', payload: { ...editing, id: generateId() } as Facility })
    }
    setEditing(emptyFacility)
    setShowForm(false)
  }

  function handleEdit(facility: Facility) {
    setEditing(facility)
    setShowForm(true)
  }

  function handleRemove(id: string) {
    dispatch({ type: 'REMOVE_FACILITY', payload: id })
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-accent">Facilities</h2>
        <button
          onClick={() => { setEditing(emptyFacility); setShowForm(!showForm) }}
          className="text-sm bg-blue-700 text-white hover:bg-blue-600 px-3 py-1 rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-base rounded border border-primary/50 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-text/70 mb-1">Name</label>
            <input
              type="text"
              value={editing.name}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="Blue Center (ZBX)"
              className="w-full bg-input border border-primary/50 rounded px-2 py-1 text-sm text-text"
            />
          </div>
          <div>
            <label className="block text-xs text-text/70 mb-1">Timezone</label>
            <select
              value={editing.timezone}
              onChange={e => setEditing({ ...editing, timezone: e.target.value })}
              className="w-full bg-input border border-primary/50 rounded px-2 py-1 text-sm text-text"
            >
              <option value="">Select one</option>
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text/70 mb-1">Type</label>
            <select
              value={editing.type}
              onChange={e => setEditing({ ...editing, type: e.target.value as FacilityType })}
              className="w-full bg-input border border-primary/50 rounded px-2 py-1 text-sm text-text"
            >
              <option value="DEPARTURE">Departure</option>
              <option value="ARRIVAL">Arrival</option>
              <option value="ENROUTE">Enroute</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text/70 mb-1">Lead (min)</label>
            <input
              type="number"
              value={editing.leadMinutes}
              onChange={e => setEditing({ ...editing, leadMinutes: parseInt(e.target.value) || 0 })}
              className="w-full bg-input border border-primary/50 rounded px-2 py-1 text-sm text-text"
            />
          </div>
          <div>
            <label className="block text-xs text-text/70 mb-1">Lag (min)</label>
            <input
              type="number"
              value={editing.lagMinutes}
              onChange={e => setEditing({ ...editing, lagMinutes: parseInt(e.target.value) || 0 })}
              className="w-full bg-input border border-primary/50 rounded px-2 py-1 text-sm text-text"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSave}
              className="bg-accent text-base hover:bg-accent/80 px-4 py-1 rounded text-sm transition-colors"
            >
              {editing.id ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {facilities.length === 0 ? (
        <p className="text-sm text-accent/50 italic">No facilities added yet.</p>
      ) : (
        <div className="space-y-2">
          {facilities.map(facility => {
            let coverage = null
            if (hasValidPlan) {
              try {
                const window = computeFacilityCoverage(facility, plan)
                const localStart = toLocalDisplay(window.start, facility.timezone)
                const localEnd = toLocalDisplay(window.end, facility.timezone)
                coverage = {
                  utc: formatUtcWindow(window.start, window.end),
                  local: formatLocalWindow(window.start, window.end, facility.timezone),
                  datesDiffer: localStart.datesDiffer || localEnd.datesDiffer,
                }
              } catch { /* invalid inputs */ }
            }

            return (
              <div key={facility.id} className="p-3 bg-base rounded border border-primary/50">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-text truncate">
                    <span className="text-accent">{facility.name}</span>
                    {' '} {facility.type}
                    {' '}<span className="text-accent/60">{facility.timezone}</span>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => handleEdit(facility)} className="text-xs text-accent hover:text-text">Edit</button>
                    <button onClick={() => handleRemove(facility.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </div>
                {(facility.leadMinutes > 0 || facility.lagMinutes > 0) && (
                  <div className="text-sm text-text/70">
                    {facility.leadMinutes > 0 && facility.lagMinutes > 0
                      ? `Leading by ${facility.leadMinutes} and lagging by ${facility.lagMinutes} minutes`
                      : facility.leadMinutes > 0
                        ? `Leading by ${facility.leadMinutes} minutes`
                        : `Lagging by ${facility.lagMinutes} minutes`}
                  </div>
                )}
                {coverage && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full px-4 py-1 bg-accent/20 text-sm font-mono text-green-400">
                      UTC: {coverage.utc}
                    </span>
                    <span className={`inline-flex rounded-full px-4 py-1 bg-accent/20 text-sm font-mono ${coverage.datesDiffer ? 'text-amber-400' : 'text-accent'}`}>
                      Local: {coverage.local}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
