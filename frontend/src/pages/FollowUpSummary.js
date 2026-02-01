/**
 * ============================================================================
 * FollowUpSummary.js - Doctor's View of Patient Summary (STEP 9)
 * ============================================================================
 * 
 * PURPOSE:
 * Display the patient-verified follow-up summary to the doctor.
 * This is STEP 9 in the flow - doctor reviews what patient submitted.
 * 
 * ⚠️ CRITICAL PRIVACY:
 * - Only accessible AFTER patient has given explicit consent
 * - Patient verified all responses before they became visible here
 * - Shows prescription details + AI-generated summary
 * 
 * FEATURES:
 * - Prescription details (medicine, dosage, duration)
 * - Patient-verified summary from AI
 * - Submission timestamp (audit trail)
 * - Close case action
 * 
 * DATA FLOW:
 * - Fetches summary via API (requires doctorId for authorization)
 * - API returns 403 if patient hasn't consented yet
 * - Doctor can "Close Case" when review is complete
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFollowUpSummary, closeFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

// Hardcoded doctor ID for development
// TODO: Replace with user.id from props in production
const DOCTOR_ID = 'doctor-001';

/**
 * FollowUpSummary Component
 * 
 * Uses follow-up ID from URL params
 */
function FollowUpSummary() {
    // Get follow-up ID from URL (/doctor/follow-ups/:id)
    const { id } = useParams();
    const navigate = useNavigate();
    
    // ========== STATE ==========
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [closing, setClosing] = useState(false);

    // Load summary on mount
    useEffect(() => { loadSummary(); }, [id]);

    /**
     * Fetch follow-up summary from backend
     * 
     * SECURITY: API requires doctorId to verify ownership
     * Will return 403 if patient hasn't consented
     */
    const loadSummary = async () => {
        try {
            const result = await getFollowUpSummary(id, DOCTOR_ID);
            setSummary(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle "Close Case" action
     * 
     * FLOW:
     * 1. Confirm with doctor
     * 2. Send close request to backend
     * 3. Navigate back to follow-ups list
     */
    const handleClose = async () => {
        if (!window.confirm('Are you sure you want to close this case?')) return;
        
        setClosing(true);
        try {
            await closeFollowUp(id, DOCTOR_ID, 'Reviewed and closed');
            navigate('/doctor/follow-ups');
        } catch (err) {
            alert('Failed to close: ' + err.message);
        } finally {
            setClosing(false);
        }
    };

    // ========== LOADING STATE ==========
    if (loading) return <Loading message="Loading summary..." />;
    
    // ========== ERROR STATE ==========
    if (error) return (
        <div className="page">
            <div className="container">
                <div className="alert alert-error">{error}</div>
            </div>
        </div>
    );

    // ========== RENDER ==========
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <Disclaimer />

                {/* ========== HEADER ========== */}
                <div className="d-flex justify-between align-center mb-4">
                    <div>
                        <h1>Follow-Up Summary</h1>
                        <p className="text-muted">Case ID: {summary?.caseId}</p>
                    </div>
                    {/* Status badge */}
                    <span className={`badge ${summary?.status === 'closed' ? 'badge-info' : 'badge-success'}`}>
                        {summary?.status === 'closed' ? 'Closed' : 'Ready for Review'}
                    </span>
                </div>

                {/* ========== PRESCRIPTION DETAILS ========== */}
                <div className="card mb-3">
                    <h3 className="mb-2">💊 Prescription</h3>
                    <div style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', padding: '1rem', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                            <thead>
                                <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.85rem', fontSize: '0.9rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '40%' }}>
                                        Medicine Name
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '0.85rem', fontSize: '0.9rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                                        Dosage Instructions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    {/* Medicine name - highlighted */}
                                    <td style={{ padding: '0.85rem', fontWeight: '600', color: 'var(--color-primary)', fontSize: '1.05rem', verticalAlign: 'top' }}>
                                        {summary?.prescription?.medicineName}
                                    </td>
                                    {/* Dosage and duration */}
                                    <td style={{ padding: '0.85rem', verticalAlign: 'top' }}>
                                        <div style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
                                            {summary?.prescription?.dosage}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            Duration: {summary?.prescription?.duration}
                                        </div>
                                        {summary?.prescription?.condition && (
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                Condition: {summary?.prescription?.condition}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ========== PATIENT SUMMARY ========== */}
                {/* This is the AI-generated, patient-verified summary */}
                <div className="card mb-3">
                    <h3 className="mb-2">Patient-Verified Summary</h3>
                    {/* Pre-formatted text preserves line breaks from AI */}
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                        {summary?.summary || 'No summary available'}
                    </div>
                    {/* Submission timestamp for audit trail */}
                    <p className="text-muted text-sm mt-3">
                        Submitted: {summary?.submittedAt ? new Date(summary.submittedAt).toLocaleString() : 'N/A'}
                    </p>
                </div>

                {/* ========== ACTION BUTTONS ========== */}
                <div className="d-flex gap-2">
                    <button className="btn btn-secondary" onClick={() => navigate('/doctor/follow-ups')}>
                        Back to List
                    </button>
                    {/* Only show Close button if not already closed */}
                    {summary?.status !== 'closed' && (
                        <button 
                            className="btn btn-success" 
                            onClick={handleClose} 
                            disabled={closing}
                        >
                            {closing ? 'Closing...' : 'Close Case'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default FollowUpSummary;
