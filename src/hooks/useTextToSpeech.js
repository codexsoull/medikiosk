import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for browser Web Speech API (speechSynthesis)
 * Supports English (en-IN) and Hindi (hi-IN)
 * Manages start, stop, overlap prevention, and unmount cancellation
 */
export function useTextToSpeech({ text, language = 'English' }) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  const utteranceRef = useRef(null)

  // Cancel any active speech
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [isSupported])

  // Speak the given text
  const speak = useCallback(() => {
    if (!isSupported || !text || !text.trim()) return

    // Cancel any existing speech to prevent overlapping utterances
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = language === 'Hindi' ? 'hi-IN' : 'en-IN'
    utterance.rate = 0.95 // Natural, clear pacing for clinical intake

    // Best-effort voice matching if available in browser
    if (window.speechSynthesis.getVoices) {
      const voices = window.speechSynthesis.getVoices()
      const targetLang = language === 'Hindi' ? 'hi' : 'en-IN'
      const matched = voices.find(
        (v) => v.lang && (v.lang === targetLang || v.lang.startsWith(targetLang))
      )
      if (matched) {
        utterance.voice = matched
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = (e) => {
      // If cancelled intentionally via window.speechSynthesis.cancel(), ignore 'interrupted' / 'canceled'
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.warn('SpeechSynthesis error:', e.error)
      }
      setIsSpeaking(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [isSupported, text, language])

  // Toggle between speaking and stopping
  const toggle = useCallback(() => {
    if (isSpeaking) {
      stop()
    } else {
      speak()
    }
  }, [isSpeaking, stop, speak])

  // Clean up and stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel()
      }
    }
  }, [isSupported])

  // If text or language changes while speaking, cancel current utterance
  useEffect(() => {
    if (isSupported) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [text, language, isSupported])

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    toggle
  }
}

