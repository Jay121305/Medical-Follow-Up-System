/**
 * API Service
 * Centralized API calls to backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
}

// ===== Prescription APIs =====

export async function scanPrescription(imageBase64) {
    return apiCall('/prescriptions/scan', {
        method: 'POST',
        body: JSON.stringify({ image: imageBase64 }),
    });
}

export async function createPrescription(prescriptionData) {
    return apiCall('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(prescriptionData),
    });
}

export async function getDoctorPrescriptions(doctorId) {
    return apiCall(`/prescriptions/doctor/${doctorId}`);
}

export async function getPrescription(id) {
    return apiCall(`/prescriptions/${id}`);
}

// ===== Follow-Up APIs =====

export async function createFollowUp(prescriptionId, doctorId) {
    return apiCall('/follow-ups', {
        method: 'POST',
        body: JSON.stringify({ prescriptionId, doctorId }),
    });
}

export async function verifyOTP(followUpId, otp) {
    return apiCall(`/follow-ups/${followUpId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp }),
    });
}

export async function getFollowUpDrafts(followUpId) {
    return apiCall(`/follow-ups/${followUpId}/drafts`);
}

export async function submitFollowUp(followUpId, responses, consent) {
    return apiCall(`/follow-ups/${followUpId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ responses, consent }),
    });
}

export async function getFollowUpSummary(followUpId, doctorId) {
    return apiCall(`/follow-ups/${followUpId}/summary?doctorId=${doctorId}`);
}

export async function getDoctorFollowUps(doctorId) {
    return apiCall(`/follow-ups/doctor/${doctorId}`);
}

export async function closeFollowUp(followUpId, doctorId, resolution) {
    return apiCall(`/follow-ups/${followUpId}/close`, {
        method: 'POST',
        body: JSON.stringify({ doctorId, resolution }),
    });
}

export default {
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
};
