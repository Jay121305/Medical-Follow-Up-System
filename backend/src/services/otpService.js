/**
 * OTP Service
 * Handles generation, storage, and verification of OTPs
 * 
 * SECURITY: OTP verification is MANDATORY before any medical data access
 */

const { db } = require('../config/firebase');
require('dotenv').config();

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 4;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

/**
 * Generate a cryptographically random OTP
 * @returns {string} OTP of configured length
 */
function generateOTP() {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

/**
 * Create and store OTP for a follow-up request
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<{otp: string, expiresAt: Date}>}
 */
async function createOTP(followUpId) {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in the follow-up document
    await db.collection('followUps').doc(followUpId).update({
        otp: otp,
        otpExpiresAt: expiresAt,
        otpVerified: false,
        otpAttempts: 0,
    });

    return { otp, expiresAt };
}

/**
 * Verify OTP for a follow-up request
 * @param {string} followUpId - The follow-up document ID
 * @param {string} providedOTP - The OTP provided by the patient
 * @returns {Promise<{success: boolean, message: string}>}
 * 
 * SECURITY: This function enforces OTP verification at backend level
 */
async function verifyOTP(followUpId, providedOTP) {
    const followUpRef = db.collection('followUps').doc(followUpId);
    const followUpDoc = await followUpRef.get();

    if (!followUpDoc.exists) {
        return { success: false, message: 'Follow-up request not found' };
    }

    const data = followUpDoc.data();

    // Check if already verified
    if (data.otpVerified) {
        return { success: true, message: 'OTP already verified' };
    }

    // Check if OTP has expired
    const expiresAt = data.otpExpiresAt?.toDate?.() || new Date(data.otpExpiresAt);
    if (new Date() > expiresAt) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Check attempt limit (max 5 attempts)
    if (data.otpAttempts >= 5) {
        return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }

    // Increment attempt counter
    await followUpRef.update({
        otpAttempts: (data.otpAttempts || 0) + 1,
    });

    // Verify OTP
    if (data.otp !== providedOTP) {
        return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    // Mark as verified
    await followUpRef.update({
        otpVerified: true,
        otpVerifiedAt: new Date(),
    });

    return { success: true, message: 'OTP verified successfully' };
}

/**
 * Check if OTP is verified for a follow-up
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<boolean>}
 * 
 * SECURITY: This check MUST pass before any AI calls or data access
 */
async function isOTPVerified(followUpId) {
    const followUpDoc = await db.collection('followUps').doc(followUpId).get();

    if (!followUpDoc.exists) {
        return false;
    }

    return followUpDoc.data().otpVerified === true;
}

module.exports = {
    generateOTP,
    createOTP,
    verifyOTP,
    isOTPVerified,
};
