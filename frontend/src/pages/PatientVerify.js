/**
 * ============================================================================
 * PatientVerify.js - OTP Verification Page (STEP 4)
 * ============================================================================
 * 
 * PURPOSE:
 * Patient enters the OTP received via SMS/WhatsApp/Email to access their
 * follow-up form. This is a critical security gate in the patient flow.
 * 
 * CRITICAL SECURITY:
 * - NO medical content shown until OTP verified
 * - OTP expires after 10 minutes
 * - Rate limiting on backend prevents brute force
 * - Successful verification unlocks the follow-up form
 * 
 * PATIENT FLOW CONTEXT:
 * STEP 3: Patient receives SMS/WhatsApp with OTP and link
 * STEP 4: THIS PAGE - Patient enters OTP ←
 * STEP 5: On success, redirect to PatientFollowUp page
 * 
 * URL PATTERN:
 * /verify/:id where :id is the follow-up document ID
 * (ID is embedded in the link sent to patient)
 * 
 * ============================================================================
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyOTP } from '../services/api';
import OTPInput from '../components/OTPInput';
import Disclaimer from '../components/Disclaimer';

/**
 * PatientVerify Component
 * 
 * Uses follow-up ID from URL params
 * On successful OTP verification, redirects to follow-up form
 */
function PatientVerify() {
    // Get follow-up ID from URL (/verify/:id)
    const { id } = useParams();
    
    // For navigation after successful verification
    const navigate = useNavigate();
    
    // ========== STATE ==========
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    /**
     * Handle OTP completion
     * Called by OTPInput component when all 4 digits are entered
     * 
     * FLOW:
     * 1. Call backend to verify OTP
     * 2. On success: redirect to follow-up form
     * 3. On failure: show error message
     * 
     * @param {string} otp - 4-digit OTP string
     */
    const handleOTPComplete = async (otp) => {
        setLoading(true);
        setError(null);
        
        try {
            // Verify OTP with backend
            // This marks the follow-up as OTP verified
            await verifyOTP(id, otp);
            
            // SUCCESS: Redirect to follow-up form
            // Patient can now answer questions
            navigate(`/follow-up/${id}`);
            
        } catch (err) {
            // Show error (wrong OTP, expired, etc.)
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            {/* Centered, narrow container */}
            <div className="container" style={{ maxWidth: '500px' }}>
                <Disclaimer />

                <div className="card text-center animate-slide-up">
                    {/* ========== HEADER ========== */}
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔑</div>
                    <h1 className="mb-2">Enter Verification Code</h1>
                    <p className="text-muted mb-4">
                        Enter the 4-digit OTP sent to your email to access your follow-up form.
                    </p>

                    {/* ========== ERROR DISPLAY ========== */}
                    {error && (
                        <div className="alert alert-error mb-3">
                            <span>❌</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ========== OTP INPUT ========== */}
                    {/* Custom 4-box OTP input with auto-focus */}
                    <div className="mb-4">
                        <OTPInput length={4} onComplete={handleOTPComplete} />
                    </div>

                    {/* ========== LOADING STATE ========== */}
                    {loading && <p className="text-muted">Verifying...</p>}

                    {/* ========== HELP TEXT ========== */}
                    <p className="text-sm text-muted">
                        OTP expires in 10 minutes. Check your spam folder if you don't see the email.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default PatientVerify;
