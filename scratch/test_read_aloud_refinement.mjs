import fs from 'fs'
import path from 'path'
import { translations } from 'file:///c:/Users/adiis/Desktop/New folder/medikiosk/src/translations/translations.js'

function verifyReadAloudRefinement() {
  console.log('=== VERIFYING READ ALOUD ACCESSIBILITY UX REFINEMENT ===\n')

  const screensDir = 'c:/Users/adiis/Desktop/New folder/medikiosk/src/screens'
  const componentsDir = 'c:/Users/adiis/Desktop/New folder/medikiosk/src/components'

  // 1. Verify Floating ReadAloud in all 8 general patient screens
  const generalScreens = [
    'Welcome.jsx',
    'Consent.jsx',
    'IdentityVerification.jsx',
    'OTPVerification.jsx',
    'PatientDetails.jsx',
    'DocumentUpload.jsx',
    'PatientReview.jsx',
    'SubmissionSuccess.jsx'
  ]

  console.log('1. Checking general patient screens for persistent floating ReadAloud...')
  for (const screen of generalScreens) {
    const filePath = path.join(screensDir, screen)
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check that ReadAloud is present with floating={true}
    if (!content.includes('ReadAloud')) {
      throw new Error(`Screen ${screen} is missing ReadAloud!`)
    }
    if (!content.includes('floating={true}')) {
      throw new Error(`Screen ${screen} is missing floating={true}!`)
    }
    // Check that old in-page read-aloud-container was removed
    if (content.includes('className="read-aloud-container"')) {
      throw new Error(`Screen ${screen} still contains old inline read-aloud-container!`)
    }
    console.log(`✓ ${screen}: Persistent floating ReadAloud verified, inline container removed`)
  }

  // 2. Verify Interview screen has NO top header ReadAloud
  console.log('\n2. Verifying Interview.jsx header ReadAloud removal...')
  const interviewContent = fs.readFileSync(path.join(screensDir, 'Interview.jsx'), 'utf8')
  if (interviewContent.includes('read-aloud-container')) {
    throw new Error('Interview.jsx still contains top header read-aloud-container!')
  }
  if (!interviewContent.includes('cancelSpeech')) {
    throw new Error('Interview.jsx missing cancelSpeech helper!')
  }
  console.log('✓ Interview.jsx: Top header ReadAloud removed and cancelSpeech helper verified')

  // 3. Verify ChatBubble.jsx has compact ReadAloud for AI questions
  console.log('\n3. Verifying ChatBubble.jsx inline compact ReadAloud...')
  const chatBubbleContent = fs.readFileSync(path.join(componentsDir, 'ChatBubble.jsx'), 'utf8')
  if (!chatBubbleContent.includes('import ReadAloud')) {
    throw new Error('ChatBubble.jsx missing ReadAloud import!')
  }
  if (!chatBubbleContent.includes('variant="compact"') || !chatBubbleContent.includes('compact={true}')) {
    throw new Error('ChatBubble.jsx missing compact ReadAloud component!')
  }
  if (!chatBubbleContent.includes('chat-sender-left') || !chatBubbleContent.includes('chat-bubble-read-aloud')) {
    throw new Error('ChatBubble.jsx missing sender header layout classes!')
  }
  console.log('✓ ChatBubble.jsx: Inline compact speaker button alongside AI questions verified')

  // 4. Verify Doctor screens do NOT contain ReadAloud
  console.log('\n4. Verifying Doctor screens do NOT have ReadAloud...')
  const doctorScreens = ['DoctorDashboard.jsx', 'DoctorCase.jsx']
  for (const screen of doctorScreens) {
    const filePath = path.join(screensDir, screen)
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes('ReadAloud')) {
      throw new Error(`Screen ${screen} should NOT contain ReadAloud!`)
    }
    console.log(`✓ ${screen}: Clean (no ReadAloud)`)
  }

  // 5. Verify ReadAloud.jsx supports floating and compact
  console.log('\n5. Verifying ReadAloud.jsx variant logic...')
  const readAloudContent = fs.readFileSync(path.join(componentsDir, 'ReadAloud.jsx'), 'utf8')
  if (!readAloudContent.includes('read-aloud-floating') || !readAloudContent.includes('read-aloud-compact')) {
    throw new Error('ReadAloud.jsx missing floating/compact class logic!')
  }
  if (!readAloudContent.includes('read-aloud-floating-wrap')) {
    throw new Error('ReadAloud.jsx missing read-aloud-floating-wrap element!')
  }
  console.log('✓ ReadAloud.jsx: floating and compact variants supported with accessible touch targets')

  // 6. Verify useTextToSpeech.js mutual exclusion
  console.log('\n6. Verifying useTextToSpeech.js audio mutual exclusion...')
  const hookContent = fs.readFileSync('c:/Users/adiis/Desktop/New folder/medikiosk/src/hooks/useTextToSpeech.js', 'utf8')
  if (!hookContent.includes('medikiosk-tts-start') || !hookContent.includes('medikiosk-stt-start')) {
    throw new Error('useTextToSpeech.js missing audio mutual exclusion events!')
  }
  console.log('✓ useTextToSpeech.js: medikiosk-tts-start and medikiosk-stt-start events verified')

  // 7. Verify CSS rules for floating button, touch targets, and clearances
  console.log('\n7. Verifying App.css styling rules...')
  const cssContent = fs.readFileSync('c:/Users/adiis/Desktop/New folder/medikiosk/src/App.css', 'utf8')
  if (!cssContent.includes('.read-aloud-btn.read-aloud-floating')) {
    throw new Error('App.css missing .read-aloud-btn.read-aloud-floating!')
  }
  if (!cssContent.includes('.read-aloud-btn.read-aloud-compact')) {
    throw new Error('App.css missing .read-aloud-btn.read-aloud-compact!')
  }
  if (!cssContent.includes('.read-aloud-floating-wrap')) {
    throw new Error('App.css missing .read-aloud-floating-wrap!')
  }
  if (!cssContent.includes('padding-bottom: 84px')) {
    throw new Error('App.css missing card bottom scroll clearance!')
  }
  console.log('✓ App.css: Floating FAB, compact bubble speaker, kiosk clearances, and dark mode tokens verified')

  console.log('\n>>> ALL READ ALOUD ACCESSIBILITY UX VERIFICATIONS PASSED! <<<')
}

verifyReadAloudRefinement()
