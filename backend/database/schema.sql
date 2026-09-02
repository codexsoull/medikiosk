-- MediKiosk SQLite Schema: Patient Cases Table

CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  mobile TEXT,
  identity_verification_status TEXT DEFAULT 'not_authenticated',
  consent_status TEXT DEFAULT 'given',
  consent_timestamp TEXT,
  chief_complaint TEXT,
  symptoms TEXT,
  medical_history TEXT,
  medications TEXT,
  allergies TEXT,
  ai_summary TEXT,
  clinical_alerts TEXT,
  doctor_notes TEXT,
  case_status TEXT DEFAULT 'ready_for_doctor',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);

