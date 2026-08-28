import React from 'react'

export default function HeaderControls({ language, onSelectLanguage, theme, onToggleTheme, t }) {
  const isDark = theme === 'dark'

  return (
    <div className="header-controls" role="toolbar" aria-label="Language and theme preferences">
      {/* Compact Language Selector */}
      <div className="compact-language-switch" role="group" aria-label="Language selector">
        <button
          type="button"
          className={`compact-lang-btn ${language === 'English' ? 'active' : ''}`}
          onClick={() => onSelectLanguage('English')}
          aria-pressed={language === 'English'}
          title="Switch to English"
        >
          EN
        </button>
        <button
          type="button"
          className={`compact-lang-btn ${language === 'Hindi' ? 'active' : ''}`}
          onClick={() => onSelectLanguage('Hindi')}
          aria-pressed={language === 'Hindi'}
          title="हिंदी में बदलें"
        >
          हिं
        </button>
      </div>

      {/* Theme Toggle Button */}
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={isDark ? t.common.switchToLight : t.common.switchToDark}
        title={isDark ? t.common.switchToLight : t.common.switchToDark}
      >
        <span className="theme-toggle-icon" aria-hidden="true">
          {isDark ? '☀️' : '🌙'}
        </span>
        <span className="theme-toggle-text">
          {isDark ? t.common.lightMode : t.common.darkMode}
        </span>
      </button>
    </div>
  )
}

