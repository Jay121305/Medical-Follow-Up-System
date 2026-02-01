import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

/**
 * Adverse Event Reporting Page
 * 
 * STEP 2 in the AE workflow:
 * Patient or Doctor reports an adverse event via this simple form.
 * Minimal initial info required - detailed follow-up handled separately.
 */
const AdverseEventReport = () => {
    const navigate = useNavigate();
    const { prescriptionId } = useParams();
    
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [prescription, setPrescription] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [reportResult, setReportResult] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        patientPhone: '',
        patientName: '',
        drugName: '',
        eventDescription: '',
        reporterType: 'patient',
        urgencyIndicators: [],
    });

    // Urgency indicators
    const urgencyOptions = [
        { value: 'breathing', label: '😮‍💨 Difficulty breathing' },
        { value: 'swelling', label: '😶 Swelling (face, throat)' },
        { value: 'chest_pain', label: '💔 Chest pain' },
        { value: 'unconscious', label: '😵 Loss of consciousness' },
        { value: 'seizure', label: '⚡ Seizure' },
        { value: 'severe_rash', label: '🔴 Severe skin reaction' },
    ];

    useEffect(() => {
        if (prescriptionId) {
            loadPrescriptionData();
        }
    }, [prescriptionId]);

    const loadPrescriptionData = async () => {
        setLoading(true);
        try {
            const response = await api.getPrescription(prescriptionId);
            if (response.success) {
                setPrescription(response.data);
                setFormData(prev => ({
                    ...prev,
                    patientPhone: response.data.patientPhone || '',
                    patientName: response.data.patientName || '',
                    drugName: response.data.medicineName || '',
                }));
            }
        } catch (error) {
            console.error('Error loading prescription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const reportData = {
                ...formData,
                prescriptionId: prescriptionId || null,
            };

            const response = await api.reportAdverseEvent(reportData);

            if (response.success) {
                setReportResult(response.data);
                setShowSuccess(true);
            }
        } catch (error) {
            console.error('Error reporting adverse event:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUrgencyToggle = (value) => {
        setFormData(prev => ({
            ...prev,
            urgencyIndicators: prev.urgencyIndicators.includes(value)
                ? prev.urgencyIndicators.filter(v => v !== value)
                : [...prev.urgencyIndicators, value],
        }));
    };

    if (loading) return <Loading />;

    if (showSuccess) {
        return (
            <div className="page" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f8 100%)', minHeight: '100vh' }}>
                <div className="container" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem 1rem' }}>
                    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                        {reportResult?.isUrgent ? (
                            <>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚨</div>
                                <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>URGENT: Safety Alert Created</h2>
                                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                                    Your report indicates a potentially serious reaction.
                                    A healthcare professional will be notified immediately.
                                </p>
                                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                    <strong>⚠️ If you're having a medical emergency, please call emergency services immediately.</strong>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                                <h2 style={{ color: '#16a34a', marginBottom: '1rem' }}>Report Submitted Successfully</h2>
                                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                                    Thank you for reporting this reaction. This information helps improve medicine safety.
                                </p>
                            </>
                        )}
                        
                        <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Case Reference</p>
                            <p style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#7c3aed' }}>
                                {reportResult?.caseId}
                            </p>
                        </div>

                        {reportResult?.followUpTriggered && (
                            <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                📱 We've sent a follow-up questionnaire to your phone.
                                Please complete it to help us understand your reaction better.
                            </div>
                        )}

                        <button 
                            onClick={() => navigate('/')}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f8 100%)', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️ Report Adverse Event</h1>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        Report any unexpected reactions to medicines
                    </p>
                </div>

                {/* Info Banner */}
                <div style={{ background: '#dbeafe', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                    <span style={{ fontSize: '0.875rem' }}>
                        Your report helps improve drug safety for everyone.
                    </span>
                </div>

                {/* Prescription Info (if linked) */}
                {prescription && (
                    <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', color: '#581c87', marginBottom: '0.5rem' }}>Linked Prescription</h3>
                        <p style={{ fontSize: '0.875rem', color: '#7c3aed' }}>
                            {prescription.medicineName} - Prescribed on {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                )}

                {/* Report Form */}
                <form onSubmit={handleSubmit}>
                    {/* Patient Info */}
                    {!prescription && (
                        <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>👤 Patient Information</h3>
                            
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Patient Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.patientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                                    placeholder="Enter patient name"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    className="input"
                                    value={formData.patientPhone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                                    placeholder="+91 XXXXXXXXXX"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Medicine Info */}
                    {!prescription && (
                        <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>💊 Medicine Information</h3>
                            
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Medicine Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.drugName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, drugName: e.target.value }))}
                                    placeholder="Enter medicine name"
                                    required
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Event Description */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>📝 What Happened?</h3>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                Describe the reaction in your own words
                            </label>
                            <textarea
                                value={formData.eventDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, eventDescription: e.target.value }))}
                                placeholder="Example: I took the medicine yesterday and started feeling dizzy..."
                                required
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '8px', 
                                    minHeight: '120px',
                                    resize: 'vertical'
                                }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
                                Even a few words help. We'll ask more questions later.
                            </p>
                        </div>
                    </div>

                    {/* Urgency Indicators */}
                    <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>🚨 Emergency Symptoms</h3>
                        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                            Check any that apply (these require immediate attention):
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {urgencyOptions.map(option => (
                                <label 
                                    key={option.value}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: formData.urgencyIndicators.includes(option.value)
                                            ? '2px solid #ef4444'
                                            : '1px solid #ddd',
                                        background: formData.urgencyIndicators.includes(option.value)
                                            ? '#fef2f2'
                                            : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.urgencyIndicators.includes(option.value)}
                                        onChange={() => handleUrgencyToggle(option.value)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Reporter Type */}
                    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Who is reporting?</h3>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {[
                                { value: 'patient', label: '👤 Patient', desc: 'I am the patient' },
                                { value: 'doctor', label: '👨‍⚕️ Doctor', desc: 'Reporting for patient' },
                                { value: 'staff', label: '📋 Staff', desc: 'Healthcare staff' },
                            ].map(type => (
                                <label
                                    key={type.value}
                                    style={{
                                        flex: '1',
                                        minWidth: '100px',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: formData.reporterType === type.value
                                            ? '2px solid #7c3aed'
                                            : '1px solid #ddd',
                                        background: formData.reporterType === type.value
                                            ? '#f3e8ff'
                                            : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="reporterType"
                                        value={type.value}
                                        checked={formData.reporterType === type.value}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reporterType: e.target.value }))}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{type.label.split(' ')[0]}</div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{type.label.split(' ')[1]}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>{type.desc}</div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn"
                        disabled={submitting || !formData.eventDescription}
                        style={{ 
                            width: '100%', 
                            padding: '1rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: submitting || !formData.eventDescription ? 'not-allowed' : 'pointer',
                            opacity: submitting || !formData.eventDescription ? 0.6 : 1
                        }}
                    >
                        {submitting ? 'Submitting...' : '⚠️ Submit Safety Report'}
                    </button>
                </form>

                <Disclaimer />
            </div>
        </div>
    );
};

export default AdverseEventReport;
