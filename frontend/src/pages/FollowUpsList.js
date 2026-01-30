/**
 * Follow-Ups List Page
 * View all follow-ups and access summaries
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorFollowUps } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

const DOCTOR_ID = 'doctor-001';

function FollowUpsList() {
    const navigate = useNavigate();
    const [followUps, setFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadFollowUps(); }, []);

    const loadFollowUps = async () => {
        try {
            const result = await getDoctorFollowUps(DOCTOR_ID);
            setFollowUps(result.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, hasSummary) => {
        if (status === 'closed') return <span className="badge badge-info">Closed</span>;
        if (hasSummary) return <span className="badge badge-success">Ready for Review</span>;
        return <span className="badge badge-warning">Awaiting Patient</span>;
    };

    if (loading) return <Loading message="Loading follow-ups..." />;

    return (
        <div className="page">
            <div className="container">
                <Disclaimer />
                <h1 className="mb-4">Follow-Up Reports</h1>

                {followUps.length === 0 ? (
                    <div className="card text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3>No Follow-Ups Yet</h3>
                        <p className="text-muted">Follow-ups will appear here after you send them from prescriptions.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions')}>View Prescriptions</button>
                    </div>
                ) : (
                    <div className="card">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr><th>Case ID</th><th>Status</th><th>Created</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {followUps.map((f) => (
                                        <tr key={f.id}>
                                            <td><strong>{f.caseId}</strong></td>
                                            <td>{getStatusBadge(f.status, f.hasSummary)}</td>
                                            <td className="text-muted">{new Date(f.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {f.hasSummary ? (
                                                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/doctor/follow-ups/${f.id}`)}>View Summary</button>
                                                ) : (
                                                    <span className="text-muted text-sm">Pending patient response</span>
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

export default FollowUpsList;
