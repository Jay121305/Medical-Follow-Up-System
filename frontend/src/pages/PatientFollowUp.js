/**
 * Patient Follow-Up Form (Steps 5, 6, 7)
 * Editable form with AI-generated drafts
 * Patient is the final authority
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFollowUpDrafts, submitFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

function PatientFollowUp() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [responses, setResponses] = useState({
        medicationAdherence: '',
        symptomStatus: '',
        sideEffects: '',
        completionStatus: '',
        additionalNotes: '',
    });
    const [consent, setConsent] = useState(false);

    useEffect(() => { loadDrafts(); }, [id]);

    const loadDrafts = async () => {
        try {
            const result = await getFollowUpDrafts(id);
            setPrescription(result.data.prescriptionInfo);
            if (result.data.drafts) {
                setResponses(prev => ({ ...prev, ...result.data.drafts }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setResponses(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!consent) {
            alert('Please confirm your consent to share this information with your doctor.');
            return;
        }
        setSubmitting(true);
        try {
            await submitFollowUp(id, responses, true);
            navigate(`/follow-up/${id}/success`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading your follow-up form..." />;
    if (error) return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '700px' }}>
                <Disclaimer variant="alert" />

                <h1 className="mb-2">Your Follow-Up Form</h1>
                <p className="text-muted mb-4">Please review and edit the information below. You are the final authority on your own health.</p>

                {prescription && (
                    <div className="card mb-4" style={{ background: 'var(--color-primary-bg)', border: '1px solid var(--color-primary)' }}>
                        <h4 className="mb-2">Prescription Reference</h4>
                        <p className="mb-0"><strong>{prescription.medicineName}</strong> - {prescription.dosage} for {prescription.duration}</p>
                        {prescription.condition && <p className="text-sm text-muted mb-0">Condition: {prescription.condition}</p>}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card">
                    <div className="form-group">
                        <label className="form-label">Medication Adherence</label>
                        <textarea className="form-textarea" value={responses.medicationAdherence} onChange={(e) => handleChange('medicationAdherence', e.target.value)} placeholder="Did you take the medication as prescribed?" />
                        <p className="form-hint">AI-generated suggestion. Please edit as needed.</p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Symptom Status</label>
                        <textarea className="form-textarea" value={responses.symptomStatus} onChange={(e) => handleChange('symptomStatus', e.target.value)} placeholder="How have your symptoms changed?" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Side Effects</label>
                        <textarea className="form-textarea" value={responses.sideEffects} onChange={(e) => handleChange('sideEffects', e.target.value)} placeholder="Did you experience any side effects?" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Completion Status</label>
                        <textarea className="form-textarea" value={responses.completionStatus} onChange={(e) => handleChange('completionStatus', e.target.value)} placeholder="Did you complete the full course?" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Additional Notes (Optional)</label>
                        <textarea className="form-textarea" value={responses.additionalNotes} onChange={(e) => handleChange('additionalNotes', e.target.value)} placeholder="Any other information for your doctor..." />
                    </div>

                    <div className="alert alert-warning mb-3">
                        <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginRight: '0.5rem' }} />
                        <label htmlFor="consent"><strong>I confirm</strong> that this information is accurate and I consent to share it with my doctor.</label>
                    </div>

                    <button type="submit" className="btn btn-success btn-lg btn-block" disabled={submitting || !consent}>
                        {submitting ? 'Submitting...' : '✓ Submit & Share with Doctor'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default PatientFollowUp;
