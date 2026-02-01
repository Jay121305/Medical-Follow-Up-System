/**
 * Prescriptions List Page
 * View all prescriptions and send follow-ups
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPrescriptions, createFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

function PrescriptionsList({ user }) {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState(null);
    const [followUpDetails, setFollowUpDetails] = useState(null);
    const [viewPrescription, setViewPrescription] = useState(null);
    
    const doctorId = user?.id || 'doctor-001';

    useEffect(() => { loadPrescriptions(); }, [doctorId]);

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

    const handleSendFollowUp = async (prescription) => {
        setSendingId(prescription.id);
        try {
            const result = await createFollowUp(prescription.id, doctorId);
            const { otp, verificationLink, patientPhone, prescriptionLink, caseId, followUpId, whatsappSent, smsSent } = result.data;

            if (whatsappSent || smsSent) {
                // Message sent successfully
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
                // Both failed - show details for manual sharing
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
            loadPrescriptions();
        } catch (err) {
            alert('Failed to send follow-up: ' + err.message);
        } finally {
            setSendingId(null);
        }
    };

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

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    if (loading) return <Loading message="Loading prescriptions..." />;

    return (
        <div className="page">
            <div className="container">
                <Disclaimer />
                <div className="d-flex justify-between align-center mb-4">
                    <h1>Prescriptions</h1>
                    <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions/new')}>+ New Prescription</button>
                </div>

                {/* Follow-up Details Modal */}
                {followUpDetails && (
                    <div className="card mb-4" style={{ border: followUpDetails.whatsappSent ? '2px solid var(--color-success)' : '2px solid var(--color-warning)', background: followUpDetails.whatsappSent ? '#d4edda' : '#fff3cd' }}>
                        <div className="d-flex justify-between align-center mb-2">
                            <h3 style={{ margin: 0 }}>{followUpDetails.whatsappSent ? '✅ WhatsApp Sent!' : '⚠️ WhatsApp Failed - Manual Sharing Required'}</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setFollowUpDetails(null)}>✕ Close</button>
                        </div>
                        <p>{followUpDetails.message}</p>
                        
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

                {/* View Prescription Modal */}
                {viewPrescription && (
                    <div className="card mb-4" style={{ border: '2px solid var(--color-primary)' }}>
                        <div className="d-flex justify-between align-center mb-3">
                            <h3 style={{ margin: 0 }}>📋 Prescription Details</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setViewPrescription(null)}>✕ Close</button>
                        </div>
                        
                        {/* Patient Info Section */}
                        <div style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>👤 Patient Information</h4>
                            <div className="grid grid-2" style={{ gap: '0.5rem' }}>
                                <div><strong>Name:</strong> {viewPrescription.patientName || 'Not provided'}</div>
                                <div><strong>Case ID:</strong> {viewPrescription.caseId}</div>
                                <div><strong>📱 Phone:</strong> {viewPrescription.patientPhone || 'Not provided'}</div>
                                <div><strong>✉️ Email:</strong> {viewPrescription.patientEmail || 'Not provided'}</div>
                            </div>
                        </div>
                        
                        {/* Medication Section */}
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
                        
                        {/* Additional Info */}
                        <div className="grid grid-2" style={{ gap: '1rem' }}>
                            <div><strong>Status:</strong> <span className={`badge ${viewPrescription.status === 'active' ? 'badge-info' : viewPrescription.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>{viewPrescription.status}</span></div>
                            {viewPrescription.condition && <div><strong>Condition:</strong> {viewPrescription.condition}</div>}
                        </div>
                        {viewPrescription.notes && <div className="mt-2" style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: '6px' }}><strong>📝 Notes:</strong> {viewPrescription.notes}</div>}
                        <div className="mt-3 text-muted text-sm">
                            <strong>Created:</strong> {new Date(viewPrescription.createdAt).toLocaleString()}
                        </div>
                        
                        {/* Edit Patient Details Button */}
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

                {prescriptions.length === 0 ? (
                    <div className="card text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <h3>No Prescriptions Yet</h3>
                        <p className="text-muted">Create your first prescription to get started.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions/new')}>Create Prescription</button>
                    </div>
                ) : (
                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Case ID</th><th>Medication</th><th>Patient Contact</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((p) => (
                                        <tr key={p.id}>
                                            <td><strong>{p.caseId}</strong></td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>💊 {p.medicineName}</span>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>📋 {p.dosage}</span>
                                                    {p.duration && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>⏱️ {p.duration}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    {p.patientPhone && <span style={{ fontSize: '0.9rem' }}>📱 {p.patientPhone}</span>}
                                                    {p.patientEmail && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>✉️ {p.patientEmail}</span>}
                                                </div>
                                            </td>
                                            <td><span className={`badge ${p.status === 'active' ? 'badge-info' : p.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>{p.status}</span></td>
                                            <td>
                                                <div className="d-flex gap-1" style={{ flexWrap: 'wrap' }}>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setViewPrescription(p)}>View</button>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => copyToClipboard(`http://localhost:3000/prescription/${p.id}`)} title="Copy prescription link">
                                                        📋 Link
                                                    </button>
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
