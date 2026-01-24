import { Hono } from 'hono'
import { nanoid } from 'nanoid'
import { db } from '../db'
import type { PlanState } from '../../src/types'

const events = new Hono()

function validatePlanState(data: unknown): data is PlanState {
  if (!data || typeof data !== 'object') return false
  const state = data as Record<string, unknown>
  return (
    typeof state.plan === 'object' &&
    Array.isArray(state.facilities) &&
    Array.isArray(state.controllers)
  )
}

// POST /api/events - Create new event (publish)
events.post('/', async (c) => {
  const body = await c.req.json()

  if (!validatePlanState(body)) {
    return c.json({ error: 'Invalid plan state' }, 400)
  }

  const id = nanoid(8)
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO events (id, state_json, created_at, updated_at)
          VALUES (?, ?, ?, ?)`,
    args: [id, JSON.stringify(body), now, now],
  })

  return c.json({ id, createdAt: now }, 201)
})

// GET /api/events/:id - Fetch event
events.get('/:id', async (c) => {
  const id = c.req.param('id')

  const result = await db.execute({
    sql: 'SELECT state_json, created_at, updated_at FROM events WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const row = result.rows[0]
  const state = JSON.parse(row.state_json as string)

  return c.json({
    id,
    state,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
})

// PUT /api/events/:id - Update event
events.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  if (!validatePlanState(body)) {
    return c.json({ error: 'Invalid plan state' }, 400)
  }

  const existing = await db.execute({
    sql: 'SELECT id FROM events WHERE id = ?',
    args: [id],
  })

  if (existing.rows.length === 0) {
    return c.json({ error: 'Event not found' }, 404)
  }

  const now = new Date().toISOString()

  await db.execute({
    sql: 'UPDATE events SET state_json = ?, updated_at = ? WHERE id = ?',
    args: [JSON.stringify(body), now, id],
  })

  return c.json({ id, updatedAt: now })
})

export { events }
