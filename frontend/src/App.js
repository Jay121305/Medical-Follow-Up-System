/**
 * Main App Component
 * React Router setup with authentication and role-based routing
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import DoctorDashboard from './pages/DoctorDashboard';
import NewPrescription from './pages/NewPrescription';
import PrescriptionsList from './pages/PrescriptionsList';
import FollowUpsList from './pages/FollowUpsList';
import FollowUpSummary from './pages/FollowUpSummary';
import StaffDashboard from './pages/StaffDashboard';
import VerifyInfo from './pages/VerifyInfo';
import PatientVerify from './pages/PatientVerify';
import PatientFollowUp from './pages/PatientFollowUp';
import SuccessPage from './pages/SuccessPage';
import ViewPrescription from './pages/ViewPrescription';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            verifyToken(token, JSON.parse(storedUser));
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async (token, storedUser) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setUser({ ...result.data, token });
                } else {
                    handleLogout();
                }
            } else {
                handleLogout();
            }
        } catch (err) {
            // If server is down, still allow using cached user
            setUser(storedUser);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // Protected Route Component
    const ProtectedRoute = ({ children, allowedRoles }) => {
        if (loading) {
            return <div className="page"><div className="container text-center">Loading...</div></div>;
        }
        
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
        
        return children;
    };

    if (loading) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <div className="text-center">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
                    <h2>NEST 2O</h2>
                    <p className="text-muted">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Header user={user} onLogout={handleLogout} />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage user={user} />} />
                <Route path="/login" element={
                    user ? <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/staff/dashboard'} /> : <Login onLogin={handleLogin} />
                } />
                <Route path="/verify-info" element={<VerifyInfo />} />
                <Route path="/verify/:id" element={<PatientVerify />} />
                <Route path="/follow-up/:id" element={<PatientFollowUp />} />
                <Route path="/follow-up/:id/success" element={<SuccessPage />} />
                <Route path="/prescription/:id" element={<ViewPrescription />} />

                {/* Doctor Routes */}
                <Route path="/doctor/dashboard" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorDashboard user={user} />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/prescriptions" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <PrescriptionsList user={user} />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/prescriptions/new" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <NewPrescription user={user} />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/follow-ups" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <FollowUpsList user={user} />
                    </ProtectedRoute>
                } />
                <Route path="/doctor/follow-ups/:id" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <FollowUpSummary user={user} />
                    </ProtectedRoute>
                } />

                {/* Staff Routes */}
                <Route path="/staff/dashboard" element={
                    <ProtectedRoute allowedRoles={['staff']}>
                        <StaffDashboard user={user} />
                    </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
