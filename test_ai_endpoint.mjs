/**
 * Verification Test Script for MediKiosk AI Backend Endpoint
 * Milestone 6.1: Foundation AI Route (POST /api/ai/test)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000'
const ENDPOINT = `${BASE_URL}/api/ai/test`

let passed = 0
let failed = 0

function logPass(desc) {
  console.log(`  [PASS] ${desc}`)
  passed++
}

function logFail(desc, error) {
  console.error(`  [FAIL] ${desc}`)
  if (error) console.error(`         Error: ${error}`)
  failed++
}

async function runTests() {
  console.log('====================================================')
  console.log('🧪 MediKiosk — Milestone 6.1 AI Endpoint Test Suite')
  console.log(`   Target: POST ${ENDPOINT}`)
  console.log('====================================================\n')

  // Test 1: POST a valid English request (with explicit language)
  console.log('Test 1: Valid English request (explicit language: "en")')
  try {
    const sentMessage = 'The patient has chest discomfort since yesterday.'
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: sentMessage, language: 'en' })
    })

    if (res.status === 200) {
      logPass('HTTP status is 200')
    } else {
      logFail(`Expected HTTP 200, got ${res.status}`)
    }

    const data = await res.json()
    if (data.status === 'success') {
      logPass('response.status === "success"')
    } else {
      logFail(`Expected data.status === "success", got "${data.status}"`)
    }

    if (data.data?.receivedMessage === sentMessage) {
      logPass('receivedMessage matches the sent message')
    } else {
      logFail(`receivedMessage mismatch. Expected "${sentMessage}", got "${data.data?.receivedMessage}"`)
    }

    if (data.data?.language === 'en') {
      logPass('language === "en"')
    } else {
      logFail(`Expected language "en", got "${data.data?.language}"`)
    }
  } catch (err) {
    logFail('Valid English request encountered an unexpected error', err.message)
  }

  console.log()

  // Test 2: POST a valid English request (with language omitted -> defaults to "en")
  console.log('Test 2: Valid request with language omitted (default to "en")')
  try {
    const sentMessage = 'Patient reports mild cough and low fever.'
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: sentMessage })
    })

    if (res.status === 200) {
      logPass('HTTP status is 200')
    } else {
      logFail(`Expected HTTP 200, got ${res.status}`)
    }

    const data = await res.json()
    if (data.status === 'success' && data.data?.language === 'en') {
      logPass('language defaulted to "en" when omitted')
    } else {
      logFail(`Expected default language "en", got "${data.data?.language}"`)
    }

    if (data.data?.receivedMessage === sentMessage) {
      logPass('receivedMessage matches the sent message')
    } else {
      logFail(`receivedMessage mismatch. Expected "${sentMessage}", got "${data.data?.receivedMessage}"`)
    }
  } catch (err) {
    logFail('Omitted language request failed', err.message)
  }

  console.log()

  // Test 3: POST a valid Hindi request
  console.log('Test 3: Valid Hindi request (language: "hi")')
  try {
    const sentMessage = 'मरीज़ को कल से सीने में दर्द और बेचैनी है।'
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: sentMessage, language: 'hi' })
    })

    if (res.status === 200) {
      logPass('HTTP status is 200')
    } else {
      logFail(`Expected HTTP 200, got ${res.status}`)
    }

    const data = await res.json()
    if (data.status === 'success') {
      logPass('response.status === "success"')
    } else {
      logFail(`Expected data.status === "success", got "${data.status}"`)
    }

    if (data.data?.receivedMessage === sentMessage) {
      logPass('receivedMessage matches the sent Hindi message')
    } else {
      logFail(`receivedMessage mismatch. Expected "${sentMessage}", got "${data.data?.receivedMessage}"`)
    }

    if (data.data?.language === 'hi') {
      logPass('language === "hi"')
    } else {
      logFail(`Expected language "hi", got "${data.data?.language}"`)
    }
  } catch (err) {
    logFail('Valid Hindi request failed', err.message)
  }

  console.log()

  // Test 4: POST an invalid empty message (empty string and whitespace)
  console.log('Test 4: Invalid empty message validation')
  try {
    const res1 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', language: 'en' })
    })

    if (res1.status === 400) {
      logPass('Empty string message rejected with HTTP 400')
    } else {
      logFail(`Expected HTTP 400 for empty string, got ${res1.status}`)
    }

    const data1 = await res1.json()
    if (data1.status === 'error' && data1.message) {
      logPass('Returned clear JSON error message for empty message')
    } else {
      logFail('Error response missing expected error structure')
    }

    const res2 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '    ', language: 'en' })
    })

    if (res2.status === 400) {
      logPass('Whitespace-only message rejected with HTTP 400')
    } else {
      logFail(`Expected HTTP 400 for whitespace-only message, got ${res2.status}`)
    }

    const res3 = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'en' })
    })

    if (res3.status === 400) {
      logPass('Missing message property rejected with HTTP 400')
    } else {
      logFail(`Expected HTTP 400 for missing message, got ${res3.status}`)
    }
  } catch (err) {
    logFail('Empty message validation test failed', err.message)
  }

  console.log()

  // Test 5: POST an unsupported language
  console.log('Test 5: Unsupported language validation')
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Patient reports severe pain.',
        language: 'fr'
      })
    })

    if (res.status === 400) {
      logPass('Unsupported language "fr" rejected with HTTP 400')
    } else {
      logFail(`Expected HTTP 400 for unsupported language, got ${res.status}`)
    }

    const data = await res.json()
    if (data.status === 'error' && data.message.includes('Unsupported language')) {
      logPass('Returned clear JSON error message indicating unsupported language')
    } else {
      logFail(`Expected error message to mention unsupported language, got: "${data.message}"`)
    }
  } catch (err) {
    logFail('Unsupported language test failed', err.message)
  }

  console.log('\n====================================================')
  console.log(`📊 Summary: ${passed} passed, ${failed} failed`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()

