/**
 * Email Service
 * Sends OTP emails using Nodemailer with Gmail
 */

const nodemailer = require('nodemailer');

// Create transporter - using Gmail
// You'll need to use an App Password if 2FA is enabled
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password, not regular password
    },
});

/**
 * Send OTP email to patient
 * @param {Object} params
 * @param {string} params.to - Patient's email address
 * @param {string} params.otp - The OTP code
 * @param {string} params.verificationLink - Link to verification page
 * @param {string} params.caseId - Case ID for reference
 */
async function sendOTPEmail({ to, otp, verificationLink, caseId }) {
    const mailOptions = {
        from: `"NEST 2O Medical Follow-Up" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Your Medical Follow-Up Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; text-align: center;">NEST 2O</h1>
                    <p style="color: rgba(255,255,255,0.9); text-align: center; margin: 5px 0 0 0;">Medical Follow-Up System</p>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    
                    <p style="font-size: 16px; color: #333;">Your doctor has requested a follow-up regarding your recent prescription. Please use the verification code below to access your follow-up form:</p>
                    
                    <div style="background: #fff; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Verification Code:</p>
                        <p style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 0;">${otp}</p>
                    </div>
                    
                    <p style="font-size: 14px; color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
                    
                    <div style="margin: 25px 0;">
                        <a href="${verificationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold;">Open Follow-Up Form</a>
                    </div>
                    
                    <p style="font-size: 12px; color: #999;">Case Reference: ${caseId}</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #999;">
                        ⚠️ <strong>Important:</strong> Do not share this code with anyone. This is for your medical follow-up only.
                    </p>
                    
                    <p style="font-size: 12px; color: #999;">
                        If you did not expect this email, please ignore it or contact your healthcare provider.
                    </p>
                </div>
                
                <div style="background: #333; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                    <p style="color: #999; font-size: 11px; margin: 0;">
                        This is an automated message from NEST 2O Medical Follow-Up System.<br>
                        For educational purposes only. Not for actual medical use.
                    </p>
                </div>
            </div>
        `,
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
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify email configuration
 */
async function verifyConnection() {
    try {
        await transporter.verify();
        console.log('✅ Email service ready');
        return true;
    } catch (error) {
        console.error('❌ Email service error:', error.message);
        return false;
    }
}

module.exports = {
    sendOTPEmail,
    verifyConnection,
};
