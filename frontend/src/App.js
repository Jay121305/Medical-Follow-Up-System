/**
 * ============================================================================
 * App.js - Main Application Component
 * ============================================================================
 * 
 * PURPOSE:
 * Root component that sets up routing, authentication state, and role-based
 * access control for the entire NEST 2O application.
 * 
 * ARCHITECTURE:
 * - Single-page application (SPA) using React Router v6
 * - Global auth state managed in this component and passed down
 * - Protected routes for doctor/staff with role verification
 * - Public routes for patients (no login required)
 * 
 * USER ROLES:
 * - doctor: Can create prescriptions, initiate follow-ups, view summaries
 * - staff: Can help with data entry and verification
 * - patient: No login - accesses via OTP-protected links
 * 
 * ROUTE STRUCTURE:
 * PUBLIC:
 *   /                  - Home page
 *   /login             - Doctor/Staff login
 *   /verify-info       - Information about verification process
 *   /verify/:id        - Patient OTP verification (STEP 4)
 *   /follow-up/:id     - Patient follow-up form (STEPS 5-7)
 *   /follow-up/:id/success - Submission success page
 *   /prescription/:id  - View prescription details
 * 
 * DOCTOR (Protected):
 *   /doctor/dashboard        - Doctor's main dashboard
 *   /doctor/prescriptions    - List all prescriptions
 *   /doctor/prescriptions/new - Create new prescription
 *   /doctor/follow-ups       - List all follow-ups
 *   /doctor/follow-ups/:id   - View follow-up summary (STEP 9)
 * 
 * STAFF (Protected):
 *   /staff/dashboard         - Staff data entry dashboard
 * 
 * ============================================================================
 */

// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect } from 'react';

// React Router v6 for client-side routing
// - BrowserRouter: Uses HTML5 history API for clean URLs
// - Routes/Route: Declarative route definitions
// - Navigate: Programmatic redirects
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ============================================================================
// COMPONENT IMPORTS
// ============================================================================

// Shared Components
import Header from './components/Header';

// Public Pages (No auth required)
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import VerifyInfo from './pages/VerifyInfo';
import ViewPrescription from './pages/ViewPrescription';

// Patient Flow Pages (OTP protected, no login)
import PatientVerify from './pages/PatientVerify';
import PatientFollowUp from './pages/PatientFollowUp';
import SuccessPage from './pages/SuccessPage';

// Doctor Pages (Login + role required)
import DoctorDashboard from './pages/DoctorDashboard';
import NewPrescription from './pages/NewPrescription';
import PrescriptionsList from './pages/PrescriptionsList';
import FollowUpsList from './pages/FollowUpsList';
import FollowUpSummary from './pages/FollowUpSummary';

// Staff Pages (Login + role required)
import StaffDashboard from './pages/StaffDashboard';

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
    // ========== STATE ==========
    
    /**
     * user: Current authenticated user object
     * Structure: { id, name, email, role, token }
     * null when not logged in
     */
    const [user, setUser] = useState(null);
    
    /**
     * loading: True while checking auth on initial mount
     * Prevents flash of login page before session is verified
     */
    const [loading, setLoading] = useState(true);

    // ========== SESSION VERIFICATION ON MOUNT ==========
    
    /**
     * Check for existing session when app loads
     * 
     * WHY: Users shouldn't have to log in again if they have a valid session
     * HOW: Check localStorage for token, verify with backend
     * FALLBACK: If server is down, use cached user data
     */
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
            // Token exists - verify it's still valid with backend
            verifyToken(token, JSON.parse(storedUser));
        } else {
            // No session - done loading
            setLoading(false);
        }
    }, []); // Empty deps = run once on mount

    /**
     * Verify JWT token with backend
     * 
     * @param {string} token - JWT token from localStorage
     * @param {object} storedUser - Cached user data as fallback
     * 
     * SECURITY: Even if we have a token, verify it's still valid
     * RESILIENCE: If server is down, use cached user (better UX)
     */
    const verifyToken = async (token, storedUser) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Token valid - use fresh user data from server
                    setUser({ ...result.data, token });
                } else {
                    // Token invalid - clear session
                    handleLogout();
                }
            } else {
                // HTTP error - clear session
                handleLogout();
            }
        } catch (err) {
            // Network error (server down)
            // Use cached user for better UX - they can still browse
            // Most protected actions will fail anyway without server
            setUser(storedUser);
        } finally {
            setLoading(false);
        }
    };

    // ========== AUTH HANDLERS ==========
    
    /**
     * Handle successful login
     * Called from Login page after backend authentication
     * 
     * @param {object} userData - User object from login API
     */
    const handleLogin = (userData) => {
        setUser(userData);
    };

    /**
     * Handle logout
     * Clears all session data and resets state
     * 
     * WHY separate function: Called from multiple places (Header, token expiry)
     */
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // ========== PROTECTED ROUTE COMPONENT ==========
    
    /**
     * ProtectedRoute - Higher-order component for route protection
     * 
     * FEATURES:
     * 1. Shows loading state while verifying auth
     * 2. Redirects to login if not authenticated
     * 3. Redirects to home if role not allowed
     * 4. Renders children if all checks pass
     * 
     * @param {React.ReactNode} children - Protected component to render
     * @param {string[]} allowedRoles - Roles that can access this route
     * 
     * USAGE:
     * <ProtectedRoute allowedRoles={['doctor']}>
     *   <DoctorDashboard />
     * </ProtectedRoute>
     */
    const ProtectedRoute = ({ children, allowedRoles }) => {
        // Still checking auth - show loading
        if (loading) {
            return <div className="page"><div className="container text-center">Loading...</div></div>;
        }
        
        // Not logged in - redirect to login
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        
        // Logged in but wrong role - redirect to home
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }
        
        // All checks passed - render the protected component
        return children;
    };

    // ========== LOADING STATE ==========
    
    /**
     * Show branded loading screen while verifying session
     * 
     * WHY: Prevents flash of login page before auth check completes
     * Better UX than blank screen
     */
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

    // ========== MAIN RENDER ==========
    
    return (
        <Router>
            {/* Header appears on all pages - handles nav and logout */}
            <Header user={user} onLogout={handleLogout} />
            
            <Routes>
                {/* ============ PUBLIC ROUTES ============ */}
                {/* Accessible without login */}
                
                {/* Home page - different content based on user state */}
                <Route path="/" element={<HomePage user={user} />} />
                
                {/* Login page - redirect if already logged in */}
                <Route path="/login" element={
                    user ? <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/staff/dashboard'} /> : <Login onLogin={handleLogin} />
                } />
                
                {/* Information page about the verification process */}
                <Route path="/verify-info" element={<VerifyInfo />} />
                
                {/* ============ PATIENT FLOW (OTP Protected) ============ */}
                {/* No login required - protected by OTP verification */}
                
                {/* STEP 4: Patient enters OTP from SMS/WhatsApp */}
                <Route path="/verify/:id" element={<PatientVerify />} />
                
                {/* STEPS 5-7: Patient answers questions, reviews drafts, consents */}
                <Route path="/follow-up/:id" element={<PatientFollowUp />} />
                
                {/* After submission - thank you page */}
                <Route path="/follow-up/:id/success" element={<SuccessPage />} />
                
                {/* View prescription details (public for now) */}
                <Route path="/prescription/:id" element={<ViewPrescription />} />

                {/* ============ DOCTOR ROUTES (Protected) ============ */}
                {/* Require login + doctor role */}
                
                {/* Doctor's main dashboard - overview and quick actions */}
                <Route path="/doctor/dashboard" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <DoctorDashboard user={user} />
                    </ProtectedRoute>
                } />
                
                {/* List all prescriptions for this doctor */}
                <Route path="/doctor/prescriptions" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <PrescriptionsList user={user} />
                    </ProtectedRoute>
                } />
                
                {/* STEPS 1-2: Create new prescription + initiate follow-up */}
                <Route path="/doctor/prescriptions/new" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <NewPrescription user={user} />
                    </ProtectedRoute>
                } />
                
                {/* List all follow-ups for this doctor */}
                <Route path="/doctor/follow-ups" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <FollowUpsList user={user} />
                    </ProtectedRoute>
                } />
                
                {/* STEP 9: View patient-submitted summary */}
                <Route path="/doctor/follow-ups/:id" element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                        <FollowUpSummary user={user} />
                    </ProtectedRoute>
                } />

                {/* ============ STAFF ROUTES (Protected) ============ */}
                {/* Require login + staff role */}
                
                {/* Staff dashboard for data entry assistance */}
                <Route path="/staff/dashboard" element={
                    <ProtectedRoute allowedRoles={['staff']}>
                        <StaffDashboard user={user} />
                    </ProtectedRoute>
                } />

                {/* ============ FALLBACK ============ */}
                {/* Any unknown route redirects to home */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default App;
