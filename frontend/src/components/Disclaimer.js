/**
 * ============================================================================
 * Disclaimer.js - Medical Disclaimer Component
 * ============================================================================
 * 
 * PURPOSE:
 * Display prominent medical disclaimers throughout the application.
 * Required for any healthcare-related application to:
 * 1. Protect users from misinterpreting AI suggestions as medical advice
 * 2. Clarify the system's role (data collection, NOT diagnosis)
 * 3. Encourage users to consult healthcare providers
 * 
 * LEGAL IMPORTANCE:
 * Medical applications MUST clearly state they don't provide medical advice.
 * This component ensures consistent disclaimer messaging across the app.
 * 
 * VARIANTS:
 * - 'banner': Full-width warning banner (for top of pages)
 * - 'minimal': Small footer text (for forms)
 * - default: Alert box format (for important sections)
 * 
 * USAGE:
 * <Disclaimer />                    // Default alert box
 * <Disclaimer variant="banner" />   // Full warning banner
 * <Disclaimer variant="minimal" />  // Small footer text
 * 
 * ============================================================================
 */

import React from 'react';

/**
 * Disclaimer Component
 * 
 * @param {object} props
 * @param {string} props.variant - Display variant: 'banner', 'minimal', or default
 * @returns {JSX.Element} Appropriate disclaimer component
 */
function Disclaimer({ variant = 'banner' }) {
    
    // ========== BANNER VARIANT ==========
    // Full-width warning banner - used at top of patient-facing pages
    if (variant === 'banner') {
        return (
            <div className="disclaimer-banner">
                {/* Warning icon for visual prominence */}
                <span className="disclaimer-banner-icon">⚠️</span>
                <p className="disclaimer-banner-text">
                    <strong>Medical Disclaimer:</strong> This system is for follow-up data collection only.
                    It does not provide medical advice, diagnosis, or treatment recommendations.
                    Always consult your healthcare provider for medical decisions.
                </p>
            </div>
        );
    }

    // ========== MINIMAL VARIANT ==========
    // Small footer text - used at bottom of forms where space is limited
    if (variant === 'minimal') {
        return (
            <p style={{ 
                textAlign: 'center', 
                fontSize: '0.75rem', 
                color: '#999', 
                marginTop: '2rem',
                padding: '0 1rem',
            }}>
                This form collects follow-up information only. Not a substitute for medical advice.
            </p>
        );
    }

    // ========== DEFAULT VARIANT ==========
    // Alert box format - used in important sections (e.g., before AI-generated content)
    // Specifically addresses AI limitations
    return (
        <div className="alert alert-warning">
            {/* Warning icon */}
            <span className="alert-icon">⚠️</span>
            <div>
                <strong>Important Notice</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    {/* Key points:
                        1. System only collects information (doesn't diagnose)
                        2. AI suggestions may not be accurate
                        3. Patient is the authority on their health */}
                    This follow-up form collects information about your treatment experience.
                    The AI-generated suggestions are for convenience only and may not be accurate.
                    You are the final authority on your own health information.
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default Disclaimer;
