import React, { useState, useEffect, useRef, useCallback } from 'react'
import ProgressBar from '../components/ProgressBar'
import ChatBubble from '../components/ChatBubble'
import ReadAloud from '../components/ReadAloud'
import { detectRedFlagTrigger, getTriggerByKey } from '../data/redFlags'
import { useSpeechToText } from '../hooks/useSpeechToText'
import { sendMessageToAI } from '../api/ai'
import { generateClinicalSummaryAPI } from '../api/ai'
import {
  mapIndexToSection,
  getNextIncompleteSection,
  getFallbackQuestionForSection,
  getQuickSuggestionsForSection
} from '../data/clinicalSections'

// SVG mic icon — no emoji
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

export default function Interview({
  patientData,
  conversation,
  onUpdateConversation,
  currentQuestionIndex,
  onUpdateQuestionIndex,
  isFinished,
  onSetFinished,
  onFinishInterview,
  onBack,
  language = 'English',
  t
}) {
  const [inputText, setInputText] = useState('')
  const [voiceError, setVoiceError] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [pendingFollowUp, setPendingFollowUp] = useState(null)
  const [autoRead, setAutoRead] = useState(false)
  const [isSpeakingCurrent, setIsSpeakingCurrent] = useState(false)

  const chatBottomRef = useRef(null)
  const inputRef = useRef(null)
  const msgIdCounterRef = useRef(conversation.length + 1)
  const firedKeysRef = useRef(
    conversation.filter((m) => m.followUpKey).map((m) => m.followUpKey)
  )

  const lastSpokenMsgIdRef = useRef(null)
  const autoReadTimerRef = useRef(null)
  const utteranceRef = useRef(null)
  const voiceErrorTimerRef = useRef(null)
  const aiErrorTimerRef = useRef(null)
  const initialInputBeforeVoiceRef = useRef('')

  // Determine active language
  const activeLang = language || (t?.interview?.patientName === 'आप (मरीज़)' ? 'Hindi' : 'English')

  // Helper to resolve localized text of an AI message
  const getAiMessageText = useCallback((msg) => {
    if (!msg) return ''
    if (msg.isAiGenerated || msg.section) {
      return msg.text || ''
    }
    if (msg.type === 'greeting') {
      const g = t?.interview?.initialGreeting ? t.interview.initialGreeting(msg.patientName || patientData.name) : ''
      const q = t?.interview?.questions?.[0] || ''
      return `${g} ${q}`.trim()
    }
    if (typeof msg.questionIndex === 'number' && t?.interview?.questions?.[msg.questionIndex]) {
      return t.interview.questions[msg.questionIndex]
    }
    if (msg.type === 'completion') {
      const title = t?.interview?.interviewCompleteTitle || ''
      const sub = t?.interview?.interviewCompleteSubtitle || ''
      return `${title}. ${sub}`.trim()
    }
    if (msg.type === 'followup' && msg.triggerKey) {
      const trigger = getTriggerByKey(msg.triggerKey)
      if (trigger?.followUp?.[activeLang]) {
        return trigger.followUp[activeLang]
      }
      if (trigger?.followUp?.English) {
        return trigger.followUp.English
      }
    }
    return msg.text || ''
  }, [t, patientData.name, activeLang])

  // Cancel any active speech or pending timers
  const cancelSpeech = useCallback(() => {
    if (autoReadTimerRef.current) {
      clearTimeout(autoReadTimerRef.current)
      autoReadTimerRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeakingCurrent(false)
  }, [])

  // Speak specified text using native Web Speech API
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text || !text.trim()) return

    cancelSpeech()

    window.dispatchEvent(
      new CustomEvent('medikiosk-tts-start', {
        detail: { instanceId: 'interview-auto-read' }
      })
    )

    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = activeLang === 'Hindi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.95

    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices()
      const targetLang = activeLang === 'Hindi' ? 'hi' : 'en-IN'
      const matched = voices.find(
        (v) => v.lang && (v.lang === targetLang || v.lang.startsWith(targetLang))
      )
      if (matched) {
        utterance.voice = matched
      }
    }

    utterance.onstart = () => {
      setIsSpeakingCurrent(true)
    }

    utterance.onend = () => {
      setIsSpeakingCurrent(false)
    }

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('SpeechSynthesis error in Interview:', e.error)
      }
      setIsSpeakingCurrent(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [activeLang, cancelSpeech])

  const showVoiceError = useCallback((code) => {
    if (voiceErrorTimerRef.current) {
      clearTimeout(voiceErrorTimerRef.current)
    }
    setVoiceError(code)
    voiceErrorTimerRef.current = setTimeout(() => {
      setVoiceError(null)
    }, 5000)
  }, [])

  const showAiError = useCallback((msg) => {
    if (aiErrorTimerRef.current) {
      clearTimeout(aiErrorTimerRef.current)
    }
    setAiError(msg || true)
    aiErrorTimerRef.current = setTimeout(() => {
      setAiError(null)
    }, 6000)
  }, [])

  const {
    isListening,
    startListening,
    stopListening,
    isSupported: isVoiceSupported
  } = useSpeechToText({
    language: activeLang,
    onTranscriptChange: ({ fullTranscript }) => {
      if (!fullTranscript) return
      const base = initialInputBeforeVoiceRef.current.trim()
      const combined = base ? `${base} ${fullTranscript}` : fullTranscript
      setInputText(combined)
    },
    onError: (errCode) => {
      showVoiceError(errCode)
    }
  })

  // Cancel speech and stop voice recognition on unmount or language change
  useEffect(() => {
    return () => {
      cancelSpeech()
      stopListening()
      if (voiceErrorTimerRef.current) {
        clearTimeout(voiceErrorTimerRef.current)
      }
      if (aiErrorTimerRef.current) {
        clearTimeout(aiErrorTimerRef.current)
      }
    }
  }, [cancelSpeech, stopListening])

  useEffect(() => {
    cancelSpeech()
    stopListening()
  }, [language, cancelSpeech, stopListening])

  // Listen for audio events to ensure mutual exclusion across all buttons & STT
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOtherTts = (e) => {
      if (e.detail?.instanceId !== 'interview-auto-read') {
        setIsSpeakingCurrent(false)
      }
    }

    const handleSttStart = () => {
      cancelSpeech()
    }

    window.addEventListener('medikiosk-tts-start', handleOtherTts)
    window.addEventListener('medikiosk-stt-start', handleSttStart)

    return () => {
      window.removeEventListener('medikiosk-tts-start', handleOtherTts)
      window.removeEventListener('medikiosk-stt-start', handleSttStart)
      cancelSpeech()
    }
  }, [cancelSpeech])

  // Toggle Auto-Read mode when user clicks speaker button on an AI message
  const handleToggleAutoRead = useCallback((msgId, text) => {
    if (autoRead) {
      // Turn Auto-Read OFF and stop speaking immediately
      setAutoRead(false)
      cancelSpeech()
    } else {
      // Turn Auto-Read ON and immediately speak the current question
      setAutoRead(true)
      lastSpokenMsgIdRef.current = msgId
      speakText(text)
    }
  }, [autoRead, cancelSpeech, speakText])

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation, isFinished, pendingFollowUp])

  // Initialize first question if conversation is empty
  useEffect(() => {
    if (conversation.length === 0) {
      const initialMessage = {
        id: 'msg-ai-0',
        sender: 'ai',
        type: 'greeting',
        section: 'chiefComplaint',
        questionIndex: 0,
        patientName: patientData.name,
        text: `${t.interview.initialGreeting(patientData.name)} ${t.interview.questions[0]}`,
        time: 'Just now'
      }
      onUpdateConversation([initialMessage])
    }
  }, [conversation.length, onUpdateConversation, patientData.name, t.interview])

  // Auto-Read Trigger: When conversation updates and Auto-Read is active, read the latest AI question
  useEffect(() => {
    if (!autoRead) return

    const latestAi = [...conversation].reverse().find((m) => m.sender === 'ai')
    if (!latestAi) return

    if (latestAi.id !== lastSpokenMsgIdRef.current) {
      lastSpokenMsgIdRef.current = latestAi.id
      cancelSpeech()

      const textToSpeak = getAiMessageText(latestAi)
      if (textToSpeak) {
        autoReadTimerRef.current = setTimeout(() => {
          speakText(textToSpeak)
        }, 250)
      }
    }

    return () => {
      if (autoReadTimerRef.current) {
        clearTimeout(autoReadTimerRef.current)
      }
    }
  }, [conversation, autoRead, getAiMessageText, speakText, cancelSpeech])

  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputText).trim()
    if (!text || isFinished || isAiThinking) return

    // Immediately stop ongoing speech when user responds
    cancelSpeech()
    stopListening()
    initialInputBeforeVoiceRef.current = ''
    setVoiceError(null)

    const msgId = msgIdCounterRef.current++

    if (pendingFollowUp) {
      // Patient is answering a red-flag follow-up question
      const patientMsg = {
        id: `msg-patient-${msgId}`,
        sender: 'patient',
        followUpKey: pendingFollowUp.key,
        section: pendingFollowUp.section || mapIndexToSection(pendingFollowUp.resumeIndex - 1),
        text,
        time: 'Just now'
      }

      const resumeIdx = pendingFollowUp.resumeIndex
      setPendingFollowUp(null)

      const updatedWithPatient = [...conversation, patientMsg]
      const nextSection = getNextIncompleteSection(updatedWithPatient)

      if (nextSection && resumeIdx < t.interview.questions.length) {
        setIsAiThinking(true)
        let dynamicAiReply = null

        try {
          const conversationForAi = updatedWithPatient
            .filter((m) => m && m.text)
            .map((m) => ({
              role: m.sender === 'patient' ? 'user' : 'assistant',
              content: m.text
            }))

          const aiResponse = await sendMessageToAI({
            message: text,
            language: activeLang === 'Hindi' ? 'hi' : 'en',
            conversation: conversationForAi,
            currentSection: nextSection
          })

          if (aiResponse?.data?.reply) {
            dynamicAiReply = aiResponse.data.reply.trim()
          }
        } catch (err) {
          console.warn('AI turn error on resume, continuing standard interview:', err.message)
          showAiError(t?.interview?.aiUnavailable || 'AI assistant temporarily unavailable. Continuing with standard question.')
        } finally {
          setIsAiThinking(false)
        }

        const fallbackText = getFallbackQuestionForSection(nextSection, activeLang) || t.interview.questions[resumeIdx]

        const nextAiQuestion = {
          id: `msg-ai-${msgId + 1}`,
          sender: 'ai',
          type: 'question',
          section: nextSection,
          questionIndex: resumeIdx,
          isAiGenerated: Boolean(dynamicAiReply),
          text: dynamicAiReply || fallbackText,
          time: 'Just now'
        }
        onUpdateConversation([...updatedWithPatient, nextAiQuestion])
        onUpdateQuestionIndex(resumeIdx)
      } else if (!nextSection) {
        const completionMsg = {
          id: `msg-ai-final-${msgId + 1}`,
          sender: 'ai',
          type: 'completion',
          text: `${t.interview.interviewCompleteTitle}. ${t.interview.interviewCompleteSubtitle}`,
          time: 'Just now'
        }
        onUpdateConversation([...updatedWithPatient, completionMsg])
        onSetFinished(true)
      } else {
        const fallbackText = getFallbackQuestionForSection(nextSection, activeLang)
        const nextAiQuestion = {
          id: `msg-ai-${msgId + 1}`,
          sender: 'ai',
          type: 'question',
          section: nextSection,
          questionIndex: resumeIdx < t.interview.questions.length ? resumeIdx : t.interview.questions.length - 1,
          isAiGenerated: false,
          text: fallbackText,
          time: 'Just now'
        }
        onUpdateConversation([...updatedWithPatient, nextAiQuestion])
        onUpdateQuestionIndex(resumeIdx < t.interview.questions.length ? resumeIdx : currentQuestionIndex)
      }
    } else {
      // Find section being answered from the last AI question
      const lastAi = [...conversation].reverse().find((m) => m.sender === 'ai')
      const answeredSection = lastAi?.section || mapIndexToSection(currentQuestionIndex)

      const patientMsg = {
        id: `msg-patient-${msgId}`,
        sender: 'patient',
        answerIndex: currentQuestionIndex,
        section: answeredSection,
        text,
        time: 'Just now'
      }

      // Check if this response triggers a red-flag follow-up branch
      const trigger = detectRedFlagTrigger(currentQuestionIndex, text, firedKeysRef.current)

      if (trigger) {
        firedKeysRef.current.push(trigger.key)
        const followUpText = trigger.followUp[language] || trigger.followUp.English || trigger.followUp.Hindi

        const aiFollowUpMsg = {
          id: `msg-ai-followup-${msgId + 1}`,
          sender: 'ai',
          type: 'followup',
          triggerKey: trigger.key,
          section: answeredSection,
          text: followUpText,
          time: 'Just now'
        }

        onUpdateConversation([...conversation, patientMsg, aiFollowUpMsg])
        setPendingFollowUp({
          key: trigger.key,
          section: answeredSection,
          resumeIndex: currentQuestionIndex + 1
        })
        // Note: We do NOT advance currentQuestionIndex until follow-up is answered
      } else {
        // Normal question advance
        const nextIndex = currentQuestionIndex + 1
        const updatedMessages = [...conversation, patientMsg]
        const nextSection = getNextIncompleteSection(updatedMessages)

        if (nextSection && (nextIndex < t.interview.questions.length || nextSection)) {
          onUpdateConversation(updatedMessages)
          setIsAiThinking(true)
          let dynamicAiReply = null

          try {
            const conversationForAi = updatedMessages
              .filter((m) => m && m.text)
              .map((m) => ({
                role: m.sender === 'patient' ? 'user' : 'assistant',
                content: m.text
              }))

            const aiResponse = await sendMessageToAI({
              message: text,
              language: activeLang === 'Hindi' ? 'hi' : 'en',
              conversation: conversationForAi,
              currentSection: nextSection
            })

            if (aiResponse?.data?.reply) {
              dynamicAiReply = aiResponse.data.reply.trim()
            }
          } catch (err) {
            console.warn('AI turn error, continuing standard interview:', err.message)
            showAiError(t?.interview?.aiUnavailable || 'AI assistant temporarily unavailable. Continuing with standard question.')
          } finally {
            setIsAiThinking(false)
          }

          const fallbackText =
            getFallbackQuestionForSection(nextSection, activeLang) ||
            t.interview.questions[nextIndex] ||
            t.interview.questions[t.interview.questions.length - 1]

          const nextAiQuestion = {
            id: `msg-ai-${msgId + 1}`,
            sender: 'ai',
            type: 'question',
            section: nextSection,
            questionIndex: nextIndex < t.interview.questions.length ? nextIndex : t.interview.questions.length - 1,
            isAiGenerated: Boolean(dynamicAiReply),
            text: dynamicAiReply || t.interview.questions[nextIndex] || fallbackText,
            time: 'Just now'
          }
          onUpdateConversation([...updatedMessages, nextAiQuestion])
          onUpdateQuestionIndex(nextIndex < t.interview.questions.length ? nextIndex : currentQuestionIndex)
        } else {
          const completionMsg = {
            id: `msg-ai-final-${msgId + 1}`,
            sender: 'ai',
            type: 'completion',
            text: `${t.interview.interviewCompleteTitle}. ${t.interview.interviewCompleteSubtitle}`,
            time: 'Just now'
          }
          onUpdateConversation([...updatedMessages, completionMsg])
          onSetFinished(true)
        }
      }
    }

    setInputText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleVoiceClick = () => {
    cancelSpeech()

    if (isListening) {
      stopListening()
    } else {
      if (!isVoiceSupported) {
        showVoiceError('not-supported')
        return
      }
      setVoiceError(null)
      initialInputBeforeVoiceRef.current = inputText
      startListening()
    }
  }

  // Get active section from the latest AI message
  const activeAiMsg = [...conversation].reverse().find((m) => m.sender === 'ai')
  const currentActiveSection = activeAiMsg?.section || mapIndexToSection(currentQuestionIndex)
  const sectionSuggestions = currentActiveSection ? getQuickSuggestionsForSection(currentActiveSection, activeLang) : []

  const currentSuggestions = isFinished
    ? []
    : pendingFollowUp
    ? (t.interview.followUpQuickReplies || ['Yes', 'No', 'Not sure'])
    : sectionSuggestions.length > 0
    ? sectionSuggestions
    : currentQuestionIndex < t.interview.quickSuggestions.length
    ? t.interview.quickSuggestions[currentQuestionIndex]
    : []

  const handleBack = () => {
    cancelSpeech()
    stopListening()
    onBack()
  }

  const finishAndGenerateSummary = async () => {
    if (isGeneratingSummary) return
    setIsGeneratingSummary(true)

    try {
      const formattedHistory = conversation
        .filter((m) => m && m.text)
        .map((m) => ({
          role: m.sender === 'patient' ? 'user' : 'assistant',
          content: m.text
        }))

      const result = await generateClinicalSummaryAPI({
        conversation: formattedHistory,
        language: activeLang === 'Hindi' ? 'hi' : 'en'
      })

      if (result?.data?.summary) {
        onFinishInterview(result.data.summary)
        return
      }
    } catch (err) {
      console.warn('AI summary generation failed, proceeding with fallback:', err.message)
      showAiError(t?.interview?.summaryUnavailable || 'AI summary temporarily unavailable. Standard clinical summary generated.')
    } finally {
      setIsGeneratingSummary(false)
    }

    onFinishInterview(null)
  }

  const handleFinish = () => {
    cancelSpeech()
    stopListening()

    // Guard: Verify all required clinical sections are actually completed
    const missingSection = getNextIncompleteSection(conversation)
    if (missingSection) {
      // Incomplete sections remain! Do NOT terminate early.
      onSetFinished(false)
      const fallbackQuestion = getFallbackQuestionForSection(missingSection, activeLang)
      const msgId = msgIdCounterRef.current++
      const guardedAiQuestion = {
        id: `msg-ai-guard-${msgId}`,
        sender: 'ai',
        type: 'question',
        section: missingSection,
        questionIndex: currentQuestionIndex,
        isAiGenerated: false,
        text: fallbackQuestion,
        time: 'Just now'
      }
      onUpdateConversation([...conversation, guardedAiQuestion])
      return
    }

    finishAndGenerateSummary()
  }

  // Find latest AI message ID for controlled Auto-Read indicators
  const latestAiMsgId = [...conversation].reverse().find((m) => m.sender === 'ai')?.id

  return (
    <div className="kiosk-container interview-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={handleBack}
          aria-label={t.common.back}
        >
          {t.common.back}
        </button>
      </div>

      <ProgressBar currentStep={4} totalSteps={6} t={t} />

      <div className="page-header interview-page-header">
        <h1 className="screen-title">{t.interview.title}</h1>
        <p className="screen-subtitle">{t.interview.subtitle}</p>
      </div>

      {/* Conversational Chat Viewport */}
      <div className="chat-viewport" role="log" aria-live="polite">
        <div className="chat-messages-list">
          {conversation.map((msg) => {
            const isLatestAi = msg.id === latestAiMsgId
            return (
              <ChatBubble
                key={msg.id}
                message={msg}
                t={t}
                language={language}
                autoRead={autoRead}
                isLatestAi={isLatestAi}
                isSpeakingCurrent={isLatestAi ? isSpeakingCurrent : false}
                onToggleAutoRead={handleToggleAutoRead}
              />
            )
          })}
          {isAiThinking && (
            <div className="ai-thinking-indicator" role="status" aria-live="polite">
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span className="thinking-dot" />
              <span>{t?.interview?.aiThinking || 'MediKiosk AI is thinking...'}</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* Touch-First Quick Option Suggestions */}
      {!isFinished && !isAiThinking && currentSuggestions.length > 0 && (
        <div className="quick-suggestions-bar" aria-label={t.interview.quickOptionsLabel}>
          <span className="suggestions-title">{t.interview.quickOptionsLabel}</span>
          <div className="suggestions-chips">
            {currentSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="chip-button touch-target"
                onClick={() => handleSendMessage(item)}
                disabled={isAiThinking}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Error Banner */}
      {aiError && (
        <div className="ai-error-banner" role="alert">
          <span aria-hidden="true">⚠️</span>
          <span>
            {typeof aiError === 'string'
              ? aiError
              : (t?.interview?.aiUnavailable || 'AI assistant temporarily unavailable. Continuing with standard question.')}
          </span>
        </div>
      )}

      {/* Voice Error Banner */}
      {voiceError && (
        <div className="voice-error-banner" role="alert">
          <MicIcon />
          <span>
            {voiceError === 'not-supported'
              ? (t.interview.voiceNotSupported || 'Voice input is not supported in this browser.')
              : voiceError === 'permission-denied'
              ? (t.interview.voicePermissionDenied || 'Microphone permission is required for voice input.')
              : (t.interview.voiceError || 'Unable to hear your voice. Please try again.')}
          </span>
        </div>
      )}

      {/* Bottom Input or Complete Panel */}
      {isFinished ? (
        <div className="interview-finished-panel">
          <div className="finish-status-banner">
            <span className="check-badge">✓</span>
            <div>
              <strong>{t.interview.interviewCompleteTitle}</strong>
              <p>{t.interview.interviewCompleteSubtitle}</p>
            </div>
          </div>
          <button
            type="button"
            className="primary-button finish-interview-btn touch-target"
            onClick={handleFinish}
            disabled={isGeneratingSummary}
          >
            <span>{isGeneratingSummary ? (t?.interview?.generatingSummary || 'Generating Clinical Summary...') : t.interview.finishBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <div className="chat-input-bar">
          <button
            type="button"
            className={`voice-button touch-target ${isListening ? 'is-listening' : ''}`}
            onClick={handleVoiceClick}
            disabled={isAiThinking}
            title={isListening ? (t.interview.voiceInputListeningTitle || 'Listening... Tap to stop') : (t.interview.voiceInputTitle || 'Speak your answer')}
            aria-label={isListening ? (t.interview.voiceInputListeningTitle || 'Listening... Tap to stop') : (t.interview.voiceBtnLabel || 'Voice input')}
            aria-pressed={isListening}
          >
            <MicIcon />
            <span className="voice-btn-text">
              {isListening ? (t.interview.voiceBtnListening || 'Listening...') : (t.interview.voiceBtnLabel || 'Voice input')}
            </span>
          </button>

          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={t.interview.inputPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAiThinking}
            aria-label={t.interview.inputPlaceholder}
          />

          <button
            type="button"
            className={`send-button touch-target ${inputText.trim() && !isAiThinking ? 'active' : ''}`}
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isAiThinking}
            aria-label={t.interview.sendBtn}
          >
            {t.interview.sendBtn}
          </button>
        </div>
      )}
    </div>
  )
}
