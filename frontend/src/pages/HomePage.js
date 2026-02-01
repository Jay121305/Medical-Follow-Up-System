/**
 * Home Page
 * Landing page with role-based navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';

function HomePage({ user }) {
    const navigate = useNavigate();

    const handleDoctorClick = () => {
        if (user?.role === 'doctor') {
            navigate('/doctor/dashboard');
        } else {
            navigate('/login');
        }
    };

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
                <Disclaimer />

                <div className="text-center animate-slide-up" style={{ marginTop: '4rem' }}>
                    <h1 style={{ marginBottom: '1rem' }}>
                        Welcome to <span className="text-primary">NEST 2O</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        A secure, consent-first medical follow-up system that puts patients in control of their health data.
                    </p>

                    <div className="grid grid-3" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        {/* Doctor Card */}
                        <div className="card">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👨‍⚕️</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>For Doctors</h3>
                            <p style={{ marginBottom: '1.5rem' }}>
                                Create prescriptions, manage medications, and review patient responses.
                            </p>
                            <button className="btn btn-primary btn-block" onClick={handleDoctorClick}>
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

                    {/* Features */}
                    <div style={{ marginTop: '4rem' }}>
                        <h2 style={{ marginBottom: '2rem' }}>How It Works</h2>
                        <div className="grid grid-3">
                            <div className="card">
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📋</div>
                                <h4>1. Prescription Created</h4>
                                <p className="text-sm text-muted">
                                    Doctor uploads prescription via OCR or manual entry.
                                </p>
                            </div>
                            <div className="card">
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📱</div>
                                <h4>2. Follow-Up Request</h4>
                                <p className="text-sm text-muted">
                                    Staff sends WhatsApp message with secure OTP to patient.
                                </p>
                            </div>
                            <div className="card">
                                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅</div>
                                <h4>3. Verify & Submit</h4>
                                <p className="text-sm text-muted">
                                    Patient answers AI-generated questions and submits response.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div style={{ marginTop: '4rem', padding: '2rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Built on Trust & Transparency</h3>
                        <div className="d-flex justify-center gap-3" style={{ flexWrap: 'wrap' }}>
                            <span className="badge badge-success">🔒 Consent-First Design</span>
                            <span className="badge badge-info">🤖 AI-Assisted, Human-Verified</span>
                            <span className="badge badge-warning">⚠️ No Medical Advice</span>
                            <span className="badge badge-success">✓ HIPAA-Conscious</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
