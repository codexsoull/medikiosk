import express from 'express'
import db, { generateCaseId, formatCaseRow } from '../database/db.js'

const router = express.Router()

/**
 * POST /api/cases
 * Create and persist a new patient case record in SQLite
 */
router.post('/cases', (req, res) => {
  try {
    const body = req.body || {}

    // Extract patient details with support for nested or top-level keys
    const patient_name = (
      body.patient_name ||
      body.patientName ||
      body.name ||
      body.patient?.name ||
      ''
    ).trim()

    // Validate minimum required fields
    if (!patient_name) {
      return res.status(400).json({
        status: 'error',
        message: 'patient_name is required'
      })
    }

    const age = body.age !== undefined && body.age !== null && body.age !== ''
      ? Number(body.age)
      : body.patient?.age !== undefined && body.patient?.age !== ''
      ? Number(body.patient.age)
      : null

    const gender = body.gender || body.patient?.gender || null
    const mobile = body.mobile || body.patient?.mobile || body.phone || null

    const identity_verification_status =
      body.identity_verification_status ||
      body.authentication?.status ||
      'not_authenticated'

    const consent_status =
      body.consent_status ||
      (body.consent?.given ? 'given' : 'not_given') ||
      'given'

    const consent_timestamp =
      body.consent_timestamp ||
      body.consent?.timestamp ||
      new Date().toISOString()

    const chief_complaint =
      body.chief_complaint ||
      body.chiefComplaint ||
      body.complaint?.chiefComplaint ||
      body.summary?.chiefComplaint ||
      null

    const symptoms =
      body.symptoms ||
      body.associatedSymptoms ||
      body.complaint?.associatedSymptoms ||
      null

    const medical_history =
      body.medical_history ||
      body.pastMedicalHistory ||
      body.summary?.pastMedicalHistory ||
      null

    const medications =
      body.medications ||
      body.summary?.medications ||
      null

    const allergies =
      body.allergies ||
      body.summary?.allergies ||
      null

    // Handle AI summary serialization
    let ai_summary = body.ai_summary || body.summary || null
    if (ai_summary && typeof ai_summary === 'object') {
      ai_summary = JSON.stringify(ai_summary)
    }

    // Handle clinical alerts serialization
    let clinical_alerts = body.clinical_alerts || body.clinicalAlerts || null
    if (clinical_alerts && typeof clinical_alerts === 'object') {
      clinical_alerts = JSON.stringify(clinical_alerts)
    }

    const doctor_notes = body.doctor_notes || body.physicianNotes || null
    const case_status = body.case_status || body.status || 'ready_for_doctor'

    // Generate or validate unique case ID
    let case_id = body.case_id || body.caseId
    if (case_id) {
      const existing = db.prepare('SELECT id FROM cases WHERE case_id = ?').get(case_id)
      if (existing) {
        case_id = generateCaseId()
      }
    } else {
      case_id = generateCaseId()
    }

    const insertStmt = db.prepare(`
      INSERT INTO cases (
        case_id,
        patient_name,
        age,
        gender,
        mobile,
        identity_verification_status,
        consent_status,
        consent_timestamp,
        chief_complaint,
        symptoms,
        medical_history,
        medications,
        allergies,
        ai_summary,
        clinical_alerts,
        doctor_notes,
        case_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const info = insertStmt.run(
      case_id,
      patient_name,
      age,
      gender,
      mobile,
      identity_verification_status,
      consent_status,
      consent_timestamp,
      chief_complaint,
      symptoms,
      medical_history,
      medications,
      allergies,
      ai_summary,
      clinical_alerts,
      doctor_notes,
      case_status
    )

    const createdRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(info.lastInsertRowid)

    return res.status(201).json({
      status: 'success',
      message: 'Case created successfully',
      case_id: createdRow.case_id,
      data: formatCaseRow(createdRow)
    })
  } catch (error) {
    console.error('Error creating case in database:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error creating case',
      error: error.message
    })
  }
})

/**
 * GET /api/cases
 * Retrieve all patient cases sorted newest first
 */
router.get('/cases', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cases ORDER BY id DESC').all()
    const formattedRows = rows.map(formatCaseRow)

    return res.status(200).json({
      status: 'success',
      count: formattedRows.length,
      data: formattedRows
    })
  } catch (error) {
    console.error('Error retrieving cases from database:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error retrieving cases',
      error: error.message
    })
  }
})

/**
 * GET /api/cases/:id
 * Retrieve a specific case by database ID or case_id
 */
router.get('/cases/:id', (req, res) => {
  try {
    const param = req.params.id

    // Query by integer ID or case_id string
    const row = db
      .prepare('SELECT * FROM cases WHERE id = ? OR case_id = ?')
      .get(param, param)

    if (!row) {
      return res.status(404).json({
        status: 'error',
        message: `Case not found with identifier: ${param}`
      })
    }

    return res.status(200).json({
      status: 'success',
      data: formatCaseRow(row)
    })
  } catch (error) {
    console.error('Error fetching case by ID:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error fetching case',
      error: error.message
    })
  }
})

/**
 * PATCH /api/cases/:id
 * Update doctor_notes and/or case_status for a specific case
 */
router.patch('/cases/:id', (req, res) => {
  try {
    const param = req.params.id
    const body = req.body || {}

    // Check if case exists
    const existingCase = db
      .prepare('SELECT * FROM cases WHERE id = ? OR case_id = ?')
      .get(param, param)

    if (!existingCase) {
      return res.status(404).json({
        status: 'error',
        message: `Case not found with identifier: ${param}`
      })
    }

    const hasNotes = body.doctor_notes !== undefined
    const hasStatus = body.case_status !== undefined

    // Validate that at least one update field was provided
    if (!hasNotes && !hasStatus) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one of doctor_notes or case_status must be provided'
      })
    }

    // Validate doctor_notes if provided
    if (hasNotes && typeof body.doctor_notes !== 'string' && body.doctor_notes !== null) {
      return res.status(400).json({
        status: 'error',
        message: 'doctor_notes must be a string or null'
      })
    }

    // Validate case_status if provided
    const validStatuses = ['ready_for_doctor', 'accepted', 'physician_accepted']
    if (hasStatus && !validStatuses.includes(body.case_status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid case_status: "${body.case_status}". Supported statuses are: ready_for_doctor, accepted`
      })
    }

    const updates = []
    const params = []

    if (hasNotes) {
      updates.push('doctor_notes = ?')
      params.push(body.doctor_notes)
    }

    if (hasStatus) {
      const normalizedStatus = body.case_status === 'physician_accepted' ? 'accepted' : body.case_status
      updates.push('case_status = ?')
      params.push(normalizedStatus)
    }

    updates.push("updated_at = datetime('now', 'localtime')")
    params.push(existingCase.id)

    const updateSql = `UPDATE cases SET ${updates.join(', ')} WHERE id = ?`
    db.prepare(updateSql).run(...params)

    const updatedRow = db.prepare('SELECT * FROM cases WHERE id = ?').get(existingCase.id)

    return res.status(200).json({
      status: 'success',
      message: 'Case updated successfully',
      data: formatCaseRow(updatedRow)
    })
  } catch (error) {
    console.error('Error updating case in database:', error)
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error updating case',
      error: error.message
    })
  }
})

export default router

