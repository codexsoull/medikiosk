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
  className = ''
}) {
  const { isSpeaking, isSupported, toggle } = useTextToSpeech({ text, language })

  // Gracefully hide if browser does not support SpeechSynthesis or if no text provided
  if (!isSupported || !text) {
    return null
  }

  const readLabel =
    t?.common?.readAloud ||
    (language === 'Hindi' ? 'पढ़कर सुनाएं' : 'Read Aloud')

  const stopLabel =
    t?.common?.stopSpeaking ||
    (language === 'Hindi' ? 'रोकें' : 'Stop')

  const currentLabel = isSpeaking ? stopLabel : readLabel

  return (
    <button
      type="button"
      className={`read-aloud-btn touch-target ${isSpeaking ? 'is-speaking' : ''} ${className}`}
      onClick={toggle}
      aria-label={currentLabel}
      title={currentLabel}
    >
      <span className="read-aloud-icon" aria-hidden="true">
        {isSpeaking ? '⏹' : '🔊'}
      </span>
      <span className="read-aloud-label">{currentLabel}</span>
      {isSpeaking && (
        <span className="read-aloud-wave" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      )}
    </button>
  )
}

