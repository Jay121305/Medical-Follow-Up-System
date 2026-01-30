/**
 * Main App Component
 * React Router setup with all routes
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import DoctorDashboard from './pages/DoctorDashboard';
import NewPrescription from './pages/NewPrescription';
import PrescriptionsList from './pages/PrescriptionsList';
import FollowUpsList from './pages/FollowUpsList';
import FollowUpSummary from './pages/FollowUpSummary';
import VerifyInfo from './pages/VerifyInfo';
import PatientVerify from './pages/PatientVerify';
import PatientFollowUp from './pages/PatientFollowUp';
import SuccessPage from './pages/SuccessPage';

function App() {
    const [userRole, setUserRole] = useState(null);

    return (
        <Router>
            <Header userRole={userRole} onRoleChange={setUserRole} />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage onRoleChange={setUserRole} />} />
                <Route path="/verify-info" element={<VerifyInfo />} />
                <Route path="/verify/:id" element={<PatientVerify />} />
                <Route path="/follow-up/:id" element={<PatientFollowUp />} />
                <Route path="/follow-up/:id/success" element={<SuccessPage />} />

                {/* Doctor Routes */}
                <Route path="/doctor/dashboard" element={userRole === 'doctor' ? <DoctorDashboard /> : <Navigate to="/" />} />
                <Route path="/doctor/prescriptions" element={userRole === 'doctor' ? <PrescriptionsList /> : <Navigate to="/" />} />
                <Route path="/doctor/prescriptions/new" element={userRole === 'doctor' ? <NewPrescription /> : <Navigate to="/" />} />
                <Route path="/doctor/follow-ups" element={userRole === 'doctor' ? <FollowUpsList /> : <Navigate to="/" />} />
                <Route path="/doctor/follow-ups/:id" element={userRole === 'doctor' ? <FollowUpSummary /> : <Navigate to="/" />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
