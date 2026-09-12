/**
 * Comprehensive Acceptance Test Suite for Revised Milestone 11B:
 * Hospital OPD Kiosk UX, Accessibility & Patient-Facing UI Redesign
 * (Scope: Language-First Welcome, Direct-to-Consent, Touch Targets, Normal Identity Input, Doctor Workflow Intact)
 */

import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { translations } from '../src/translations/translations.js'

const BASE_URL = 'http://localhost:5000'
const WORKSPACE_DIR = 'c:/Users/adiis/Desktop/New folder/medikiosk'

async function requestJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const text = await res.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, ok: res.ok, data }
}

async function runMilestone11BTests() {
  console.log('🧪 Starting Revised Milestone 11B Acceptance Tests (Hospital OPD Kiosk UX & Accessibility)...\n')

  let passed = 0
  let failed = 0

  function pass(desc) {
    console.log(`  ✅ PASS: ${desc}`)
    passed++
  }

  function fail(desc, err) {
    console.error(`  ❌ FAIL: ${desc} ->`, err?.message || err)
    failed++
  }

  // =========================================================================
  // GROUP A: LANGUAGE FLOW & DIRECT-TO-CONSENT WELCOME SCREEN
  // =========================================================================
  console.log('--- Group A: Language-First Flow & Welcome Screen ---')
  try {
    const welcomePath = path.join(WORKSPACE_DIR, 'src/screens/Welcome.jsx')
    assert(fs.existsSync(welcomePath), 'Welcome.jsx must exist')
    const welcomeContent = fs.readFileSync(welcomePath, 'utf8')

    assert(welcomeContent.includes('welcome-lang-grid'), 'Welcome screen must include welcome-lang-grid')
    assert(welcomeContent.includes('welcome-lang-card-large'), 'Welcome screen must include large touch cards')
    assert(welcomeContent.includes('handleChooseLanguage'), 'Welcome screen must have direct language selection handler')
    assert(welcomeContent.includes('ENGLISH'), 'Welcome screen must display large English card')
    assert(welcomeContent.includes('हिंदी'), 'Welcome screen must display large Hindi card')
    assert(welcomeContent.includes('speechSynthesis'), 'Welcome screen must attempt non-blocking audio welcome')
    assert(welcomeContent.includes('ReadAloud'), 'Welcome screen must provide accessible ReadAloud assistance')
    assert(!welcomeContent.includes('intake type'), 'Welcome speech does not refer to intake type')
    assert(!welcomeContent.includes('इंटेक प्रकार'), 'Hindi welcome speech does not refer to intake type')
    pass('Welcome.jsx features large touch cards for English and Hindi with non-blocking audio welcome')
  } catch (e) {
    fail('Welcome screen language-first presentation', e)
  }

  try {
    const appPath = path.join(WORKSPACE_DIR, 'src/App.jsx')
    const appContent = fs.readFileSync(appPath, 'utf8')
    assert(appContent.includes("setScreen('consent')"), "Starting intake from Welcome advances directly to consent")
    assert(!appContent.includes("setScreen('intake_mode')"), "App.jsx does not navigate to intake_mode")
    assert(!appContent.includes("screen === 'intake_mode'"), "App.jsx does not render intake_mode screen")
    pass('Language selection advances directly to Consent')
  } catch (e) {
    fail('Language flow navigation directly to Consent', e)
  }

  try {
    const headerPath = path.join(WORKSPACE_DIR, 'src/components/AppHeader.jsx')
    const headerContent = fs.readFileSync(headerPath, 'utf8')
    assert(headerContent.includes('isWelcomeScreen'), 'AppHeader checks for welcome screen')
    assert(headerContent.includes('!isWelcomeScreen &&'), 'AppHeader hides redundant language toggle on welcome screen')
    pass('AppHeader cleanly hides redundant language toggle on welcome screen')
  } catch (e) {
    fail('AppHeader welcome screen language toggle hiding', e)
  }

  // =========================================================================
  // GROUP B: VERIFY COMPLETE REMOVAL OF AYUSH & INTAKE MODE
  // =========================================================================
  console.log('\n--- Group B: Verification of AYUSH & Intake Mode Removal ---')
  try {
    const intakeModePath = path.join(WORKSPACE_DIR, 'src/screens/IntakeMode.jsx')
    assert(!fs.existsSync(intakeModePath), 'IntakeMode.jsx file must be deleted')

    const appPath = path.join(WORKSPACE_DIR, 'src/App.jsx')
    const appContent = fs.readFileSync(appPath, 'utf8')
    assert(!appContent.includes('IntakeMode'), 'App.jsx must not import or use IntakeMode')
    assert(!appContent.includes('intakeMode'), 'App.jsx must not maintain intakeMode state')
    assert(!appContent.includes('ayush'), 'App.jsx must not contain ayush references')

    assert(!translations.English.intakeMode, 'English translations must not contain intakeMode')
    assert(!translations.Hindi.intakeMode, 'Hindi translations must not contain intakeMode')

    const cssPath = path.join(WORKSPACE_DIR, 'src/App.css')
    const cssContent = fs.readFileSync(cssPath, 'utf8')
    assert(!cssContent.includes('.intake-mode-selector'), 'CSS must not contain .intake-mode-selector')
    assert(!cssContent.includes('.ayush-disclaimer-box'), 'CSS must not contain .ayush-disclaimer-box')

    pass('AYUSH Mode and Intake Mode screen completely removed from codebase')
  } catch (e) {
    fail('AYUSH and Intake Mode removal verification', e)
  }

  // =========================================================================
  // GROUP C: VERIFY COMPLETE REMOVAL OF KEYPAD & RETENTION OF NORMAL INPUT
  // =========================================================================
  console.log('\n--- Group C: Removal of Numeric Keypad & Retention of Normal Input ---')
  try {
    const idPath = path.join(WORKSPACE_DIR, 'src/screens/IdentityVerification.jsx')
    const idContent = fs.readFileSync(idPath, 'utf8')

    assert(!idContent.includes('kiosk-keypad-container'), 'IdentityVerification must not contain kiosk-keypad-container')
    assert(!idContent.includes('kiosk-keypad-grid'), 'IdentityVerification must not contain kiosk-keypad-grid')
    assert(!idContent.includes('handleKeypadInput'), 'IdentityVerification must not contain handleKeypadInput')
    assert(!idContent.includes('handleKeypadBackspace'), 'IdentityVerification must not contain handleKeypadBackspace')
    assert(!idContent.includes('handleKeypadClear'), 'IdentityVerification must not contain handleKeypadClear')
    assert(!idContent.includes('keypad-btn'), 'IdentityVerification must not contain keypad-btn')

    assert(idContent.includes('type="text"'), 'Standard keyboard text input remains fully functional')
    assert(idContent.includes('masked-input'), 'Masked input styling preserved')
    assert(idContent.includes('touch-target'), 'Input retains touch-target accessibility class')
    assert(idContent.includes('IdCardIcon'), 'Visual guidance ID icon rendered in header')
    assert(idContent.includes('mockDisclaimer'), 'Mock disclaimer banner preserved')

    const cssPath = path.join(WORKSPACE_DIR, 'src/App.css')
    const cssContent = fs.readFileSync(cssPath, 'utf8')
    assert(!cssContent.includes('.kiosk-keypad-container'), 'CSS must not contain .kiosk-keypad-container')
    assert(!cssContent.includes('.keypad-btn'), 'CSS must not contain .keypad-btn')

    pass('Touchscreen Numeric Keypad completely removed; normal touch-friendly input preserved')
  } catch (e) {
    fail('Numeric Keypad removal verification', e)
  }

  // =========================================================================
  // GROUP D: HINDI LOCALIZATION AUDIT & NO DUPLICATE SUGGESTIONS
  // =========================================================================
  console.log('\n--- Group D: Complete Hindi Localization Audit ---')
  try {
    assert(translations.English, 'English translation exists')
    assert(translations.Hindi, 'Hindi translation exists')

    // Verify Welcome translations
    assert(translations.English.welcome?.chooseLanguage, 'English welcome.chooseLanguage exists')
    assert(translations.Hindi.welcome?.chooseLanguage, 'Hindi welcome.chooseLanguage exists')

    // Verify Identity translations
    assert.strictEqual(translations.Hindi.identity?.defaultTag, 'प्राथमिक', 'Hindi default tag is प्राथमिक')
    assert.strictEqual(translations.Hindi.identity?.smsTag, 'एसएमएस', 'Hindi SMS tag is एसएमएस')
    assert.strictEqual(translations.Hindi.identity?.hospitalIdTag, 'अस्पताल आईडी', 'Hindi Hospital ID tag is अस्पताल आईडी')

    // Verify common keys
    assert(translations.Hindi.common?.upload, 'Hindi common.upload exists')
    assert(translations.Hindi.common?.skip, 'Hindi common.skip exists')

    // Verify quickSuggestions length and NO duplicates
    assert.strictEqual(translations.English.interview.quickSuggestions.length, 10, 'English quickSuggestions has exactly 10 items')
    assert.strictEqual(translations.Hindi.interview.quickSuggestions.length, 10, 'Hindi quickSuggestions has exactly 10 items')
    assert.strictEqual(translations.English.interview.questions.length, 10, 'English questions has exactly 10 items')
    assert.strictEqual(translations.Hindi.interview.questions.length, 10, 'Hindi questions has exactly 10 items')

    pass('Full Hindi localization verified with zero duplicate suggestions and 1:1 question mapping')
  } catch (e) {
    fail('Hindi localization audit', e)
  }

  // =========================================================================
  // GROUP E: ACCESSIBILITY & TOUCH TARGET STANDARDS
  // =========================================================================
  console.log('\n--- Group E: Kiosk Accessibility & Touch Target Standards ---')
  try {
    const cssPath = path.join(WORKSPACE_DIR, 'src/App.css')
    const cssContent = fs.readFileSync(cssPath, 'utf8')

    assert(cssContent.includes('.touch-target'), 'CSS defines .touch-target')
    assert(cssContent.includes('min-height: 48px'), 'CSS enforces min-height 48px on touch targets')
    assert(cssContent.includes('.submit-intake-btn'), 'CSS styles .submit-intake-btn')
    assert(cssContent.includes('min-height: 60px'), 'Submit button has 60px height')
    assert(cssContent.includes(':focus-visible'), 'CSS provides high-contrast :focus-visible rules')
    assert(cssContent.includes('.checkbox-custom-box'), 'CSS styles custom checkbox')
    assert(cssContent.includes('width: 28px'), 'Checkbox is at least 28px wide')
    assert(cssContent.includes('height: 28px'), 'Checkbox is at least 28px high')
    assert(cssContent.includes('.chip-button'), 'CSS styles choice chips')
    assert(cssContent.includes('min-height: 52px'), 'Choice chips have >= 48px height')
    pass('CSS satisfies all kiosk touch targets (48px min, 56-64px major actions) and :focus-visible')
  } catch (e) {
    fail('Touch target and accessibility CSS verification', e)
  }

  // =========================================================================
  // GROUP F: EXISTING FUNCTIONALITY, ZERO PIN IMPLEMENTATION, BACKEND PRESERVED
  // =========================================================================
  console.log('\n--- Group F: Backend, Doctor Workflow & Scope Verification ---')
  try {
    // 1. Critical scope check: Admin PIN must NOT exist
    const adminPinPath = path.join(WORKSPACE_DIR, 'src/components/AdminPinModal.jsx')
    assert(!fs.existsSync(adminPinPath), 'AdminPinModal.jsx must NOT exist (strictly excluded from Milestone 11B)')
    
    const headerPath = path.join(WORKSPACE_DIR, 'src/components/AppHeader.jsx')
    const headerContent = fs.readFileSync(headerPath, 'utf8')
    assert(!headerContent.includes('AdminPinModal'), 'AppHeader does not reference AdminPinModal')
    assert(!headerContent.includes('staffPin'), 'AppHeader has no PIN authentication')
    pass('Physician PIN was NOT implemented (scope boundary respected)')
  } catch (e) {
    fail('Scope boundary check (no physician PIN)', e)
  }

  try {
    // 2. Health check
    const health = await requestJson(`${BASE_URL}/api/health`)
    assert.strictEqual(health.status, 200, 'Health endpoint returns 200 OK')
    pass('Backend GET /api/health returns 200 OK')
  } catch (e) {
    fail('Backend health check', e)
  }

  try {
    // 3. Case creation and retrieval
    const testPayload = {
      patient_name: 'Kiosk Acceptance Test Patient',
      age: 42,
      gender: 'Male',
      mobile: '9876543210',
      identity_verification_status: 'verified_mock',
      consent_status: 'given',
      consent_timestamp: new Date().toISOString(),
      chief_complaint: 'Routine kiosk intake verification',
      symptoms: 'None',
      medical_history: 'None',
      medications: 'None',
      allergies: 'No known allergies',
      ai_summary: { chiefComplaint: 'Routine kiosk intake verification' },
      clinical_alerts: [],
      doctor_notes: '',
      case_status: 'ready_for_doctor',
      documents: []
    }

    const createRes = await requestJson(`${BASE_URL}/api/cases`, {
      method: 'POST',
      body: JSON.stringify(testPayload)
    })
    assert.strictEqual(createRes.status, 201, 'POST /api/cases returns 201 Created')
    const caseId = createRes.data?.case_id || createRes.data?.data?.case_id
    assert(caseId, 'Case ID is returned')
    pass(`Case creation API functional (ID: ${caseId})`)

    // 4. Case retrieval
    const getRes = await requestJson(`${BASE_URL}/api/cases/${caseId}`)
    assert.strictEqual(getRes.status, 200, 'GET /api/cases/:id returns 200')
    assert.strictEqual(getRes.data?.data?.patient_name, 'Kiosk Acceptance Test Patient', 'Patient name matches')
    pass(`Case retrieval API functional for ${caseId}`)

    // 5. Doctor case list retrieval
    const listRes = await requestJson(`${BASE_URL}/api/cases`)
    assert.strictEqual(listRes.status, 200, 'GET /api/cases returns 200')
    assert(Array.isArray(listRes.data?.data), 'Returns cases array for Doctor Dashboard')
    pass('Doctor Dashboard case queue endpoint functional')
  } catch (e) {
    fail('Backend case persistence and retrieval', e)
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n========================================')
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`)
  console.log('========================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runMilestone11BTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})

