import express from 'express'

const router = express.Router()

/**
 * Health check endpoint for MediKiosk backend
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'MediKiosk Backend'
  })
})

export default router

