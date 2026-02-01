/**
 * ============================================================================
 * Loading.js - Reusable Loading Spinner Component
 * ============================================================================
 * 
 * PURPOSE:
 * Provide consistent loading feedback throughout the application.
 * Used whenever async operations are in progress (API calls, data loading).
 * 
 * FEATURES:
 * - CSS-based spinner animation (no external dependencies)
 * - Customizable loading message
 * - Centered layout with appropriate spacing
 * 
 * USAGE:
 * <Loading />                           // Default "Loading..." message
 * <Loading message="Generating..." />   // Custom message
 * 
 * STYLING:
 * - .loading-container: Flexbox centered container
 * - .spinner: CSS animated spinner (defined in index.css)
 * - .loading-text: Muted text below spinner
 * 
 * ============================================================================
 */

import React from 'react';

/**
 * Loading Component
 * 
 * @param {object} props
 * @param {string} props.message - Text to display below spinner (default: "Loading...")
 * @returns {JSX.Element} Centered loading spinner with message
 */
function Loading({ message = 'Loading...' }) {
    return (
        <div className="loading-container">
            {/* Animated spinner - CSS keyframes animation */}
            <div className="spinner"></div>
            
            {/* Loading message - describes what's happening */}
            <p className="loading-text">{message}</p>
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default Loading;
