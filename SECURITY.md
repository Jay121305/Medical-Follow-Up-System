# 🔐 NEST 2O Data Security & Integrity Documentation

## Executive Summary

NEST 2O implements a **multi-layered security architecture** designed to protect sensitive medical data while enabling seamless patient-doctor communication. This document outlines all security measures in place.

---

## 1. Authentication Security

### 1.1 Password Security
```
Algorithm: bcrypt (10 salt rounds)
Storage: Hashed passwords only (never plaintext)
Minimum: 8 characters required
```

**Implementation:** [authRoutes.js](backend/src/routes/authRoutes.js)

### 1.2 JWT (JSON Web Tokens)
```
Secret: 256-bit random key (environment variable)
Expiry: 7 days
Algorithm: HS256
Payload: { userId, email, role }
```

**Security Benefits:**
- Stateless authentication (no server-side session storage)
- Tamper-proof (signature verification)
- Self-contained claims (role-based access)

---

## 2. OTP Verification System

### 2.1 Configuration
```javascript
OTP_LENGTH: 4 digits
OTP_EXPIRY: 10 minutes
MAX_ATTEMPTS: 5 before lockout
GENERATION: Cryptographically secure (crypto.randomInt)
```

**Implementation:** [otpService.js](backend/src/services/otpService.js)

### 2.2 OTP Lifecycle
1. **Generation**: Created when doctor initiates follow-up
2. **Delivery**: Sent via WhatsApp + SMS (dual channel)
3. **Storage**: Stored with timestamp and attempt counter
4. **Verification**: Constant-time comparison to prevent timing attacks
5. **Expiry**: Auto-invalidates after 10 minutes
6. **Lockout**: Blocks after 5 failed attempts

### 2.3 Why This Matters
- **Patient Identity Verification**: Ensures only the actual patient can respond
- **No Account Required**: Patients don't need to create accounts
- **Dual Delivery**: Redundancy ensures OTP reaches patient

---

## 3. Consent-Gated Data Access

### 3.1 The Consent Model
```
PRINCIPLE: No medical data is accessible until patient explicitly consents
```

**Three-Layer Security Gate:**
1. **OTP Gate**: Must verify identity first
2. **Consent Gate**: Must explicitly agree to share data
3. **Authorization Gate**: Doctor must own the prescription

### 3.2 Implementation Flow
```
Patient receives link → Enters OTP → Reads consent → Checks checkbox → 
Data becomes accessible to doctor
```

**Code Location:** [followUpRoutes.js](backend/src/routes/followUpRoutes.js)

### 3.3 What's Protected
- Patient health responses
- AI-generated statements
- Side effect reports
- Medication effectiveness data

---

## 4. HTTP Security (Helmet.js)

### 4.1 Headers Set
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: (configured)
```

**Implementation:** [server.js](backend/src/server.js)

### 4.2 Protection Against
- **Clickjacking**: X-Frame-Options prevents embedding
- **MIME Sniffing**: Content-Type enforcement
- **XSS**: Script injection prevention
- **HTTPS Downgrade**: HSTS enforcement

---

## 5. CORS (Cross-Origin Resource Sharing)

### 5.1 Configuration
```javascript
{
    origin: 'http://localhost:3000', // Only frontend
    credentials: true,               // Allow auth cookies
}
```

### 5.2 Why Restrictive CORS
- Prevents unauthorized websites from calling our API
- Ensures only our frontend can make requests
- Protects against CSRF attacks

---

## 6. Data Encryption

### 6.1 In Transit
```
Protocol: HTTPS (TLS 1.2+)
Certificate: Required in production
```

### 6.2 At Rest (Firebase)
```
Firestore: Encrypted by default (AES-256)
Storage: Google Cloud encryption
Backups: Encrypted automatically
```

### 6.3 Sensitive Data Handling
- Passwords: bcrypt hashed (irreversible)
- OTPs: Time-limited, auto-deleted after use
- Phone numbers: Stored for communication only

---

## 7. Firebase Security Rules

### 7.1 Rule Structure
```javascript
// Only authenticated users can read/write
// Documents scoped to owner (doctorId, patientPhone)
// Role-based access control
```

### 7.2 Data Isolation
- Each doctor can only access their own prescriptions
- Patients can only access their own follow-ups (via OTP)
- No cross-doctor data leakage

---

## 8. Input Validation & Sanitization

### 8.1 Backend Validation
```javascript
// Phone number format: +91XXXXXXXXXX
// Email format: standard RFC 5322
// Required fields: checked before processing
// Type checking: numbers, strings, booleans
```

### 8.2 Protection Against
- SQL Injection: N/A (NoSQL database)
- NoSQL Injection: Parameterized queries
- XSS: Input sanitization + output encoding
- Buffer Overflow: JSON size limits (50MB max)

---

## 9. Rate Limiting (Recommended)

### 9.1 Suggested Implementation
```javascript
// Login: 5 attempts per 15 minutes
// OTP verify: 5 attempts per OTP
// API calls: 100 per minute per IP
```

### 9.2 Current Status
- OTP attempts: ✅ Implemented (5 max)
- Login attempts: ⚠️ Recommended addition
- API rate limiting: ⚠️ Recommended for production

---

## 10. Audit Trail

### 10.1 Tracked Events
```
- Prescription creation (timestamp, doctorId)
- Follow-up initiation (timestamp, prescriptionId)
- OTP verification (timestamp, success/fail)
- Patient consent (timestamp, IP address)
- Data access by doctor (timestamp)
```

### 10.2 Logging
```javascript
// Every API request logged: timestamp, method, path
// Errors logged with stack traces
// Security events highlighted
```

---

## 11. Role-Based Access Control (RBAC)

### 11.1 Roles
| Role    | Can Create Rx | Can View Rx | Can Submit Follow-up | Can View Summary |
|---------|--------------|-------------|---------------------|------------------|
| Doctor  | ✅           | Own only    | ❌                  | After consent    |
| Staff   | ❌           | Assigned    | ❌                  | ❌               |
| Patient | ❌           | Own only    | ✅ (after OTP)      | ❌               |

### 11.2 Implementation
```javascript
const ProtectedRoute = ({ allowedRoles }) => {
    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }
    return children;
};
```

---

## 12. Medical Data Privacy Compliance

### 12.1 Principles Applied
- **Data Minimization**: Only collect what's needed
- **Purpose Limitation**: Data used only for stated purpose
- **Consent**: Explicit patient consent required
- **Right to Access**: Patients can view their data
- **Anonymization**: Summaries don't include unnecessary identifiers

### 12.2 Considerations for Production
- HIPAA compliance (US)
- GDPR compliance (EU)
- DISHA compliance (India)

---

## 13. Adverse Event Security

### 13.1 Special Protections
```
- Urgent cases flagged immediately
- Complete audit trail for regulatory reporting
- Consent required before data sharing
- OTP verification for follow-up questions
```

### 13.2 Data Flow
```
Report → OTP Verification → Follow-up Questions → Consent → 
Regulatory-ready case
```

---

## 14. Security Checklist

### ✅ Implemented
- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] OTP verification
- [x] Consent gating
- [x] CORS protection
- [x] Helmet.js headers
- [x] Input validation
- [x] Role-based access
- [x] Audit timestamps
- [x] HTTPS ready

### ⚠️ Recommended for Production
- [ ] API rate limiting
- [ ] Login attempt limiting
- [ ] IP-based blocking
- [ ] Web Application Firewall (WAF)
- [ ] Security scanning (OWASP ZAP)
- [ ] Penetration testing
- [ ] Compliance certification

---

## 15. Incident Response

### 15.1 In Case of Breach
1. Revoke all JWT tokens (change secret)
2. Reset all OTPs
3. Notify affected users
4. Audit access logs
5. Patch vulnerability
6. Document incident

### 15.2 Contact
Security issues should be reported to the development team immediately.

---

## Summary

NEST 2O uses a **defense-in-depth** approach:

```
Layer 1: Network (HTTPS, CORS, Firewall)
Layer 2: Application (Helmet, Validation)
Layer 3: Authentication (JWT, OTP)
Layer 4: Authorization (Roles, Consent)
Layer 5: Data (Encryption, Isolation)
Layer 6: Audit (Logging, Timestamps)
```

**The key principle**: Patient data is only accessible after explicit consent, verified by OTP.

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Author: NEST 2O Development Team*
