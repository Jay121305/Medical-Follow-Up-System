/**
 * ============================================================================
 * VerifyInfo.js - Patient Verification Information Page
 * ============================================================================
 * 
 * PURPOSE:
 * Information page for patients who need to access their follow-up form.
 * Explains the verification process and allows manual entry of follow-up ID.
 * 
 * WHEN USED:
 * - Patient navigates to site directly (not from link)
 * - Patient lost or doesn't have the direct link
 * - Patient wants to understand the process first
 * 
 * FEATURES:
 * - Step-by-step explanation of verification process
 * - Manual follow-up ID input
 * - Links to OTP verification page
 * 
 * USER FLOW:
 * 1. Patient reads how verification works
 * 2. Patient enters follow-up ID (from doctor's email)
 * 3. Clicks "Continue" → redirects to /verify/:id
 * 4. Then enters OTP on that page
 * 
 * NOTE:
 * Most patients will use the direct link from SMS/WhatsApp/Email
 * and skip this page entirely.
 * 
 * ============================================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';

/**
 * VerifyInfo Component
 * 
 * Static information page with ID input
 */
function VerifyInfo() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                <Disclaimer />

                <div className="card text-center animate-slide-up">
                    {/* Header */}
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
                    <h1 className="mb-2">Verify Your Follow-Up</h1>
                    <p className="text-muted mb-4">
                        To access your follow-up form, you need the verification link and OTP 
                        sent to your email by your doctor.
                    </p>

                    {/* ========== HOW IT WORKS ========== */}
                    {/* Step-by-step explanation of the process */}
                    <div className="alert alert-info text-left">
                        <span className="alert-icon">ℹ️</span>
                        <div>
                            <strong>How it works:</strong>
                            <ol style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
                                <li>Your doctor sends you an email with a secure link</li>
                                <li>Click the link or enter the follow-up ID</li>
                                <li>Enter the 4-digit OTP from your email</li>
                                <li>Review and confirm your follow-up information</li>
                            </ol>
                        </div>
                    </div>

                    {/* ========== MANUAL ID INPUT ========== */}
                    {/* For patients who have ID but not the full link */}
                    <div className="form-group mt-4">
                        <label className="form-label">Have a Follow-Up ID?</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your follow-up ID"
                            id="followUpIdInput"
                        />
                    </div>

                    {/* Submit button - navigates to OTP verification page */}
                    <button
                        className="btn btn-primary btn-block"
                        onClick={() => {
                            const id = document.getElementById('followUpIdInput').value;
                            if (id) {
                                // Redirect to OTP verification with the entered ID
                                navigate(`/verify/${id}`);
                            } else {
                                alert('Please enter a follow-up ID');
                            }
                        }}
                    >
                        Continue to Verification
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default VerifyInfo;
