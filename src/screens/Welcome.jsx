import React from 'react'
import Logo from '../components/Logo'
import ReadAloud from '../components/ReadAloud'

export default function Welcome({ language, onSelectLanguage, onStart, t }) {
  const welcomeSpeech = language === 'Hindi'
    ? (t.welcome?.welcomeAudioHindi || 'मेडीकियोस्क में आपका स्वागत है। कृपया अपना स्वास्थ्य इनटेक शुरू करें।')
    : (t.welcome?.welcomeAudioEnglish || 'Welcome to MediKiosk. Please begin your health intake.')

  const handleChooseLanguage = (chosenLang) => {
    // 1. Update/persist chosen language
    if (onSelectLanguage) {
      onSelectLanguage(chosenLang)
    }

    // 2. Attempt brief welcome audio non-blockingly
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        window.speechSynthesis.cancel()
        const textToSpeak = chosenLang === 'Hindi'
          ? (t.welcome?.welcomeAudioHindi || 'मेडीकियोस्क में आपका स्वागत है। कृपया अपना स्वास्थ्य इनटेक शुरू करें।')
          : (t.welcome?.welcomeAudioEnglish || 'Welcome to MediKiosk. Please begin your health intake.')
        const utterance = new SpeechSynthesisUtterance(textToSpeak)
        utterance.lang = chosenLang === 'Hindi' ? 'hi-IN' : 'en-IN'
        utterance.rate = 0.95
        window.speechSynthesis.speak(utterance)
      }
    } catch (err) {
      console.warn('Welcome audio playback error:', err)
    }

    // 3. Advance directly to Consent
    if (onStart) {
      onStart()
    }
  }

  return (
    <div className="kiosk-container welcome-card" role="main">
      <div className="welcome-hero-content">
        <Logo size="large" />

        <div className="welcome-brand-header">
          <h1 className="brand-title">{t.welcome.brand}</h1>
          <p className="brand-tagline">{t.welcome.tagline}</p>
        </div>

        <div className="welcome-prompt-banner">
          <h2 className="welcome-instruction-title">
            {t.welcome.chooseLanguage || 'Choose your language'}
          </h2>
          <p className="welcome-instruction-sub">
            {t.welcome.chooseLanguageHindi || 'अपनी भाषा चुनें'}
          </p>
        </div>

        {/* Primary Language-First Touch Cards */}
        <div className="welcome-lang-grid" role="group" aria-label="Select language to begin">
          <button
            type="button"
            className={`welcome-lang-card-large touch-target ${language === 'English' ? 'active-lang' : ''}`}
            onClick={() => handleChooseLanguage('English')}
            aria-label="Start in English"
          >
            <span className="lang-card-script">ENGLISH</span>
            <span className="lang-card-subtext">{t.welcome.englishSubtext || 'Start in English'}</span>
            <span className="lang-card-arrow" aria-hidden="true">→</span>
          </button>

          <button
            type="button"
            className={`welcome-lang-card-large touch-target ${language === 'Hindi' ? 'active-lang' : ''}`}
            onClick={() => handleChooseLanguage('Hindi')}
            aria-label="हिंदी में शुरू करें"
          >
            <span className="lang-card-script">हिंदी</span>
            <span className="lang-card-subtext">{t.welcome.hindiSubtext || 'हिंदी में शुरू करें'}</span>
            <span className="lang-card-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        {/* Subtle Text-Only Trust Statement */}
        <div className="welcome-trust-statement">
          <span>{t.welcome.trustStatement || 'Secure • Private • Simple'}</span>
        </div>

        {/* Persistent Floating Read Aloud Button */}
        <ReadAloud
          text={welcomeSpeech}
          language={language}
          t={t}
          floating={true}
          variant="floating"
        />
      </div>
    </div>
  )
}
