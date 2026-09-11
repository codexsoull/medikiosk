import React, { useRef } from 'react'
import ProgressBar from '../components/ProgressBar'
import ReadAloud from '../components/ReadAloud'
import { processDocumentAPI } from '../api/documents'

// SVG upload icon
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40" aria-hidden="true">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
  </svg>
)

// SVG document icon (replaces emoji)
const DocIcon = ({ type }) => {
  if (type === 'Image / Scan') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    )
  }
  if (type === 'PDF Report') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// SVG document header icon
const DocumentHeaderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
)

export default function DocumentUpload({
  uploadedDocuments,
  onUpdateDocuments,
  onContinue,
  onSkip,
  onBack,
  language = 'English',
  t
}) {
  const fileInputRef = useRef(null)

  const readFileAsBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  const handleFilesAdded = (files) => {
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    const newDocs = fileList.map((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      let fileTypeLabel = 'Document'

      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        fileTypeLabel = 'Image / Scan'
      } else if (ext === 'pdf') {
        fileTypeLabel = 'PDF Report'
      }

      return {
        id: `doc-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        rawSize: file.size,
        mimeType: file.type,
        type: fileTypeLabel,
        uploadDate: new Date().toLocaleDateString(),
        ocrStatus: 'Extracting text...',
        extractionStatus: 'extracting',
        extractedText: '',
        characterCount: 0,
        extractionMethod: 'none'
      }
    })

    // Immediately add files to UI with extracting state
    onUpdateDocuments((prevDocs) => [...(Array.isArray(prevDocs) ? prevDocs : uploadedDocuments), ...newDocs])

    // Asynchronously read and extract text for each document
    fileList.forEach((file, idx) => {
      const targetDoc = newDocs[idx]
      readFileAsBase64(file).then((base64Content) => {
        if (!base64Content) {
          onUpdateDocuments((prevDocs) =>
            prevDocs.map((d) =>
              d.id === targetDoc.id
                ? {
                    ...d,
                    extractionStatus: 'failed',
                    ocrStatus: 'Could not extract text'
                  }
                : d
            )
          )
          return
        }

        processDocumentAPI({
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          content: base64Content
        })
          .then((res) => {
            const data = res?.data || {}
            onUpdateDocuments((prevDocs) =>
              prevDocs.map((d) =>
                d.id === targetDoc.id
                  ? {
                      ...d,
                      extractionStatus: data.extractionStatus || 'completed',
                      extractedText: data.extractedText || '',
                      characterCount: data.characterCount || 0,
                      extractionMethod: data.extractionMethod || 'none',
                      ocrStatus: 'Text extracted'
                    }
                  : d
              )
            )
          })
          .catch(() => {
            onUpdateDocuments((prevDocs) =>
              prevDocs.map((d) =>
                d.id === targetDoc.id
                  ? {
                      ...d,
                      extractionStatus: 'failed',
                      ocrStatus: 'Could not extract text'
                    }
                  : d
              )
            )
          })
      })
    })
  }

  const handleFileInputChange = (e) => {
    handleFilesAdded(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveDoc = (idToRemove) => {
    onUpdateDocuments((prevDocs) =>
      (Array.isArray(prevDocs) ? prevDocs : uploadedDocuments).filter((doc) => doc.id !== idToRemove)
    )
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleAddSample = (sampleName, sampleSize, sampleType) => {
    const isPdf = sampleType.includes('PDF')
    const sampleText = isPdf
      ? 'COMPLETE BLOOD COUNT (CBC)\nHb: 13.2 g/dL\nWBC: 6,800 /mcL\nPlatelets: 2.4 Lakh\nRBC: 4.6 million/mcL'
      : 'OPD PRESCRIPTION\nPatient Name: Test Patient\nChief Complaint: Headache since yesterday.\nMedication: Paracetamol 500mg\nBlood Pressure: 120/80 mmHg'

    const newDoc = {
      id: `doc-sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: sampleName,
      size: sampleSize,
      type: sampleType,
      uploadDate: new Date().toLocaleDateString(),
      ocrStatus: 'Text extracted',
      extractionStatus: 'completed',
      extractedText: sampleText,
      characterCount: sampleText.length,
      extractionMethod: isPdf ? 'pdf-text' : 'ocr'
    }
    onUpdateDocuments((prevDocs) => [...(Array.isArray(prevDocs) ? prevDocs : uploadedDocuments), newDoc])
  }

  return (
    <div className="kiosk-container upload-card" role="main">
      <div className="card-top-nav">
        <button
          type="button"
          className="back-button touch-target"
          onClick={onBack}
          aria-label={t.common.back}
        >
          {t.common.back}
        </button>
      </div>

      <ProgressBar currentStep={5} totalSteps={6} t={t} />

      <div className="page-header upload-page-header">
        <div className="screen-title-group">
          <div className="screen-title-icon-badge" aria-hidden="true">
            <DocumentHeaderIcon />
          </div>
          <div className="screen-title-text-wrap">
            <h1 className="screen-title">{t.upload.title}</h1>
            <p className="screen-subtitle">{t.upload.subtitle}</p>
          </div>
          <div className="header-audio-action">
            <ReadAloud
              text={`${t.upload.title}. ${t.upload.subtitle}. ${t.upload.dropzoneHeading}`}
              language={language}
              t={t}
              variant="compact"
            />
          </div>
        </div>
      </div>

      {/* Touch-Friendly Dropzone */}
      <div
        className="upload-dropzone touch-target"
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label={t.upload.dropzoneHeading}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,image/jpeg,image/png,image/jpg,image/webp,.webp"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <div className="dropzone-icon" aria-hidden="true">
          <UploadIcon />
        </div>
        <strong className="dropzone-heading">{t.upload.dropzoneHeading}</strong>
        <p className="dropzone-hint">{t.upload.dropzoneHint}</p>
        <button
          type="button"
          className="browse-files-btn touch-target"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          {t.upload.selectDocsBtn}
        </button>
      </div>

      {/* Demo Samples for testing */}
      <div className="sample-records-helper">
        <span className="sample-label">{t.upload.sampleLabel}</span>
        <div className="sample-chips-row">
          <button
            type="button"
            className="sample-chip touch-target"
            onClick={() => handleAddSample('CBC_Blood_Test_Report.pdf', '245.8 KB', 'PDF Report')}
          >
            + CBC_Blood_Test_Report.pdf
          </button>
          <button
            type="button"
            className="sample-chip touch-target"
            onClick={() => handleAddSample('Prior_Prescription_OPD.jpg', '412.3 KB', 'Image / Scan')}
          >
            + Prior_Prescription_OPD.jpg
          </button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="uploaded-section">
        <div className="uploaded-section-header">
          <h2 className="section-title">
            {t.upload.attachedRecords} ({uploadedDocuments.length})
          </h2>
          {uploadedDocuments.length > 0 && (
            <button
              type="button"
              className="clear-all-btn"
              onClick={() => onUpdateDocuments([])}
            >
              {t.upload.clearAll}
            </button>
          )}
        </div>

        {uploadedDocuments.length === 0 ? (
          <div className="empty-docs-box">
            <p className="empty-docs-text">{t.upload.noDocsText}</p>
          </div>
        ) : (
          <ul className="docs-list" aria-label={t.upload.attachedRecords}>
            {uploadedDocuments.map((doc) => (
              <li key={doc.id} className="doc-list-item">
                <div className="doc-item-icon" aria-hidden="true">
                  <DocIcon type={doc.type} />
                </div>
                <div className="doc-item-details">
                  <strong className="doc-item-name">{doc.name}</strong>
                  <div className="doc-item-meta">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.type}</span>
                  </div>
                  <div className={`doc-ocr-notice ${doc.extractionStatus || 'pending'}`}>
                    <span className={`ocr-dot ${doc.extractionStatus || 'pending'}`}></span>
                    <span>
                      {doc.extractionStatus === 'completed'
                        ? (language === 'Hindi'
                            ? `✓ पाठ निकाला गया (${doc.characterCount || doc.extractedText?.length || 0} अक्षर)`
                            : `✓ Text extracted (${doc.characterCount || doc.extractedText?.length || 0} chars)`)
                        : doc.extractionStatus === 'extracting'
                        ? (language === 'Hindi'
                            ? 'पाठ निकाला जा रहा है...'
                            : 'Extracting text...')
                        : doc.extractionStatus === 'failed'
                        ? (language === 'Hindi'
                            ? '⚠ पाठ नहीं निकाला जा सका'
                            : '⚠ Could not extract text')
                        : (language === 'Hindi'
                            ? 'पाठ निष्कर्षण लंबित'
                            : 'Pending text extraction')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-doc-btn touch-target"
                  onClick={() => handleRemoveDoc(doc.id)}
                  title={`${t.upload.removeBtn} ${doc.name}`}
                  aria-label={`${t.upload.removeBtn} ${doc.name}`}
                >
                  {t.upload.removeBtn}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Footer */}
      <div className="action-buttons-row upload-actions">
        <button
          type="button"
          className="secondary-button back-nav-btn touch-target"
          onClick={onBack}
        >
          {t.common.back}
        </button>

        {uploadedDocuments.length > 0 ? (
          <div className="right-action-group">
            <button
              type="button"
              className="secondary-button skip-step-btn touch-target"
              onClick={onSkip}
            >
              {t.upload.skipRecordsBtn}
            </button>
            <button
              type="button"
              className="primary-button continue-btn touch-target"
              onClick={onContinue}
            >
              <span>{t.upload.continueBtn}</span>
              <span className="arrow-icon" aria-hidden="true">→</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="primary-button continue-btn touch-target"
            onClick={onSkip}
          >
            <span>{t.upload.skipAndContinueBtn}</span>
            <span className="arrow-icon" aria-hidden="true">→</span>
          </button>
        )}
      </div>

      {/* Persistent Floating Read Aloud Button */}
      <ReadAloud
        text={`${t.upload.title}. ${t.upload.subtitle}. ${t.upload.dropzoneHeading}`}
        language={language}
        t={t}
        floating={true}
        variant="floating"
      />
    </div>
  )
}
