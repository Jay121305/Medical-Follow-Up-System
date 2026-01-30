/**
 * Doctor Dashboard
 * Overview of prescriptions and follow-ups
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorPrescriptions, getDoctorFollowUps } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

const DOCTOR_ID = 'doctor-001';

function DoctorDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalPrescriptions: 0, pendingFollowUps: 0, completedFollowUps: 0, readyForReview: 0 });
    const [recentFollowUps, setRecentFollowUps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const prescriptionsResult = await getDoctorPrescriptions(DOCTOR_ID);
            const followUpsResult = await getDoctorFollowUps(DOCTOR_ID);
            const prescriptions = prescriptionsResult.data || [];
            const followUps = followUpsResult.data || [];

            setStats({
                totalPrescriptions: prescriptions.length,
                pendingFollowUps: followUps.filter(f => f.status === 'pending_verification').length,
                completedFollowUps: followUps.filter(f => f.status === 'closed').length,
                readyForReview: followUps.filter(f => f.status === 'ready_for_review' || f.status === 'submitted').length,
            });
            setRecentFollowUps(followUps.slice(0, 5));
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading message="Loading dashboard..." />;

    return (
        <div className="page">
            <div className="container">
                <Disclaimer />
                <div className="d-flex justify-between align-center mb-4">
                    <h1>Doctor Dashboard</h1>
                    <button className="btn btn-primary" onClick={() => navigate('/doctor/prescriptions/new')}>+ New Prescription</button>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card text-center"><div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>{stats.totalPrescriptions}</div><p className="text-muted mb-0">Prescriptions</p></div>
                    <div className="card text-center"><div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-warning)' }}>{stats.pendingFollowUps}</div><p className="text-muted mb-0">Pending</p></div>
                    <div className="card text-center"><div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-success)' }}>{stats.readyForReview}</div><p className="text-muted mb-0">Ready for Review</p></div>
                    <div className="card text-center"><div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-secondary)' }}>{stats.completedFollowUps}</div><p className="text-muted mb-0">Completed</p></div>
                </div>

                <div className="grid grid-3 mb-4">
                    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/prescriptions/new')}><div style={{ fontSize: '2rem' }}>📝</div><h4>Create Prescription</h4></div>
                    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/prescriptions')}><div style={{ fontSize: '2rem' }}>📋</div><h4>View Prescriptions</h4></div>
                    <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/doctor/follow-ups')}><div style={{ fontSize: '2rem' }}>📊</div><h4>Follow-Up Reports</h4></div>
                </div>
            </div>
        </div>
    );
}

export default DoctorDashboard;
