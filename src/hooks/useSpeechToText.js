import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for browser Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * Supports English (en-IN) and Hindi (hi-IN)
 * Manages start, stop, mutual exclusion with TTS, and clean lifecycle teardown
 */
export function useSpeechToText({ language = 'English', onTranscriptChange, onError } = {}) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  const recognitionRef = useRef(null)
  const languageRef = useRef(language)
  languageRef.current = language

  const onTranscriptChangeRef = useRef(onTranscriptChange)
  onTranscriptChangeRef.current = onTranscriptChange

  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const getLocale = (lang) => {
    if (!lang) return 'en-IN'
    const l = String(lang).toLowerCase()
    if (l === 'hi' || l === 'hindi' || l.startsWith('hi')) return 'hi-IN'
    return 'en-IN'
  }

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (err) {
        // Recognition may already be stopped
      }
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errCode = 'not-supported'
      setError(errCode)
      onErrorRef.current?.(errCode)
      return
    }

    // Mutual Exclusion: Stop any active Text-to-Speech immediately
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      window.dispatchEvent(new CustomEvent('medikiosk-stt-start'))
    }

    // Stop and abort any existing recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (err) {
        // Ignore abort errors
      }
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = getLocale(languageRef.current)
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event) => {
      let finalStr = ''
      let interimStr = ''

      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i]
        const text = res[0]?.transcript || ''
        if (res.isFinal) {
          finalStr += text
        } else {
          interimStr += text
        }
      }

      setTranscript(finalStr)
      setInterimTranscript(interimStr)

      const fullCurrentText = (finalStr + (interimStr ? ' ' + interimStr : '')).trim()
      if (onTranscriptChangeRef.current) {
        onTranscriptChangeRef.current({
          finalTranscript: finalStr,
          interimTranscript: interimStr,
          fullTranscript: fullCurrentText
        })
      }
    }

    recognition.onerror = (event) => {
      const err = event.error
      // Ignore user-initiated abort
      if (err === 'aborted') {
        setIsListening(false)
        return
      }

      let errCode = 'unknown'
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        errCode = 'permission-denied'
      } else if (err === 'no-speech') {
        errCode = 'no-speech'
      } else if (err === 'network') {
        errCode = 'network'
      }

      setError(errCode)
      setIsListening(false)
      onErrorRef.current?.(errCode)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (err) {
      console.warn('SpeechRecognition start error:', err)
      setError('start-failed')
      setIsListening(false)
      onErrorRef.current?.('start-failed')
    }
  }, [isSupported])

  // Mutual exclusion: If any TTS starts, halt microphone listening immediately
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleTtsStart = () => {
      stopListening()
    }

    window.addEventListener('medikiosk-tts-start', handleTtsStart)
    return () => {
      window.removeEventListener('medikiosk-tts-start', handleTtsStart)
    }
  }, [stopListening])

  // Clean up and abort on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (err) {
          // Ignore
        }
      }
    }
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error
  }
}

