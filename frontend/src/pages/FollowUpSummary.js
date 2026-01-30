/**
 * Follow-Up Summary Page
 * Doctor view of patient-verified summary (Step 9)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFollowUpSummary, closeFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

const DOCTOR_ID = 'doctor-001';

function FollowUpSummary() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [closing, setClosing] = useState(false);

    useEffect(() => { loadSummary(); }, [id]);

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

    if (loading) return <Loading message="Loading summary..." />;
    if (error) return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '800px' }}>
                <Disclaimer />

                <div className="d-flex justify-between align-center mb-4">
                    <div>
                        <h1>Follow-Up Summary</h1>
                        <p className="text-muted">Case ID: {summary?.caseId}</p>
                    </div>
                    <span className={`badge ${summary?.status === 'closed' ? 'badge-info' : 'badge-success'}`}>{summary?.status === 'closed' ? 'Closed' : 'Ready for Review'}</span>
                </div>

                <div className="card mb-3">
                    <h3 className="mb-2">Prescription Details</h3>
                    <div className="grid grid-2">
                        <div><strong>Medicine:</strong> {summary?.prescription?.medicineName}</div>
                        <div><strong>Dosage:</strong> {summary?.prescription?.dosage}</div>
                        <div><strong>Duration:</strong> {summary?.prescription?.duration}</div>
                        <div><strong>Condition:</strong> {summary?.prescription?.condition || 'Not specified'}</div>
                    </div>
                </div>

                <div className="card mb-3">
                    <h3 className="mb-2">Patient-Verified Summary</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>{summary?.summary || 'No summary available'}</div>
                    <p className="text-muted text-sm mt-3">Submitted: {summary?.submittedAt ? new Date(summary.submittedAt).toLocaleString() : 'N/A'}</p>
                </div>

                <div className="d-flex gap-2">
                    <button className="btn btn-secondary" onClick={() => navigate('/doctor/follow-ups')}>Back to List</button>
                    {summary?.status !== 'closed' && (
                        <button className="btn btn-success" onClick={handleClose} disabled={closing}>{closing ? 'Closing...' : 'Close Case'}</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FollowUpSummary;
