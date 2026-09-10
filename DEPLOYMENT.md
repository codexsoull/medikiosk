# MediKiosk Deployment Guide
# MediKiosk — Production Deployment Guide & Readiness Architecture

Placeholder
This document provides complete instructions for local development, production configuration, environment variables, hosting architecture, and security considerations for the MediKiosk MVP.

---

## A. Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Groq API Key**: Obtainable from [Groq Console](https://console.groq.com)

### 2. Dependency Installation
From the repository root:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration
Create the local environment files from their templates:
```bash
# Frontend
cp .env.example .env

# Backend
cd backend
cp .env.example .env
cd ..
```
Add your Groq API key to `backend/.env`:
```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### 4. Running the Application
Open two terminal windows:

**Terminal 1 — Backend Server:**
```bash
cd backend
npm start
# or: node server.js
```
The backend starts on `http://localhost:5000`.

**Terminal 2 — Frontend Client:**
```bash
npm run dev
```
The Vite development server runs on `http://localhost:5173`.

---

## B. Environment Variables Reference

### Backend Environment Variables (`backend/.env`)
> [!IMPORTANT]
> All backend environment variables are **strictly server-side** and must never be committed to Git or exposed to client bundles.

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | — | Private Groq API key for LLM interview & summary synthesis |
| `AI_PROVIDER` | No | `groq` | AI provider identifier |
| `AI_MODEL` | No | `openai/gpt-oss-120b` | LLM model deployed on Groq |
| `PORT` | No | `5000` | HTTP port on which the Express server listens |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`). When set to `production`, stack traces and internal errors are suppressed. |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin for CORS |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated list of allowed CORS origins |
| `DATABASE_PATH` | No | `medikiosk.db` | Path to the SQLite database file. Supports absolute mount paths (e.g. `/data/medikiosk.db`) |
| `MAX_DOCUMENT_SIZE_MB` | No | `10` | Maximum document upload size in MB (enforced in memory) |

### Frontend Environment Variables (`.env`)
> [!NOTE]
> Only variables prefixed with `VITE_` are exposed to the client bundle by Vite. Never place private keys or secrets here.

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No (in dev) / **Yes** (in prod) | `http://localhost:5000` | Fully qualified base URL of the deployed Express backend (e.g., `https://medikiosk-api.onrender.com`). Trailing slashes are safely normalized automatically. |

---

## C. Production Architecture

```
                               ┌────────────────────────────────────────┐
                               │             Client Browser             │
                               │  (React + Vite SPA on CDN / Static)   │
                               └──────────────────┬─────────────────────┘
                                                  │
                             HTTPS REST Requests  │  (VITE_API_BASE_URL)
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │           Backend Web Service          │
                               │     (Node.js / Express on Port 5000)   │
                               └───────┬────────────────────────┬───────┘
                                       │                        │
               In-Memory File Parsing  │                        │  Server-to-Server
          (pdf-parse / Tesseract.js)   │                        │  HTTPS with API Key
                                       ▼                        ▼
                       ┌─────────────────────────┐   ┌───────────────────────┐
                       │   SQLite Database File  │   │    Groq Cloud API     │
                       │    (Persistent Volume)  │   │ (openai/gpt-oss-120b) │
                       │    backend/medikiosk.db │   └───────────────────────┘
                       └─────────────────────────┘
```

1. **Frontend**: Static Single-Page Application (SPA) served by Vercel, Netlify, Cloudflare Pages, or Render Static Sites.
2. **Backend API**: Long-running Node.js process managing `/api/cases`, `/api/ai`, and `/api/documents`.
3. **Database**: Single-file embedded SQLite database using WAL (Write-Ahead Logging) mode and foreign keys enabled.
4. **AI Processing**: Private server-to-server calls to Groq API. The client never interacts with Groq directly.
5. **Document OCR Pipeline**: Uploaded PDF and image binaries are processed entirely in memory via Node.js Buffers; extracted text and normalized metadata are stored in SQLite. No raw binary files are retained on disk.

---

## D. Database & Persistence Considerations

### SQLite Characteristics & Limitations
- **Single-Node Simplicity**: SQLite is a serverless, single-file embedded database engine. It delivers sub-millisecond query performance and zero operational maintenance for MVPs and hackathon prototypes.
- **Concurrency**: Configured with WAL (`journal_mode = WAL`), which allows concurrent readers while a write occurs.
- **Ephemeral Filesystem Risk**:
  - On **Serverless** hosts (e.g., Vercel Functions, AWS Lambda), the local filesystem is read-only or ephemeral (`/tmp`), and separate function invocations run in isolated containers. SQLite files cannot persist across invocations.
  - On **Free-Tier PaaS without Persistent Volumes** (e.g., Render Free Tier web services), the filesystem resets whenever the dyno spins down or restarts.
- **Recommended Production Hosting for SQLite**:
  1. **Render Web Service with Persistent Disk**: Mount a persistent disk to `/data` and set `DATABASE_PATH=/data/medikiosk.db`.
  2. **Railway with Volume**: Attach a persistent volume mount to `/app/data` and set `DATABASE_PATH=/app/data/medikiosk.db`.
  3. **Fly.io with Volume**: Mount a volume and point SQLite to the mounted path.
  4. **Single VM / VPS** (AWS EC2, DigitalOcean, Linode): Persistent SSD filesystem works out-of-the-box.

---

## E. Health Check & Diagnostics

The backend provides a lightweight monitoring endpoint:
```http
GET /api/health
```

**Expected Response (HTTP 200):**
```json
{
  "status": "ok",
  "service": "MediKiosk Backend"
}
```

Use this URL (`/api/health`) for PaaS health probes, uptime monitors, and container readiness checks.

---

## F. Security & Clinical Safety Governance

1. **API Key Isolation**:
   - `GROQ_API_KEY` is loaded strictly on the backend.
   - Client code only communicates with `/api/ai/chat` and `/api/ai/summary`.
   - API error handlers strictly strip internal stack traces and configuration details before responding.
2. **Mock Identity & Aadhaar**:
   - The Aadhaar and OTP steps in MediKiosk are **simulated mock workflows** for hackathon demonstration. No real government identity systems (UIDAI) or real citizen credentials are connected or stored.
3. **In-Memory Document Processing**:
   - Medical document uploads (PDF, PNG, JPG, WEBP) are parsed in memory.
   - Raw binary files are **never written to disk**.
   - Only clinical metadata and extracted OCR text are persisted.
4. **Clinical Draft Disclaimers**:
   - All AI-generated clinical summaries are tagged `isAiDraft: true`.
   - Summaries are accompanied by a mandatory physician review disclaimer.
   - Conflicting information between patient interview answers and prior medical documents is preserved and flagged for doctor review.
5. **Doctor Review Isolation**:
   - The Doctor Case interface provides **view-only** access to medical documents.
   - Doctors cannot upload, modify, or delete patient document records.
