import { useState } from 'react'
import { usePlan } from '../context/PlanContext'
import { computeFacilityCoverage, splitIntoShifts } from '../utils/coverage'
import { formatShiftLocal } from '../utils/timezone'
import { timezones } from '../utils/timezoneList'
import type { Controller } from '../types'

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const emptyController: Omit<Controller, 'id'> = {
  name: '',
  timezone: '',
  facilityId: '',
}

export function ControllersPanel() {
  const { state, dispatch } = usePlan()
  const { plan, facilities, controllers } = state
  const [editing, setEditing] = useState<Omit<Controller, 'id'> & { id?: string }>(emptyController)
  const [showForm, setShowForm] = useState(false)

  const hasValidPlan = plan.baseDateUTC && plan.depStart && plan.depEnd && plan.flightDurationMinutes > 0

  function handleSave() {
    if (!editing.name || !editing.timezone || !editing.facilityId) return

    if (editing.id) {
      dispatch({ type: 'UPDATE_CONTROLLER', payload: editing as Controller })
    } else {
      dispatch({ type: 'ADD_CONTROLLER', payload: { ...editing, id: generateId() } as Controller })
    }
    setEditing(emptyController)
    setShowForm(false)
  }

  function handleEdit(controller: Controller) {
    setEditing(controller)
    setShowForm(true)
  }

  function handleRemove(id: string) {
    dispatch({ type: 'REMOVE_CONTROLLER', payload: id })
  }

  return (
    <div className="bg-surface rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-accent">Controllers</h2>
        <button
          onClick={() => { setEditing(emptyController); setShowForm(!showForm) }}
          className="text-sm bg-accent text-base hover:bg-accent/80 px-3 py-1 rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-base rounded border border-primary/50 grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-xs text-text/70 mb-1">Name / Handle</label>
            <input
              type="text"
              value={editing.name}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
              placeholder="e.g., Jim"
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
              <option value="">Select timezone...</option>
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text/70 mb-1">Facility</label>
            <select
              value={editing.facilityId}
              onChange={e => setEditing({ ...editing, facilityId: e.target.value })}
              className="w-full bg-input border border-primary/50 rounded px-2 py-1 text-sm text-text"
            >
              <option value="">Select facility...</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
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

      {controllers.length === 0 ? (
        <p className="text-sm text-accent/50 italic">No controllers added yet.</p>
      ) : (
        <div className="space-y-2">
          {controllers.map(controller => (
            <div key={controller.id} className="p-3 bg-base rounded border border-primary/50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-sm text-text">{controller.name} <span className="text-accent/70">({controller.timezone})</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(controller)} className="text-xs text-accent hover:text-text">Edit</button>
                  <button onClick={() => handleRemove(controller.id)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
              </div>

              {hasValidPlan && (() => {
                const facility = facilities.find(f => f.id === controller.facilityId)
                if (!facility) return null
                try {
                  const window = computeFacilityCoverage(facility, plan)
                  const shiftMinutes = controller.preferredShiftMinutes || plan.defaultShiftMinutes
                  const shifts = splitIntoShifts(window, shiftMinutes)

                  return (
                    <div className="mt-2">
                      <div className="text-xs text-accent/50 mb-1">{facility.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {shifts.map((s, i) => (
                          <span
                            key={i}
                            className="inline-flex rounded-full px-4 py-1 bg-accent/20 text-accent text-sm font-mono"
                          >
                            {formatShiftLocal(s.start, s.end, controller.timezone)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                } catch {
                  return null
                }
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
