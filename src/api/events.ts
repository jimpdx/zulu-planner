import type { PlanState } from '../types'

const API_BASE = '/api/events'

export interface EventResponse {
  id: string
  state: PlanState
  createdAt: string
  updatedAt: string
}

export interface PublishResponse {
  id: string
  createdAt: string
}

export interface UpdateResponse {
  id: string
  updatedAt: string
}

export async function publishEvent(state: PlanState): Promise<PublishResponse> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to publish event')
  }

  return response.json()
}

export async function fetchEvent(id: string): Promise<EventResponse> {
  const response = await fetch(`${API_BASE}/${id}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Event not found')
    }
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch event')
  }

  return response.json()
}

export async function updateEvent(id: string, state: PlanState): Promise<UpdateResponse> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update event')
  }

  return response.json()
}
