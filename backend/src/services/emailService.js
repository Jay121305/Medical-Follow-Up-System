/**
 * ============================================================================
 * Email Service - Backend OTP Email Delivery via Nodemailer
 * ============================================================================
 * 
 * PURPOSE:
 * Sends beautifully formatted OTP verification emails to patients.
 * This is the PRIMARY email delivery method for the application.
 * 
 * WHY NODEMAILER?
 * 1. Industry-standard Node.js email library
 * 2. Supports multiple email services (Gmail, Outlook, SMTP, etc.)
 * 3. Full control over email content and formatting
 * 4. Reliable and well-maintained
 * 
 * GMAIL CONFIGURATION:
 * - Requires Gmail account with "Less secure apps" or App Password
 * - For 2FA-enabled accounts, MUST use App Password (not regular password)
 * - App Password: Google Account → Security → 2-Step Verification → App Passwords
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - EMAIL_USER: Gmail address (e.g., yourapp@gmail.com)
 * - EMAIL_PASS: App Password (16-character code from Google)
 * 
 * WORKFLOW:
 * 1. Doctor initiates follow-up → Backend generates OTP
 * 2. This service sends email with OTP to patient
 * 3. Patient receives email with verification code and link
 * 4. Patient uses code to verify identity (STEP 4)
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

/**
 * Nodemailer - Node.js email sending library
 * Supports SMTP, Gmail, Outlook, SendGrid, etc.
 * Documentation: https://nodemailer.com/
 */
const nodemailer = require('nodemailer');

// ============================================================================
// TRANSPORTER CONFIGURATION
// ============================================================================

/**
 * Email Transporter
 * 
 * WHY TRANSPORTER PATTERN?
 * - Reusable connection configuration
 * - Connection pooling for better performance
 * - Easy to switch email providers
 * 
 * GMAIL NOTES:
 * - 'service: gmail' automatically sets SMTP server and port
 * - For other providers, use host/port configuration instead
 * - App Password is required if 2FA is enabled on Gmail account
 * 
 * PRODUCTION CONSIDERATIONS:
 * - Use dedicated email service (SendGrid, Mailgun, AWS SES)
 * - Gmail has daily sending limits (~500/day for regular accounts)
 * - Consider email queuing for high-volume applications
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Shorthand for Gmail SMTP settings
    auth: {
        user: process.env.EMAIL_USER,  // Gmail address
        pass: process.env.EMAIL_PASS,  // App Password (16 chars, no spaces)
    },
});

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Send OTP verification email to patient
 * 
 * WHEN CALLED:
 * - From followUpRoutes.js when doctor initiates a follow-up
 * - Contains OTP and verification link
 * 
 * EMAIL CONTENT:
 * - Professional medical-themed design
 * - Clear OTP display with large font
 * - Direct link to verification page
 * - Security warnings about not sharing OTP
 * - Both HTML and plain text versions (for email client compatibility)
 * 
 * @param {Object} params - Email parameters
 * @param {string} params.to - Patient's email address
 * @param {string} params.otp - The 4-digit OTP code
 * @param {string} params.verificationLink - Full URL to verification page
 * @param {string} params.caseId - Case reference number for patient records
 * @returns {Promise<Object>} Result with success status and messageId/error
 * 
 * @example
 * await sendOTPEmail({
 *     to: 'patient@example.com',
 *     otp: '1234',
 *     verificationLink: 'http://localhost:3000/follow-up/abc123',
 *     caseId: 'CASE-2024-001'
 * });
 */
async function sendOTPEmail({ to, otp, verificationLink, caseId }) {
    /**
     * Mail Options
     * 
     * FORMAT:
     * - from: Sender name and email (displayed to recipient)
     * - to: Recipient email address
     * - subject: Email subject line
     * - html: Rich HTML email body (primary)
     * - text: Plain text fallback (for email clients without HTML support)
     * 
     * DESIGN NOTES:
     * - Inline CSS used (many email clients strip <style> tags)
     * - Gradient header matches NEST 2O branding
     * - OTP displayed prominently with large, spaced letters
     * - CTA button for direct access to verification page
     */
    const mailOptions = {
        // Sender identification
        from: `"NEST 2O Medical Follow-Up" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Your Medical Follow-Up Verification Code',
        
        // HTML email body with inline styling
        // IMPORTANT: Inline styles used because many email clients strip <style> tags
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Header with gradient background matching NEST 2O branding -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; text-align: center;">NEST 2O</h1>
                    <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 5px 0 0 0;">Medical Follow-Up System</p>
                </div>
                
                <!-- Main content area -->
                <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    
                    <p style="font-size: 16px; color: #333;">Your doctor has requested a follow-up regarding your recent prescription. Please use the verification code below to access your follow-up form:</p>
                    
                    <!-- OTP Display Box - Prominent and easy to read -->
                    <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Verification Code:</p>
                        <p style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0;">${otp}</p>
                    </div>
                    
                    <!-- Expiry warning -->
                    <p style="font-size: 14px; color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
                    
                    <!-- Call-to-Action Button -->
                    <div style="margin: 25px 0;">
                        <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold;">Open Follow-Up Form</a>
                    </div>
                    
                    <!-- Case reference for patient records -->
                    <p style="font-size: 12px; color: #999;">Case Reference: ${caseId}</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <!-- Security warning -->
                    <p style="font-size: 12px; color: #999;">
                        ⚠️ <strong>Important:</strong> Do not share this code with anyone. This is for your medical follow-up only.
                    </p>
                    
                    <p style="font-size: 12px; color: #999;">
                        If you did not expect this email, please ignore it or contact your healthcare provider.
                    </p>
                </div>
                
                <!-- Footer with disclaimer -->
                <div style="background: #333; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                    <p style="color: #999; font-size: 11px; margin: 0;">
                        This is an automated message from NEST 2O Medical Follow-Up System.<br>
                        For educational purposes only. Not for actual medical use.
                    </p>
                </div>
            </div>
        `,
        
        // Plain text fallback for email clients that don't support HTML
        text: `
NEST 2O Medical Follow-Up

Hello,

Your doctor has requested a follow-up regarding your recent prescription.

Your Verification Code: ${otp}

This code will expire in 10 minutes.

Verification Link: ${verificationLink}

Case Reference: ${caseId}

Important: Do not share this code with anyone.

If you did not expect this email, please ignore it.
        `,
    };

    try {
        // Send the email and get delivery info
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        // Common errors: invalid credentials, network issues, blocked by Gmail
        console.error('Failed to send email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify email service configuration
 * 
 * PURPOSE:
 * Tests the SMTP connection without sending an email.
 * Called during server startup to ensure email service is ready.
 * 
 * WHAT IT CHECKS:
 * - Valid credentials (EMAIL_USER and EMAIL_PASS)
 * - Network connectivity to Gmail SMTP
 * - Account permissions
 * 
 * COMMON FAILURE CAUSES:
 * - Missing or incorrect environment variables
 * - App Password not configured for 2FA accounts
 * - Gmail account security restrictions
 * 
 * @returns {Promise<boolean>} True if connection verified, false otherwise
 */
async function verifyConnection() {
    try {
        // transporter.verify() tests the SMTP connection
        await transporter.verify();
        console.log('✅ Email service ready');
        return true;
    } catch (error) {
        // Log error but don't crash - email might work later
        console.error('❌ Email service error:', error.message);
        return false;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    sendOTPEmail,      // Main OTP email function
    verifyConnection,  // Connection verification for startup check
};
