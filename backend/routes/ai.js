import express from 'express'

const router = express.Router()

const SUPPORTED_LANGUAGES = ['en', 'hi']

/**
 * Deterministic test endpoint for AI backend integration
 * POST /api/ai/test
 * 
 * Body:
 * {
 *   "message": string (required, non-empty),
 *   "language": "en" | "hi" (optional, default: "en")
 * }
 */
router.post(['/test', '/ai/test'], (req, res) => {
  const { message, language } = req.body || {}

  // 1. Validate that message exists and is a non-empty string
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error: "message" is required and must be a non-empty string'
    })
  }

  // 2. Validate language: default to 'en' if omitted, reject unsupported values
  let resolvedLanguage = 'en'
  if (language !== undefined && language !== null) {
    if (typeof language !== 'string' || !SUPPORTED_LANGUAGES.includes(language.toLowerCase().trim())) {
      return res.status(400).json({
        status: 'error',
        message: `Validation error: Unsupported language "${language}". Supported languages are: ${SUPPORTED_LANGUAGES.join(', ')}`
      })
    }
    resolvedLanguage = language.toLowerCase().trim()
  }

  // 3. Return deterministic test response
  return res.status(200).json({
    status: 'success',
    message: 'AI backend endpoint is working',
    data: {
      receivedMessage: message.trim(),
      language: resolvedLanguage
    }
  })
})

export default router

