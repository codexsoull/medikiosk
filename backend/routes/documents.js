import express from 'express'
import { processDocument, extractDocumentText } from '../services/documentProcessor.js'

const router = express.Router()

/**
 * Medical Document Processing & OCR Endpoint
 * POST /api/documents/process
 *
 * Body:
 * {
 *   "originalName": string,
 *   "mimeType": string,
 *   "size": number,
 *   "content": string (base64)
 * }
 * or
 * {
 *   "file": { ... }
 * }
 */
router.post(['/process', '/documents/process'], async (req, res) => {
  try {
    const payload = req.body

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error: Request body is required.'
      })
    }

    // Check if payload has binary content (base64 string, data URL, buffer, or path)
    const fileObj = payload.file && typeof payload.file === 'object' ? payload.file : payload
    const hasContent = Boolean(
      fileObj.content ||
      fileObj.data ||
      fileObj.base64 ||
      fileObj.buffer ||
      fileObj.path
    )

    // If content is provided, perform actual text extraction / OCR
    if (hasContent) {
      const result = await extractDocumentText(payload)

      if (result.extractionStatus === 'completed') {
        return res.status(200).json({
          status: 'success',
          data: result
        })
      }

      // Extraction failed to extract readable text
      return res.status(422).json({
        status: 'error',
        message: 'Document text could not be extracted.',
        details: result.message || 'No readable text found in document'
      })
    }

    // If no binary content provided, validate and return normalized metadata (Milestone 8.1 foundation mode)
    const metadata = processDocument(payload)
    return res.status(200).json({
      status: 'success',
      data: metadata
    })
  } catch (error) {
    // Return controlled error without exposing stack traces
    const isValidationError =
      error.message?.includes('Missing file') ||
      error.message?.includes('Unsupported') ||
      error.message?.includes('empty') ||
      error.message?.includes('exceeds') ||
      error.message?.includes('Invalid') ||
      error.message?.includes('Unable to determine')

    const statusCode = isValidationError ? 400 : 500
    const clientMessage = isValidationError
      ? error.message
      : 'An unexpected error occurred while processing document.'

    return res.status(statusCode).json({
      status: 'error',
      message: clientMessage
    })
  }
})

export default router

