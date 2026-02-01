/**
 * ============================================================================
 * Header.js - Navigation Header Component
 * ============================================================================
 * 
 * PURPOSE:
 * Primary navigation component that appears on every page.
 * Handles:
 * - Brand logo and home link
 * - Role-based navigation menus
 * - Theme toggle (dark/light mode)
 * - User display and logout
 * 
 * ROLE-BASED NAVIGATION:
 * - Doctor: Dashboard, Prescriptions, Follow-Ups links
 * - Staff: Dashboard link only
 * - Guest (no user): Login link only
 * 
 * THEME SUPPORT:
 * - Persists user's theme preference to localStorage
 * - Defaults to dark mode (easier on eyes for medical professionals)
 * - Sets data-theme attribute on document root for CSS variables
 * 
 * PROPS:
 * - user: Current user object or null
 * - onLogout: Callback function to handle logout
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';

// React Router hooks for navigation
// - Link: Navigation links without page reload
// - useLocation: Get current URL for active link styling
// - useNavigate: Programmatic navigation (for logout)
import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * Header Component
 * 
 * @param {object} props
 * @param {object|null} props.user - Current user object { name, role, ... } or null
 * @param {function} props.onLogout - Callback to clear auth state
 */
function Header({ user, onLogout }) {
    // Get current path for active link highlighting
    const location = useLocation();
    
    // For programmatic navigation after logout
    const navigate = useNavigate();
    
    // ========== THEME STATE ==========
    /**
     * Dark mode state with localStorage persistence
     * 
     * WHY localStorage: User's theme preference persists across sessions
     * WHY default to dark: Common preference in clinical settings
     *                      (reduces eye strain during long shifts)
     */
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to dark mode
    });

    // ========== THEME EFFECT ==========
    /**
     * Apply theme to document and persist preference
     * 
     * HOW IT WORKS:
     * - Sets data-theme attribute on <html> element
     * - CSS uses [data-theme="dark"] selectors for dark mode styles
     * - Saves preference to localStorage for persistence
     */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    /**
     * Toggle between dark and light themes
     */
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    /**
     * Handle logout action
     * 
     * 1. Call parent's onLogout to clear auth state
     * 2. Navigate to home page
     */
    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    // ========== RENDER ==========
    return (
        <header className="header">
            <div className="container header-content">
                
                {/* ========== BRAND LOGO ========== */}
                {/* Always links to home page */}
                <Link to="/" className="logo">
                    <div className="logo-icon">🏥</div>
                    <span>NEST 2O</span>
                </Link>

                {/* ========== NAVIGATION ========== */}
                <nav className="nav">
                    
                    {/* ========== DOCTOR NAVIGATION ========== */}
                    {/* Only shown when logged in as doctor */}
                    {user?.role === 'doctor' && (
                        <>
                            {/* Dashboard - Main overview page */}
                            <Link
                                to="/doctor/dashboard"
                                className={`nav-link ${location.pathname === '/doctor/dashboard' ? 'active' : ''}`}
                            >
                                Dashboard
                            </Link>
                            
                            {/* Prescriptions - List and create prescriptions */}
                            <Link
                                to="/doctor/prescriptions"
                                className={`nav-link ${location.pathname.includes('/doctor/prescriptions') ? 'active' : ''}`}
                            >
                                Prescriptions
                            </Link>
                            
                            {/* Follow-Ups - View submitted follow-ups */}
                            <Link
                                to="/doctor/follow-ups"
                                className={`nav-link ${location.pathname.includes('/doctor/follow-ups') ? 'active' : ''}`}
                            >
                                Follow-Ups
                            </Link>
                        </>
                    )}

                    {/* ========== STAFF NAVIGATION ========== */}
                    {/* Only shown when logged in as staff */}
                    {user?.role === 'staff' && (
                        <Link
                            to="/staff/dashboard"
                            className={`nav-link ${location.pathname === '/staff/dashboard' ? 'active' : ''}`}
                        >
                            Dashboard
                        </Link>
                    )}

                    {/* ========== THEME TOGGLE ========== */}
                    {/* Always visible - sun for light mode, moon for dark mode */}
                    <button
                        className="btn btn-sm theme-toggle"
                        onClick={toggleTheme}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    {/* ========== USER SECTION ========== */}
                    {user ? (
                        // Logged in - show name and logout button
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {/* User name display - "Dr." prefix for doctors */}
                            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                {user.role === 'doctor' ? `Dr. ${user.name}` : user.name}
                            </span>
                            
                            {/* Logout button */}
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        // Not logged in - show login button
                        <Link to="/login" className="btn btn-sm btn-primary">
                            Login
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default Header;
