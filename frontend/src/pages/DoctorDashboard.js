/**
 * ============================================================================
 * DoctorDashboard.js - Doctor's Main Dashboard
 * ============================================================================
 * 
 * PURPOSE:
 * Primary landing page for logged-in doctors. Provides at-a-glance overview
 * of prescriptions, follow-ups, and quick actions.
 * 
 * FEATURES:
 * - Statistics cards showing key metrics
 * - Quick action cards for common tasks
 * - Recent follow-ups list (top 5)
 * 
 * STATISTICS TRACKED:
 * - Total Prescriptions: All prescriptions created by this doctor
 * - Pending: Follow-ups waiting for patient response
 * - Ready for Review: Patient has submitted, doctor can view
 * - Completed: Cases that have been closed
 * 
 * QUICK ACTIONS:
 * - Create Prescription: New prescription (with OCR support)
 * - View Prescriptions: List all prescriptions
 * - Follow-Up Reports: View patient responses
 * 
 * DATA FLOW:
 * - Loads prescriptions and follow-ups on mount
 * - Calculates statistics from loaded data
 * - Updates automatically when doctor returns to dashboard
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPrescriptions, getDoctorFollowUps } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

/**
 * DoctorDashboard Component
 * 
 * @param {object} props
 * @param {object} props.user - Current logged-in doctor
 */
function DoctorDashboard({ user }) {
    // Navigation hook for button clicks
    const navigate = useNavigate();
    
    // ========== STATE ==========
    
    /**
     * Statistics object for dashboard cards
     */
    const [stats, setStats] = useState({ 
        totalPrescriptions: 0, 
        pendingFollowUps: 0, 
        completedFollowUps: 0, 
        readyForReview: 0 
    });
    
    /**
     * Recent follow-ups for quick view
     */
    const [recentFollowUps, setRecentFollowUps] = useState([]);
    
    /**
     * Loading state while fetching data
     */
    const [loading, setLoading] = useState(true);

    // Get doctor ID from user object (fallback for development)
    const doctorId = user?.id || 'doctor-001';

    // ========== DATA LOADING ==========
    
    /**
     * Load dashboard data on mount and when doctorId changes
     */
    useEffect(() => {
        loadDashboardData();
    }, [doctorId]);

    /**
     * Fetch prescriptions and follow-ups, calculate statistics
     * 
     * FLOW:
     * 1. Fetch all prescriptions for this doctor
     * 2. Fetch all follow-ups for this doctor
     * 3. Calculate statistics by status
     * 4. Store recent follow-ups for display
     */
    const loadDashboardData = async () => {
        try {
            // Fetch data in parallel
            const prescriptionsResult = await getDoctorPrescriptions(doctorId);
            const followUpsResult = await getDoctorFollowUps(doctorId);
            
            const prescriptions = prescriptionsResult.data || [];
            const followUps = followUpsResult.data || [];

            // Calculate statistics from follow-up statuses
            setStats({
                totalPrescriptions: prescriptions.length,
                // Pending: Waiting for patient to verify OTP and respond
                pendingFollowUps: followUps.filter(f => f.status === 'pending_verification').length,
                // Completed: Doctor has closed the case
                completedFollowUps: followUps.filter(f => f.status === 'closed').length,
                // Ready for Review: Patient submitted, doctor can view summary
                readyForReview: followUps.filter(f => f.status === 'ready_for_review' || f.status === 'submitted').length,
            });
            
            // Store top 5 recent follow-ups
            setRecentFollowUps(followUps.slice(0, 5));
            
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ========== LOADING STATE ==========
    if (loading) return <Loading message="Loading dashboard..." />;

    // ========== RENDER ==========
    return (
        <div className="page">
            <div className="container">
                <Disclaimer />
                
                {/* ========== HEADER WITH WELCOME + ACTION ========== */}
                <div className="d-flex justify-between align-center mb-4">
                    <div>
                        <h1>Welcome, Dr. {user?.name || 'Doctor'}</h1>
                        <p className="text-muted mb-0">{user?.specialization || 'General Practitioner'}</p>
                    </div>
                    {/* Primary action button */}
                    <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions/new')}>
                        + New Prescription
                    </button>
                </div>

                {/* ========== STATISTICS CARDS ========== */}
                {/* 4-column grid showing key metrics */}
                <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {/* Total Prescriptions */}
                    <div className="card text-center">
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                            {stats.totalPrescriptions}
                        </div>
                        <p className="text-muted mb-0">Prescriptions</p>
                    </div>
                    
                    {/* Pending Follow-ups */}
                    <div className="card text-center">
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-warning)' }}>
                            {stats.pendingFollowUps}
                        </div>
                        <p className="text-muted mb-0">Pending</p>
                    </div>
                    
                    {/* Ready for Review */}
                    <div className="card text-center">
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-success)' }}>
                            {stats.readyForReview}
                        </div>
                        <p className="text-muted mb-0">Ready for Review</p>
                    </div>
                    
                    {/* Completed */}
                    <div className="card text-center">
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                            {stats.completedFollowUps}
                        </div>
                        <p className="text-muted mb-0">Completed</p>
                    </div>
                </div>

                {/* ========== QUICK ACTION CARDS ========== */}
                {/* 3-column grid with clickable action cards */}
                <div className="grid grid-3 mb-4">
                    {/* Create Prescription */}
                    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/prescriptions/new')}>
                        <div style={{ fontSize: '2rem' }}>📝</div>
                        <h4>Create Prescription</h4>
                        <p className="text-muted text-sm">Add new prescription with OCR or voice</p>
                    </div>
                    
                    {/* View Prescriptions */}
                    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/prescriptions')}>
                        <div style={{ fontSize: '2rem' }}>📋</div>
                        <h4>View Prescriptions</h4>
                        <p className="text-muted text-sm">Manage your prescriptions</p>
                    </div>
                    
                    {/* Follow-up Reports */}
                    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/follow-ups')}>
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <h4>Follow-Up Reports</h4>
                        <p className="text-muted text-sm">View patient responses</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default DoctorDashboard;
