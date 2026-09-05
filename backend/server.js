import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import healthRoutes from './routes/health.js'
import casesRoutes from './routes/cases.js'
import aiRoutes from './routes/ai.js'
import './database/db.js' // Auto-initialize SQLite database & tables

// Load environment variables from .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// JSON body parsing middleware
app.use(express.json())

// CORS middleware allowing React frontend origin
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]

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

// Root fallback route for convenience
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MediKiosk API Server is running',
    healthEndpoint: '/api/health',
    casesEndpoint: '/api/cases'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`MediKiosk Backend running on http://localhost:${PORT}`)
})

export default app
