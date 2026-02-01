/**
 * View Prescription Page
 * Public page for patients to view their prescription details
 * Accessible without OTP - only shows prescription info (not follow-up data)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPrescription } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

function ViewPrescription() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPrescription();
    }, [id]);

    const loadPrescription = async () => {
        try {
            const result = await getPrescription(id);
            setPrescription(result.data);
        } catch (err) {
            setError(err.message || 'Prescription not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading message="Loading prescription..." />;

    if (error) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: '600px' }}>
                    <div className="card text-center">
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                        <h2>Prescription Not Found</h2>
                        <p className="text-muted">{error}</p>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '700px' }}>
                <Disclaimer />

                <div className="card animate-slide-up">
                    <div className="text-center mb-4">
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💊</div>
                        <h1>Prescription Details</h1>
                        <p className="text-muted">Case ID: {prescription.caseId}</p>
                    </div>

                    <div style={{ background: 'var(--color-primary-bg)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        {/* Structured Medication Table */}
                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-muted)' }}>💊 Prescription</h3>
                        <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.9rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '40%' }}>Medicine Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.9rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Dosage Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--color-primary)', fontSize: '1.1rem', verticalAlign: 'top' }}>
                                            {prescription.medicineName}
                                        </td>
                                        <td style={{ padding: '1rem', verticalAlign: 'top' }}>
                                            <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{prescription.dosage}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', background: 'var(--color-info-bg)', padding: '0.35rem 0.75rem', borderRadius: '6px', display: 'inline-block' }}>
                                                ⏱️ Duration: {prescription.duration}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-2 mt-3" style={{ gap: '1rem' }}>
                            <div>
                                <p className="text-muted text-sm mb-1">Status</p>
                                <span className={`badge ${prescription.status === 'active' ? 'badge-info' : prescription.status === 'follow_up_sent' ? 'badge-warning' : 'badge-success'}`}>
                                    {prescription.status === 'active' ? 'Active' : prescription.status === 'follow_up_sent' ? 'Follow-up Pending' : 'Completed'}
                                </span>
                            </div>
                        </div>

                        {prescription.condition && (
                            <div className="mt-3">
                                <p className="text-muted text-sm mb-1">Condition</p>
                                <p style={{ margin: 0, fontWeight: '500' }}>{prescription.condition}</p>
                            </div>
                        )}

                        {prescription.notes && (
                            <div className="mt-3" style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                <p className="text-muted text-sm mb-1">📝 Doctor's Notes</p>
                                <p style={{ margin: 0 }}>{prescription.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-muted text-sm">
                            Prescribed on: {new Date(prescription.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>

                    {prescription.status === 'follow_up_sent' && (
                        <div className="alert alert-info mt-3">
                            <strong>� Follow-up Requested</strong>
                            <p className="mb-0 mt-1">Your doctor has requested a follow-up. Please check your WhatsApp for the verification link and OTP.</p>
                        </div>
                    )}

                    <div className="d-flex justify-center mt-4">
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back to Home</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ViewPrescription;
