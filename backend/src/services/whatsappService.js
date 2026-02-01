/**
 * ============================================================================
 * WhatsApp & SMS Service - Twilio Integration
 * ============================================================================
 * 
 * PURPOSE:
 * Sends OTP verification codes and follow-up links to patients via WhatsApp
 * and SMS using the Twilio API. This is the PRIMARY delivery method for
 * patient notifications.
 * 
 * WHY WHATSAPP + SMS?
 * 1. WhatsApp: High open rates, rich formatting, widely used in India
 * 2. SMS: Fallback for users without WhatsApp, guaranteed delivery
 * 3. Both: Redundancy ensures patient receives the OTP
 * 
 * TWILIO CONFIGURATION:
 * - Account SID and Auth Token from Twilio Console
 * - WhatsApp: Requires approved WhatsApp Business number
 * - SMS: Requires purchased Twilio phone number
 * 
 * PHONE NUMBER FORMAT:
 * - Stored in database: May be in any format
 * - For Twilio: Must be E.164 format (+[country][number])
 * - Default country code: India (+91) if not specified
 * 
 * MESSAGE TYPES:
 * 1. OTP Messages: Verification codes with follow-up links
 * 2. Reminder Messages: Gentle nudges to complete follow-up
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - TWILIO_ACCOUNT_SID: Your Twilio account ID
 * - TWILIO_AUTH_TOKEN: Your Twilio auth token
 * - TWILIO_WHATSAPP_NUMBER: WhatsApp-enabled number (without whatsapp: prefix)
 * - TWILIO_SMS_NUMBER: SMS-enabled Twilio number
 * - DEFAULT_COUNTRY_CODE: Default country code (e.g., 91 for India)
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

/**
 * Twilio SDK for WhatsApp and SMS
 * Documentation: https://www.twilio.com/docs
 */
const twilio = require('twilio');

/**
 * Load environment variables
 */
require('dotenv').config();

// ============================================================================
// TWILIO CLIENT INITIALIZATION
// ============================================================================

/**
 * Twilio client instance (singleton pattern)
 */
let twilioClient;

/**
 * Get or create Twilio client
 * 
 * WHY LAZY INITIALIZATION?
 * - App can start even if Twilio isn't configured
 * - Single instance reused for all messages
 * - Credentials validated on first use
 * 
 * @returns {twilio.Twilio} Configured Twilio client
 */
function getTwilioClient() {
    if (!twilioClient) {
        twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
    return twilioClient;
}

// ============================================================================
// PHONE NUMBER FORMATTING
// ============================================================================

/**
 * Format phone number for WhatsApp
 * 
 * Twilio WhatsApp API requires numbers in format: whatsapp:+[country][number]
 * 
 * TRANSFORMATIONS:
 * - Removes spaces, dashes, parentheses
 * - Adds country code if missing (default: India +91)
 * - Removes leading 0 (common in Indian numbers)
 * - Adds "whatsapp:" prefix
 * 
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} Formatted WhatsApp number (e.g., "whatsapp:+919876543210")
 * 
 * @example
 * formatWhatsAppNumber('9876543210')     → 'whatsapp:+919876543210'
 * formatWhatsAppNumber('+919876543210')  → 'whatsapp:+919876543210'
 * formatWhatsAppNumber('09876543210')    → 'whatsapp:+919876543210'
 */
function formatWhatsAppNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle numbers without country code
    if (!cleaned.startsWith('+')) {
        // Remove leading 0 (common in local format)
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        // Add default country code
        const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '91';
        cleaned = `+${defaultCountryCode}${cleaned}`;
    }
    
    // Add WhatsApp prefix for Twilio
    return `whatsapp:${cleaned}`;
}

/**
 * Format phone number for SMS (E.164 format)
 * 
 * E.164 is the international phone number format: +[country][number]
 * Required by Twilio and most telephony APIs.
 * 
 * @param {string} phoneNumber - Phone number in any format
 * @returns {string} E.164 formatted number (e.g., "+919876543210")
 * 
 * @example
 * formatSMSNumber('9876543210')     → '+919876543210'
 * formatSMSNumber('+919876543210')  → '+919876543210'
 */
function formatSMSNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Handle numbers without country code
    if (!cleaned.startsWith('+')) {
        // Remove leading 0 (common in local format)
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        // Add default country code
        const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '91';
        cleaned = `+${defaultCountryCode}${cleaned}`;
    }
    
    return cleaned;
}

// ============================================================================
// SMS FUNCTIONS
// ============================================================================

/**
 * Send OTP via SMS
 * 
 * WHEN USED:
 * - As backup when WhatsApp fails
 * - For patients who prefer SMS
 * - When WhatsApp number not configured
 * 
 * SMS LIMITATIONS:
 * - 160 character limit per segment
 * - No rich formatting (bold, links may not be clickable)
 * - May be filtered as spam by carriers
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.to - Patient's phone number
 * @param {string} params.otp - The 4-digit OTP code
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

        // Keep message under 160 chars for single segment delivery
        const messageBody = `NEST 2O: Your medical follow-up OTP is ${otp}. Valid for 10 mins. Complete here: ${verificationLink}`;

        // Send via Twilio
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

// ============================================================================
// WHATSAPP FUNCTIONS
// ============================================================================

/**
 * Send OTP via WhatsApp
 * 
 * PRIMARY delivery method for OTP messages.
 * WhatsApp provides rich formatting and higher engagement.
 * 
 * MESSAGE CONTENT:
 * - Professional header with emoji
 * - Prominently displayed OTP
 * - Expiry warning
 * - Direct link to verification page
 * - Case and follow-up IDs for reference
 * - Security warning
 * 
 * FORMATTING:
 * - *text* = Bold
 * - _text_ = Italic
 * - Emojis for visual appeal
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.to - Patient's phone number
 * @param {string} params.otp - The 4-digit OTP code
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

        // Rich WhatsApp message with formatting
        // *text* = bold, _text_ = italic
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

        // Send via Twilio WhatsApp
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

// ============================================================================
// COMBINED FUNCTIONS
// ============================================================================

/**
 * Send OTP via both WhatsApp and SMS
 * 
 * REDUNDANCY STRATEGY:
 * - Sends WhatsApp first (primary)
 * - Then sends SMS (backup)
 * - Returns results for both
 * 
 * WHY BOTH?
 * - Patient might not have WhatsApp installed
 * - WhatsApp might fail due to network issues
 * - Some patients prefer SMS
 * - Ensures OTP reaches the patient
 * 
 * @param {Object} params - Same parameters as sendOTPWhatsApp
 * @returns {Promise<{whatsapp: Object, sms: Object}>} Results for both channels
 */
async function sendOTPBoth(params) {
    const results = {
        whatsapp: { success: false, error: 'Not attempted' },
        sms: { success: false, error: 'Not attempted' }
    };
    
    // Send WhatsApp first (primary channel)
    try {
        results.whatsapp = await sendOTPWhatsApp(params);
    } catch (err) {
        results.whatsapp = { success: false, error: err.message };
    }
    
    // Then send SMS (if configured)
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

// ============================================================================
// REMINDER FUNCTIONS
// ============================================================================

/**
 * Send follow-up reminder via WhatsApp
 * 
 * WHEN USED:
 * - Patient hasn't completed follow-up after X hours
 * - Doctor requests a reminder
 * - Scheduled reminder job
 * 
 * NOTE: This is a GENTLE reminder, not the OTP.
 * Patient will need to request a new OTP to continue.
 * 
 * @param {Object} params - Reminder parameters
 * @param {string} params.to - Patient's phone number
 * @param {string} params.patientName - Patient's name (optional)
 * @param {string} params.verificationLink - Link to follow-up page
 * @param {string} params.medicineName - Medicine name for context
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendFollowUpReminder({ to, patientName, verificationLink, medicineName }) {
    try {
        const client = getTwilioClient();
        const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
        const toNumber = formatWhatsAppNumber(to);

        // Friendly reminder message
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

// ============================================================================
// CONNECTION VERIFICATION
// ============================================================================

/**
 * Verify Twilio service configuration
 * 
 * PURPOSE:
 * Tests Twilio credentials without sending a message.
 * Called during server startup to ensure service is ready.
 * 
 * WHAT IT CHECKS:
 * - Valid Account SID and Auth Token
 * - Account is active
 * - API is accessible
 * 
 * @returns {Promise<boolean>} True if connection verified, false otherwise
 */
async function verifyConnection() {
    try {
        const client = getTwilioClient();
        // Fetch account info to verify credentials
        await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log('✅ WhatsApp (Twilio) service ready');
        return true;
    } catch (error) {
        console.error('❌ WhatsApp service error:', error.message);
        return false;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Primary messaging functions
    sendOTPWhatsApp,       // Send OTP via WhatsApp
    sendOTPSMS,            // Send OTP via SMS
    sendOTPBoth,           // Send OTP via both channels
    
    // Reminder functions
    sendFollowUpReminder,  // Send reminder to complete follow-up
    
    // Utility functions
    verifyConnection,      // Test Twilio configuration
    formatWhatsAppNumber,  // Format number for WhatsApp
    formatSMSNumber,       // Format number for SMS
};
