import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database file path (default: backend/medikiosk.db)
const dbFileName = process.env.DATABASE_PATH || 'medikiosk.db'
const dbPath = path.isAbsolute(dbFileName)
  ? dbFileName
  : path.resolve(__dirname, '..', dbFileName)

// Initialize SQLite database instance
const db = new Database(dbPath)

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Execute schema.sql to ensure tables exist
const schemaPath = path.resolve(__dirname, 'schema.sql')
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  db.exec(schemaSql)
}

/**
 * Generates next sequential human-readable case ID (e.g. CASE-0001)
 */
export function generateCaseId() {
  const row = db.prepare('SELECT COUNT(*) as count FROM cases').get()
  const nextNum = (row?.count || 0) + 1
  return `CASE-${String(nextNum).padStart(4, '0')}`
}

/**
 * Formats a raw database row, parsing JSON fields if applicable
 */
export function formatCaseRow(row) {
  if (!row) return null

  let ai_summary = row.ai_summary
  let clinical_alerts = row.clinical_alerts

  if (typeof ai_summary === 'string' && (ai_summary.startsWith('{') || ai_summary.startsWith('['))) {
    try {
      ai_summary = JSON.parse(ai_summary)
    } catch {
      // keep raw string if not parseable
    }
  }

  if (typeof clinical_alerts === 'string' && (clinical_alerts.startsWith('{') || clinical_alerts.startsWith('['))) {
    try {
      clinical_alerts = JSON.parse(clinical_alerts)
    } catch {
      // keep raw string if not parseable
    }
  }

  return {
    ...row,
    ai_summary,
    clinical_alerts
  }
}

export default db

