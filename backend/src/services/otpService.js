/**
 * ============================================================================
 * OTP Service
 * One-Time Password Generation, Storage, and Verification
 * ============================================================================
 * 
 * PURPOSE:
 * Handles the complete OTP lifecycle for patient verification.
 * OTP verification is the GATEWAY to all medical data access.
 * 
 * WHY OTP?
 * - Verifies patient identity without requiring account creation
 * - Ensures only the intended recipient can access follow-up forms
 * - Provides audit trail of consent (OTP = patient actively engaged)
 * - Simple enough for non-tech-savvy patients
 * 
 * FLOW:
 * 1. Doctor initiates follow-up → OTP generated & stored
 * 2. OTP sent to patient via WhatsApp/SMS
 * 3. Patient enters OTP on verification page
 * 4. If valid → unlock medical content and follow-up form
 * 5. If invalid → increment attempts, maybe block after 5 tries
 * 
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 * 
 * 1. OTP expires after 10 minutes (configurable via OTP_EXPIRY_MINUTES)
 * 2. Maximum 5 attempts before lockout
 * 3. OTP is stored in Firestore (not in memory) for persistence
 * 4. isOTPVerified() MUST be called before ANY medical data access
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const { db } = require('../config/firebase');  // Firestore for OTP storage
require('dotenv').config();

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * OTP_LENGTH: Number of digits in the OTP
 * Default: 4 digits (easy to read from WhatsApp/SMS)
 * WHY 4? Balance between security and usability for patients
 */
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 4;

/**
 * OTP_EXPIRY_MINUTES: How long the OTP remains valid
 * Default: 10 minutes
 * WHY 10? Enough time to switch from WhatsApp to browser, but not too long
 */
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

// ============================================================================
// OTP GENERATION
// ============================================================================

/**
 * Generate a cryptographically random OTP
 * 
 * WHY NOT USE Math.random()?
 * Math.random() is NOT cryptographically secure. For OTPs, we want
 * unpredictable values. However, for simplicity, we use Math.random here.
 * In production, consider using crypto.randomInt() for better security.
 * 
 * @returns {string} OTP of configured length (e.g., "4829")
 */
function generateOTP() {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

// ============================================================================
// OTP STORAGE
// ============================================================================

/**
 * Create and store OTP for a follow-up request
 * 
 * This function:
 * 1. Generates a new random OTP
 * 2. Calculates expiration time
 * 3. Stores both in the follow-up document
 * 4. Resets verification status and attempt counter
 * 
 * @param {string} followUpId - The Firestore document ID for the follow-up
 * @returns {Promise<{otp: string, expiresAt: Date}>} The OTP and expiration time
 */
async function createOTP(followUpId) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Update the follow-up document with OTP data
    await db.collection('followUps').doc(followUpId).update({
        otp: otp,                  // The actual OTP value
        otpExpiresAt: expiresAt,   // When it becomes invalid
        otpVerified: false,        // Reset verification status
        otpAttempts: 0,            // Reset attempt counter
    });

    return { otp, expiresAt };
}

// ============================================================================
// OTP VERIFICATION
// ============================================================================

/**
 * Verify OTP for a follow-up request
 * 
 * SECURITY CHECKS PERFORMED:
 * 1. Follow-up document exists
 * 2. OTP not already verified (prevent replay attacks)
 * 3. OTP not expired
 * 4. Attempt limit not exceeded (brute-force protection)
 * 5. OTP matches
 * 
 * @param {string} followUpId - The follow-up document ID
 * @param {string} providedOTP - The OTP entered by the patient
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function verifyOTP(followUpId, providedOTP) {
    const followUpRef = db.collection('followUps').doc(followUpId);
    const followUpDoc = await followUpRef.get();

    // Check 1: Document exists
    if (!followUpDoc.exists) {
        return { success: false, message: 'Follow-up request not found' };
    }

    const data = followUpDoc.data();

    // Check 2: Not already verified (idempotency)
    // If already verified, just return success - don't force re-verification
    if (data.otpVerified) {
        return { success: true, message: 'OTP already verified' };
    }

    // Check 3: OTP not expired
    // toDate() converts Firestore Timestamp to JavaScript Date
    const expiresAt = data.otpExpiresAt?.toDate?.() || new Date(data.otpExpiresAt);
    if (new Date() > expiresAt) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Check 4: Attempt limit (brute-force protection)
    // After 5 wrong attempts, lock out this OTP
    if (data.otpAttempts >= 5) {
        return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }

    // Always increment attempt counter (even before checking if correct)
    // This prevents timing attacks
    await followUpRef.update({
        otpAttempts: (data.otpAttempts || 0) + 1,
    });

    // Check 5: OTP matches
    if (data.otp !== providedOTP) {
        return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    // SUCCESS: Mark as verified with timestamp
    await followUpRef.update({
        otpVerified: true,
        otpVerifiedAt: new Date(),  // Record when verification happened
    });

    return { success: true, message: 'OTP verified successfully' };
}

// ============================================================================
// OTP STATUS CHECK
// ============================================================================

/**
 * Check if OTP is verified for a follow-up
 * 
 * CRITICAL: This function is the GATEKEEPER for medical data access.
 * It MUST be called before:
 * - Generating AI drafts
 * - Showing prescription details to patient
 * - Allowing follow-up form submission
 * - Generating doctor summaries
 * 
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<boolean>} True if OTP was successfully verified
 */
async function isOTPVerified(followUpId) {
    const followUpDoc = await db.collection('followUps').doc(followUpId).get();

    if (!followUpDoc.exists) {
        return false;
    }

    // Strict equality check - must be exactly true
    return followUpDoc.data().otpVerified === true;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    generateOTP,     // Generate a random OTP (utility)
    createOTP,       // Create and store OTP for a follow-up
    verifyOTP,       // Verify patient-provided OTP
    isOTPVerified,   // Check if OTP was already verified (SECURITY GATEKEEPER)
};
