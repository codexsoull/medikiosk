import React, { useState, useEffect } from 'react'
import AppHeader from './components/AppHeader'
import Welcome from './screens/Welcome'
import Consent from './screens/Consent'
import IdentityVerification from './screens/IdentityVerification'
import OTPVerification from './screens/OTPVerification'
import PatientDetails from './screens/PatientDetails'
import Interview from './screens/Interview'
import DocumentUpload from './screens/DocumentUpload'
import PatientReview from './screens/PatientReview'
import SubmissionSuccess from './screens/SubmissionSuccess'
import DoctorDashboard from './screens/DoctorDashboard'
import DoctorCase from './screens/DoctorCase'
import { translations } from './translations/translations'
import { initialCaseData, generateStructuredSummaryFromAnswers } from './data/mockCase'
import './App.css'

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem('medikiosk-language')
    if (saved === 'Hindi' || saved === 'English') {
      return saved
    }
  } catch {
    // Storage fallback
  }
  return 'English'
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('medikiosk-theme')
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
  } catch {
    // Storage fallback
  }
  return 'light'
}

export default function App() {
  const [language, setLanguage] = useState(getInitialLanguage)
  const [theme, setTheme] = useState(getInitialTheme)
  const [screen, setScreen] = useState('welcome')

  // Master Shared Mock Case State
  const [caseData, setCaseData] = useState(() => ({
    ...initialCaseData,
    patient: {
      ...initialCaseData.patient,
      language: getInitialLanguage()
    }
  }))

  // Interview Conversation State
  const [conversation, setConversation] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isInterviewFinished, setIsInterviewFinished] = useState(false)

  // Persist language to localStorage and caseData
  const handleSelectLanguage = (lang) => {
    setLanguage(lang)
    setCaseData((prev) => ({
      ...prev,
      patient: {
        ...prev.patient,
        language: lang
      }
    }))
    try {
      localStorage.setItem('medikiosk-language', lang)
    } catch {
      // ignore
    }
  }

  // Persist theme to localStorage and document element
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    try {
      localStorage.setItem('medikiosk-theme', nextTheme)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Active translation dictionary
  const t = translations[language] || translations.English

  // Mode helper
  const isDoctorMode = screen === 'doctor_dashboard' || screen === 'doctor_case'

  const handleSwitchMode = () => {
    if (isDoctorMode) {
      setScreen('welcome')
    } else {
      // If patient is not yet submitted, generate preview summary so doctor sees current state
      if (!caseData.summary.chiefComplaint && conversation.length > 0) {
        const answers = conversation.filter((m) => m.sender === 'patient').map((m) => m.text)
        const generated = generateStructuredSummaryFromAnswers(answers)
        setCaseData((prev) => ({ ...prev, summary: { ...prev.summary, ...generated } }))
      }
      setScreen('doctor_dashboard')
    }
  }

  // Navigation handlers
  const handleStart = () => {
    setScreen('consent')
  }

  const handleConsentContinue = () => {
    setScreen('identity')
  }

  const handleIdentityContinue = () => {
    setScreen('otp')
  }

  const handleOtpVerified = () => {
    setScreen('details')
  }

  const handleDetailsContinue = () => {
    setScreen('interview')
  }

  const handleFinishInterview = () => {
    const patientReplies = conversation
      .filter((msg) => msg.sender === 'patient')
      .map((msg) => msg.text.trim())

    const generated = generateStructuredSummaryFromAnswers(patientReplies)
    setCaseData((prev) => ({
      ...prev,
      complaint: {
        chiefComplaint: generated.chiefComplaint,
        onset: patientReplies[1] || 'Recently',
        severity: patientReplies[2] || 'Moderate',
        associatedSymptoms: patientReplies[3] || 'None'
      },
      interview: {
        answers: patientReplies
      },
      summary: {
        ...prev.summary,
        ...generated
      }
    }))
    setScreen('upload')
  }

  const handleUploadContinue = () => {
    setScreen('review')
  }

  const handlePatientSubmit = () => {
    setCaseData((prev) => ({
      ...prev,
      status: 'ready_for_doctor',
      intakeTimestamp: new Date().toISOString()
    }))
    setScreen('success')
  }

  const handleOpenDoctorDashboard = () => {
    setScreen('doctor_dashboard')
  }

  const handleOpenDoctorCase = () => {
    setScreen('doctor_case')
  }

  const handleDoctorAcceptSummary = () => {
    setCaseData((prev) => ({
      ...prev,
      status: 'physician_accepted',
      acceptedTimestamp: new Date().toISOString()
    }))
  }

  const handleDoctorUpdateSummary = (updatedSummary) => {
    setCaseData((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        ...updatedSummary
      },
      physicianNotes: 'Edited by physician'
    }))
  }

  const handleStartNewIntake = () => {
    setCaseData({
      ...initialCaseData,
      caseId: `CASE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      patient: {
        name: '',
        age: '',
        gender: '',
        language: language
      }
    })
    setConversation([])
    setCurrentQuestionIndex(0)
    setIsInterviewFinished(false)
    setScreen('welcome')
  }

  return (
    <div className="app" data-theme={theme}>
      <AppHeader
        language={language}
        onSelectLanguage={handleSelectLanguage}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentMode={isDoctorMode ? 'doctor' : 'kiosk'}
        onSwitchMode={handleSwitchMode}
        screen={screen}
        t={t}
      />

      <main className="main-content-wrapper">
        {/* Step 0: Welcome */}
        {screen === 'welcome' && (
          <Welcome
            language={language}
            onSelectLanguage={handleSelectLanguage}
            onStart={handleStart}
            t={t}
          />
        )}

        {/* Step 1: Consent */}
        {screen === 'consent' && (
          <Consent
            caseData={caseData}
            onUpdateCase={setCaseData}
            onContinue={handleConsentContinue}
            onBack={() => setScreen('welcome')}
            t={t}
          />
        )}

        {/* Step 2: Identity Verification */}
        {screen === 'identity' && (
          <IdentityVerification
            caseData={caseData}
            onUpdateCase={setCaseData}
            onContinueToOtp={handleIdentityContinue}
            onBack={() => setScreen('consent')}
            t={t}
          />
        )}

        {/* Step 2.5: OTP Verification */}
        {screen === 'otp' && (
          <OTPVerification
            onUpdateCase={setCaseData}
            onContinueToDetails={handleOtpVerified}
            onBack={() => setScreen('identity')}
            t={t}
          />
        )}

        {/* Step 3: Patient Details */}
        {screen === 'details' && (
          <PatientDetails
            patientData={caseData.patient}
            onUpdatePatient={(newPatient) =>
              setCaseData((prev) => ({ ...prev, patient: newPatient }))
            }
            onContinue={handleDetailsContinue}
            onBack={() => setScreen('otp')}
            t={t}
          />
        )}

        {/* Step 4: AI History Interview */}
        {screen === 'interview' && (
          <Interview
            patientData={caseData.patient}
            conversation={conversation}
            onUpdateConversation={setConversation}
            currentQuestionIndex={currentQuestionIndex}
            onUpdateQuestionIndex={setCurrentQuestionIndex}
            isFinished={isInterviewFinished}
            onSetFinished={setIsInterviewFinished}
            onFinishInterview={handleFinishInterview}
            onBack={() => setScreen('details')}
            t={t}
          />
        )}

        {/* Step 5: Document Upload */}
        {screen === 'upload' && (
          <DocumentUpload
            uploadedDocuments={caseData.documents}
            onUpdateDocuments={(docs) =>
              setCaseData((prev) => ({ ...prev, documents: docs }))
            }
            onContinue={handleUploadContinue}
            onSkip={handleUploadContinue}
            onBack={() => setScreen('interview')}
            t={t}
          />
        )}

        {/* Step 6: Patient Review */}
        {screen === 'review' && (
          <PatientReview
            caseData={caseData}
            onEditSection={(sectionKey) => setScreen(sectionKey)}
            onSubmit={handlePatientSubmit}
            onBack={() => setScreen('upload')}
            t={t}
          />
        )}

        {/* Step 7: Submission Success */}
        {screen === 'success' && (
          <SubmissionSuccess
            caseData={caseData}
            onGoToDoctorDashboard={handleOpenDoctorDashboard}
            onStartNewIntake={handleStartNewIntake}
            t={t}
          />
        )}

        {/* Step 8: Doctor Dashboard */}
        {screen === 'doctor_dashboard' && (
          <DoctorDashboard
            caseData={caseData}
            onOpenCase={handleOpenDoctorCase}
            onStartNewIntake={handleStartNewIntake}
            t={t}
          />
        )}

        {/* Step 9: Doctor Case Summary & Editing */}
        {screen === 'doctor_case' && (
          <DoctorCase
            caseData={caseData}
            onUpdateSummary={handleDoctorUpdateSummary}
            onAcceptCase={handleDoctorAcceptSummary}
            onBackToDashboard={() => setScreen('doctor_dashboard')}
            t={t}
          />
        )}
      </main>
    </div>
  )
}