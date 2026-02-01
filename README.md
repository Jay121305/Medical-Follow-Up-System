<p align="center">
  <img src="https://img.shields.io/badge/NEST-2O-00d4aa?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==" alt="NEST 2O">
</p>

<h1 align="center">🏥 NEST 2O</h1>
<h3 align="center">Next-Generation Medical Follow-Up & Pharmacovigilance System</h3>

<p align="center">
  <strong>Doctor-Initiated • Patient-Verified • AI-Assisted • Ethically Designed</strong>
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
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-security">Security</a>
</p>

---

## 📖 About

**NEST 2O** (Next-generation Effective System for Treatment & Outcome Observation) is a comprehensive medical follow-up platform designed to bridge the communication gap between healthcare providers and patients while ensuring regulatory-grade data collection for pharmacovigilance.

> 💡 **Core Philosophy**: *The doctor initiates, AI assists, the patient verifies, and only consent-gated verified data reaches the doctor. AI reduces effort, never decides truth.*

### 👥 Team DDOS_ME

| Member | Role |
|--------|------|
| **Jay Gautam** | Developer |
| **Karnajeet Gosavi** | Developer |
| **Archit Bagad** | Developer |
| **Manas Bagul** | Developer |
| **Prof. Kalyani Ghuge** | Mentor Faculty |

---

## ✨ Features

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

The heart of NEST 2O - a **9-step verified workflow** that ensures data integrity:

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
│      │                            │                            │        │
│      │                            │ 2. Generate OTP            │        │
│      │                            │ ──────────────────────────>│        │
│      │                            │    (WhatsApp/SMS)          │        │
│      │                            │                            │        │
│      │                            │ 3. Patient Verifies OTP    │        │
│      │                            │ <──────────────────────────│        │
│      │                            │                            │        │
│      │                            │ 4. Show Smart Questionnaire│        │
│      │                            │ ──────────────────────────>│        │
│      │                            │                            │        │
│      │                            │ 5. Patient Answers         │        │
│      │                            │ <──────────────────────────│        │
│      │                            │                            │        │
│      │                            │ 6. AI Generates Draft      │        │
│      │                            │ ──────────────────────────>│        │
│      │                            │                            │        │
│      │                            │ 7. Patient Reviews & Edits │        │
│      │                            │ <──────────────────────────│        │
│      │                            │                            │        │
│      │                            │ 8. Explicit Consent ✓      │        │
│      │                            │ <──────────────────────────│        │
│      │                            │                            │        │
│      │ 9. View Summary            │                            │        │
│      │ <──────────────────────────│                            │        │
│      │    (Consent-Gated)         │                            │        │
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

#### Question Flow Diagram

```
Q1: How are you feeling after taking the medicine?
    │
    ├── ✅ Fully recovered ──────┐
    ├── 📈 Getting better ──────┼──> 🟢 HAPPY PATH (6 questions)
    │                           │    Q3: Improvement percentage?
    │                           │    Q4: When did you notice improvement?
    │                           │    Q5: Other medications taken?
    │                           │    Q6: Need further assistance?
    │
    ├── ➡️ No change ───────────┼──> 🟡 QUICK PATH (4 questions)
    │                           │    Q3: Symptoms still present?
    │                           │    Q4: Need follow-up appointment?
    │
    └── ⚠️ Had problems ────────┼──> 🔴 SAFETY PATH (11 questions)
                                │    Q3: What kind of problem?
                                │    Q4: When did it start?
                                │    Q5: What symptoms? (multi-select)
                                │    Q6: How severe?
                                │    Q7: Medical attention needed?
                                │    Q8: Action taken with medicine?
                                │    Q9: Outcome after action?
                                │    Q10: Other medications?
                                │    Q11: Need further assistance?
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

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Firebase Project** with Firestore enabled
- **API Keys**: Groq, Google Cloud Vision, Twilio

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Jay121305/Medical-Follow-Up-System.git
cd NEST-2O

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Backend Configuration

Create `backend/.env`:

```env
# Server
PORT=5000

# Firebase
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# AI Service
GROQ_API_KEY=your_groq_api_key

# Twilio (WhatsApp/SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Generate service account key
4. Save as `backend/google-credentials.json`

### Running the Application

```bash
# Terminal 1: Start Backend
cd backend
npm start
# Server runs on http://localhost:5000

# Terminal 2: Start Frontend
cd frontend
npm start
# App opens at http://localhost:3000
```

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
| `POST` | `/api/prescriptions/ocr` | Extract text from image |

### Follow-Ups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/follow-ups` | Initiate follow-up |
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

### Data Protection Layers

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
│   ├── 6-digit secure random OTP                                 │
│   ├── 10-minute expiration                                      │
│   ├── WhatsApp/SMS delivery                                     │
│   └── Rate limiting (3 attempts)                                │
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
| **OTP Enforcement** | 6-digit, 10min expiry | Identity verification |
| **Consent Gating** | Explicit checkbox | Data sharing control |
| **Password Security** | bcrypt (12 rounds) | Credential protection |
| **Token Auth** | JWT with expiry | Stateless authentication |
| **Rate Limiting** | Express rate-limit | DoS prevention |
| **Input Validation** | Server-side sanitization | Injection prevention |
| **Audit Trail** | Firestore timestamps | Compliance & forensics |

---

## 📁 Project Structure

```
NEST 2O/
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 config/
│   │   │   ├── firebase.js         # Firebase Admin SDK setup
│   │   │   └── groq.js             # Groq AI configuration
│   │   ├── 📂 routes/
│   │   │   ├── authRoutes.js       # Authentication endpoints
│   │   │   ├── prescriptionRoutes.js
│   │   │   ├── followUpRoutes.js   # Follow-up workflow
│   │   │   └── adverseEventRoutes.js # Pharmacovigilance
│   │   ├── 📂 services/
│   │   │   ├── aiService.js        # AI draft generation
│   │   │   ├── ocrService.js       # Google Vision OCR
│   │   │   ├── otpService.js       # OTP generation/verification
│   │   │   ├── whatsappService.js  # Twilio WhatsApp
│   │   │   └── emailService.js     # Email notifications
│   │   └── server.js               # Express app entry
│   ├── google-credentials.json     # Firebase service account
│   ├── .env                        # Environment variables
│   └── package.json
│
├── 📂 frontend/
│   ├── 📂 public/
│   │   └── index.html
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Header.js           # Navigation header
│   │   │   ├── Loading.js          # Loading spinner
│   │   │   ├── Disclaimer.js       # Medical disclaimer
│   │   │   └── OTPInput.js         # OTP input component
│   │   ├── 📂 pages/
│   │   │   ├── HomePage.js         # Landing page
│   │   │   ├── Login.js            # Authentication
│   │   │   ├── DoctorDashboard.js  # Doctor portal
│   │   │   ├── StaffDashboard.js   # Staff portal
│   │   │   ├── NewPrescription.js  # Create prescription
│   │   │   ├── PatientVerify.js    # OTP verification
│   │   │   ├── PatientFollowUp.js  # Smart questionnaire
│   │   │   ├── FollowUpSummary.js  # View summary
│   │   │   ├── AdverseEventReport.js # Report adverse event
│   │   │   └── AdverseEventsList.js  # View reports
│   │   ├── 📂 services/
│   │   │   ├── api.js              # API client
│   │   │   └── email.js            # Email utilities
│   │   ├── App.js                  # Main app component
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Global styles
│   └── package.json
│
├── SECURITY.md                     # Security documentation
└── README.md                       # This file
```

---

## 📊 Data Models

### Follow-Up Response Structure

```javascript
{
  prescriptionId: "abc123",
  patientPhone: "+91XXXXXXXXXX",
  status: "completed",
  otpVerified: true,
  consentGiven: true,
  responses: {
    overallStatus: "improving",
    medicationCompleted: true,
    improvementPercentage: 75,
    improvementTimeline: "3-5 days",
    additionalMedications: ["Vitamin C"],
    needsAssistance: false
  },
  aiDraft: "Patient reports 75% improvement...",
  summary: "...",
  timestamps: {
    initiated: "2026-02-01T10:00:00Z",
    otpVerified: "2026-02-01T10:05:00Z",
    submitted: "2026-02-01T10:15:00Z"
  }
}
```

### Adverse Event Structure

```javascript
{
  patientPhone: "+91XXXXXXXXXX",
  medicationName: "Drug XYZ",
  adverseEvent: {
    description: "Severe headache",
    onsetTime: "2 hours after dose",
    severity: "moderate",
    seriousness: ["required_medical_attention"],
    symptoms: ["headache", "nausea"],
    actionTaken: "stopped_medication",
    outcome: "recovering"
  },
  concomitantMedications: ["Aspirin"],
  reportedAt: "2026-02-01T10:00:00Z"
}
```

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
> - ❌ Drug interaction warnings
>
> **Always consult qualified healthcare providers for medical decisions.**
>
> All AI-generated content must be reviewed and approved by medical professionals before any clinical use.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

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
