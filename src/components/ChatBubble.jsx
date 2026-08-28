import React from 'react'

export default function ChatBubble({ message, t }) {
  const isAi = message.sender === 'ai'

  // If message has dynamic question or greeting key, render in active language
  let displayText = message.text
  if (isAi && t?.interview) {
    if (message.type === 'greeting') {
      displayText = `${t.interview.initialGreeting(message.patientName)} ${t.interview.questions[0]}`
    } else if (typeof message.questionIndex === 'number' && t.interview.questions[message.questionIndex]) {
      displayText = t.interview.questions[message.questionIndex]
    } else if (message.type === 'completion') {
      displayText = `${t.interview.interviewCompleteTitle}. ${t.interview.interviewCompleteSubtitle}`
    }
  }

  const senderName = isAi
    ? (t?.interview?.assistantName || 'MediKiosk AI')
    : (t?.interview?.patientName || 'You (Patient)')

  return (
    <div className={`chat-message-row ${isAi ? 'ai-row' : 'patient-row'}`}>
      <div className={`chat-avatar ${isAi ? 'ai-avatar' : 'patient-avatar'}`} aria-hidden="true">
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

      <div className={`chat-bubble ${isAi ? 'ai-bubble' : 'patient-bubble'}`}>
        <div className="chat-sender-name">{senderName}</div>
        <div className="chat-text">{displayText}</div>
        {message.time && <div className="chat-timestamp">{message.time}</div>}
      </div>
    </div>
  )
}
