/**
 * Email Service
 * Handles OTP email delivery via EmailJS
 */

import emailjs from '@emailjs/browser';

// EmailJS Configuration
const SERVICE_ID = 'service_mqi4d2a';
const TEMPLATE_ID = 'template_39sz9ss';
const PUBLIC_KEY = 'PthizI_5Ry0smexJw';

// Initialize EmailJS
emailjs.init(PUBLIC_KEY);

/**
 * Send OTP email to patient
 * @param {Object} params - Email parameters
 * @param {string} params.patientEmail - Patient's email address
 * @param {string} params.otp - The OTP code
 * @param {string} params.verificationLink - Link to verification page
 * @param {string} params.caseId - Case ID for reference
 * @returns {Promise<Object>} EmailJS response
 */
export async function sendOTPEmail({ patientEmail, otp, verificationLink, caseId }) {
    try {
        const templateParams = {
            to_email: patientEmail,
            otp_code: otp,
            verification_link: verificationLink,
            case_id: caseId,
            expiry_time: '10 minutes',
        };

        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);

        console.log('OTP Email sent successfully:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        return { success: false, error: error.message || 'Failed to send email' };
    }
}

export default {
    sendOTPEmail,
};
