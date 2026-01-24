import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
import type { PlanState, Plan, Facility, Controller } from '../types'

const STORAGE_KEY = 'vatsim-pacific-planner'

const defaultPlan: Plan = {
  name: '',
  baseDateUTC: '',
  depStart: '11:00',
  depEnd: '15:00',
  flightDurationMinutes: 360,
  arrivalOffsetMinutes: 0,
  defaultShiftMinutes: 120,
}

const defaultState: PlanState = {
  plan: defaultPlan,
  facilities: [],
  controllers: [],
}

function loadState(): PlanState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return defaultState
}

type Action =
  | { type: 'UPDATE_PLAN'; payload: Partial<Plan> }
  | { type: 'ADD_FACILITY'; payload: Facility }
  | { type: 'UPDATE_FACILITY'; payload: Facility }
  | { type: 'REMOVE_FACILITY'; payload: string }
  | { type: 'ADD_CONTROLLER'; payload: Controller }
  | { type: 'UPDATE_CONTROLLER'; payload: Controller }
  | { type: 'REMOVE_CONTROLLER'; payload: string }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; payload: PlanState }

function reducer(state: PlanState, action: Action): PlanState {
  switch (action.type) {
    case 'UPDATE_PLAN':
      return { ...state, plan: { ...state.plan, ...action.payload } }
    case 'ADD_FACILITY':
      return { ...state, facilities: [...state.facilities, action.payload] }
    case 'UPDATE_FACILITY':
      return {
        ...state,
        facilities: state.facilities.map(f =>
          f.id === action.payload.id ? action.payload : f
        ),
      }
    case 'REMOVE_FACILITY':
      return {
        ...state,
        facilities: state.facilities.filter(f => f.id !== action.payload),
      }
    case 'ADD_CONTROLLER':
      return { ...state, controllers: [...state.controllers, action.payload] }
    case 'UPDATE_CONTROLLER':
      return {
        ...state,
        controllers: state.controllers.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      }
    case 'REMOVE_CONTROLLER':
      return {
        ...state,
        controllers: state.controllers.filter(c => c.id !== action.payload),
      }
    case 'RESET':
      return defaultState
    case 'LOAD_STATE':
      return action.payload
    default:
      return state
  }
}

interface PlanContextValue {
  state: PlanState
  dispatch: React.Dispatch<Action>
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <PlanContext.Provider value={{ state, dispatch }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
