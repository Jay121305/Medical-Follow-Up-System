/**
 * Login Page
 * Combined login for Doctors and Staff
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../components/Disclaimer';

function Login({ onLogin }) {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'doctor',
        specialization: '',
        phone: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
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

            // Store token and user info
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data));

            // Call parent login handler
            onLogin(result.data);

            // Redirect based on role
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

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '450px' }}>
                <Disclaimer />

                <div className="card animate-slide-up">
                    <div className="text-center mb-4">
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                            {formData.role === 'doctor' ? '👨‍⚕️' : '👩‍💼'}
                        </div>
                        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                        <p className="text-muted">
                            {isLogin ? 'Login to access your dashboard' : 'Register as a new user'}
                        </p>
                    </div>

                    {/* Role Toggle */}
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

                    {error && (
                        <div className="alert alert-error mb-3">
                            <span>❌</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <>
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

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            disabled={loading}
                        >
                            {loading ? '⏳ Please wait...' : (isLogin ? '🔐 Login' : '📝 Register')}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-muted">
                            {isLogin ? "Don't have an account?" : 'Already have an account?'}
                            <button
                                type="button"
                                className="btn btn-link"
                                style={{ padding: '0 0.5rem', textDecoration: 'underline' }}
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                }}
                            >
                                {isLogin ? 'Register' : 'Login'}
                            </button>
                        </p>
                    </div>

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

export default Login;
