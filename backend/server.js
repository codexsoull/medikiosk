import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import healthRoutes from './routes/health.js'
import casesRoutes from './routes/cases.js'
import aiRoutes from './routes/ai.js'
import documentsRoutes from './routes/documents.js'
import './database/db.js' // Auto-initialize SQLite database & tables

// Load environment variables from .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// JSON body parsing middleware with 15MB limit for medical documents
app.use(express.json({ limit: '15mb' }))

// CORS middleware allowing React frontend origin
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

const envOrigins = [
  process.env.FRONTEND_ORIGIN,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
].filter(Boolean)

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])]

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`))
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  })
)

// Mount API routes
app.use('/api', healthRoutes)
app.use('/api', casesRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/documents', documentsRoutes)

// Root fallback route for convenience
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MediKiosk API Server is running',
    healthEndpoint: '/api/health',
    casesEndpoint: '/api/cases'
  })
})

// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({
      status: 'error',
      message: 'CORS forbidden: Origin not allowed'
    })
  }
  console.error('Unhandled server error:', err.message || err)
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`MediKiosk Backend running on http://localhost:${PORT}`)
})

export default app
