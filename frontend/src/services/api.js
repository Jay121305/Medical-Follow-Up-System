/**
 * ============================================================================
 * API Service - Frontend HTTP Client
 * ============================================================================
 * 
 * PURPOSE:
 * Centralized module for all HTTP requests to the backend API.
 * All components should use this service instead of calling fetch() directly.
 * 
 * WHY CENTRALIZE API CALLS?
 * 1. Single place to change the API base URL
 * 2. Consistent error handling across the app
 * 3. Easy to add authentication headers later
 * 4. Simplifies mocking for unit tests
 * 5. Type safety and documentation in one place
 * 
 * ERROR HANDLING:
 * All functions throw errors on failure. Components should use try/catch.
 * 
 * RESPONSE FORMAT:
 * All endpoints return: { success: boolean, data?: any, error?: string }
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Base URL for all API requests
 * WHY HARDCODE? For simplicity. In production, use environment variables.
 */
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================================================
// GENERIC API CALL WRAPPER
// ============================================================================

/**
 * Generic fetch wrapper with error handling
 * 
 * @param {string} endpoint - API endpoint (e.g., '/prescriptions')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} Parsed JSON response
 * @throws {Error} If response is not OK or if there's a network error
 * 
 * WHY A WRAPPER?
 * - Automatically adds Content-Type header
 * - Handles JSON parsing
 * - Extracts error messages from response
 * - Reduces boilerplate in individual API functions
 */
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Default headers - can be overridden by options
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // Merge default options with provided options
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    // If response status is not 2xx, throw an error
    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ============================================================================
// PRESCRIPTION APIs
// These handle prescription CRUD operations (STEP 2 of the workflow)
// ============================================================================

/**
 * Scan a prescription image using OCR
 * Extracts patient info, medication details, and dosage from image
 * 
 * @param {string} imageBase64 - Base64-encoded image string
 * @returns {Promise<object>} Extracted prescription data
 * 
 * BACKEND: POST /api/prescriptions/scan
 * USES: Google Cloud Vision API + Groq AI for parsing
 */
export async function scanPrescription(imageBase64) {
    return apiCall('/prescriptions/scan', {
        method: 'POST',
        body: JSON.stringify({ image: imageBase64 }),
    });
}

/**
 * Create a new prescription record
 * 
 * @param {object} prescriptionData - Prescription details
 *   - medicineName: Name of the medicine
 *   - dosage: Dosage instructions
 *   - duration: Treatment duration
 *   - patientPhone: Patient's phone number (required for WhatsApp)
 *   - doctorId: ID of the creating doctor
 * @returns {Promise<object>} Created prescription with ID and caseId
 * 
 * BACKEND: POST /api/prescriptions
 */
export async function createPrescription(prescriptionData) {
    return apiCall('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(prescriptionData),
    });
}

/**
 * Get all prescriptions for a specific doctor
 * 
 * @param {string} doctorId - Doctor's user ID
 * @returns {Promise<object>} Array of prescriptions
 * 
 * BACKEND: GET /api/prescriptions/doctor/:doctorId
 */
export async function getDoctorPrescriptions(doctorId) {
    return apiCall(`/prescriptions/doctor/${doctorId}`);
}

/**
 * Get a single prescription by ID
 * 
 * @param {string} id - Prescription document ID
 * @returns {Promise<object>} Prescription details
 * 
 * BACKEND: GET /api/prescriptions/:id
 * NOTE: This is a PUBLIC endpoint - used for patient prescription view
 */
export async function getPrescription(id) {
    return apiCall(`/prescriptions/${id}`);
}

// ============================================================================
// FOLLOW-UP APIs
// These handle the follow-up workflow (STEPS 3-9)
// ============================================================================

/**
 * Create a follow-up request (STEP 3)
 * Doctor initiates follow-up → OTP generated → WhatsApp sent
 * 
 * @param {string} prescriptionId - ID of the prescription to follow up on
 * @param {string} doctorId - ID of the doctor initiating the follow-up
 * @returns {Promise<object>} Follow-up details including OTP and verification link
 * 
 * BACKEND: POST /api/follow-ups
 * TRIGGERS: WhatsApp/SMS with OTP sent to patient
 */
export async function createFollowUp(prescriptionId, doctorId) {
    return apiCall('/follow-ups', {
        method: 'POST',
        body: JSON.stringify({ prescriptionId, doctorId }),
    });
}

/**
 * Verify patient OTP (STEP 4)
 * CRITICAL: This must succeed before any medical content is shown
 * 
 * @param {string} followUpId - Follow-up document ID
 * @param {string} otp - 4-digit OTP entered by patient
 * @returns {Promise<object>} Success message
 * 
 * BACKEND: POST /api/follow-ups/:id/verify-otp
 */
export async function verifyOTP(followUpId, otp) {
    return apiCall(`/follow-ups/${followUpId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

/**
 * Get AI-generated drafts and personalized questions (STEP 5)
 * ONLY available AFTER OTP verification
 * 
 * @param {string} followUpId - Follow-up document ID
 * @returns {Promise<object>} Draft statements and questions
 * 
 * BACKEND: GET /api/follow-ups/:id/drafts
 */
export async function getFollowUpDrafts(followUpId) {
    return apiCall(`/follow-ups/${followUpId}/drafts`);
}

/**
 * Submit patient's follow-up responses (STEP 8)
 * Patient verifies/edits drafts and submits with consent
 * 
 * @param {string} followUpId - Follow-up document ID
 * @param {object} responses - Patient's answers to questions
 * @param {boolean} consent - Patient's explicit consent to share with doctor
 * @returns {Promise<object>} Confirmation
 * 
 * BACKEND: POST /api/follow-ups/:id/submit
 */
export async function submitFollowUp(followUpId, responses, consent) {
    return apiCall(`/follow-ups/${followUpId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ responses, consent }),
    });
}

/**
 * Get follow-up summary for doctor (STEP 9)
 * Doctor views patient-verified summary
 * 
 * @param {string} followUpId - Follow-up document ID
 * @param {string} doctorId - Doctor's ID (for authorization)
 * @returns {Promise<object>} Summary including prescription and responses
 * 
 * BACKEND: GET /api/follow-ups/:id/summary
 */
export async function getFollowUpSummary(followUpId, doctorId) {
    return apiCall(`/follow-ups/${followUpId}/summary?doctorId=${doctorId}`);
}

/**
 * Get all follow-ups for a doctor
 * 
 * @param {string} doctorId - Doctor's user ID
 * @returns {Promise<object>} Array of follow-ups with status
 * 
 * BACKEND: GET /api/follow-ups/doctor/:doctorId
 */
export async function getDoctorFollowUps(doctorId) {
    return apiCall(`/follow-ups/doctor/${doctorId}`);
}

/**
 * Close a follow-up case (doctor action)
 * Marks the follow-up as reviewed and closed
 * 
 * @param {string} followUpId - Follow-up document ID
 * @param {string} doctorId - Doctor's ID (for authorization)
 * @param {string} resolution - Doctor's resolution notes
 * @returns {Promise<object>} Confirmation
 * 
 * BACKEND: POST /api/follow-ups/:id/close
 */
export async function closeFollowUp(followUpId, doctorId, resolution) {
    return apiCall(`/follow-ups/${followUpId}/close`, {
        method: 'POST',
        body: JSON.stringify({ doctorId, resolution }),
    });
}

// ============================================================================
// ADVERSE EVENT APIs (Pharmacovigilance)
// ============================================================================

/**
 * Report a new adverse event
 * 
 * @param {object} data - Adverse event report data
 * @returns {Promise<object>} Case ID and follow-up details
 * 
 * BACKEND: POST /api/adverse-events
 */
export async function reportAdverseEvent(data) {
    return apiCall('/adverse-events', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Verify OTP for adverse event follow-up
 * 
 * @param {string} adverseEventId - Adverse event document ID
 * @param {string} otp - OTP entered by patient
 * @returns {Promise<object>} Verification result
 * 
 * BACKEND: POST /api/adverse-events/:id/verify-otp
 */
export async function verifyAdverseEventOTP(adverseEventId, otp) {
    return apiCall(`/adverse-events/${adverseEventId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

/**
 * Get smart follow-up questions for adverse event
 * 
 * @param {string} adverseEventId - Adverse event document ID
 * @returns {Promise<object>} Questions array and case info
 * 
 * BACKEND: GET /api/adverse-events/:id/questions
 */
export async function getAdverseEventQuestions(adverseEventId) {
    return apiCall(`/adverse-events/${adverseEventId}/questions`);
}

/**
 * Submit adverse event follow-up responses
 * 
 * @param {string} adverseEventId - Adverse event document ID
 * @param {object} data - Responses and consent
 * @returns {Promise<object>} Case assessment result
 * 
 * BACKEND: POST /api/adverse-events/:id/submit
 */
export async function submitAdverseEventFollowUp(adverseEventId, data) {
    return apiCall(`/adverse-events/${adverseEventId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Get adverse event case (for doctor)
 * 
 * @param {string} adverseEventId - Adverse event document ID
 * @param {string} doctorId - Doctor's ID for authorization
 * @returns {Promise<object>} Complete case data
 * 
 * BACKEND: GET /api/adverse-events/:id/case
 */
export async function getAdverseEventCase(adverseEventId, doctorId) {
    return apiCall(`/adverse-events/${adverseEventId}/case?doctorId=${doctorId}`);
}

/**
 * Get all adverse events for a doctor
 * 
 * @param {string} doctorId - Doctor's user ID
 * @returns {Promise<object>} Array of adverse events
 * 
 * BACKEND: GET /api/adverse-events/doctor/:doctorId
 */
export async function getAdverseEventsByDoctor(doctorId) {
    return apiCall(`/adverse-events/doctor/${doctorId}`);
}

// ============================================================================
// DEFAULT EXPORT
// Exports all functions as an object for alternative import style
// ============================================================================

const api = {
    createPrescription,
    getDoctorPrescriptions,
    getPrescription,
    createFollowUp,
    verifyOTP,
    getFollowUpDrafts,
    submitFollowUp,
    getFollowUpSummary,
    getDoctorFollowUps,
    closeFollowUp,
    // Adverse Event APIs
    reportAdverseEvent,
    verifyAdverseEventOTP,
    getAdverseEventQuestions,
    submitAdverseEventFollowUp,
    getAdverseEventCase,
    getAdverseEventsByDoctor,
};

// Named export for destructured imports: import { api } from './api'
export { api };

// Default export for: import api from './api'
export default api;
