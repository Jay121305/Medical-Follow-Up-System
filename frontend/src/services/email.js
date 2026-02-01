/**
 * ============================================================================
 * Email Service - Frontend OTP Email Delivery
 * ============================================================================
 * 
 * PURPOSE:
 * Sends OTP verification emails to patients using EmailJS.
 * This is a FRONTEND email service that runs in the browser.
 * 
 * WHY EMAILJS (FRONTEND) vs NODEMAILER (BACKEND)?
 * 1. EmailJS runs in browser - no server required for email sending
 * 2. Useful as a BACKUP when backend email fails
 * 3. Can be used for direct patient notifications from frontend
 * 4. Simpler setup - no SMTP configuration needed
 * 
 * IMPORTANT: The backend also has an email service using Nodemailer.
 * This frontend service is typically used for:
 * - Quick testing during development
 * - Fallback when backend is unavailable
 * - Direct-to-patient notifications
 * 
 * CONFIGURATION:
 * - Service ID: EmailJS email service identifier
 * - Template ID: Pre-configured email template on EmailJS dashboard
 * - Public Key: API key for EmailJS (safe to expose in frontend)
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

/**
 * EmailJS Browser SDK
 * Allows sending emails directly from browser without a backend server.
 * Uses pre-configured templates on EmailJS dashboard.
 */
import emailjs from '@emailjs/browser';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * EmailJS Service ID
 * Identifies which email service to use (Gmail, Outlook, etc.)
 * Configured in EmailJS dashboard: https://www.emailjs.com/
 */
const SERVICE_ID = 'service_mqi4d2a';

/**
 * EmailJS Template ID
 * Points to the email template with placeholders like {{passcode}}, {{to_email}}
 * Template is designed in EmailJS dashboard with dynamic variables
 */
const TEMPLATE_ID = 'template_39sz9ss';

/**
 * EmailJS Public Key
 * Authentication key for EmailJS API
 * This is safe to expose in frontend code (unlike private keys)
 */
const PUBLIC_KEY = 'PthizI_5Ry0smexJw';

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Send OTP email to patient
 * 
 * WHEN CALLED:
 * - When doctor initiates a follow-up
 * - When patient requests OTP resend
 * 
 * TEMPLATE VARIABLES:
 * The EmailJS template uses these placeholders:
 * - {{to_email}} - Patient's email address
 * - {{passcode}} - The 4-digit OTP
 * - {{time}} - Expiry time for the OTP
 * 
 * @param {Object} params - Email parameters
 * @param {string} params.patientEmail - Patient's email address
 * @param {string} params.otp - The 4-digit OTP code
 * @param {string} params.verificationLink - Link to verification page (optional)
 * @param {string} params.caseId - Case ID for reference (optional)
 * @returns {Promise<Object>} Result with success status and response/error
 * 
 * @example
 * await sendOTPEmail({
 *     patientEmail: 'patient@example.com',
 *     otp: '1234',
 *     verificationLink: 'http://localhost:3000/follow-up/abc123',
 *     caseId: 'CASE-001'
 * });
 */
export async function sendOTPEmail({ patientEmail, otp, verificationLink, caseId }) {
    try {
        // Debug logging - helpful for troubleshooting email issues
        console.log('Attempting to send email to:', patientEmail);
        console.log('OTP:', otp);
        console.log('Service ID:', SERVICE_ID);
        console.log('Template ID:', TEMPLATE_ID);
        
        // Map our parameters to EmailJS template variables
        // These names must match the variables in the EmailJS template
        const templateParams = {
            to_email: patientEmail,    // Recipient email
            passcode: otp,             // The OTP code
            time: '10 minutes',        // OTP validity period
        };
        
        console.log('Template params:', templateParams);

        // Send email via EmailJS
        // This makes an API call to EmailJS servers which then send the email
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

        console.log('OTP Email sent successfully:', response);
        return { success: true, response };
    } catch (error) {
        // EmailJS errors often have a 'text' property with details
        console.error('Failed to send OTP email:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return { 
            success: false, 
            error: error?.text || error?.message || 'Failed to send email' 
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Default export as object for alternative import style
 * Allows: import email from './email'; email.sendOTPEmail(...)
 */
export default {
    sendOTPEmail,
};
