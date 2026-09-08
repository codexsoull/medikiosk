/**
 * MediKiosk Medical Document Processing Service
 * Provides validation, MIME detection, text extraction (PDF),
 * and Optical Character Recognition (OCR for PNG/JPG/WEBP).
 */

import { PDFParse } from 'pdf-parse'
import Tesseract from 'tesseract.js'
import fs from 'fs'

// Supported Document MIME types and standard extensions
export const SUPPORTED_MIME_TYPES = {
  'application/pdf': { ext: 'pdf', category: 'pdf' },
  'image/png': { ext: 'png', category: 'image' },
  'image/jpeg': { ext: 'jpg', category: 'image' },
  'image/jpg': { ext: 'jpg', category: 'image' },
  'image/webp': { ext: 'webp', category: 'image' }
}

export const SUPPORTED_EXTENSIONS = {
  pdf: { mime: 'application/pdf', category: 'pdf' },
  png: { mime: 'image/png', category: 'image' },
  jpg: { mime: 'image/jpeg', category: 'image' },
  jpeg: { mime: 'image/jpeg', category: 'image' },
  webp: { mime: 'image/webp', category: 'image' }
}

/**
 * Validates and processes an uploaded document file
 * @param {Object} file - File descriptor object or payload
 * @param {string} [file.originalName] - Original file name
 * @param {string} [file.fileName] - Alternative file name property
 * @param {string} [file.name] - Standard File.name property
 * @param {string} [file.mimeType] - MIME type
 * @param {string} [file.type] - Standard File.type property
 * @param {number} [file.size] - File size in bytes
 * @returns {Object} Normalized document metadata
 */
export function processDocument(file) {
  // 1. Validate that file input exists
  if (!file || typeof file !== 'object' || Array.isArray(file)) {
    throw new Error('Missing file data. A valid document descriptor is required.')
  }

  // Support nested file property or direct object
  const fileObj = file.file && typeof file.file === 'object' ? file.file : file

  const originalName = (
    fileObj.originalName ||
    fileObj.fileName ||
    fileObj.name ||
    ''
  ).trim()

  const rawMimeType = (
    fileObj.mimeType ||
    fileObj.type ||
    ''
  ).toLowerCase().trim()

  const rawSize = fileObj.size !== undefined && fileObj.size !== null
    ? Number(fileObj.size)
    : null

  // 2. Validate file identifier existence
  if (!originalName && !rawMimeType) {
    throw new Error('Invalid file descriptor: original file name or MIME type is required.')
  }

  // 3. Validate file size
  const maxMb = Number(process.env.MAX_DOCUMENT_SIZE_MB) || 10
  const maxBytes = maxMb * 1024 * 1024

  if (rawSize !== null) {
    if (isNaN(rawSize) || rawSize < 0) {
      throw new Error('Invalid file size value.')
    }
    if (rawSize === 0) {
      throw new Error('File is empty (0 bytes).')
    }
    if (rawSize > maxBytes) {
      throw new Error(`File size (${(rawSize / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of ${maxMb} MB.`)
    }
  }

  // 4. Extract and validate file extension
  let ext = ''
  if (originalName && originalName.includes('.')) {
    const parts = originalName.split('.')
    ext = parts[parts.length - 1].toLowerCase().trim()
  }

  // 5. Cross-validate MIME type and extension against supported list
  const extConfig = ext ? SUPPORTED_EXTENSIONS[ext] : null
  const mimeConfig = rawMimeType ? SUPPORTED_MIME_TYPES[rawMimeType] : null

  // Reject if extension is present and unsupported
  if (ext && !extConfig) {
    throw new Error(`Unsupported file type ".${ext}". Supported types are PDF, PNG, JPG/JPEG, and WEBP.`)
  }

  // Reject if MIME is present and unsupported
  if (rawMimeType && !mimeConfig) {
    throw new Error(`Unsupported MIME type "${rawMimeType}". Supported types are application/pdf, image/png, image/jpeg, and image/webp.`)
  }

  // If neither extension nor MIME is identifiable
  if (!extConfig && !mimeConfig) {
    throw new Error('Unable to determine document type. Supported types are PDF, PNG, JPG/JPEG, and WEBP.')
  }

  // Resolve canonical extension and canonical MIME
  const resolvedFileType = ext ? (ext === 'jpeg' ? 'jpg' : ext) : mimeConfig.ext
  const resolvedMimeType = rawMimeType && mimeConfig ? rawMimeType : extConfig.mime
  const category = (mimeConfig || extConfig).category

  // 6. Return normalized document metadata
  return {
    success: true,
    originalName: originalName || `document_${Date.now()}.${resolvedFileType}`,
    mimeType: resolvedMimeType,
    fileType: resolvedFileType,
    category,
    size: rawSize !== null ? rawSize : 0,
    extractionStatus: 'pending',
    extractedText: '',
    processedAt: new Date().toISOString()
  }
}

/**
 * Conservative text cleaning for medical documents
 * Normalizes whitespace and artifacts while strictly preserving
 * clinical values, dosages, units, abbreviations, and numbers.
 * @param {string} rawText
 * @returns {string} Cleaned text
 */
export function cleanExtractedText(rawText) {
  if (!rawText || typeof rawText !== 'string') return ''

  // 1. Normalize CRLF and CR to standard LF \n
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // 2. Remove standard PDF pagination artifacts e.g. "-- 1 of 1 --"
  text = text.replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')

  // 3. Strip non-printable ASCII control characters (keep \n and \t)
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // 4. Normalize non-breaking spaces and exotic Unicode spaces to standard space
  text = text.replace(/[\u00A0\u2000-\u200B\u202F\u205F]/g, ' ')

  // 5. Line-by-line processing
  const lines = text.split('\n').map((line) => {
    // Collapse multiple horizontal spaces/tabs to single space
    return line.replace(/[ \t]+/g, ' ').trim()
  })

  // 6. Condense excessive blank lines (allow at most 1 empty line between text blocks)
  const cleanedLines = []
  let prevBlank = false
  for (const line of lines) {
    if (line.length === 0) {
      if (!prevBlank && cleanedLines.length > 0) {
        cleanedLines.push('')
        prevBlank = true
      }
    } else {
      cleanedLines.push(line)
      prevBlank = false
    }
  }

  return cleanedLines.join('\n').trim()
}

/**
 * Extracts binary Buffer from a file descriptor
 * Supports base64 strings, data URLs, file paths, or raw Buffers
 * @param {Object} fileObj
 * @returns {Buffer|null}
 */
export function getFileBuffer(fileObj) {
  if (!fileObj || typeof fileObj !== 'object') return null

  if (Buffer.isBuffer(fileObj)) return fileObj
  if (Buffer.isBuffer(fileObj.buffer)) return fileObj.buffer
  if (Buffer.isBuffer(fileObj.content)) return fileObj.content
  if (Buffer.isBuffer(fileObj.data)) return fileObj.data

  const rawContent = fileObj.content || fileObj.data || fileObj.base64
  if (typeof rawContent === 'string' && rawContent.length > 0) {
    const base64Str = rawContent.includes(';base64,')
      ? rawContent.split(';base64,')[1]
      : rawContent
    return Buffer.from(base64Str, 'base64')
  }

  if (fileObj.path && typeof fileObj.path === 'string' && fs.existsSync(fileObj.path)) {
    return fs.readFileSync(fileObj.path)
  }

  return null
}

/**
 * Extracts text directly from a PDF buffer
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    const rawText = result && typeof result === 'object' ? (result.text || '') : String(result || '')
    return rawText
  } finally {
    if (typeof parser.destroy === 'function') {
      try {
        await parser.destroy()
      } catch {
        // Safe destroy ignore
      }
    }
  }
}

/**
 * Performs OCR on an image buffer using Tesseract.js
 * @param {Buffer} buffer
 * @param {string} [ext='png']
 * @returns {Promise<string>}
 */
export async function extractImageOcr(buffer, ext = 'png') {
  // Tesseract.js supports Buffer directly in Node.js
  const result = await Tesseract.recognize(buffer, 'eng')
  return result?.data?.text || ''
}

/**
 * Full Document Text Extraction & OCR Pipeline
 * Validates document, extracts text via direct PDF parsing or Tesseract OCR,
 * normalizes text, and returns structured result.
 * @param {Object} file - Document descriptor with content/buffer
 * @returns {Promise<Object>} Structured extraction result
 */
export async function extractDocumentText(file) {
  // 1. Foundation validation
  const metadata = processDocument(file)

  // 2. Resolve buffer
  const fileObj = file.file && typeof file.file === 'object' ? file.file : file
  const buffer = getFileBuffer(fileObj)

  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      fileType: metadata.fileType,
      category: metadata.category,
      size: metadata.size,
      extractionStatus: 'failed',
      extractedText: '',
      characterCount: 0,
      extractionMethod: 'none',
      message: 'Document file content is required for text extraction.',
      processedAt: new Date().toISOString()
    }
  }

  let rawText = ''
  let extractionMethod = 'none'

  // 3. Route extraction according to document category
  if (metadata.category === 'pdf') {
    extractionMethod = 'pdf-text'
    try {
      rawText = await extractPdfText(buffer)
    } catch {
      rawText = ''
    }

    const cleanedText = cleanExtractedText(rawText)

    if (cleanedText.length > 0) {
      return {
        success: true,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        fileType: metadata.fileType,
        category: metadata.category,
        size: metadata.size,
        extractionStatus: 'completed',
        extractedText: cleanedText,
        characterCount: cleanedText.length,
        extractionMethod,
        processedAt: new Date().toISOString()
      }
    }

    // Scanned / image-only PDF with 0 extractable text:
    // Controlled failure per prompt requirements 4 & 7
    return {
      success: false,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      fileType: metadata.fileType,
      category: metadata.category,
      size: metadata.size,
      extractionStatus: 'failed',
      extractedText: '',
      characterCount: 0,
      extractionMethod: 'pdf-text',
      message: 'No readable text found in PDF document (may be a scanned/image-only PDF).',
      processedAt: new Date().toISOString()
    }
  }

  if (metadata.category === 'image') {
    extractionMethod = 'ocr'
    try {
      rawText = await extractImageOcr(buffer, metadata.fileType)
    } catch {
      rawText = ''
    }

    const cleanedText = cleanExtractedText(rawText)

    if (cleanedText.length > 0) {
      return {
        success: true,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        fileType: metadata.fileType,
        category: metadata.category,
        size: metadata.size,
        extractionStatus: 'completed',
        extractedText: cleanedText,
        characterCount: cleanedText.length,
        extractionMethod,
        processedAt: new Date().toISOString()
      }
    }

    return {
      success: false,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      fileType: metadata.fileType,
      category: metadata.category,
      size: metadata.size,
      extractionStatus: 'failed',
      extractedText: '',
      characterCount: 0,
      extractionMethod: 'ocr',
      message: 'No readable text could be recognized in image document.',
      processedAt: new Date().toISOString()
    }
  }

  // Fallback for unexpected category
  return {
    success: false,
    originalName: metadata.originalName,
    mimeType: metadata.mimeType,
    fileType: metadata.fileType,
    category: metadata.category,
    size: metadata.size,
    extractionStatus: 'failed',
    extractedText: '',
    characterCount: 0,
    extractionMethod: 'none',
    message: 'Unsupported document category.',
    processedAt: new Date().toISOString()
  }
}

