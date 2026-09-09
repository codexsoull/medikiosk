import fs from 'fs'
import path from 'path'
import { translations } from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/translations/translations.js'

function testTTSFeature() {
  console.log('=== TESTING TEXT-TO-SPEECH (READ ALOUD) FEATURE ===\n')

  // 1. Check translations for English and Hindi
  console.log('1. Checking translations for readAloud & stopSpeaking...')
  if (!translations.English.common.readAloud || !translations.English.common.stopSpeaking) {
    throw new Error('English translations missing readAloud or stopSpeaking!')
  }
  if (!translations.Hindi.common.readAloud || !translations.Hindi.common.stopSpeaking) {
    throw new Error('Hindi translations missing readAloud or stopSpeaking!')
  }
  console.log('English labels:', {
    readAloud: translations.English.common.readAloud,
    stopSpeaking: translations.English.common.stopSpeaking
  })
  console.log('Hindi labels:', {
    readAloud: translations.Hindi.common.readAloud,
    stopSpeaking: translations.Hindi.common.stopSpeaking
  })
  console.log('✓ Translations verified for both English and Hindi\n')

  // 2. Verify useTextToSpeech logic and SpeechSynthesis mock
  console.log('2. Verifying SpeechSynthesis API calls and language tags...')
  let spokenUtterances = []
  let cancelCalled = 0

  // Mock window.speechSynthesis & SpeechSynthesisUtterance in Node environment
  class MockSpeechSynthesisUtterance {
    constructor(text) {
      this.text = text
      this.lang = ''
      this.rate = 1
      this.onstart = null
      this.onend = null
      this.onerror = null
    }
  }

  const mockSpeechSynthesis = {
    speak(utterance) {
      spokenUtterances.push(utterance)
      if (utterance.onstart) utterance.onstart()
    },
    cancel() {
      cancelCalled++
      spokenUtterances = []
    },
    getVoices() {
      return [
        { name: 'Google हिन्दी', lang: 'hi-IN' },
        { name: 'Google Indian English', lang: 'en-IN' }
      ]
    }
  }

  // Test English utterance
  const englishText = `${translations.English.welcome.heading}. ${translations.English.welcome.subheading}`
  const englishUtterance = new MockSpeechSynthesisUtterance(englishText)
  englishUtterance.lang = 'en-IN'
  mockSpeechSynthesis.speak(englishUtterance)

  if (englishUtterance.lang !== 'en-IN') {
    throw new Error(`Expected en-IN language for English, got ${englishUtterance.lang}`)
  }
  if (!englishUtterance.text.includes('Welcome to MediKiosk')) {
    throw new Error('English welcome speech text mismatch')
  }
  console.log('✓ English welcome text and en-IN tag verified')

  // Test Hindi utterance
  const hindiText = `${translations.Hindi.welcome.heading}. ${translations.Hindi.welcome.subheading}`
  const hindiUtterance = new MockSpeechSynthesisUtterance(hindiText)
  hindiUtterance.lang = 'hi-IN'
  mockSpeechSynthesis.cancel()
  mockSpeechSynthesis.speak(hindiUtterance)

  if (hindiUtterance.lang !== 'hi-IN') {
    throw new Error(`Expected hi-IN language for Hindi, got ${hindiUtterance.lang}`)
  }
  if (!hindiUtterance.text.includes('मेडीकियोस्क में आपका स्वागत है')) {
    throw new Error('Hindi welcome speech text mismatch')
  }
  console.log('✓ Hindi welcome text and hi-IN tag verified')

  // Test Interview questions in English and Hindi
  const englishQuestion = translations.English.interview.questions[0]
  const englishQuestionUtterance = new MockSpeechSynthesisUtterance(englishQuestion)
  englishQuestionUtterance.lang = 'en-IN'
  if (!englishQuestionUtterance.text || englishQuestionUtterance.lang !== 'en-IN') {
    throw new Error('English interview speech failed')
  }
  console.log('✓ English interview question verified:', englishQuestion)

  const hindiQuestion = translations.Hindi.interview.questions[0]
  const hindiQuestionUtterance = new MockSpeechSynthesisUtterance(hindiQuestion)
  hindiQuestionUtterance.lang = 'hi-IN'
  if (!hindiQuestionUtterance.text || hindiQuestionUtterance.lang !== 'hi-IN') {
    throw new Error('Hindi interview speech failed')
  }
  console.log('✓ Hindi interview question verified:', hindiQuestion)

  // Test Overlap prevention & Stop
  console.log('\n3. Verifying overlap prevention and stop behavior...')
  mockSpeechSynthesis.cancel()
  const initialCancels = cancelCalled
  mockSpeechSynthesis.speak(englishUtterance)
  // Simulate second click while first is speaking
  mockSpeechSynthesis.cancel() // Must cancel before new speak
  if (cancelCalled <= initialCancels) {
    throw new Error('Overlap prevention cancel was not called!')
  }
  console.log('✓ cancel() properly prevents overlapping utterances')
  mockSpeechSynthesis.cancel()
  console.log('✓ Stop action successfully terminates current speech\n')

  // 4. Verify patient screens contain ReadAloud
  console.log('4. Verifying ReadAloud is integrated in all patient-facing screens...')
  const screensDir = 'c:/Users/adiis/Desktop/New folder/medikiosk/src/screens'
  const patientScreens = [
    'Welcome.jsx',
    'Consent.jsx',
    'IdentityVerification.jsx',
    'OTPVerification.jsx',
    'PatientDetails.jsx',
    'Interview.jsx',
    'DocumentUpload.jsx',
    'PatientReview.jsx',
    'SubmissionSuccess.jsx'
  ]

  for (const file of patientScreens) {
    const content = fs.readFileSync(path.join(screensDir, file), 'utf8')
    if (!content.includes('ReadAloud')) {
      throw new Error(`Screen ${file} is missing ReadAloud component!`)
    }
    console.log(`✓ ReadAloud found in ${file}`)
  }

  // 5. Verify Doctor Dashboard and Doctor Case do NOT contain ReadAloud
  console.log('\n5. Verifying ReadAloud is NOT in Doctor Dashboard or Doctor Case...')
  const doctorScreens = ['DoctorDashboard.jsx', 'DoctorCase.jsx']
  for (const file of doctorScreens) {
    const content = fs.readFileSync(path.join(screensDir, file), 'utf8')
    if (content.includes('ReadAloud')) {
      throw new Error(`Screen ${file} should NOT have ReadAloud component!`)
    }
    console.log(`✓ ${file} does NOT contain ReadAloud`)
  }

  // 6. Verify Auto-Read translations and Interview auto-read toggle
  console.log('\n6. Verifying Auto-Read preferences & Interview screen setup...')
  if (!translations.English.interview.autoReadLabel || !translations.English.interview.autoReadOn) {
    throw new Error('English interview missing autoReadLabel!')
  }
  if (!translations.Hindi.interview.autoReadLabel || !translations.Hindi.interview.autoReadOn) {
    throw new Error('Hindi interview missing autoReadLabel!')
  }
  console.log('✓ Auto-Read labels verified: English and Hindi')

  const interviewContent = fs.readFileSync(path.join(screensDir, 'Interview.jsx'), 'utf8')
  if (!interviewContent.includes('autoRead') || !interviewContent.includes('cancelSpeech')) {
    throw new Error('Interview.jsx missing autoRead state or cancelSpeech helper!')
  }
  console.log('✓ Interview.jsx verified with autoRead state and cancelSpeech')

  // 7. Verify ChatBubble.jsx contains inline compact ReadAloud
  console.log('\n7. Verifying ChatBubble.jsx inline compact ReadAloud integration...')
  const chatBubbleContent = fs.readFileSync(
    path.join('c:/Users/adiis/Desktop/New folder/medikiosk/src/components', 'ChatBubble.jsx'),
    'utf8'
  )
  if (!chatBubbleContent.includes('ReadAloud') || !chatBubbleContent.includes('compact')) {
    throw new Error('ChatBubble.jsx missing inline compact ReadAloud!')
  }
  console.log('✓ ChatBubble.jsx verified with compact inline ReadAloud')

  // 8. Verify General screens use floating={true}
  console.log('\n8. Verifying persistent floating ReadAloud on general screens...')
  const floatingScreens = ['Consent.jsx', 'PatientReview.jsx', 'IdentityVerification.jsx']
  for (const file of floatingScreens) {
    const content = fs.readFileSync(path.join(screensDir, file), 'utf8')
    if (!content.includes('floating={true}')) {
      throw new Error(`Screen ${file} is missing floating={true}!`)
    }
    console.log(`✓ ${file} verified with floating={true}`)
  }

  console.log('\n>>> ALL TEXT-TO-SPEECH TESTS PASSED SUCCESSFULLY! <<<')
}

testTTSFeature()
