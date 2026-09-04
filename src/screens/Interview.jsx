import React, { useState, useEffect, useRef } from 'react'
import ProgressBar from '../components/ProgressBar'
import ChatBubble from '../components/ChatBubble'
import ReadAloud from '../components/ReadAloud'
import { detectRedFlagTrigger } from '../data/redFlags'

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
  const [voiceToast, setVoiceToast] = useState(false)
  const [pendingFollowUp, setPendingFollowUp] = useState(null)

  const chatBottomRef = useRef(null)
  const inputRef = useRef(null)
  const msgIdCounterRef = useRef(conversation.length + 1)
  const firedKeysRef = useRef(
    conversation.filter((m) => m.followUpKey).map((m) => m.followUpKey)
  )

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
        questionIndex: 0,
        patientName: patientData.name,
        text: `${t.interview.initialGreeting(patientData.name)} ${t.interview.questions[0]}`,
        time: 'Just now'
      }
      onUpdateConversation([initialMessage])
    }
  }, [conversation.length, onUpdateConversation, patientData.name, t.interview])

  const handleSendMessage = (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputText).trim()
    if (!text || isFinished) return

    const msgId = msgIdCounterRef.current++

    if (pendingFollowUp) {
      // Patient is answering a red-flag follow-up question
      const patientMsg = {
        id: `msg-patient-${msgId}`,
        sender: 'patient',
        followUpKey: pendingFollowUp.key,
        text,
        time: 'Just now'
      }

      const resumeIdx = pendingFollowUp.resumeIndex
      setPendingFollowUp(null)

      if (resumeIdx < t.interview.questions.length) {
        const nextAiQuestion = {
          id: `msg-ai-${msgId + 1}`,
          sender: 'ai',
          type: 'question',
          questionIndex: resumeIdx,
          text: t.interview.questions[resumeIdx],
          time: 'Just now'
        }
        onUpdateConversation([...conversation, patientMsg, nextAiQuestion])
        onUpdateQuestionIndex(resumeIdx)
      } else {
        const completionMsg = {
          id: `msg-ai-final-${msgId + 1}`,
          sender: 'ai',
          type: 'completion',
          text: `${t.interview.interviewCompleteTitle}. ${t.interview.interviewCompleteSubtitle}`,
          time: 'Just now'
        }
        onUpdateConversation([...conversation, patientMsg, completionMsg])
        onSetFinished(true)
      }
    } else {
      // Patient is answering a fixed base question (tagged with answerIndex)
      const patientMsg = {
        id: `msg-patient-${msgId}`,
        sender: 'patient',
        answerIndex: currentQuestionIndex,
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
          text: followUpText,
          time: 'Just now'
        }

        onUpdateConversation([...conversation, patientMsg, aiFollowUpMsg])
        setPendingFollowUp({
          key: trigger.key,
          resumeIndex: currentQuestionIndex + 1
        })
        // Note: We do NOT advance currentQuestionIndex until follow-up is answered
      } else {
        // Normal question advance
        const nextIndex = currentQuestionIndex + 1
        const updatedMessages = [...conversation, patientMsg]

        if (nextIndex < t.interview.questions.length) {
          const nextAiQuestion = {
            id: `msg-ai-${msgId + 1}`,
            sender: 'ai',
            type: 'question',
            questionIndex: nextIndex,
            text: t.interview.questions[nextIndex],
            time: 'Just now'
          }
          onUpdateConversation([...updatedMessages, nextAiQuestion])
          onUpdateQuestionIndex(nextIndex)
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
    setVoiceToast(true)
    setTimeout(() => {
      setVoiceToast(false)
    }, 4000)
  }

  const currentSuggestions = isFinished
    ? []
    : pendingFollowUp
    ? (t.interview.followUpQuickReplies || ['Yes', 'No', 'Not sure'])
    : currentQuestionIndex < t.interview.quickSuggestions.length
    ? t.interview.quickSuggestions[currentQuestionIndex]
    : []

  const activeAiSpeechText =
    (conversation.length > 0 &&
      [...conversation].reverse().find((m) => m.sender === 'ai')?.text) ||
    t.interview.questions[currentQuestionIndex] ||
    t.interview.title

  return (
    <div className="kiosk-container interview-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label={t.common.back}
        >
          {t.common.back}
        </button>
      </div>

      <ProgressBar currentStep={4} totalSteps={6} t={t} />

      <div className="page-header interview-page-header">
        <h1 className="screen-title">{t.interview.title}</h1>
        <p className="screen-subtitle">{t.interview.subtitle}</p>
        <div className="read-aloud-container">
          <ReadAloud
            text={activeAiSpeechText}
            language={language}
            t={t}
          />
        </div>
      </div>

      {/* Conversational Chat Viewport */}
      <div className="chat-viewport" role="log" aria-live="polite">
        <div className="chat-messages-list">
          {conversation.map((msg) => (
            <ChatBubble key={msg.id} message={msg} t={t} language={language} />
          ))}
          <div ref={chatBottomRef} />
        </div>
      </div>

      {/* Touch-First Quick Option Suggestions */}
      {!isFinished && currentSuggestions.length > 0 && (
        <div className="quick-suggestions-bar" aria-label={t.interview.quickOptionsLabel}>
          <span className="suggestions-title">{t.interview.quickOptionsLabel}</span>
          <div className="suggestions-chips">
            {currentSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="chip-button touch-target"
                onClick={() => handleSendMessage(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Toast Feedback — SVG-only, no emoji */}
      {voiceToast && (
        <div className="voice-toast-banner" role="alert">
          <MicIcon />
          <span>{t.interview.voiceToast}</span>
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
            onClick={onFinishInterview}
          >
            <span>{t.interview.finishBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <div className="chat-input-bar">
          <button
            type="button"
            className="voice-button touch-target"
            onClick={handleVoiceClick}
            title={t.interview.voiceInputTitle}
            aria-label={t.interview.voiceBtnLabel}
          >
            <MicIcon />
            <span className="voice-btn-text">{t.interview.voiceBtnLabel}</span>
          </button>

          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder={t.interview.inputPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t.interview.inputPlaceholder}
          />

          <button
            type="button"
            className={`send-button touch-target ${inputText.trim() ? 'active' : ''}`}
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            aria-label={t.interview.sendBtn}
          >
            {t.interview.sendBtn}
          </button>
        </div>
      )}
    </div>
  )
}
