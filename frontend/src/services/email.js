/**
 * Email Service
 * Handles OTP email delivery via EmailJS
 */

import emailjs from '@emailjs/browser';

// EmailJS Configuration
const SERVICE_ID = 'service_mqi4d2a';
const TEMPLATE_ID = 'template_39sz9ss';
const PUBLIC_KEY = 'PthizI_5Ry0smexJw';

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
        console.log('Attempting to send email to:', patientEmail);
        console.log('OTP:', otp);
        console.log('Service ID:', SERVICE_ID);
        console.log('Template ID:', TEMPLATE_ID);
        
        const templateParams = {
            to_email: patientEmail,
            passcode: otp,
            time: '10 minutes',
        };
        
        console.log('Template params:', templateParams);

        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

        console.log('OTP Email sent successfully:', response);
        return { success: true, response };
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { success: false, error: error?.text || error?.message || 'Failed to send email' };
    }
}

export default {
    sendOTPEmail,
};
