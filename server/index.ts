import 'dotenv/config'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { events } from './routes/events'
import { initializeSchema } from './db'

const app = new Hono()

// Initialize database schema
initializeSchema().catch(console.error)

// Only apply middleware to API routes
app.use('/api/*', logger())

// API routes
app.route('/api/events', events)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default app
