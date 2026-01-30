/**
 * Header Component
 * Navigation header with role-based display
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header({ userRole, onRoleChange }) {
    const location = useLocation();

    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/" className="logo">
                    <div className="logo-icon">🏥</div>
                    <span>NEST 2O</span>
                </Link>

                <nav className="nav">
                    {userRole === 'doctor' && (
                        <>
                            <Link
                                to="/doctor/dashboard"
                                className={`nav-link ${location.pathname === '/doctor/dashboard' ? 'active' : ''}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/doctor/prescriptions"
                                className={`nav-link ${location.pathname === '/doctor/prescriptions' ? 'active' : ''}`}
                            >
                                Prescriptions
                            </Link>
                            <Link
                                to="/doctor/follow-ups"
                                className={`nav-link ${location.pathname === '/doctor/follow-ups' ? 'active' : ''}`}
                            >
                                Follow-Ups
                            </Link>
                        </>
                    )}

                    <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onRoleChange(userRole === 'doctor' ? null : 'doctor')}
                    >
                        {userRole === 'doctor' ? 'Exit Doctor Mode' : 'Doctor Login'}
                    </button>
                </nav>
            </div>
        </header>
    );
}

export default Header;
