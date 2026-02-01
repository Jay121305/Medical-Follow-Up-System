/**
 * ============================================================================
 * NEST 2O Frontend - React Entry Point
 * ============================================================================
 * 
 * PURPOSE:
 * This is the starting point for the React application. It renders the root
 * App component into the DOM.
 * 
 * WHY REACT.STRICTMODE?
 * - Highlights potential problems in the app during development
 * - Detects unsafe lifecycles, legacy API usage, and more
 * - Does NOT affect production builds
 * - May cause components to render twice in development (this is intentional)
 * 
 * FILE STRUCTURE:
 * index.js (this file) → App.js → individual page/component files
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// IMPORTS
// ============================================================================

import React from 'react';               // React library - required for JSX
import ReactDOM from 'react-dom/client'; // React 18's new root API for rendering
import './index.css';                    // Global CSS styles (variables, resets, utilities)
import App from './App';                 // Main application component

// ============================================================================
// ROOT RENDERING
// ============================================================================

/**
 * Create a React root and render the app
 * 
 * WHY createRoot (React 18)?
 * - Enables concurrent features (Suspense, Transitions)
 * - Better performance through automatic batching
 * - Required for React 18+ features
 * 
 * document.getElementById('root') finds the div in public/index.html
 */
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * Render the App inside StrictMode
 * 
 * StrictMode checks:
 * - Unsafe lifecycle methods
 * - Legacy string ref API usage
 * - Deprecated findDOMNode usage
 * - Legacy context API
 * - Unexpected side effects
 */
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
