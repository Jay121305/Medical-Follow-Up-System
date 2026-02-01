/**
 * ============================================================================
 * StaffDashboard.js - Hospital Staff Management Dashboard
 * ============================================================================
 * 
 * PURPOSE:
 * Central dashboard for hospital staff to manage follow-ups across all doctors.
 * Staff can send follow-ups on behalf of doctors, view all prescriptions,
 * and filter by doctor to organize their work.
 * 
 * STAFF vs DOCTOR ROLE DIFFERENCES:
 * - Doctors: See only THEIR prescriptions
 * - Staff: See ALL prescriptions from ALL doctors
 * - Staff: Can filter by doctor to focus on specific workloads
 * - Both: Can send follow-ups (initiates STEP 3)
 * 
 * FEATURES:
 * - Dashboard statistics (total, sent, pending)
 * - Filter prescriptions by doctor
 * - Send follow-ups via WhatsApp/SMS
 * - Manual fallback with OTP sharing
 * - View all prescription details
 * 
 * WORKFLOW:
 * 1. Staff logs in → sees all prescriptions
 * 2. Can filter by doctor to organize work
 * 3. Click "Send Follow-up" → triggers STEP 3
 * 4. Backend sends WhatsApp/SMS to patient
 * 5. If delivery fails, shows manual sharing info
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

/**
 * StaffDashboard Component
 * 
 * Provides staff with a comprehensive view of all prescriptions
 * and the ability to send follow-ups on behalf of doctors.
 */
function StaffDashboard() {
    const navigate = useNavigate();
    
    // ========== STATE ==========
    const [user, setUser] = useState(null);                    // Current logged-in staff user
    const [prescriptions, setPrescriptions] = useState([]);    // All prescriptions (all doctors)
    const [doctors, setDoctors] = useState([]);                // List of doctors for filter dropdown
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState(null);          // ID of prescription being sent
    const [followUpResult, setFollowUpResult] = useState(null); // Result of follow-up send attempt
    const [selectedDoctor, setSelectedDoctor] = useState('all'); // Filter: 'all' or doctor ID

    /**
     * Load user from localStorage and fetch initial data on mount
     */
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        loadData();
    }, []);

    /**
     * Fetch doctors list and all prescriptions
     * Staff can see ALL prescriptions unlike doctors who see only their own
     */
    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // ---------- Load doctors for filter dropdown ----------
            const doctorsRes = await fetch('http://localhost:5000/api/auth/doctors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const doctorsData = await doctorsRes.json();
            if (doctorsData.success) {
                setDoctors(doctorsData.data);
            }

            // ---------- Load ALL prescriptions ----------
            // Staff sees all prescriptions from all doctors
            const prescRes = await fetch('http://localhost:5000/api/prescriptions/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const prescData = await prescRes.json();
            if (prescData.success) {
                setPrescriptions(prescData.data || []);
            }
        } catch (err) {
            console.error('Load data error:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Send follow-up request for a prescription (STEP 3)
     * 
     * FLOW:
     * 1. Call backend to create follow-up
     * 2. Backend generates OTP and attempts WhatsApp/SMS delivery
     * 3. Show result with success or manual fallback info
     * 
     * @param {object} prescription - Prescription to send follow-up for
     */
    const handleSendFollowUp = async (prescription) => {
        setSendingId(prescription.id);
        setFollowUpResult(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/follow-ups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    prescriptionId: prescription.id,
                    doctorId: prescription.doctorId,  // Staff sends on behalf of doctor
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                // ========== SUCCESS: Show delivery status ==========
                setFollowUpResult({
                    success: true,
                    whatsappSent: result.data.whatsappSent,
                    smsSent: result.data.smsSent,
                    patientPhone: result.data.patientPhone,
                    otp: result.data.otp,
                    followUpId: result.data.followUpId,
                    verificationLink: result.data.verificationLink,
                });
                loadData(); // Refresh list to update status badges
            } else {
                // ========== FAILURE: Show error ==========
                setFollowUpResult({
                    success: false,
                    error: result.error,
                });
            }
        } catch (err) {
            setFollowUpResult({
                success: false,
                error: err.message,
            });
        } finally {
            setSendingId(null);
        }
    };

    /**
     * Copy text to clipboard helper
     */
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    /**
     * Filter prescriptions by selected doctor
     * Returns all if 'all' selected, otherwise filters by doctorId
     */
    const filteredPrescriptions = selectedDoctor === 'all'
        ? prescriptions
        : prescriptions.filter(p => p.doctorId === selectedDoctor);

    // ========== LOADING STATE ==========
    if (loading) return <Loading message="Loading dashboard..." />;

    return (
        <div className="page">
            <div className="container">
                <Disclaimer />

                {/* ========== HEADER ========== */}
                <div className="d-flex justify-between align-center mb-4">
                    <div>
                        <h1>👩‍💼 Staff Dashboard</h1>
                        <p className="text-muted">Welcome, {user?.name || 'Staff Member'}</p>
                    </div>
                </div>

                {/* ========== STATISTICS CARDS ========== */}
                {/* Overview of prescription and follow-up status */}
                <div className="grid grid-3 mb-4" style={{ gap: '1rem' }}>
                    {/* Total Prescriptions */}
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{prescriptions.length}</div>
                        <div>Total Prescriptions</div>
                    </div>
                    
                    {/* Follow-ups Sent - waiting for patient response */}
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#fff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {prescriptions.filter(p => p.status === 'follow_up_sent').length}
                        </div>
                        <div>Follow-ups Sent</div>
                    </div>
                    
                    {/* Pending - need to send follow-ups */}
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {prescriptions.filter(p => p.status === 'active').length}
                        </div>
                        <div>Pending Follow-ups</div>
                    </div>
                </div>

                {/* ========== FOLLOW-UP RESULT MODAL ========== */}
                {/* Shows after sending follow-up - success or manual fallback */}
                {followUpResult && (
                    <div className="card mb-4" style={{ 
                        border: `2px solid ${followUpResult.success ? 'var(--color-success)' : 'var(--color-error)'}`,
                        background: followUpResult.success ? '#d4edda' : '#f8d7da'
                    }}>
                        <div className="d-flex justify-between align-center mb-2">
                            <h3 style={{ margin: 0 }}>
                                {followUpResult.success ? '✅ Follow-up Sent!' : '❌ Failed to Send'}
                            </h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setFollowUpResult(null)}>✕ Close</button>
                        </div>
                        
                        {followUpResult.success ? (
                            // ---------- Success: Show delivery status and manual fallback ----------
                            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                                {/* Delivery channel status indicators */}
                                <div className="mb-2">
                                    <strong>📱 WhatsApp:</strong> {followUpResult.whatsappSent ? '✅ Sent' : '❌ Failed'}
                                </div>
                                <div className="mb-2">
                                    <strong>📲 SMS OTP:</strong> {followUpResult.smsSent ? '✅ Sent' : '❌ Failed'}
                                </div>
                                <div className="mb-2">
                                    <strong>Patient Phone:</strong> {followUpResult.patientPhone}
                                </div>
                                
                                {/* OTP for manual sharing if delivery failed */}
                                {followUpResult.otp && (
                                    <div className="mb-2">
                                        <strong>OTP:</strong> 
                                        <code style={{ background: '#e9ecef', padding: '0.25rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                            {followUpResult.otp}
                                        </code>
                                        <button className="btn btn-sm btn-primary ml-2" onClick={() => copyToClipboard(followUpResult.otp)}>Copy</button>
                                    </div>
                                )}
                                
                                {/* Verification link for manual sharing */}
                                <div className="mb-2">
                                    <strong>Verification Link:</strong>
                                    <div style={{ wordBreak: 'break-all', background: '#e9ecef', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                                        {followUpResult.verificationLink}
                                    </div>
                                    <button className="btn btn-sm btn-primary mt-2" onClick={() => copyToClipboard(followUpResult.verificationLink)}>Copy Link</button>
                                </div>
                            </div>
                        ) : (
                            // ---------- Failure: Show error message ----------
                            <p className="text-error">{followUpResult.error}</p>
                        )}
                    </div>
                )}

                {/* ========== DOCTOR FILTER ========== */}
                {/* Filter prescriptions by doctor - staff can see all doctors */}
                <div className="card mb-4">
                    <div className="d-flex align-center gap-2">
                        <label style={{ fontWeight: '600' }}>Filter by Doctor:</label>
                        <select
                            className="form-input"
                            style={{ maxWidth: '300px' }}
                            value={selectedDoctor}
                            onChange={(e) => setSelectedDoctor(e.target.value)}
                        >
                            <option value="all">All Doctors</option>
                            {/* List all doctors from database */}
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    Dr. {doc.name} ({doc.specialization || 'General'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ========== PRESCRIPTIONS TABLE ========== */}
                {/* Main table showing all prescriptions to process */}
                <div className="card">
                    <h3 className="mb-3">📋 Prescriptions to Send Follow-ups</h3>
                    
                    {filteredPrescriptions.length === 0 ? (
                        // ---------- Empty State ----------
                        <div className="text-center py-4">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                            <p className="text-muted">No prescriptions found</p>
                        </div>
                    ) : (
                        // ---------- Prescriptions Table ----------
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Case ID</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Medication</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPrescriptions.map((p) => (
                                        <tr key={p.id}>
                                            {/* Case ID - unique identifier */}
                                            <td><strong>{p.caseId}</strong></td>
                                            
                                            {/* Patient info with phone */}
                                            <td>
                                                <div>{p.patientName || 'N/A'}</div>
                                                <div className="text-sm text-muted">📱 {p.patientPhone}</div>
                                            </td>
                                            
                                            {/* Doctor name - looked up from doctors list */}
                                            <td>
                                                {doctors.find(d => d.id === p.doctorId)?.name || p.doctorId}
                                            </td>
                                            
                                            {/* Medication details */}
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{p.medicineName}</div>
                                                <div className="text-sm text-muted">{p.dosage}</div>
                                            </td>
                                            
                                            {/* Status badge - color-coded */}
                                            <td>
                                                <span className={`badge ${p.status === 'active' ? 'badge-info' : p.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            
                                            {/* Send/Resend follow-up action */}
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleSendFollowUp(p)}
                                                    disabled={sendingId === p.id}
                                                >
                                                    {sendingId === p.id ? '⏳ Sending...' : (
                                                        p.status === 'follow_up_sent' ? '🔄 Resend' : '📤 Send Follow-up'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StaffDashboard;
