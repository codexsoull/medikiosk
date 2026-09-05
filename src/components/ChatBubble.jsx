import React from 'react'
import { getTriggerByKey } from '../data/redFlags'
import ReadAloud from './ReadAloud'

export default function ChatBubble({
  message,
  t,
  language,
  autoRead = false,
  isLatestAi = false,
  isSpeakingCurrent = false,
  onToggleAutoRead
}) {
  const isAi = message.sender === 'ai'
  const isFollowUp = message.type === 'followup'

  // Determine active language
  const activeLang = language || (t?.interview?.patientName === 'आप (मरीज़)' ? 'Hindi' : 'English')

  // If message has dynamic question, greeting or followup key, render in active language
  let displayText = message.text
  if (isAi && t?.interview) {
    if (message.type === 'greeting') {
      displayText = `${t.interview.initialGreeting(message.patientName)} ${t.interview.questions[0]}`
    } else if (typeof message.questionIndex === 'number' && t.interview.questions[message.questionIndex]) {
      displayText = t.interview.questions[message.questionIndex]
    } else if (message.type === 'completion') {
      displayText = `${t.interview.interviewCompleteTitle}. ${t.interview.interviewCompleteSubtitle}`
    } else if (isFollowUp && message.triggerKey) {
      const trigger = getTriggerByKey(message.triggerKey)
      if (trigger?.followUp?.[activeLang]) {
        displayText = trigger.followUp[activeLang]
      }
    }
  }

  const senderName = isAi
    ? (t?.interview?.assistantName || 'MediKiosk AI')
    : (t?.interview?.patientName || 'You (Patient)')

  return (
    <div className={`chat-message-row ${isAi ? 'ai-row' : 'patient-row'} ${isFollowUp ? 'followup-row' : ''}`}>
      <div
        className={`chat-avatar ${isAi ? 'ai-avatar' : 'patient-avatar'} ${isFollowUp ? 'followup-avatar' : ''}`}
        aria-hidden="true"
      >
        {isAi ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="avatar-icon-svg">
            <path d="M12 5v14M5 12h14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="avatar-icon-svg">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>

      <div className={`chat-bubble ${isAi ? 'ai-bubble' : 'patient-bubble'} ${isFollowUp ? 'followup-bubble' : ''}`}>
        <div className="chat-sender-name-group">
          <div className="chat-sender-left">
            <span className="chat-sender-name">{senderName}</span>
            {isFollowUp && (
              <span className="chat-followup-tag">
                {t?.interview?.followUpTag || 'Follow-up'}
              </span>
            )}
          </div>
          {isAi && displayText && (
            <ReadAloud
              text={displayText}
              language={activeLang}
              t={t}
              variant="compact"
              compact={true}
              autoRead={autoRead}
              isLatestAi={isLatestAi}
              controlledSpeaking={isLatestAi ? isSpeakingCurrent : undefined}
              onToggleAutoRead={onToggleAutoRead ? () => onToggleAutoRead(message.id, displayText) : undefined}
              className="chat-bubble-read-aloud"
            />
          )}
        </div>
        <div className="chat-text">{displayText}</div>
        {message.time && <div className="chat-timestamp">{message.time}</div>}
      </div>
    </div>
  )
}

