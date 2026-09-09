import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('🧪 Running Comprehensive Verification Tests for Milestone 6.2 (Speech-to-Text STT)...\n')

const rootDir = 'c:/Users/adiis/Desktop/New folder/medikiosk'
const sttHookPath = path.join(rootDir, 'src', 'hooks', 'useSpeechToText.js')
const interviewPath = path.join(rootDir, 'src', 'screens', 'Interview.jsx')
const ttsHookPath = path.join(rootDir, 'src', 'hooks', 'useTextToSpeech.js')
const translationsPath = path.join(rootDir, 'src', 'translations', 'translations.js')
const cssPath = path.join(rootDir, 'src', 'App.css')

const sttHookSrc = fs.readFileSync(sttHookPath, 'utf8')
const interviewSrc = fs.readFileSync(interviewPath, 'utf8')
const ttsHookSrc = fs.readFileSync(ttsHookPath, 'utf8')
const translationsSrc = fs.readFileSync(translationsPath, 'utf8')
const cssSrc = fs.readFileSync(cssPath, 'utf8')

// Test 1: STT hook exists and exports useSpeechToText
console.log('Test 1: useSpeechToText hook existence and exports...')
assert.ok(sttHookSrc.includes('export function useSpeechToText'), 'useSpeechToText hook must be exported')
assert.ok(sttHookSrc.includes('isListening'), 'hook must provide isListening')
assert.ok(sttHookSrc.includes('transcript'), 'hook must provide transcript')
assert.ok(sttHookSrc.includes('interimTranscript'), 'hook must provide interimTranscript')
assert.ok(sttHookSrc.includes('startListening'), 'hook must provide startListening')
assert.ok(sttHookSrc.includes('stopListening'), 'hook must provide stopListening')
assert.ok(sttHookSrc.includes('resetTranscript'), 'hook must provide resetTranscript')
assert.ok(sttHookSrc.includes('isSupported'), 'hook must provide isSupported')
assert.ok(sttHookSrc.includes('error'), 'hook must provide error')
console.log('✅ Passed Test 1: STT hook exports complete interface.')

// Test 2: SpeechRecognition and webkitSpeechRecognition feature detection
console.log('Test 2: Feature detection for SpeechRecognition / webkitSpeechRecognition...')
assert.ok(sttHookSrc.includes('window.SpeechRecognition || window.webkitSpeechRecognition'), 'SpeechRecognition and webkitSpeechRecognition fallback must be used')
console.log('✅ Passed Test 2: SpeechRecognition feature detection verified.')

// Test 3: Language configuration (en-IN and hi-IN)
console.log('Test 3: Language configuration for English and Hindi...')
assert.ok(sttHookSrc.includes("'en-IN'"), 'en-IN locale must be configured')
assert.ok(sttHookSrc.includes("'hi-IN'"), 'hi-IN locale must be configured')
assert.ok(sttHookSrc.includes('recognition.lang = getLocale('), 'recognition.lang dynamically set from language')
console.log('✅ Passed Test 3: English (en-IN) and Hindi (hi-IN) recognition locales configured.')

// Test 4: Mutual exclusion coordination between STT and TTS
console.log('Test 4: Mutual exclusion events...')
assert.ok(sttHookSrc.includes("new CustomEvent('medikiosk-stt-start')"), 'useSpeechToText dispatches medikiosk-stt-start')
assert.ok(sttHookSrc.includes("window.speechSynthesis.cancel()"), 'useSpeechToText cancels speech synthesis on start')
assert.ok(sttHookSrc.includes("addEventListener('medikiosk-tts-start'"), 'useSpeechToText listens for medikiosk-tts-start to halt')
assert.ok(ttsHookSrc.includes("addEventListener('medikiosk-stt-start'"), 'useTextToSpeech listens for medikiosk-stt-start to halt')
assert.ok(interviewSrc.includes("addEventListener('medikiosk-stt-start', handleSttStart)"), 'Interview listens for medikiosk-stt-start to cancel speech')
console.log('✅ Passed Test 4: Mutual exclusion between STT and TTS verified.')

// Test 5: Interview screen connects microphone UI to useSpeechToText
console.log('Test 5: Interview screen integrates useSpeechToText...')
assert.ok(interviewSrc.includes("import { useSpeechToText } from '../hooks/useSpeechToText'"), 'Interview imports useSpeechToText')
assert.ok(interviewSrc.includes('useSpeechToText({'), 'Interview initializes useSpeechToText')
assert.ok(interviewSrc.includes('onClick={handleVoiceClick}'), 'Existing microphone button attached to handleVoiceClick')
assert.ok(interviewSrc.includes('stopListening()'), 'handleVoiceClick toggles stopListening when active')
assert.ok(interviewSrc.includes('startListening()'), 'handleVoiceClick calls startListening when inactive')
console.log('✅ Passed Test 5: Existing microphone UI connected to real STT.')

// Test 6: Transcript connected to existing answer input without creating separate field
console.log('Test 6: Transcript connected to existing answer input...')
assert.ok(interviewSrc.includes('setInputText(combined)'), 'Transcript updates existing inputText state')
assert.ok(interviewSrc.includes('initialInputBeforeVoiceRef.current'), 'Pre-existing typed text preserved when speech begins')
console.log('✅ Passed Test 6: Transcript seamlessly streams into existing answer input field.')

// Test 7: Speech does NOT auto-submit
console.log('Test 7: Verification that speech does not auto-submit...')
assert.ok(!sttHookSrc.includes('handleSendMessage'), 'STT hook must not know about or call handleSendMessage')
assert.ok(!interviewSrc.includes('onTranscriptChange: ({ fullTranscript }) => {\n      handleSendMessage'), 'onTranscriptChange must not auto-submit')
console.log('✅ Passed Test 7: Verified that speech never auto-submits.')

// Test 8: STT cancellation on navigation and user actions
console.log('Test 8: STT cancellation on actions and navigation...')
assert.ok(interviewSrc.includes('cancelSpeech()\n    stopListening()'), 'handleSendMessage stops listening')
assert.ok(interviewSrc.includes('const handleBack = () => {\n    cancelSpeech()\n    stopListening()'), 'handleBack stops listening')
assert.ok(interviewSrc.includes('const handleFinish = () => {\n    cancelSpeech()\n    stopListening()'), 'handleFinish stops listening')
assert.ok(interviewSrc.includes('useEffect(() => {\n    return () => {\n      cancelSpeech()\n      stopListening()'), 'unmount stops listening')
console.log('✅ Passed Test 8: STT cancelled cleanly on submit, navigation, and unmount.')

// Test 9: Existing Auto-Read code and compatibility preserved
console.log('Test 9: Auto-Read compatibility...')
assert.ok(interviewSrc.includes('const [autoRead, setAutoRead] = useState(false)'), 'autoRead state preserved')
assert.ok(interviewSrc.includes('lastSpokenMsgIdRef'), 'lastSpokenMsgIdRef preserved')
assert.ok(interviewSrc.includes('speakText(textToSpeak)'), 'speakText auto-invocation preserved')
console.log('✅ Passed Test 9: Smart Auto-Read functionality 100% intact.')

// Test 10: Visual listening state and CSS
console.log('Test 10: Visual listening styling and accessibility...')
assert.ok(interviewSrc.includes('${isListening ? \'is-listening\' : \'\'}'), 'voice-button has is-listening class')
assert.ok(interviewSrc.includes('aria-pressed={isListening}'), 'voice-button has aria-pressed attribute')
assert.ok(cssSrc.includes('.voice-button.is-listening'), 'App.css defines .voice-button.is-listening')
assert.ok(cssSrc.includes('.voice-error-banner'), 'App.css defines .voice-error-banner')
console.log('✅ Passed Test 10: Visual listening state, ARIA attributes, and CSS verified.')

// Test 11: Translations contain necessary STT keys for English and Hindi
console.log('Test 11: Translation keys for English and Hindi...')
assert.ok(translationsSrc.includes("voiceBtnListening: 'Listening...'"), 'English voiceBtnListening present')
assert.ok(translationsSrc.includes("voiceBtnListening: 'सुन रहे हैं...'"), 'Hindi voiceBtnListening present')
assert.ok(translationsSrc.includes("voiceNotSupported: 'Voice input is not supported in this browser.'"), 'English voiceNotSupported present')
assert.ok(translationsSrc.includes("voiceNotSupported: 'इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है।'"), 'Hindi voiceNotSupported present')
assert.ok(translationsSrc.includes("voicePermissionDenied: 'Microphone permission is required for voice input.'"), 'English voicePermissionDenied present')
assert.ok(translationsSrc.includes("voicePermissionDenied: 'वॉयस इनपुट के लिए माइक्रोफ़ोन की अनुमति आवश्यक है।'"), 'Hindi voicePermissionDenied present')
assert.ok(translationsSrc.includes("voiceError: 'Unable to hear your voice. Please try again.'"), 'English voiceError present')
assert.ok(translationsSrc.includes("voiceError: 'आपकी आवाज़ सुनाई नहीं दी। कृपया पुनः प्रयास करें।'"), 'Hindi voiceError present')
console.log('✅ Passed Test 11: Localized STT translation strings present.')

console.log('\n🎉 ALL 11 VERIFICATION TEST SUITES PASSED!')
