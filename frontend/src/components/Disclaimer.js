/**
 * Medical Disclaimer Component
 * Prominent disclaimer as per requirements
 */

import React from 'react';

function Disclaimer({ variant = 'banner' }) {
    if (variant === 'banner') {
        return (
            <div className="disclaimer-banner">
                <span className="disclaimer-banner-icon">⚠️</span>
                <p className="disclaimer-banner-text">
                    <strong>Medical Disclaimer:</strong> This system is for follow-up data collection only.
                    It does not provide medical advice, diagnosis, or treatment recommendations.
                    Always consult your healthcare provider for medical decisions.
                </p>
            </div>
        );
    }

    return (
        <div className="alert alert-warning">
            <span className="alert-icon">⚠️</span>
            <div>
                <strong>Important Notice</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    This follow-up form collects information about your treatment experience.
                    The AI-generated suggestions are for convenience only and may not be accurate.
                    You are the final authority on your own health information.
                </p>
            </div>
        </div>
    );
}

export default Disclaimer;
