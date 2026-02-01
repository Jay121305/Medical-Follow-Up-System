/**
 * ============================================================================
 * HomePage.js - Landing Page
 * ============================================================================
 * 
 * PURPOSE:
 * Primary entry point for users. Provides navigation to different sections
 * based on user role (Doctor, Staff, Patient).
 * 
 * USER JOURNEYS FROM THIS PAGE:
 * - Doctor (logged in): → Dashboard
 * - Doctor (not logged in): → Login → Dashboard
 * - Staff (logged in): → Dashboard
 * - Staff (not logged in): → Login → Dashboard
 * - Patient: → Verify Info page → OTP verification
 * 
 * SECTIONS:
 * 1. Disclaimer Banner - Required medical disclaimer
 * 2. Hero Section - App title and description
 * 3. Role Cards - Navigation cards for Doctor, Staff, Patient
 * 4. How It Works - 3-step process explanation
 * 5. Trust Indicators - Badges showing system principles
 * 
 * DESIGN PRINCIPLES:
 * - Consent-first messaging throughout
 * - Clear role-based navigation
 * - Emphasize AI assists but humans decide
 * 
 * ============================================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';

/**
 * HomePage Component
 * 
 * @param {object} props
 * @param {object|null} props.user - Current logged in user or null
 */
function HomePage({ user }) {
    // React Router hook for programmatic navigation
    const navigate = useNavigate();

    /**
     * Handle Doctor card click
     * - If logged in as doctor: go directly to dashboard
     * - Otherwise: redirect to login page
     */
    const handleDoctorClick = () => {
        if (user?.role === 'doctor') {
            navigate('/doctor/dashboard');
        } else {
            navigate('/login');
        }
    };

    /**
     * Handle Staff card click
     * - If logged in as staff: go directly to dashboard
     * - Otherwise: redirect to login page
     */
    const handleStaffClick = () => {
        if (user?.role === 'staff') {
            navigate('/staff/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="page">
            <div className="container">
                {/* ========== MEDICAL DISCLAIMER ========== */}
                {/* Always shown at top - legal requirement */}
                <Disclaimer />

                {/* ========== HERO SECTION ========== */}
                <div className="text-center animate-slide-up" style={{ marginTop: '4rem' }}>
                    <h1 style={{ marginBottom: '1rem' }}>
                        Welcome to <span className="text-primary">NEST 2O</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        A secure, consent-first medical follow-up system that puts patients in control of their health data.
                    </p>

                    {/* ========== ROLE-BASED NAVIGATION CARDS ========== */}
                    <div className="grid grid-3" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        
                        {/* Doctor Card */}
                        <div className="card">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍⚕️</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>For Doctors</h3>
                            <p style={{ marginBottom: '1.5rem' }}>
                                Create prescriptions, manage medications, and review patient responses.
                            </p>
                            <button className="btn btn-primary btn-block" onClick={handleDoctorClick}>
                                {/* Button text changes based on login state */}
                                {user?.role === 'doctor' ? 'Go to Dashboard' : 'Doctor Login'}
                            </button>
                        </div>

                        {/* Staff Card */}
                        <div className="card">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👩‍💼</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>For Staff</h3>
                            <p style={{ marginBottom: '1.5rem' }}>
                                Send follow-up requests and manage patient communications.
                            </p>
                            <button className="btn btn-secondary btn-block" onClick={handleStaffClick}>
                                {user?.role === 'staff' ? 'Go to Dashboard' : 'Staff Login'}
                            </button>
                        </div>

                        {/* Patient Card */}
                        {/* Note: Patients don't log in - they use OTP from SMS/WhatsApp */}
                        <div className="card">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>For Patients</h3>
                            <p style={{ marginBottom: '1.5rem' }}>
                                Received an OTP? Verify your identity and complete your follow-up.
                            </p>
                            <button
                                className="btn btn-outline btn-block"
                                onClick={() => navigate('/verify-info')}
                            >
                                Verify Follow-Up
                            </button>
                        </div>
                    </div>

                    {/* ========== ADVERSE EVENT REPORTING ========== */}
                    {/* Important link for reporting medicine reactions */}
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <button
                            className="btn btn-outline"
                            onClick={() => navigate('/report-adverse-event')}
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                        >
                            ⚠️ Report Medicine Side Effect / Adverse Reaction
                        </button>
                    </div>

                    {/* ========== HOW IT WORKS SECTION ========== */}
                    {/* Explains the 3-step process */}
                    <div style={{ marginTop: '4rem' }}>
                        <h2 style={{ marginBottom: '2rem' }}>How It Works</h2>
                        <div className="grid grid-3">
                            {/* Step 1: Prescription */}
                            <div className="card">
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                                <h4>1. Prescription Created</h4>
                                <p className="text-sm text-muted">
                                    Doctor uploads prescription via OCR or manual entry.
                                </p>
                            </div>
                            
                            {/* Step 2: Follow-up Request */}
                            <div className="card">
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
                                <h4>2. Follow-Up Request</h4>
                                <p className="text-sm text-muted">
                                    Staff sends WhatsApp message with secure OTP to patient.
                                </p>
                            </div>
                            
                            {/* Step 3: Patient Response */}
                            <div className="card">
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                                <h4>3. Verify & Submit</h4>
                                <p className="text-sm text-muted">
                                    Patient answers AI-generated questions and submits response.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ========== TRUST INDICATORS ========== */}
                    {/* Badges highlighting key principles */}
                    <div style={{ marginTop: '4rem', padding: '2rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Built on Trust & Transparency</h3>
                        <div className="d-flex justify-center gap-3" style={{ flexWrap: 'wrap' }}>
                            {/* Consent-first design */}
                            <span className="badge badge-success">🔒 Consent-First Design</span>
                            {/* AI assists but humans verify */}
                            <span className="badge badge-info">🤖 AI-Assisted, Human-Verified</span>
                            {/* No medical advice - disclaimer reminder */}
                            <span className="badge badge-warning">⚠️ No Medical Advice</span>
                            {/* HIPAA-conscious design */}
                            <span className="badge badge-success">✓ HIPAA-Conscious</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default HomePage;
