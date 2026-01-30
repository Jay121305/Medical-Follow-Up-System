/**
 * Prescriptions List Page
 * View all prescriptions and send follow-ups
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPrescriptions, createFollowUp } from '../services/api';
import { sendOTPEmail } from '../services/email';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

const DOCTOR_ID = 'doctor-001';

function PrescriptionsList() {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sendingId, setSendingId] = useState(null);

    useEffect(() => { loadPrescriptions(); }, []);

    const loadPrescriptions = async () => {
        try {
            const result = await getDoctorPrescriptions(DOCTOR_ID);
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
            const result = await createFollowUp(prescription.id, DOCTOR_ID);
            const { otp, verificationLink, caseId, patientEmail } = result.data;

            await sendOTPEmail({ patientEmail, otp, verificationLink, caseId });
            alert(`Follow-up sent to ${patientEmail}. OTP: ${otp}`);
            loadPrescriptions();
        } catch (err) {
            alert('Failed to send follow-up: ' + err.message);
        } finally {
            setSendingId(null);
        }
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
                                    <tr><th>Case ID</th><th>Medicine</th><th>Patient Email</th><th>Status</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {prescriptions.map((p) => (
                                        <tr key={p.id}>
                                            <td><strong>{p.caseId}</strong></td>
                                            <td>{p.medicineName} ({p.dosage})</td>
                                            <td>{p.patientEmail}</td>
                                            <td><span className={`badge ${p.status === 'active' ? 'badge-info' : p.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>{p.status}</span></td>
                                            <td>
                                                {p.status === 'active' && (
                                                    <button className="btn btn-sm btn-success" onClick={() => handleSendFollowUp(p)} disabled={sendingId === p.id}>
                                                        {sendingId === p.id ? 'Sending...' : 'Send Follow-Up'}
                                                    </button>
                                                )}
                                                {p.status !== 'active' && <span className="text-muted text-sm">Follow-up sent</span>}
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
