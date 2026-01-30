/**
 * Loading Component
 * Reusable loading spinner with optional message
 */

import React from 'react';

function Loading({ message = 'Loading...' }) {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">{message}</p>
        </div>
    );
}

export default Loading;
