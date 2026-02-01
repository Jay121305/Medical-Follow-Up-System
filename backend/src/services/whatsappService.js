/**
 * WhatsApp & SMS Service
 * Sends OTP and follow-up links via WhatsApp and SMS using Twilio API
 */

const twilio = require('twilio');
require('dotenv').config();

// Initialize Twilio client
let twilioClient;

function getTwilioClient() {
    if (!twilioClient) {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
    return twilioClient;
}

/**
 * Format phone number for WhatsApp
 * Ensures the number has country code and whatsapp: prefix
 * @param {string} phoneNumber - Phone number (with or without country code)
 * @returns {string} Formatted WhatsApp number
 */
function formatWhatsAppNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If no country code, assume India (+91)
    if (!cleaned.startsWith('+')) {
        // Remove leading 0 if present
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        // Add default country code (India)
        const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '91';
        cleaned = `+${defaultCountryCode}${cleaned}`;
    }
    
    return `whatsapp:${cleaned}`;
}

/**
 * Format phone number for SMS (E.164 format)
 * @param {string} phoneNumber - Phone number (with or without country code)
 * @returns {string} Formatted phone number
 */
function formatSMSNumber(phoneNumber) {
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If no country code, assume India (+91)
    if (!cleaned.startsWith('+')) {
        // Remove leading 0 if present
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        // Add default country code (India)
        const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '91';
        cleaned = `+${defaultCountryCode}${cleaned}`;
    }
    
    return cleaned;
}

/**
 * Send OTP via SMS
 * @param {Object} params
 * @param {string} params.to - Patient's phone number
 * @param {string} params.otp - The OTP code
 * @param {string} params.verificationLink - Link to verification page
 * @param {string} params.caseId - Case ID for reference
 * @param {string} params.followUpId - Follow-up ID for reference
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendOTPSMS({ to, otp, verificationLink, caseId, followUpId }) {
    try {
        const client = getTwilioClient();
        const fromNumber = process.env.TWILIO_SMS_NUMBER;
        const toNumber = formatSMSNumber(to);

        // SMS has 160 character limit, so keep it concise
        const messageBody = `NEST 2O: Your medical follow-up OTP is ${otp}. Valid for 10 mins. Complete here: ${verificationLink}`;

        const message = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: toNumber,
        });

        console.log('SMS message sent:', message.sid);
        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error('SMS Send Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send OTP via WhatsApp
 * @param {Object} params
 * @param {string} params.to - Patient's phone number
 * @param {string} params.otp - The OTP code
 * @param {string} params.verificationLink - Link to verification page
 * @param {string} params.caseId - Case ID for reference
 * @param {string} params.followUpId - Follow-up ID for reference
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendOTPWhatsApp({ to, otp, verificationLink, caseId, followUpId }) {
    try {
        const client = getTwilioClient();
        const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
        const toNumber = formatWhatsAppNumber(to);

        const messageBody = `🏥 *NEST 2O Medical Follow-Up*

Hello! Your doctor has requested a follow-up regarding your recent prescription.

🔐 *Your Verification Code:*
*${otp}*

⏰ This code expires in *10 minutes*.

📋 Click below to complete your follow-up:
${verificationLink}

📎 Case Reference: ${caseId}
🆔 Follow-Up ID: ${followUpId}

⚠️ *Important:* Do not share this code with anyone.

_If you did not expect this message, please ignore it or contact your healthcare provider._

---
_This is an automated message from NEST 2O Medical Follow-Up System._`;

        const message = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: toNumber,
        });

        console.log('WhatsApp message sent:', message.sid);
        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error('WhatsApp Send Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send OTP via both WhatsApp and SMS
 * @param {Object} params - Same as sendOTPWhatsApp
 * @returns {Promise<{whatsapp: Object, sms: Object}>}
 */
async function sendOTPBoth(params) {
    const results = {
        whatsapp: { success: false, error: 'Not attempted' },
        sms: { success: false, error: 'Not attempted' }
    };
    
    // Send WhatsApp first
    try {
        results.whatsapp = await sendOTPWhatsApp(params);
    } catch (err) {
        results.whatsapp = { success: false, error: err.message };
    }
    
    // Then send SMS (if SMS number is configured)
    if (process.env.TWILIO_SMS_NUMBER) {
        try {
            results.sms = await sendOTPSMS(params);
        } catch (err) {
            results.sms = { success: false, error: err.message };
        }
    } else {
        results.sms = { success: false, error: 'SMS number not configured' };
    }
    
    return results;
}

/**
 * Send follow-up reminder via WhatsApp
 * @param {Object} params
 * @param {string} params.to - Patient's phone number
 * @param {string} params.patientName - Patient's name
 * @param {string} params.verificationLink - Link to follow-up
 * @param {string} params.medicineName - Name of the medicine
 */
async function sendFollowUpReminder({ to, patientName, verificationLink, medicineName }) {
    try {
        const client = getTwilioClient();
        const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
        const toNumber = formatWhatsAppNumber(to);

        const messageBody = `🏥 *NEST 2O - Follow-Up Reminder*

Hello${patientName ? ` ${patientName}` : ''}! 

This is a friendly reminder to complete your follow-up for *${medicineName || 'your recent prescription'}*.

Your feedback helps your doctor provide better care.

📋 Complete your follow-up here:
${verificationLink}

_This is an automated reminder from NEST 2O._`;

        const message = await client.messages.create({
            body: messageBody,
            from: fromNumber,
            to: toNumber,
        });

        return { success: true, messageId: message.sid };
    } catch (error) {
        console.error('WhatsApp Reminder Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify WhatsApp service configuration
 */
async function verifyConnection() {
    try {
        const client = getTwilioClient();
        // Try to fetch account info to verify credentials
        await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log('✅ WhatsApp (Twilio) service ready');
        return true;
    } catch (error) {
        console.error('❌ WhatsApp service error:', error.message);
        return false;
    }
}

module.exports = {
    sendOTPWhatsApp,
    sendOTPSMS,
    sendOTPBoth,
    sendFollowUpReminder,
    verifyConnection,
    formatWhatsAppNumber,
    formatSMSNumber,
};
