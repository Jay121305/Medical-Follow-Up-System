/**
 * ============================================================================
 * FollowUpsList.js - Doctor's Follow-Ups List Page
 * ============================================================================
 * 
 * PURPOSE:
 * Display all follow-ups initiated by a doctor with their current status.
 * Allows doctor to view summaries for submitted follow-ups.
 * 
 * FOLLOW-UP STATUSES:
 * - pending_verification: Patient hasn't verified OTP yet
 * - submitted/ready_for_review: Patient submitted, doctor can view
 * - closed: Doctor has reviewed and closed the case
 * 
 * FEATURES:
 * - Table view of all follow-ups
 * - Status badges with color coding
 * - Click to view summary (when available)
 * - Empty state with call-to-action
 * 
 * DATA FLOW:
 * - Fetches follow-ups for logged-in doctor
 * - Shows "View Summary" only if patient has consented
 * - Links to FollowUpSummary page for details
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorFollowUps } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

/**
 * FollowUpsList Component
 * 
 * @param {object} props
 * @param {object} props.user - Current logged-in doctor
 */
function FollowUpsList({ user }) {
    // Navigation hook
    const navigate = useNavigate();
    
    // ========== STATE ==========
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Get doctor ID (fallback for development)
    const doctorId = user?.id || 'doctor-001';

    // Load follow-ups on mount
    useEffect(() => { loadFollowUps(); }, [doctorId]);

    /**
     * Fetch all follow-ups for this doctor from backend
     */
    const loadFollowUps = async () => {
        try {
            const result = await getDoctorFollowUps(doctorId);
            setFollowUps(result.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get appropriate status badge based on follow-up state
     * 
     * @param {string} status - Follow-up status string
     * @param {boolean} hasSummary - Whether patient has submitted
     * @returns {JSX.Element} Styled badge element
     */
    const getStatusBadge = (status, hasSummary) => {
        // Closed - doctor has reviewed and closed
        if (status === 'closed') return <span className="badge badge-info">Closed</span>;
        // Has summary - patient submitted, ready for doctor review
        if (hasSummary) return <span className="badge badge-success">Ready for Review</span>;
        // Default - still waiting for patient
        return <span className="badge badge-warning">Awaiting Patient</span>;
    };

    // ========== LOADING STATE ==========
    if (loading) return <Loading message="Loading follow-ups..." />;

    // ========== RENDER ==========
    return (
        <div className="page">
            <div className="container">
                <Disclaimer />
                <h1 className="mb-4">Follow-Up Reports</h1>

                {/* ========== EMPTY STATE ========== */}
                {followUps.length === 0 ? (
                    <div className="card text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3>No Follow-Ups Yet</h3>
                        <p className="text-muted">Follow-ups will appear here after you send them from prescriptions.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions')}>
                            View Prescriptions
                        </button>
                    </div>
                ) : (
                    /* ========== FOLLOW-UPS TABLE ========== */
                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Case ID</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {followUps.map((f) => (
                                        <tr key={f.id}>
                                            {/* Case ID - unique identifier */}
                                            <td><strong>{f.caseId}</strong></td>
                                            
                                            {/* Status badge */}
                                            <td>{getStatusBadge(f.status, f.hasSummary)}</td>
                                            
                                            {/* Creation date */}
                                            <td className="text-muted">
                                                {new Date(f.createdAt).toLocaleDateString()}
                                            </td>
                                            
                                            {/* Action - View Summary or Pending message */}
                                            <td>
                                                {f.hasSummary ? (
                                                    // Patient submitted - can view summary
                                                    <button 
                                                        className="btn btn-sm btn-primary" 
                                                        onClick={() => navigate(`/doctor/follow-ups/${f.id}`)}
                                                    >
                                                        View Summary
                                                    </button>
                                                ) : (
                                                    // Still waiting for patient
                                                    <span className="text-muted text-sm">
                                                        Pending patient response
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default FollowUpsList;
