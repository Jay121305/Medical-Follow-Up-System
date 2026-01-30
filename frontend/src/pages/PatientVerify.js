/**
 * Patient OTP Verification Page (Step 4)
 * CRITICAL: No medical content until OTP verified
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyOTP } from '../services/api';
import OTPInput from '../components/OTPInput';
import Disclaimer from '../components/Disclaimer';

function PatientVerify() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleOTPComplete = async (otp) => {
        setLoading(true);
        setError(null);
        try {
            await verifyOTP(id, otp);
            navigate(`/follow-up/${id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '500px' }}>
                <Disclaimer />

                <div className="card text-center animate-slide-up">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔑</div>
                    <h1 className="mb-2">Enter Verification Code</h1>
                    <p className="text-muted mb-4">
                        Enter the 4-digit OTP sent to your email to access your follow-up form.
                    </p>

                    {error && <div className="alert alert-error mb-3"><span>❌</span><span>{error}</span></div>}

                    <div className="mb-4">
                        <OTPInput length={4} onComplete={handleOTPComplete} />
                    </div>

                    {loading && <p className="text-muted">Verifying...</p>}

                    <p className="text-sm text-muted">
                        OTP expires in 10 minutes. Check your spam folder if you don't see the email.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PatientVerify;
