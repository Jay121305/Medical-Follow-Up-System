# NEST 2O - Medical Follow-Up System

A doctor-initiated, patient-verified, AI-assisted follow-up system built with ethical design principles.

## 🎯 Core Principle

> The doctor initiates the follow-up, the AI drafts it, the patient verifies it, and only verified data reaches the doctor. AI is used only to reduce effort, never to decide truth.

## 📋 System Flow

| Step | Actor | Action | Security Gate |
|------|-------|--------|---------------|
| 1 | Doctor | Writes prescription | - |
| 2 | System | Stores prescription metadata | - |
| 3 | Doctor | Sends follow-up request | OTP generated |
| 4 | Patient | Verifies OTP | **No data until verified** |
| 5 | AI | Generates editable drafts | Only after OTP |
| 6 | Patient | Edits & confirms responses | Patient is authority |
| 7 | Patient | Explicit consent click | **No sharing until consent** |
| 8 | AI | Generates doctor summary | Only verified data |
| 9 | Doctor | Views clean summary | Consent-gated |

## 🛠️ Tech Stack

- **Frontend**: React
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Email**: EmailJS
- **AI**: Groq API (LLaMA)

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## 🔐 Security Features

1. **OTP Enforcement**: No medical data visible until OTP verified
2. **Consent Gating**: Doctor cannot see data until patient explicitly consents
3. **AI Safety**: All AI prompts include mandatory safety constraints
4. **Backend Isolation**: AI calls only triggered from backend

## 📁 Project Structure

```
NEST 2O/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.js      # Firebase Admin SDK
│   │   │   └── groq.js          # Groq API + safety prefix
│   │   ├── routes/
│   │   │   ├── prescriptionRoutes.js
│   │   │   └── followUpRoutes.js
│   │   ├── services/
│   │   │   ├── otpService.js    # OTP generation/verification
│   │   │   └── aiService.js     # AI draft & summary generation
│   │   └── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions/doctor/:id` | Get doctor's prescriptions |
| POST | `/api/follow-ups` | Initiate follow-up |
| POST | `/api/follow-ups/:id/verify-otp` | Verify patient OTP |
| GET | `/api/follow-ups/:id/drafts` | Get AI drafts (OTP required) |
| POST | `/api/follow-ups/:id/submit` | Submit with consent |
| GET | `/api/follow-ups/:id/summary` | Get summary (consent required) |

## ⚠️ Medical Disclaimer

This system is for data collection only. It does NOT provide:
- Medical advice
- Diagnosis
- Treatment recommendations

Always consult healthcare providers for medical decisions.

## 📄 License

MIT License
