import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { PlanState } from '../types'

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

export async function savePlan(state: PlanState): Promise<string> {
  const id = generateId()
  await setDoc(doc(db, 'plans', id), {
    ...state,
    createdAt: new Date().toISOString(),
  })
  return id
}

function isValidPlan(data: unknown): data is PlanState {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  if (!d.plan || typeof d.plan !== 'object') return false
  if (!Array.isArray(d.facilities)) return false
  if (!Array.isArray(d.controllers)) return false
  const plan = d.plan as Record<string, unknown>
  if (typeof plan.name !== 'string') return false
  if (typeof plan.baseDateUTC !== 'string') return false
  if (typeof plan.depStart !== 'string') return false
  if (typeof plan.depEnd !== 'string') return false
  if (typeof plan.flightDurationMinutes !== 'number') return false
  if (typeof plan.defaultShiftMinutes !== 'number') return false
  return true
}

export async function loadPlan(id: string): Promise<PlanState | null> {
  if (!/^[a-z0-9]{1,20}$/.test(id)) return null
  const snap = await getDoc(doc(db, 'plans', id))
  if (!snap.exists()) return null
  const data = {
    plan: snap.data().plan,
    facilities: snap.data().facilities,
    controllers: snap.data().controllers,
  }
  if (!isValidPlan(data)) return null
  return data
}
