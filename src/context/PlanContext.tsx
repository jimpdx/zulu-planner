import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react'
import type { PlanState, Plan, Facility, Controller } from '../types'
import { loadPlan } from '../services/sharePlan'

const STORAGE_KEY = 'zulu-event-planner'
const BASE_PATH = '/events/'

const defaultPlan: Plan = {
  name: '',
  createdBy: '',
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

function getSharedPlanId(): string | null {
  const path = window.location.pathname
  if (!path.startsWith(BASE_PATH)) return null
  const id = path.slice(BASE_PATH.length).replace(/\/$/, '')
  return id || null
}

type Action =
  | { type: 'UPDATE_PLAN'; payload: Partial<Plan> }
  | { type: 'ADD_FACILITY'; payload: Facility }
  | { type: 'UPDATE_FACILITY'; payload: Facility }
  | { type: 'REMOVE_FACILITY'; payload: string }
  | { type: 'ADD_CONTROLLER'; payload: Controller }
  | { type: 'UPDATE_CONTROLLER'; payload: Controller }
  | { type: 'REMOVE_CONTROLLER'; payload: string }
  | { type: 'LOAD_PLAN'; payload: PlanState }
  | { type: 'RESET' }

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
    case 'LOAD_PLAN':
      return action.payload
    case 'RESET':
      return defaultState
    default:
      return state
  }
}

interface PlanContextValue {
  state: PlanState
  dispatch: React.Dispatch<Action>
  isSharedPlan: boolean
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [loading, setLoading] = useState(() => !!getSharedPlanId())
  const [isSharedPlan, setIsSharedPlan] = useState(false)

  useEffect(() => {
    const id = getSharedPlanId()
    if (!id) return
    loadPlan(id).then(plan => {
      if (plan) {
        dispatch({ type: 'LOAD_PLAN', payload: plan })
        setIsSharedPlan(true)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, loading])

  if (loading) {
    return <div className="text-center text-text/60 py-12">Loading shared plan...</div>
  }

  return (
    <PlanContext.Provider value={{ state, dispatch, isSharedPlan }}>
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
