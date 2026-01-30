/**
 * Success Page
 * Shown after patient submits follow-up
 */

import React from 'react';

function SuccessPage() {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '500px' }}>
                <div className="card text-center animate-slide-up">
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
                    <h1 className="mb-2">Follow-Up Submitted!</h1>
                    <p className="text-muted mb-4">
                        Your responses have been securely submitted to your doctor. They will review your information and may contact you if needed.
                    </p>
                    <div className="alert alert-success">
                        <span>🔒</span>
                        <span>Your data is now visible to your doctor as per your consent.</span>
                    </div>
                    <p className="text-sm text-muted mt-4">You may close this window.</p>
                </div>
            </div>
        </div>
    );
}

export default SuccessPage;
