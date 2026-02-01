/**
 * Header Component
 * Navigation header with role-based display and theme toggle
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Header({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to dark mode
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="logo">
                    <div className="logo-icon">🏥</div>
                    <span>NEST 2O</span>
                </Link>

                <nav className="nav">
                    {user?.role === 'doctor' && (
                        <>
                            <Link
                                to="/doctor/dashboard"
                                className={`nav-link ${location.pathname === '/doctor/dashboard' ? 'active' : ''}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/doctor/prescriptions"
                                className={`nav-link ${location.pathname.includes('/doctor/prescriptions') ? 'active' : ''}`}
                            >
                                Prescriptions
                            </Link>
                            <Link
                                to="/doctor/follow-ups"
                                className={`nav-link ${location.pathname.includes('/doctor/follow-ups') ? 'active' : ''}`}
                            >
                                Follow-Ups
                            </Link>
                        </>
                    )}

                    {user?.role === 'staff' && (
                        <Link
                            to="/staff/dashboard"
                            className={`nav-link ${location.pathname === '/staff/dashboard' ? 'active' : ''}`}
                        >
                            Dashboard
                        </Link>
                    )}

                    <button
                        className="btn btn-sm theme-toggle"
                        onClick={toggleTheme}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {user.role === 'doctor' ? `Dr. ${user.name}` : user.name}
                            </span>
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-sm btn-primary">
                            Login
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;
