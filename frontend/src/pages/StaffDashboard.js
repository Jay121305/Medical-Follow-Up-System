/**
 * Staff Dashboard
 * Dashboard for hospital staff to manage follow-ups and patient communications
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

function StaffDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState(null);
    const [followUpResult, setFollowUpResult] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState('all');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Load doctors
            const doctorsRes = await fetch('http://localhost:5000/api/auth/doctors', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const doctorsData = await doctorsRes.json();
            if (doctorsData.success) {
                setDoctors(doctorsData.data);
            }

            // Load all prescriptions (staff can see all)
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
                    doctorId: prescription.doctorId,
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                setFollowUpResult({
                    success: true,
                    whatsappSent: result.data.whatsappSent,
                    smsSent: result.data.smsSent,
                    patientPhone: result.data.patientPhone,
                    otp: result.data.otp,
                    followUpId: result.data.followUpId,
                    verificationLink: result.data.verificationLink,
                });
                loadData(); // Refresh list
            } else {
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

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const filteredPrescriptions = selectedDoctor === 'all'
        ? prescriptions
        : prescriptions.filter(p => p.doctorId === selectedDoctor);

    if (loading) return <Loading message="Loading dashboard..." />;

    return (
        <div className="page">
            <div className="container">
                <Disclaimer />

                {/* Header */}
                <div className="d-flex justify-between align-center mb-4">
                    <div>
                        <h1>👩‍💼 Staff Dashboard</h1>
                        <p className="text-muted">Welcome, {user?.name || 'Staff Member'}</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-3 mb-4" style={{ gap: '1rem' }}>
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{prescriptions.length}</div>
                        <div>Total Prescriptions</div>
                    </div>
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: '#fff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {prescriptions.filter(p => p.status === 'follow_up_sent').length}
                        </div>
                        <div>Follow-ups Sent</div>
                    </div>
                    <div className="card text-center" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {prescriptions.filter(p => p.status === 'active').length}
                        </div>
                        <div>Pending Follow-ups</div>
                    </div>
                </div>

                {/* Follow-up Result Modal */}
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
                            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                                <div className="mb-2">
                                    <strong>📱 WhatsApp:</strong> {followUpResult.whatsappSent ? '✅ Sent' : '❌ Failed'}
                                </div>
                                <div className="mb-2">
                                    <strong>📲 SMS OTP:</strong> {followUpResult.smsSent ? '✅ Sent' : '❌ Failed'}
                                </div>
                                <div className="mb-2">
                                    <strong>Patient Phone:</strong> {followUpResult.patientPhone}
                                </div>
                                {followUpResult.otp && (
                                    <div className="mb-2">
                                        <strong>OTP:</strong> 
                                        <code style={{ background: '#e9ecef', padding: '0.25rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                            {followUpResult.otp}
                                        </code>
                                        <button className="btn btn-sm btn-primary ml-2" onClick={() => copyToClipboard(followUpResult.otp)}>Copy</button>
                                    </div>
                                )}
                                <div className="mb-2">
                                    <strong>Verification Link:</strong>
                                    <div style={{ wordBreak: 'break-all', background: '#e9ecef', padding: '0.5rem', borderRadius: '4px', marginTop: '0.25rem' }}>
                                        {followUpResult.verificationLink}
                                    </div>
                                    <button className="btn btn-sm btn-primary mt-2" onClick={() => copyToClipboard(followUpResult.verificationLink)}>Copy Link</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-error">{followUpResult.error}</p>
                        )}
                    </div>
                )}

                {/* Filter by Doctor */}
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
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    Dr. {doc.name} ({doc.specialization || 'General'})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Prescriptions Table */}
                <div className="card">
                    <h3 className="mb-3">📋 Prescriptions to Send Follow-ups</h3>
                    
                    {filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-4">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                            <p className="text-muted">No prescriptions found</p>
                        </div>
                    ) : (
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
                                            <td><strong>{p.caseId}</strong></td>
                                            <td>
                                                <div>{p.patientName || 'N/A'}</div>
                                                <div className="text-sm text-muted">📱 {p.patientPhone}</div>
                                            </td>
                                            <td>
                                                {doctors.find(d => d.id === p.doctorId)?.name || p.doctorId}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{p.medicineName}</div>
                                                <div className="text-sm text-muted">{p.dosage}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${p.status === 'active' ? 'badge-info' : p.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>
                                                    {p.status}
                                                </span>
                                            </td>
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
