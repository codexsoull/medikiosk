import React, { useState, useEffect } from 'react'
import AppHeader from './components/AppHeader'
import Welcome from './screens/Welcome'
import Consent from './screens/Consent'
import IdentityVerification from './screens/IdentityVerification'
import OTPVerification from './screens/OTPVerification'
import PatientDetails from './screens/PatientDetails'
import Interview from './screens/Interview'
import DocumentUpload from './screens/DocumentUpload'
import AIProcessing from './screens/AIProcessing'
import PatientReview from './screens/PatientReview'
import SubmissionSuccess from './screens/SubmissionSuccess'
import DoctorDashboard from './screens/DoctorDashboard'
import DoctorCase from './screens/DoctorCase'
import { translations } from './translations/translations'
import {
  initialCaseData,
  generateStructuredSummaryFromAnswers,
  extractAnswersByIndex,
  extractRedFlagResponses
} from './data/mockCase'
import { createCase, fetchCaseById, mapBackendCaseToFrontend } from './api/cases'
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

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState('')

  // Active Selected Case in Doctor Portal
  const [selectedDoctorCase, setSelectedDoctorCase] = useState(null)

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
        const answersByIndex = extractAnswersByIndex(conversation)
        const redFlags = extractRedFlagResponses(conversation)
        const { summary, clinicalAlerts } = generateStructuredSummaryFromAnswers(answersByIndex, {
          redFlags,
          documentCount: (caseData.documents || []).length
        })
        setCaseData((prev) => ({
          ...prev,
          interview: {
            answers: answersByIndex,
            answersByIndex,
            redFlags
          },
          summary: { ...prev.summary, ...summary },
          clinicalAlerts: clinicalAlerts || []
        }))
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
    const answersByIndex = extractAnswersByIndex(conversation)
    const redFlags = extractRedFlagResponses(conversation)
    const { summary, clinicalAlerts } = generateStructuredSummaryFromAnswers(answersByIndex, {
      redFlags,
      documentCount: (caseData.documents || []).length
    })

    setCaseData((prev) => ({
      ...prev,
      complaint: {
        chiefComplaint: summary.chiefComplaint,
        onset: answersByIndex[1] || 'Recently',
        severity: answersByIndex[2] || 'Moderate',
        associatedSymptoms: answersByIndex[3] || 'None'
      },
      interview: {
        answers: answersByIndex,
        answersByIndex,
        redFlags
      },
      summary: {
        ...prev.summary,
        ...summary
      },
      clinicalAlerts: clinicalAlerts || []
    }))
    setScreen('upload')
  }

  const handleUploadContinue = () => {
    setScreen('processing')
  }

  const handleProcessingComplete = () => {
    const answersByIndex = caseData.interview?.answersByIndex || extractAnswersByIndex(conversation)
    const redFlags = caseData.interview?.redFlags || extractRedFlagResponses(conversation)
    const { summary, clinicalAlerts } = generateStructuredSummaryFromAnswers(answersByIndex, {
      redFlags,
      documentCount: (caseData.documents || []).length
    })

    setCaseData((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        ...summary
      },
      clinicalAlerts: clinicalAlerts || []
    }))
    setScreen('review')
  }

  const handlePatientSubmit = async () => {
    setIsSubmitting(true)
    setSubmissionError('')

    try {
      const payload = {
        patient_name: caseData.patient?.name || '',
        age: caseData.patient?.age ? Number(caseData.patient.age) : null,
        gender: caseData.patient?.gender || null,
        mobile: caseData.patient?.mobile || '',
        identity_verification_status: caseData.authentication?.status || 'not_authenticated',
        consent_status: caseData.consent?.given ? 'given' : 'not_given',
        consent_timestamp: caseData.consent?.timestamp || new Date().toISOString(),
        chief_complaint: caseData.summary?.chiefComplaint || caseData.complaint?.chiefComplaint || '',
        symptoms: caseData.complaint?.associatedSymptoms || '',
        medical_history: caseData.summary?.pastMedicalHistory || '',
        medications: caseData.summary?.medications || '',
        allergies: caseData.summary?.allergies || '',
        ai_summary: caseData.summary || {},
        clinical_alerts: caseData.clinicalAlerts || [],
        doctor_notes: caseData.physicianNotes || '',
        case_status: 'ready_for_doctor'
      }

      const result = await createCase(payload)
      const returnedCaseId = result.case_id || result.data?.case_id || caseData.caseId

      setCaseData((prev) => ({
        ...prev,
        caseId: returnedCaseId,
        status: 'ready_for_doctor',
        intakeTimestamp: new Date().toISOString()
      }))

      setScreen('success')
    } catch (error) {
      console.error('Failed to submit patient intake to backend:', error)
      setSubmissionError(
        t.review?.submissionError || 'Unable to submit your case right now. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDoctorDashboard = () => {
    setSelectedDoctorCase(null)
    setScreen('doctor_dashboard')
  }

  const handleOpenDoctorCase = async (caseIdentifier) => {
    if (caseIdentifier) {
      try {
        const response = await fetchCaseById(caseIdentifier)
        if (response?.data) {
          const mappedCase = mapBackendCaseToFrontend(response.data)
          setSelectedDoctorCase(mappedCase)
          setScreen('doctor_case')
          return
        }
      } catch (err) {
        console.error(`Failed to fetch complete case for ${caseIdentifier}:`, err)
      }
    }
    // Fallback to active caseData if fetch fails
    setSelectedDoctorCase(caseData)
    setScreen('doctor_case')
  }

  const handleDoctorAcceptSummary = (updatedBackendData) => {
    const acceptedTimestamp = new Date().toISOString()
    const mapped = updatedBackendData ? mapBackendCaseToFrontend(updatedBackendData) : null

    setSelectedDoctorCase((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        status: 'physician_accepted',
        case_status: 'accepted',
        acceptedTimestamp,
        ...(mapped || {})
      }
    })
    setCaseData((prev) => ({
      ...prev,
      status: 'physician_accepted',
      case_status: 'accepted',
      acceptedTimestamp,
      ...(mapped || {})
    }))
  }

  const handleDoctorUpdateSummary = (updatedSummary, updatedBackendData) => {
    const mapped = updatedBackendData ? mapBackendCaseToFrontend(updatedBackendData) : null

    setSelectedDoctorCase((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        summary: {
          ...prev.summary,
          ...updatedSummary
        },
        doctor_notes: mapped?.doctor_notes || prev.doctor_notes,
        physicianNotes: mapped?.doctor_notes || prev.physicianNotes,
        ...(mapped || {})
      }
    })
    setCaseData((prev) => ({
      ...prev,
      summary: {
        ...prev.summary,
        ...updatedSummary
      },
      doctor_notes: mapped?.doctor_notes || prev.doctor_notes,
      physicianNotes: mapped?.doctor_notes || prev.physicianNotes,
      ...(mapped || {})
    }))
  }

  const handleStartNewIntake = () => {
    setCaseData({
      ...initialCaseData,
      caseId: 'CASE-0001',
      patient: {
        name: '',
        age: '',
        gender: '',
        language: language
      }
    })
    setSelectedDoctorCase(null)
    setConversation([])
    setCurrentQuestionIndex(0)
    setIsInterviewFinished(false)
    setIsSubmitting(false)
    setSubmissionError('')
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
            language={language}
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

        {/* Step 5.5: AI Processing Transition */}
        {screen === 'processing' && (
          <AIProcessing
            onComplete={handleProcessingComplete}
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
            isSubmitting={isSubmitting}
            errorMessage={submissionError}
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
            onOpenCase={handleOpenDoctorCase}
            onStartNewIntake={handleStartNewIntake}
            t={t}
          />
        )}

        {/* Step 9: Doctor Case Summary & Editing */}
        {screen === 'doctor_case' && (
          <DoctorCase
            caseData={selectedDoctorCase || caseData}
            onUpdateSummary={handleDoctorUpdateSummary}
            onAcceptCase={handleDoctorAcceptSummary}
            onBackToDashboard={handleOpenDoctorDashboard}
            t={t}
          />
        )}
      </main>
    </div>
  )
}