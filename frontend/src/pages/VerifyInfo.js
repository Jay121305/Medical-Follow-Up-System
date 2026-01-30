/**
 * Patient Verify Info Page
 * Info page for patients before OTP verification
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';

function VerifyInfo() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                <Disclaimer />

                <div className="card text-center animate-slide-up">
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
                    <h1 className="mb-2">Verify Your Follow-Up</h1>
                    <p className="text-muted mb-4">
                        To access your follow-up form, you need the verification link and OTP sent to your email by your doctor.
                    </p>

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

                    <div className="form-group mt-4">
                        <label className="form-label">Have a Follow-Up ID?</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your follow-up ID"
                            id="followUpIdInput"
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-block"
                        onClick={() => {
                            const id = document.getElementById('followUpIdInput').value;
                            if (id) navigate(`/verify/${id}`);
                            else alert('Please enter a follow-up ID');
                        }}
                    >
                        Continue to Verification
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VerifyInfo;
