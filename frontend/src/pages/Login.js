/**
 * ============================================================================
 * Login.js - Authentication Page
 * ============================================================================
 * 
 * PURPOSE:
 * Combined login and registration page for Doctors and Staff.
 * Patients do NOT use this page - they authenticate via OTP.
 * 
 * FEATURES:
 * - Toggle between login and registration modes
 * - Role selection (Doctor vs Staff)
 * - Dynamic form fields based on role
 * - Stores JWT token and user info in localStorage
 * - Redirects to appropriate dashboard after login
 * 
 * FORM FIELDS:
 * Login:
 *   - Email
 *   - Password
 * 
 * Registration (additional):
 *   - Full Name
 *   - Phone Number
 *   - Specialization (Doctor only)
 * 
 * SECURITY:
 * - Passwords hashed on backend (bcrypt)
 * - JWT tokens for session management
 * - Token stored in localStorage (simple, not production-grade)
 * 
 * ============================================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';

/**
 * Login Component
 * 
 * @param {object} props
 * @param {function} props.onLogin - Callback to set user in parent App state
 */
function Login({ onLogin }) {
    // React Router hook for navigation
    const navigate = useNavigate();
    
    // ========== STATE ==========
    
    /**
     * isLogin: Toggle between login (true) and register (false) modes
     */
    const [isLogin, setIsLogin] = useState(true);
    
    /**
     * loading: True while API call in progress
     */
    const [loading, setLoading] = useState(false);
    
    /**
     * error: Error message from failed login/registration
     */
    const [error, setError] = useState(null);
    
    /**
     * formData: Form field values
     * 
     * Note: All fields stored here even if not all are used
     * (e.g., specialization only used for doctor registration)
     */
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'doctor',          // Default role
        specialization: '',      // Doctor only
        phone: '',
    });

    // ========== HANDLERS ==========
    
    /**
     * Handle input field changes
     * Uses computed property name to update the right field
     */
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    /**
     * Handle form submission
     * 
     * FLOW:
     * 1. Determine endpoint (login vs register)
     * 2. Send appropriate data to backend
     * 3. Store token and user in localStorage
     * 4. Call parent's onLogin callback
     * 5. Navigate to role-appropriate dashboard
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Choose endpoint based on mode
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            
            // Login only needs email/password, register needs all fields
            const body = isLogin 
                ? { email: formData.email, password: formData.password }
                : formData;

            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error);
            }

            // ========== SUCCESS: STORE SESSION ==========
            // Store JWT token for subsequent API calls
            localStorage.setItem('token', result.data.token);
            // Store user object for UI display
            localStorage.setItem('user', JSON.stringify(result.data));

            // Update parent App component's user state
            onLogin(result.data);

            // Redirect to appropriate dashboard based on role
            if (result.data.role === 'doctor') {
                navigate('/doctor/dashboard');
            } else {
                navigate('/staff/dashboard');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ========== RENDER ==========
    return (
        <div className="page">
            {/* Centered, narrow container for form */}
            <div className="container" style={{ maxWidth: '450px' }}>
                <Disclaimer />

                <div className="card animate-slide-up">
                    {/* ========== HEADER ========== */}
                    <div className="text-center mb-4">
                        {/* Role-specific icon */}
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                            {formData.role === 'doctor' ? '👨‍⚕️' : '👩‍💼'}
                        </div>
                        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                        <p className="text-muted">
                            {isLogin ? 'Login to access your dashboard' : 'Register as a new user'}
                        </p>
                    </div>

                    {/* ========== ROLE TOGGLE ========== */}
                    {/* Select Doctor or Staff role */}
                    <div className="d-flex gap-2 mb-4" style={{ justifyContent: 'center' }}>
                        <button
                            type="button"
                            className={`btn ${formData.role === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFormData({ ...formData, role: 'doctor' })}
                            style={{ flex: 1 }}
                        >
                            👨‍⚕️ Doctor
                        </button>
                        <button
                            type="button"
                            className={`btn ${formData.role === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFormData({ ...formData, role: 'staff' })}
                            style={{ flex: 1 }}
                        >
                            👩‍💼 Staff
                        </button>
                    </div>

                    {/* ========== ERROR DISPLAY ========== */}
                    {error && (
                        <div className="alert alert-error mb-3">
                            <span>❌</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ========== LOGIN/REGISTER FORM ========== */}
                    <form onSubmit={handleSubmit}>
                        
                        {/* ===== REGISTRATION-ONLY FIELDS ===== */}
                        {!isLogin && (
                            <>
                                {/* Full Name */}
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        placeholder={formData.role === 'doctor' ? 'Dr. John Smith' : 'Jane Doe'}
                                    />
                                </div>

                                {/* Specialization - Doctor only */}
                                {formData.role === 'doctor' && (
                                    <div className="form-group">
                                        <label className="form-label">Specialization</label>
                                        <select
                                            name="specialization"
                                            className="form-input"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select specialization</option>
                                            <option value="General Physician">General Physician</option>
                                            <option value="Cardiologist">Cardiologist</option>
                                            <option value="Dermatologist">Dermatologist</option>
                                            <option value="Orthopedic">Orthopedic</option>
                                            <option value="Pediatrician">Pediatrician</option>
                                            <option value="Neurologist">Neurologist</option>
                                            <option value="Psychiatrist">Psychiatrist</option>
                                            <option value="Gynecologist">Gynecologist</option>
                                            <option value="ENT Specialist">ENT Specialist</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                )}

                                {/* Phone Number - Optional for both roles */}
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                            </>
                        )}

                        {/* ===== COMMON FIELDS (Login + Registration) ===== */}
                        
                        {/* Email - Required for both modes */}
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="email@hospital.com"
                            />
                        </div>

                        {/* Password - Required for both modes */}
                        <div className="form-group">
                            <label className="form-label">Password *</label>
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Please wait...' : (isLogin ? '🔐 Login' : '📝 Register')}
                        </button>
                    </form>

                    {/* ========== MODE TOGGLE ========== */}
                    {/* Switch between Login and Register */}
                    <div className="text-center mt-4">
                        <p className="text-muted">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                type="button"
                                className="btn btn-link"
                                style={{ padding: '0 0.5rem', textDecoration: 'underline' }}
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);  // Clear any errors when switching
                                }}
                            >
                                {isLogin ? 'Register' : 'Login'}
                            </button>
                        </p>
                    </div>

                    {/* ========== BACK TO HOME ========== */}
                    <div className="text-center mt-3">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/')}
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default Login;
