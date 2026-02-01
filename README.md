# NEST 2O - Medical Follow-Up System

A doctor-initiated, patient-verified, AI-assisted follow-up system built with ethical design principles and optimized for maximum data density with minimal patient effort.

## 🎯 Core Principle

> The doctor initiates the follow-up, the AI drafts it, the patient verifies it, and only verified data reaches the doctor. AI is used only to reduce effort, never to decide truth.

## ✨ Key Features

### 🔄 Smart Branching Follow-Up Questionnaire
The system uses an intelligent question flow that adapts based on patient responses:

| Patient Status | Questions Asked | Purpose |
|----------------|-----------------|---------|
| **Fully Recovered / Improving** | 6 questions | Track recovery progress, medication adherence, improvement timeline |
| **Experienced Problems** | 11 questions | Full adverse event capture with regulatory-ready data |
| **No Change** | 4 questions | Quick path to schedule follow-up |

### 📊 High-Value Safety Data Extraction
Each question is designed to populate **multiple safety fields**, maximizing data quality while minimizing user effort:

- ✅ Time-to-onset & Temporal association
- ✅ Event description & Medical classification  
- ✅ Severity grading & Clinical impact
- ✅ Seriousness assessment & Hospitalization flags
- ✅ Action taken & Dechallenge status
- ✅ Outcome & Causality reinforcement
- ✅ Concomitant medications & Drug interactions

### 💬 Text Input Analysis
Every question includes an optional text box where patients can describe their experience in their own words. This narrative data is captured alongside structured responses for comprehensive case documentation.

## 📋 System Flow

| Step | Actor | Action | Security Gate |
|------|-------|--------|---------------|
| 1 | Doctor | Writes prescription | - |
| 2 | System | Stores prescription metadata | - |
| 3 | Doctor | Sends follow-up request | OTP generated |
| 4 | Patient | Verifies OTP | **No data until verified** |
| 5 | System | Shows smart questionnaire | Adapts to patient status |
| 6 | Patient | Answers questions progressively | One at a time, text input optional |
| 7 | Patient | Reviews & confirms responses | Patient is authority |
| 8 | Patient | Explicit consent click | **No sharing until consent** |
| 9 | Doctor | Views comprehensive summary | Consent-gated |

## 🎯 Follow-Up Question Flow

### Phase 1: Understand Patient Status (Everyone)
```
Q1: How are you feeling after taking the medicine?
    → Fully recovered ✅  → Happy Path (6 questions)
    → Getting better 📈   → Happy Path (6 questions)
    → No change ➡️       → Quick Path (4 questions)
    → Had problems ⚠️    → Safety Path (11 questions)

Q2: Did you complete the medication course?
```

### Phase 2A: Happy Path (Recovered/Improving)
```
Q3: How much have symptoms improved?
Q4: When did you notice improvement?
Q5: Other medications taken?
Q6: Need further assistance?
```

### Phase 2B: Safety Path (Experienced Problems)
```
Q3: What kind of problem?
Q4: When did it start?
Q5: What symptoms? (multi-select)
Q6: How severe?
Q7: Medical attention needed?
Q8: Action taken with medicine?
Q9: Outcome after action?
Q10: Other medications?
Q11: Need further assistance?
```

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Email**: EmailJS
- **AI**: Groq API (LLaMA 3.3 70B)

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project with Firestore
- Groq API key

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
GROQ_API_KEY=your_groq_api_key
```

Start the server:
```bash
npm start
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
5. **Urgent Case Detection**: Automatic flagging of serious adverse events

## 📁 Project Structure

```
NEST 2O/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── firebase.js      # Firebase Admin SDK
│   │   │   └── groq.js          # Groq API + safety prefix
│   │   ├── routes/
│   │   │   ├── authRoutes.js    # Authentication endpoints
│   │   │   ├── prescriptionRoutes.js
│   │   │   └── followUpRoutes.js
│   │   ├── services/
│   │   │   ├── otpService.js    # OTP generation/verification
│   │   │   ├── aiService.js     # AI draft & summary generation
│   │   │   ├── emailService.js  # Email notifications
│   │   │   └── ocrService.js    # Prescription OCR
│   │   └── server.js
│   ├── google-credentials.json
│   ├── .env
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Loading.js
│   │   │   ├── Disclaimer.js
│   │   │   └── OTPInput.js
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── Login.js
│   │   │   ├── DoctorDashboard.js
│   │   │   ├── StaffDashboard.js
│   │   │   ├── NewPrescription.js
│   │   │   ├── PrescriptionsList.js
│   │   │   ├── ViewPrescription.js
│   │   │   ├── PatientVerify.js
│   │   │   ├── PatientFollowUp.js    # Smart branching questionnaire
│   │   │   ├── FollowUpsList.js
│   │   │   ├── FollowUpSummary.js
│   │   │   └── SuccessPage.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── email.js
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

## 📊 Data Captured

### For Positive Outcomes
- Overall status & recovery timeline
- Medication adherence & completion
- Symptom improvement percentage
- Follow-up needs

### For Adverse Events
- Time-to-onset (causality assessment)
- Symptom description (MedDRA-ready)
- Severity grading
- Seriousness criteria (hospitalization, etc.)
- Action taken (dechallenge)
- Outcome (dechallenge result)
- Concomitant medications

## ⚠️ Medical Disclaimer

This system is for data collection only. It does NOT provide:
- Medical advice
- Diagnosis
- Treatment recommendations

Always consult healthcare providers for medical decisions.

## 📄 License

MIT License
