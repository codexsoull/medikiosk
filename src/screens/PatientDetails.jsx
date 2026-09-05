import React, { useState } from 'react'
import ProgressBar from '../components/ProgressBar'
import ReadAloud from '../components/ReadAloud'

export default function PatientDetails({
  patientData,
  onUpdatePatient,
  onContinue,
  onBack,
  language = 'English',
  t
}) {
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const handleChange = (field, value) => {
    onUpdatePatient({ ...patientData, [field]: value })
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, patientData[field])
  }

  const validateField = (field, value) => {
    let error = ''
    if (field === 'name') {
      if (!value || !value.trim()) {
        error = t.details.errors.nameRequired
      } else if (value.trim().length < 2) {
        error = t.details.errors.nameMinLength
      }
    }

    if (field === 'age') {
      if (!value && value !== 0) {
        error = t.details.errors.ageRequired
      } else {
        const num = Number(value)
        if (isNaN(num) || num <= 0 || num > 125) {
          error = t.details.errors.ageInvalid
        }
      }
    }

    if (field === 'gender') {
      if (!value) {
        error = t.details.errors.genderRequired
      }
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }))
    } else {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }

    return !error
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!patientData.name || !patientData.name.trim()) {
      newErrors.name = t.details.errors.nameRequired
    } else if (patientData.name.trim().length < 2) {
      newErrors.name = t.details.errors.nameMinLength
    }

    if (!patientData.age && patientData.age !== 0) {
      newErrors.age = t.details.errors.ageRequired
    } else {
      const num = Number(patientData.age)
      if (isNaN(num) || num <= 0 || num > 125) {
        newErrors.age = t.details.errors.ageInvalid
      }
    }

    if (!patientData.gender) {
      newErrors.gender = t.details.errors.genderRequired
    }

    setErrors(newErrors)
    setTouched({ name: true, age: true, gender: true })

    if (Object.keys(newErrors).length === 0) {
      onContinue()
    }
  }

  return (
    <div className="kiosk-container details-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label={t.details.backBtn}
        >
          {t.details.backBtn}
        </button>
      </div>

      <ProgressBar currentStep={3} totalSteps={6} t={t} />

      <div className="page-header">
        <h1 className="screen-title">{t.details.title}</h1>
        <p className="screen-subtitle">{t.details.subtitle}</p>
      </div>

      <form className="form details-form" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="patient-name">
            {t.details.fullName} <span className="required-star">*</span>
          </label>
          <input
            id="patient-name"
            type="text"
            className={`form-input ${errors.name && touched.name ? 'input-error' : ''}`}
            placeholder={t.details.namePlaceholder}
            value={patientData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            autoComplete="name"
          />
          {errors.name && touched.name && (
            <p className="field-error-message" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Age */}
        <div className="form-group">
          <label htmlFor="patient-age">
            {t.details.age} <span className="required-star">*</span>
          </label>
          <input
            id="patient-age"
            type="number"
            min="1"
            max="125"
            className={`form-input ${errors.age && touched.age ? 'input-error' : ''}`}
            placeholder={t.details.agePlaceholder}
            value={patientData.age || ''}
            onChange={(e) => handleChange('age', e.target.value)}
            onBlur={() => handleBlur('age')}
          />
          {errors.age && touched.age && (
            <p className="field-error-message" role="alert">
              {errors.age}
            </p>
          )}
        </div>

        {/* Gender Selection */}
        <div className="form-group">
          <label id="gender-label">
            {t.details.gender} <span className="required-star">*</span>
          </label>
          <div
            className="gender-buttons"
            role="radiogroup"
            aria-labelledby="gender-label"
          >
            {['Male', 'Female', 'Other'].map((option) => {
              const isSelected = patientData.gender === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`gender-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    handleChange('gender', option)
                    setTouched((prev) => ({ ...prev, gender: true }))
                  }}
                >
                  <span className="gender-check-icon">{isSelected ? '●' : '○'}</span>
                  <span>{t.details.genderOptions[option] || option}</span>
                </button>
              )
            })}
          </div>
          {errors.gender && touched.gender && (
            <p className="field-error-message" role="alert">
              {errors.gender}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons-row">
          <button
            type="button"
            className="secondary-button back-nav-btn"
            onClick={onBack}
          >
            {t.details.backBtn}
          </button>

          <button
            type="submit"
            className="primary-button continue-btn"
          >
            <span>{t.details.continueBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {/* Persistent Floating Read Aloud Button */}
      <ReadAloud
        text={`${t.details.title}. ${t.details.subtitle}`}
        language={language}
        t={t}
        floating={true}
        variant="floating"
      />
    </div>
  )
}
