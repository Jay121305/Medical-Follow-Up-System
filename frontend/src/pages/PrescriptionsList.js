/**
 * ============================================================================
 * PrescriptionsList.js - Doctor's Prescriptions Management Page
 * ============================================================================
 * 
 * PURPOSE:
 * Display all prescriptions created by a doctor and allow sending follow-ups.
 * This is the launching point for the patient follow-up flow.
 * 
 * FEATURES:
 * - Table view of all prescriptions
 * - Send follow-up action (initiates STEP 3)
 * - View prescription details
 * - Edit patient contact info
 * - Manual fallback if WhatsApp fails
 * 
 * FOLLOW-UP INITIATION (STEP 3):
 * When doctor clicks "Send Follow-up":
 * 1. Backend creates follow-up record
 * 2. Generates OTP
 * 3. Attempts WhatsApp/SMS delivery via Twilio
 * 4. If delivery fails, shows manual sharing info
 * 
 * MANUAL FALLBACK:
 * If WhatsApp/SMS fails to send:
 * - Shows OTP code for doctor to share
 * - Shows verification link to share with patient
 * - Doctor can copy and share via other channels
 * 
 * STATUS BADGES:
 * - Active: New prescription, no follow-up sent
 * - Follow-up Sent: Waiting for patient response
 * - Completed: Follow-up closed by doctor
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPrescriptions, createFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

/**
 * PrescriptionsList Component
 * 
 * @param {object} props
 * @param {object} props.user - Current logged-in doctor
 */
function PrescriptionsList({ user }) {
    const navigate = useNavigate();
    
    // ========== STATE ==========
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState(null);        // ID of prescription being sent
    const [followUpDetails, setFollowUpDetails] = useState(null);  // Result modal data
    const [viewPrescription, setViewPrescription] = useState(null); // Detail view modal
    
    // Get doctor ID (fallback for development)
    const doctorId = user?.id || 'doctor-001';

    // Load prescriptions on mount
    useEffect(() => { loadPrescriptions(); }, [doctorId]);

    /**
     * Fetch all prescriptions for this doctor
     */
    const loadPrescriptions = async () => {
        try {
            const result = await getDoctorPrescriptions(doctorId);
            setPrescriptions(result.data || []);
        } catch (err) {
            console.error(err);
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
     * 3. Show result modal with success or manual fallback info
     * 
     * @param {object} prescription - Prescription to send follow-up for
     */
    const handleSendFollowUp = async (prescription) => {
        setSendingId(prescription.id);
        try {
            const result = await createFollowUp(prescription.id, doctorId);
            const { otp, verificationLink, patientPhone, prescriptionLink, caseId, followUpId, whatsappSent, smsSent } = result.data;

            if (whatsappSent || smsSent) {
                // ========== SUCCESS: Message sent via WhatsApp or SMS ==========
                const channels = [];
                if (whatsappSent) channels.push('WhatsApp');
                if (smsSent) channels.push('SMS');
                
                setFollowUpDetails({
                    success: true,
                    patientPhone,
                    followUpId,
                    whatsappSent,
                    smsSent,
                    message: `Follow-up OTP sent via ${channels.join(' and ')} to ${patientPhone}!`
                });
            } else {
                // ========== FALLBACK: Both failed - show manual sharing info ==========
                setFollowUpDetails({
                    success: false,
                    patientPhone,
                    otp,
                    verificationLink,
                    prescriptionLink,
                    caseId,
                    followUpId,
                    message: 'Message delivery failed. Please share these details with the patient manually:'
                });
            }
            // Refresh list to show updated status
            loadPrescriptions();
        } catch (err) {
            alert('Failed to send follow-up: ' + err.message);
        } finally {
            setSendingId(null);
        }
    };

    /**
     * Update patient details (e.g., phone number correction)
     */
    const handleUpdatePatientDetails = async (prescriptionId, updates) => {
        try {
            const response = await fetch(`http://localhost:5000/api/prescriptions/${prescriptionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const result = await response.json();
            if (result.success) {
                alert('Patient details updated successfully!');
                loadPrescriptions();
                setViewPrescription(null);
            } else {
                alert('Failed to update: ' + result.error);
            }
        } catch (err) {
            alert('Failed to update patient details: ' + err.message);
        }
    };

    /**
     * Copy text to clipboard helper
     */
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // ========== LOADING STATE ==========
    if (loading) return <Loading message="Loading prescriptions..." />;

    return (
        <div className="page">
            <div className="container">
                <Disclaimer />
                
                {/* ========== HEADER ========== */}
                <div className="d-flex justify-between align-center mb-4">
                    <h1>Prescriptions</h1>
                    <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions/new')}>
                        + New Prescription
                    </button>
                </div>

                {/* ========== FOLLOW-UP RESULT MODAL ========== */}
                {/* Shows after sending follow-up - success or manual fallback */}
                {followUpDetails && (
                    <div className="card mb-4" style={{ border: followUpDetails.whatsappSent ? '2px solid var(--color-success)' : '2px solid var(--color-warning)', background: followUpDetails.whatsappSent ? '#d4edda' : '#fff3cd' }}>
                        <div className="d-flex justify-between align-center mb-2">
                            <h3 style={{ margin: 0 }}>{followUpDetails.whatsappSent ? '✅ WhatsApp Sent!' : '⚠️ WhatsApp Failed - Manual Sharing Required'}</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setFollowUpDetails(null)}>✕ Close</button>
                        </div>
                        <p>{followUpDetails.message}</p>
                        
                        {/* Manual sharing info - shown when delivery failed */}
                        {!followUpDetails.whatsappSent && (
                            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                <div className="mb-2">
                                    <strong>Patient Phone:</strong> {followUpDetails.patientPhone}
                                </div>
                                <div className="mb-2">
                                    <strong>Follow-Up ID:</strong> 
                                    <code style={{ background: '#e9ecef', padding: '0.25rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                                        {followUpDetails.followUpId}
                                    </code>
                                    <button className="btn btn-sm btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => copyToClipboard(followUpDetails.followUpId)}>Copy</button>
                                </div>
                                <div className="mb-2">
                                    <strong>OTP Code:</strong> 
                                    <code style={{ background: '#e9ecef', padding: '0.25rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        {followUpDetails.otp}
                                    </code>
                                    <button className="btn btn-sm btn-primary" style={{ marginLeft: '0.5rem' }} onClick={() => copyToClipboard(followUpDetails.otp)}>Copy</button>
                                </div>
                                <div className="mb-2">
                                    <strong>Verification Link (for follow-up):</strong>
                                    <div style={{ wordBreak: 'break-all', background: '#e9ecef', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                                        {followUpDetails.verificationLink}
                                    </div>
                                    <button className="btn btn-sm btn-primary mt-2" onClick={() => copyToClipboard(followUpDetails.verificationLink)}>Copy Link</button>
                                </div>
                                {followUpDetails.prescriptionLink && (
                                    <div className="mb-2">
                                        <strong>Prescription View Link (optional - no OTP needed):</strong>
                                        <div style={{ wordBreak: 'break-all', background: '#e9ecef', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                                            {followUpDetails.prescriptionLink}
                                        </div>
                                        <button className="btn btn-sm btn-secondary mt-2" onClick={() => copyToClipboard(followUpDetails.prescriptionLink)}>Copy Link</button>
                                    </div>
                                )}
                                <p className="text-muted text-sm mt-2">Share the verification link and OTP with your patient via WhatsApp manually. The OTP expires in 10 minutes.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== PRESCRIPTION DETAIL MODAL ========== */}
                {/* Shows full prescription info with edit capability */}
                {viewPrescription && (
                    <div className="card mb-4" style={{ border: '2px solid var(--color-primary)' }}>
                        <div className="d-flex justify-between align-center mb-3">
                            <h3 style={{ margin: 0 }}>📋 Prescription Details</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setViewPrescription(null)}>✕ Close</button>
                        </div>
                        
                        {/* ---------- Patient Info Section ---------- */}
                        <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>👤 Patient Information</h4>
                            <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                <div><strong>Name:</strong> {viewPrescription.patientName || 'Not provided'}</div>
                                <div><strong>Case ID:</strong> {viewPrescription.caseId}</div>
                                <div><strong>📱 Phone:</strong> {viewPrescription.patientPhone || 'Not provided'}</div>
                                <div><strong>✉️ Email:</strong> {viewPrescription.patientEmail || 'Not provided'}</div>
                            </div>
                        </div>
                        
                        {/* ---------- Medication Section ---------- */}
                        {/* Table showing medicine name, dosage, and duration */}
                        <div style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>💊 Prescription</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '40%' }}>Medicine Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Dosage Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--color-primary)', verticalAlign: 'top' }}>
                                            {viewPrescription.medicineName}
                                        </td>
                                        <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                                            <div style={{ marginBottom: '0.25rem' }}>{viewPrescription.dosage}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Duration: {viewPrescription.duration}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        {/* ---------- Status and Additional Info ---------- */}
                        <div className="grid grid-2" style={{ gap: '1rem' }}>
                            <div><strong>Status:</strong> <span className={`badge ${viewPrescription.status === 'active' ? 'badge-info' : viewPrescription.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>{viewPrescription.status}</span></div>
                            {viewPrescription.condition && <div><strong>Condition:</strong> {viewPrescription.condition}</div>}
                        </div>
                        
                        {/* Optional notes field */}
                        {viewPrescription.notes && <div className="mt-2" style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}><strong>📝 Notes:</strong> {viewPrescription.notes}</div>}
                        <div className="mt-3 text-muted text-sm">
                            <strong>Created:</strong> {new Date(viewPrescription.createdAt).toLocaleString()}
                        </div>
                        
                        {/* ---------- Edit Button ---------- */}
                        {/* Allows correcting patient phone if entered wrong */}
                        <div className="mt-3">
                            <button className="btn btn-sm btn-secondary" onClick={() => {
                                const newPhone = prompt('Edit Patient Phone:', viewPrescription.patientPhone || '');
                                if (newPhone !== null) {
                                    // Update phone in the prescription
                                    handleUpdatePatientDetails(viewPrescription.id, { patientPhone: newPhone });
                                }
                            }}>✏️ Edit Patient Details</button>
                        </div>
                    </div>
                )}

                {/* ========== PRESCRIPTIONS TABLE ========== */}
                {/* Empty state vs. populated table */}
                {prescriptions.length === 0 ? (
                    // ---------- Empty State ----------
                    <div className="card text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <h3>No Prescriptions Yet</h3>
                        <p className="text-muted">Create your first prescription to get started.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions/new')}>Create Prescription</button>
                    </div>
                ) : (
                    // ---------- Prescriptions Table ----------
                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Case ID</th><th>Medication</th><th>Patient Contact</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {/* Map through all prescriptions */}
                                    {prescriptions.map((p) => (
                                        <tr key={p.id}>
                                            {/* Case ID - unique identifier */}
                                            <td><strong>{p.caseId}</strong></td>
                                            
                                            {/* Medication details column */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>💊 {p.medicineName}</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>📋 {p.dosage}</span>
                                                    {p.duration && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>⏱️ {p.duration}</span>}
                                                </div>
                                            </td>
                                            
                                            {/* Patient contact info */}
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    {p.patientPhone && <span style={{ fontSize: '0.9rem' }}>📱 {p.patientPhone}</span>}
                                                    {p.patientEmail && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>✉️ {p.patientEmail}</span>}
                                                </div>
                                            </td>
                                            
                                            {/* Status badge - color-coded */}
                                            <td><span className={`badge ${p.status === 'active' ? 'badge-info' : p.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>{p.status}</span></td>
                                            
                                            {/* Action buttons */}
                                            <td>
                                                <div className="d-flex gap-1" style={{ flexWrap: 'wrap' }}>
                                                    {/* View full details */}
                                                    <button className="btn btn-sm btn-primary" onClick={() => setViewPrescription(p)}>View</button>
                                                    
                                                    {/* Copy shareable link - for sending to patient */}
                                                    <button className="btn btn-sm btn-secondary" onClick={() => copyToClipboard(`http://localhost:3000/prescription/${p.id}`)} title="Copy prescription link">
                                                        📋 Link
                                                    </button>
                                                    
                                                    {/* Send/Resend follow-up - triggers STEP 3 */}
                                                    <button className="btn btn-sm btn-success" onClick={() => handleSendFollowUp(p)} disabled={sendingId === p.id}>
                                                        {sendingId === p.id ? 'Sending...' : p.status === 'follow_up_sent' ? 'Resend Follow-Up' : 'Send Follow-Up'}
                                                    </button>
                                                </div>
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

export default PrescriptionsList;
