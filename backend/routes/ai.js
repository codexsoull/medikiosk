import express from 'express'
import { generateInterviewResponse } from '../services/ai.js'
import { generateClinicalSummary } from '../services/summary.js'

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

/**
 * Conversational AI clinical intake turn
 * POST /api/ai/chat
 * 
 * Body:
 * {
 *   "message": string (required, non-empty),
 *   "language": "en" | "hi" (optional, default: "en"),
 *   "conversation": Array<{ role: 'user' | 'assistant', content: string }> (optional)
 * }
 */
router.post(['/chat', '/ai/chat'], async (req, res) => {
  const { message, language, conversation } = req.body || {}

  // 1. Validate message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error: "message" is required and must be a non-empty string'
    })
  }

  // 2. Validate language
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

  // 3. Validate conversation if supplied
  let sanitizedConversation = []
  if (conversation !== undefined && conversation !== null) {
    if (!Array.isArray(conversation)) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error: "conversation" must be an array of messages'
      })
    }

    // Limit and sanitize conversation history (last 10 messages max)
    sanitizedConversation = conversation.slice(-10).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content.trim() : ''
    })).filter((item) => item.content.length > 0)
  }

  // 4. Generate AI response via service
  try {
    const result = await generateInterviewResponse({
      message: message.trim(),
      language: resolvedLanguage,
      conversation: sanitizedConversation
    })

    return res.status(200).json({
      status: 'success',
      data: {
        reply: result.reply,
        language: result.language
      }
    })
  } catch (error) {
    console.error('AI chat endpoint error:', error.message)

    // Security: Never leak API keys, stack traces, or internal metadata to client
    const isConfigError = error.message?.includes('GROQ_API_KEY is not configured')
    const statusCode = isConfigError ? 503 : 500
    const userMessage = isConfigError
      ? 'AI service configuration missing'
      : 'AI service temporarily unavailable'

    return res.status(statusCode).json({
      status: 'error',
      message: userMessage
    })
  }
})

/**
 * AI-powered structured clinical summary generation from patient interview
 * POST /api/ai/summary
 *
 * Body:
 * {
 *   "conversation": Array<{ role: 'user' | 'assistant', content: string }> (required, non-empty),
 *   "language": "en" | "hi" (optional, default: "en")
 * }
 */
router.post(['/summary', '/ai/summary'], async (req, res) => {
  const { conversation, language } = req.body || {}

  // 1. Validate conversation is a non-empty array
  if (!conversation || !Array.isArray(conversation) || conversation.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error: "conversation" is required and must be a non-empty array'
    })
  }

  // 2. Validate language: default to 'en', reject unsupported
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

  // 3. Filter valid messages from conversation
  const sanitizedConversation = conversation
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === 'assistant' || m.role === 'ai' ? 'assistant' : 'user',
      content: m.content.trim()
    }))

  if (sanitizedConversation.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error: "conversation" must contain at least one valid message with text content'
    })
  }

  // 4. Generate structured clinical summary via service
  try {
    const summary = await generateClinicalSummary({
      conversation: sanitizedConversation,
      language: resolvedLanguage
    })

    return res.status(200).json({
      status: 'success',
      data: {
        summary,
        language: resolvedLanguage
      }
    })
  } catch (error) {
    console.error('AI summary endpoint error:', error.message)

    // Security: Never leak API keys, stack traces, or internal metadata to client
    const isConfigError = error.message?.includes('GROQ_API_KEY is not configured')
    const statusCode = isConfigError ? 503 : 500
    const userMessage = isConfigError
      ? 'AI service configuration missing'
      : 'AI summary service temporarily unavailable'

    return res.status(statusCode).json({
      status: 'error',
      message: userMessage
    })
  }
})

export default router
