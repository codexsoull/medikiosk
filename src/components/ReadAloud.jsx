import React from 'react'
import { useTextToSpeech } from '../hooks/useTextToSpeech'

/**
 * ReadAloud Component
 * Adds an accessible "Read Aloud" button for patient intake screens.
 * Uses native Web Speech API (speechSynthesis) with English (en-IN) and Hindi (hi-IN) support.
 */
export default function ReadAloud({
  text,
  language = 'English',
  t,
  className = '',
  variant = 'default',
  floating = false,
  compact = false,
  autoRead = false,
  isLatestAi = false,
  controlledSpeaking,
  onToggleAutoRead
}) {
  const { isSpeaking: hookSpeaking, isSupported, toggle: hookToggle } = useTextToSpeech({ text, language })

  // Gracefully hide if browser does not support SpeechSynthesis or if no text provided
  if (!isSupported || !text) {
    return null
  }

  const isFloating = floating || variant === 'floating'
  const isCompact = compact || variant === 'compact'
  const isSpeaking = typeof controlledSpeaking === 'boolean' ? controlledSpeaking : hookSpeaking

  const handleClick = (e) => {
    if (onToggleAutoRead) {
      onToggleAutoRead(e)
    } else {
      hookToggle()
    }
  }

  const readLabel =
    t?.common?.readAloud ||
    (language === 'Hindi' ? 'पढ़कर सुनाएं' : 'Read Aloud')

  const stopLabel =
    t?.common?.stopSpeaking ||
    (language === 'Hindi' ? 'रोकें' : 'Stop')

  const compactRead = t?.interview?.readBtn || (language === 'Hindi' ? 'पढ़ें' : 'Read')
  const compactStop = t?.interview?.stopSpeaking || stopLabel
  const autoReadOnBadge = t?.interview?.autoReadOnBadge || (language === 'Hindi' ? 'स्वतः पढ़ें ON' : 'Auto-Read ON')

  let displayLabel
  let ariaLabel

  if (isCompact) {
    if (isLatestAi && autoRead) {
      displayLabel = isSpeaking ? compactStop : autoReadOnBadge
      ariaLabel = isSpeaking
        ? (language === 'Hindi' ? 'रोकें और स्वतः पढ़ना बंद करें' : 'Stop reading and turn Auto-Read OFF')
        : (language === 'Hindi' ? 'स्वतः पढ़ना चालू है। बंद करने के लिए टैप करें।' : 'Auto-Read is ON. Tap to turn OFF.')
    } else {
      displayLabel = isSpeaking ? compactStop : compactRead
      ariaLabel = isSpeaking
        ? (language === 'Hindi' ? 'रोकें' : 'Stop reading')
        : (language === 'Hindi' ? 'पढ़कर सुनाएं और स्वतः पढ़ना चालू करें' : 'Read aloud and turn Auto-Read ON')
    }
  } else {
    displayLabel = isSpeaking ? stopLabel : readLabel
    ariaLabel = isSpeaking
      ? (language === 'Hindi' ? stopLabel : 'Stop reading')
      : (language === 'Hindi' ? readLabel : 'Read aloud')
  }

  const isAutoReadActive = isCompact && isLatestAi && autoRead

  const buttonElement = (
    <button
      type="button"
      className={`read-aloud-btn touch-target ${isFloating ? 'read-aloud-floating' : ''} ${isCompact ? 'read-aloud-compact' : ''} ${isAutoReadActive ? 'auto-read-active' : ''} ${isSpeaking ? 'is-speaking' : ''} ${className}`}
      onClick={handleClick}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="read-aloud-icon" aria-hidden="true">
        {isSpeaking ? '⏹' : '🔊'}
      </span>
      <span className="read-aloud-label">{displayLabel}</span>
      {isSpeaking && (
        <span className="read-aloud-wave" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      )}
    </button>
  )

  if (isFloating) {
    return (
      <aside className="read-aloud-floating-wrap" aria-label="Audio Assistance">
        {buttonElement}
      </aside>
    )
  }

  return buttonElement
}


