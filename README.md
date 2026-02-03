<img width="775" height="892" alt="image" src="https://github.com/user-attachments/assets/4f17b942-45d9-4686-8628-39539df079db" />
<p align="center">
  <img src="https://img.shields.io/badge/NEST-2O-00d4aa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==" alt="NEST 2O">
</p>

<h1 align="center">🏥 NEST 2O</h1>
<h3 align="center">Next-Generation Medical Follow-Up & Pharmacovigilance System</h3>

<p align="center">
  <strong>Doctor-Initiated • Patient-Verified • AI-Assisted • Consent-Gated</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/AI-Groq%20LLaMA%203.3-8B5CF6?style=flat-square&logo=openai" alt="Groq">
  <img src="https://img.shields.io/badge/OCR-Google%20Vision-4285F4?style=flat-square&logo=google-cloud" alt="Google Vision">
  <img src="https://img.shields.io/badge/WhatsApp-Twilio-25D366?style=flat-square&logo=whatsapp" alt="Twilio">
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-security">Security</a>
</p>

---

## 📖 About

**NEST 2O** (Next-generation Effective System for Treatment & Outcome Observation) is a medical follow-up platform that automates post-prescription patient communication while capturing regulatory-grade adverse event data for pharmacovigilance.

> 💡 **Core Philosophy**: *The doctor initiates, AI assists, the patient verifies, and only consent-gated verified data reaches the doctor. AI reduces effort, never decides truth.*

### 👥 Team DDOS_ME

| Member | Role |
|--------|------|
| **Jay Gautam** | Developer |
| **Karnajeet Gosavi** | Developer |
| **Archit Bagad** | Developer |
| **Manas Bagul** | Developer |
| **Prof. Kalyani Ghuge** | Mentor |

---

## ⚡ Quick Start

**Get NEST 2O running in 10 minutes:**

```bash
# 1. Clone the repository
git clone https://github.com/Jay121305/Medical-Follow-Up-System.git
cd Medical-Follow-Up-System

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment (see Configuration section below)

# 4. Start the application
# Terminal 1:
cd backend && npm start    # → http://localhost:5000

# Terminal 2:
cd frontend && npm start   # → http://localhost:3000
```

---

## ✨ Features

### 🎯 Core Workflow: Adverse Event Follow-Up

The heart of NEST 2O — converting incomplete adverse event reports into complete, regulatory-ready safety cases:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      ADVERSE EVENT WORKFLOW (8 Steps)                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1️⃣ ADVERSE EVENT OCCURS                                                  │
│     Patient takes medicine → experiences problem (dizziness, nausea)     │
│                              │                                            │
│                              ▼                                            │
│  2️⃣ ADVERSE EVENT REPORTED                                                │
│     Simple report: "I felt dizzy after taking the medicine"              │
│                              │                                            │
│                              ▼                                            │
│  3️⃣ SYSTEM CREATES SAFETY CASE                                           │
│     Links to OCR prescription → auto-fills patient/drug/prescriber data  │
│                              │                                            │
│                              ▼                                            │
│  4️⃣ SYSTEM IDENTIFIES MISSING DATA                                       │
│     Checks mandatory fields → finds gaps (severity, outcome, etc.)       │
│                              │                                            │
│                              ▼                                            │
│  5️⃣ FOLLOW-UP TRIGGERED AUTOMATICALLY                                    │
│     SMS/WhatsApp sent with OTP + verification link                       │
│                              │                                            │
│                              ▼                                            │
│  6️⃣ PATIENT ANSWERS 7 SMART QUESTIONS                                    │
│     Tap-based, conditional, 2-3 minutes max                              │
│                              │                                            │
│                              ▼                                            │
│  7️⃣ COMPLETE SAFETY CASE OBTAINED                                        │
│     All regulatory fields captured (ICH E2B compliant)                   │
│                              │                                            │
│                              ▼                                            │
│  8️⃣ REGULATORY-READY OUTPUT                                              │
│     Case ready for safety analysis, signal detection, submission         │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### 📋 The 7 Smart Follow-Up Questions

| # | Question | Regulatory Field |
|---|----------|------------------|
| Q1 | When did the reaction start? | Causality assessment |
| Q2 | What symptoms did you experience? | Seriousness indicators |
| Q3 | How severe was the reaction? | Severity classification |
| Q4 | Did you require medical attention? | Serious vs non-serious |
| Q5 | What action was taken with the medicine? | Dechallenge information |
| Q6 | What happened to the symptoms? | Outcome + causality |
| Q7 | Were any other medicines taken? | Confounder assessment |

---

### 🎯 Smart Prescription Management

<table>
<tr>
<td width="50%">

#### 📷 OCR-Powered Prescription Upload
- **Google Cloud Vision** extracts text from prescription images
- Automatic parsing of medication details
- Supports handwritten and printed prescriptions
- Reduces manual data entry by 90%

</td>
<td width="50%">

#### 🎤 Voice-to-Text Input
- **Web Speech API** integration for hands-free input
- Real-time speech recognition
- Perfect for busy doctors
- Works on all modern browsers

</td>
</tr>
</table>

---

### 🔄 Intelligent Follow-Up System

The **9-step verified workflow** ensures data integrity:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEST 2O FOLLOW-UP WORKFLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   👨‍⚕️ DOCTOR                    📱 SYSTEM                    👤 PATIENT   │
│   ────────                    ─────────                    ─────────    │
│      │                            │                            │        │
│      │ 1. Initiate Follow-up      │                            │        │
│      │ ──────────────────────────>│                            │        │
│      │                            │ 2. Generate OTP            │        │
│      │                            │ ──────────────────────────>│        │
│      │                            │    (WhatsApp/SMS)          │        │
│      │                            │ 3. Patient Verifies OTP    │        │
│      │                            │ <──────────────────────────│        │
│      │                            │ 4. Show Smart Questionnaire│        │
│      │                            │ ──────────────────────────>│        │
│      │                            │ 5. Patient Answers         │        │
│      │                            │ <──────────────────────────│        │
│      │                            │ 6. AI Generates Draft      │        │
│      │                            │ ──────────────────────────>│        │
│      │                            │ 7. Patient Reviews & Edits │        │
│      │                            │ <──────────────────────────│        │
│      │                            │ 8. Explicit Consent ✓      │        │
│      │                            │ <──────────────────────────│        │
│      │ 9. View Summary            │                            │        │
│      │ <──────────────────────────│    (Consent-Gated)         │        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 🧠 Adaptive Question Flow

The questionnaire intelligently adapts based on patient responses:

| Patient Status | Questions | Path | Purpose |
|----------------|-----------|------|---------|
| ✅ Fully Recovered | 6 | 🟢 Happy Path | Track recovery timeline & adherence |
| 📈 Getting Better | 6 | 🟢 Happy Path | Monitor improvement progress |
| ➡️ No Change | 4 | 🟡 Quick Path | Schedule follow-up consultation |
| ⚠️ Had Problems | 11 | 🔴 Safety Path | Full adverse event capture |

```
Q1: How are you feeling after taking the medicine?
    │
    ├── ✅ Fully recovered ──────┐
    ├── 📈 Getting better ──────┼──> 🟢 HAPPY PATH (6 questions)
    │                           │    → Improvement %, timeline, other meds
    │
    ├── ➡️ No change ───────────┼──> 🟡 QUICK PATH (4 questions)
    │                           │    → Symptoms present, need appointment?
    │
    └── ⚠️ Had problems ────────┼──> 🔴 SAFETY PATH (11 questions)
                                │    → Full adverse event capture
```

---

### 🤖 AI-Powered Features

<table>
<tr>
<td width="33%">

#### 📝 Smart Draft Generation
- **Groq LLaMA 3.3 70B** model
- Converts patient responses to medical summaries
- Maintains clinical accuracy
- Patient can edit before consent

</td>
<td width="33%">

#### 🔍 Intelligent Summarization
- Extracts key clinical insights
- Highlights urgent findings
- Structures data for easy review
- Supports medical terminology

</td>
<td width="33%">

#### 🛡️ Safety-First AI
- Mandatory safety constraints in all prompts
- Never makes medical decisions
- Only assists with documentation
- Human verification required

</td>
</tr>
</table>

---

### 🚨 Pharmacovigilance Module

**Industry-Grade Adverse Event Reporting** for regulatory compliance:

#### 📊 Data Captured for Safety Events

| Category | Data Points |
|----------|------------|
| **Temporal** | Time-to-onset, Duration, Frequency |
| **Clinical** | Symptoms, Severity, Seriousness |
| **Action** | Intervention, Dechallenge, Outcome |
| **Context** | Concomitant meds, Medical history |

#### 🏥 Regulatory Ready

- ✅ MedDRA-compatible symptom capture
- ✅ Seriousness criteria (hospitalization, disability)
- ✅ Causality assessment support
- ✅ Dechallenge/rechallenge tracking
- ✅ Complete audit trail

---

### 👥 Multi-Role Dashboard System

| 👨‍⚕️ Doctor Dashboard | 👤 Patient Portal | 👩‍💼 Staff Dashboard |
|---------------------|------------------|---------------------|
| View all prescriptions | OTP-secured access | Manage prescriptions |
| Initiate follow-ups | Smart questionnaire | View follow-up status |
| Review patient summaries | Review & edit drafts | Data management |
| Track adverse events | Explicit consent flow | Reporting tools |
| Voice input support | Privacy-first design | Administrative access |

---

## 🔧 Tech Stack

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React 18)                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│   │ Doctor   │  │ Patient  │  │  Staff   │  │ Adverse  │              │
│   │Dashboard │  │ Portal   │  │Dashboard │  │ Events   │              │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                         React Router v6                                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS/REST
┌────────────────────────────────┼────────────────────────────────────────┐
│                           BACKEND (Node.js)                              │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ Middleware: Helmet │ CORS │ JWT Auth │ Rate Limiter │ Logger    │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │   Auth   │  │Prescribe │  │Follow-Up │  │   Adverse Events     │  │
│   │  Routes  │  │  Routes  │  │  Routes  │  │       Routes         │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│   │    AI    │  │   OCR    │  │   OTP    │  │ WhatsApp │  │ Email  │ │
│   │ Service  │  │ Service  │  │ Service  │  │ Service  │  │Service │ │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│   │ Firebase │  │  Google  │  │   Groq   │  │  Twilio  │              │
│   │Firestore │  │  Vision  │  │   API    │  │   API    │              │
│   │(Database)│  │  (OCR)   │  │(LLaMA 3) │  │(WhatsApp)│              │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Details

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.2.0 | UI framework with hooks |
| | React Router | 6.21.1 | Client-side routing |
| | Web Speech API | Native | Voice-to-text input |
| **Backend** | Node.js | 18+ | JavaScript runtime |
| | Express | 4.18.2 | REST API framework |
| | Helmet | 7.1.0 | Security headers |
| | JWT | 9.0.3 | Authentication tokens |
| | bcrypt | 3.0.3 | Password hashing |
| **Database** | Firebase Firestore | 12.0.0 | NoSQL cloud database |
| **AI/ML** | Groq API | Latest | LLaMA 3.3 70B inference |
| | Google Cloud Vision | 4.3.2 | OCR text extraction |
| **Communication** | Twilio | 5.4.0 | WhatsApp & SMS OTP |
| | Nodemailer | 6.9.8 | Email notifications |

---

## 🚀 Installation

### Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18.x or higher | [nodejs.org](https://nodejs.org) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

### Step 1: Clone Repository

```bash
git clone https://github.com/Jay121305/Medical-Follow-Up-System.git
cd Medical-Follow-Up-System
```

### Step 2: Get API Credentials

You need credentials from 4 services:

| Service | Purpose | How to Get |
|---------|---------|------------|
| **Firebase** | Database | [Firebase Console](https://console.firebase.google.com) → Create project → Enable Firestore → Project Settings → Service Accounts → Generate new private key |
| **Google Cloud Vision** | OCR | [Google Cloud Console](https://console.cloud.google.com) → Enable Cloud Vision API → Create Service Account → Download JSON |
| **Groq API** | AI/LLM | [Groq Console](https://console.groq.com) → Sign up → API Keys → Create new key (starts with `gsk_`) |
| **Twilio** | WhatsApp | [Twilio.com](https://www.twilio.com) → Create account → Get Account SID + Auth Token → Set up WhatsApp Sandbox |

### Step 3: Configure Backend

1. **Create `.env` file in `backend/` folder:**

```env
# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this

# Groq AI (LLaMA 3.3 70B)
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# Twilio (WhatsApp + SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

2. **Add Google credentials file:**

```bash
# Rename your downloaded Firebase/Vision JSON to:
google-credentials.json

# Place it in the backend folder:
backend/google-credentials.json
```

> ⚠️ **Security Warning:** Never commit `.env` or `google-credentials.json` to Git!

### Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### Step 5: Start the Application

```bash
# Terminal 1: Backend (http://localhost:5000)
cd backend
npm start

# Terminal 2: Frontend (http://localhost:3000)
cd frontend
npm start
```

### Step 6: Test WhatsApp Integration

1. Go to [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Send the join code to **+1 415 523 8886** from your WhatsApp
3. Now your number can receive test messages

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & get JWT token |

### Prescriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/prescriptions` | Create new prescription |
| `GET` | `/api/prescriptions/doctor/:id` | Get doctor's prescriptions |
| `GET` | `/api/prescriptions/:id` | Get single prescription |
| `POST` | `/api/prescriptions/ocr` | Extract text from image (OCR) |

### Follow-Ups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/follow-ups` | Initiate follow-up (sends WhatsApp) |
| `POST` | `/api/follow-ups/:id/verify-otp` | Verify patient OTP |
| `GET` | `/api/follow-ups/:id/drafts` | Get AI-generated drafts |
| `POST` | `/api/follow-ups/:id/submit` | Submit with consent |
| `GET` | `/api/follow-ups/:id/summary` | Get summary (consent-gated) |

### Adverse Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/adverse-events` | Report new adverse event |
| `GET` | `/api/adverse-events/doctor/:id` | Get doctor's reports |
| `POST` | `/api/adverse-events/:id/verify-otp` | Verify reporter OTP |
| `POST` | `/api/adverse-events/:id/submit` | Submit adverse event |

---

## 🔐 Security

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   🔒 LAYER 1: Network Security                                   │
│   ├── HTTPS/TLS 1.2+ encryption                                 │
│   ├── Helmet.js security headers                                │
│   └── CORS policy enforcement                                    │
│                                                                  │
│   🔑 LAYER 2: Authentication                                     │
│   ├── JWT tokens (RS256)                                        │
│   ├── bcrypt password hashing (12 rounds)                       │
│   └── Session expiration (24h)                                   │
│                                                                  │
│   📱 LAYER 3: OTP Verification                                   │
│   ├── 4-digit secure random OTP                                 │
│   ├── 10-minute expiration                                      │
│   ├── WhatsApp/SMS delivery                                     │
│   └── Rate limiting (5 attempts max)                            │
│                                                                  │
│   ✅ LAYER 4: Consent Gates                                      │
│   ├── No data visible until OTP verified                        │
│   ├── No sharing until explicit consent                         │
│   └── Patient can edit before consent                           │
│                                                                  │
│   🤖 LAYER 5: AI Safety                                          │
│   ├── Backend-only AI calls                                     │
│   ├── Safety constraints in all prompts                         │
│   └── Never makes medical decisions                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Features

| Feature | Implementation | Purpose |
|---------|---------------|---------|
| **OTP Enforcement** | 4-digit, 10min expiry | Identity verification |
| **Consent Gating** | Explicit checkbox | Data sharing control |
| **Password Security** | bcrypt (12 rounds) | Credential protection |
| **Token Auth** | JWT with expiry | Stateless authentication |
| **Rate Limiting** | Express rate-limit | DoS prevention |
| **Input Validation** | Server-side sanitization | Injection prevention |
| **Audit Trail** | Firestore timestamps | Compliance & forensics |

### Security Layers

| Layer | Mechanism | Purpose |
|-------|-----------|---------|
| **Network** | HTTPS/TLS 1.2+, Helmet.js, CORS | Encrypt transit, security headers |
| **Authentication** | JWT tokens, bcrypt (12 rounds) | Stateless auth, secure passwords |
| **OTP Verification** | 4-digit, 10min expiry, 5 max attempts | Patient identity verification |
| **Consent Gate** | Explicit checkbox + timestamp | Patient controls data visibility |
| **AI Safety** | SAFETY_PREFIX on all prompts | Prevent medical advice generation |

### Consent-Gated Data Flow

```
Patient clicks follow-up link
        │
        ▼
┌─────────────────────────────┐
│   OTP VERIFICATION GATE     │ ← No data visible until verified
└─────────────────────────────┘
        │ [OTP Correct]
        ▼
Patient answers 7 questions
        │
        ▼
AI generates draft summary
        │
        ▼
┌─────────────────────────────┐
│   PATIENT EDIT & REVIEW     │ ← Patient can modify 100% of content
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│   EXPLICIT CONSENT CHECKBOX │ ← Must check to proceed
└─────────────────────────────┘
        │ [Consent Given]
        ▼
Data becomes visible to Doctor ← ONLY NOW can doctor see responses
```

---

## 📁 Project Structure

```
Medical-Follow-Up-System/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.js         # Firebase Admin SDK
│   │   │   └── groq.js             # Groq AI + SAFETY_PREFIX
│   │   ├── routes/
│   │   │   ├── authRoutes.js       # Authentication
│   │   │   ├── prescriptionRoutes.js
│   │   │   ├── followUpRoutes.js   # Follow-up workflow
│   │   │   └── adverseEventRoutes.js
│   │   ├── services/
│   │   │   ├── aiService.js        # LLaMA integration
│   │   │   ├── ocrService.js       # Cloud Vision OCR
│   │   │   ├── otpService.js       # OTP generation
│   │   │   └── whatsappService.js  # Twilio messaging
│   │   └── server.js               # Express entry point
│   ├── google-credentials.json     # Firebase/Vision key (gitignored)
│   ├── .env                        # Environment variables (gitignored)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   ├── pages/                  # Page components
│   │   ├── services/api.js         # API client
│   │   └── App.js                  # Router config
│   └── package.json
│
├── NEST_2O_Technical_Report.html   # Full technical documentation
├── SECURITY.md                     # Security documentation
└── README.md                       # This file
```

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Port 5000 already in use | Another process using port | Change PORT in `.env` or kill the process |
| CORS errors in browser | Frontend URL mismatch | Ensure `FRONTEND_URL` matches your frontend port |
| Firebase connection failed | Invalid credentials | Check `google-credentials.json` path and content |
| WhatsApp not received | Sandbox not joined | Send join code to Twilio sandbox first |
| OCR returns empty | Vision API not enabled | Enable Cloud Vision API in Google Console |
| AI returns error | Groq API key invalid | Verify `GROQ_API_KEY` starts with `gsk_` |

---

## ⚠️ Medical Disclaimer

> ⚕️ **IMPORTANT NOTICE**
>
> This system is designed for **data collection and communication** only.
>
> **NEST 2O does NOT provide:**
> - ❌ Medical advice
> - ❌ Diagnosis
> - ❌ Treatment recommendations
>
> **Always consult qualified healthcare providers for medical decisions.**

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Contact

**Team DDOS_ME** - NEST 2O Project

- **GitHub**: [Jay121305/Medical-Follow-Up-System](https://github.com/Jay121305/Medical-Follow-Up-System)

---

<p align="center">
  <strong>Built with ❤️ for better healthcare</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made%20in-India-FF9933?style=flat-square" alt="Made in India">
  <img src="https://img.shields.io/badge/For-Healthcare-00d4aa?style=flat-square" alt="For Healthcare">
  <img src="https://img.shields.io/badge/AI-Assisted-8B5CF6?style=flat-square" alt="AI Assisted">
</p>
