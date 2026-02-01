/**
 * ============================================================================
 * NEST 2O - Medical Follow-Up System
 * Main Server Entry Point (server.js)
 * ============================================================================
 * 
 * PURPOSE:
 * This is the main entry point for the NEST 2O backend API server.
 * It initializes Express, configures middleware, and mounts all API routes.
 * 
 * SYSTEM OVERVIEW:
 * - Doctor-initiated: Only doctors can create prescriptions and request follow-ups
 * - Patient-verified: Patients must verify via OTP before any data is collected
 * - AI-assisted: AI generates draft statements, but patients have final say
 * - Consent-first: No medical data visible until patient explicitly consents
 * 
 * ARCHITECTURE:
 * - Express.js server with RESTful API endpoints
 * - Firebase Firestore for data persistence
 * - Groq API (LLaMA 3.3 70B) for AI-assisted features
 * - Twilio for WhatsApp/SMS OTP delivery
 * 
 * SECURITY PRINCIPLES:
 * 1. OTP verification required before any medical data access
 * 2. Role-based access control (doctor/staff)
 * 3. CORS configured for specific frontend origin
 * 4. Helmet.js for HTTP security headers
 * 
 * @author NEST 2O Team
 * @version 1.0.0
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const express = require('express');       // Web framework for Node.js - handles routing and middleware
const cors = require('cors');             // Cross-Origin Resource Sharing - allows frontend to call API
const helmet = require('helmet');         // Security middleware - sets various HTTP headers
require('dotenv').config();               // Loads environment variables from .env file

// ============================================================================
// ROUTE IMPORTS
// Each route module handles a specific domain of the application
// ============================================================================

const prescriptionRoutes = require('./routes/prescriptionRoutes');  // CRUD for prescriptions
const followUpRoutes = require('./routes/followUpRoutes');          // Follow-up workflow (OTP, submit, summary)
const authRoutes = require('./routes/authRoutes');                  // Login/register for doctors and staff
const adverseEventRoutes = require('./routes/adverseEventRoutes');  // Adverse event reporting (pharmacovigilance)

// ============================================================================
// EXPRESS APP INITIALIZATION
// ============================================================================

const app = express();
const PORT = process.env.PORT || 5000;    // Default to port 5000 if not specified in .env

// ============================================================================
// MIDDLEWARE CONFIGURATION
// Middleware executes in the order it's defined - order matters!
// ============================================================================

/**
 * HELMET - Security Headers
 * Automatically sets security-related HTTP headers:
 * - X-Content-Type-Options: nosniff (prevents MIME sniffing)
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - X-XSS-Protection: 1; mode=block (XSS filter)
 * - And many more...
 */
app.use(helmet());

/**
 * CORS - Cross-Origin Resource Sharing
 * WHY: Browser security blocks requests from different origins by default.
 *      We need to explicitly allow our frontend to make API calls.
 * 
 * CONFIGURATION:
 * - origin: Only allow requests from our frontend URL
 * - credentials: Allow cookies/auth headers to be sent
 */
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

/**
 * BODY PARSING MIDDLEWARE
 * WHY: Express doesn't parse request bodies by default.
 *      We need this to access req.body in our routes.
 * 
 * LIMIT: Set to 50mb to handle base64-encoded prescription images
 *        (typical prescription image is 1-5MB, base64 adds ~33% overhead)
 */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * REQUEST LOGGING MIDDLEWARE
 * WHY: Helps with debugging and monitoring API usage
 * 
 * FORMAT: ISO timestamp - HTTP method - request path
 * Example: 2024-01-15T10:30:00.000Z - POST /api/prescriptions
 */
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();  // IMPORTANT: Must call next() to continue to the next middleware/route
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /api/health
 * PURPOSE: Simple endpoint to verify the server is running
 * USAGE: Load balancers, monitoring tools, and deployment checks
 * NO AUTHENTICATION REQUIRED
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'NEST 2O Backend',
    });
});

// ============================================================================
// API ROUTES
// Mount route modules at their respective base paths
// ============================================================================

app.use('/api/auth', authRoutes);                // /api/auth/login, /api/auth/register, etc.
app.use('/api/prescriptions', prescriptionRoutes); // /api/prescriptions, /api/prescriptions/:id, etc.
app.use('/api/follow-ups', followUpRoutes);       // /api/follow-ups, /api/follow-ups/:id/verify-otp, etc.
app.use('/api/adverse-events', adverseEventRoutes); // /api/adverse-events - Pharmacovigilance workflow

// ============================================================================
// ERROR HANDLING
// These must be defined AFTER all routes
// ============================================================================

/**
 * 404 NOT FOUND HANDLER
 * WHY: Catches any requests that didn't match a route
 * WHEN: This runs when no route handler called res.send() or res.json()
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

/**
 * GLOBAL ERROR HANDLER
 * WHY: Catches any unhandled errors thrown in route handlers
 * WHEN: Called when next(error) is invoked or an uncaught exception occurs
 * 
 * SIGNATURE: Must have 4 parameters (err, req, res, next) for Express to
 *            recognize it as an error handler
 */
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start the Express server
 * app.listen() creates an HTTP server and begins accepting connections
 */
app.listen(PORT, () => {
    // ASCII art banner for easy identification in logs
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    NEST 2O Backend                         ║
║          Medical Follow-Up System - API Server             ║
╠═══════════════════════════════════════════════════════════╣
║  Status: Running                                           ║
║  Port: ${PORT}                                               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║  Endpoints:                                                ║
║  - POST /api/prescriptions                                 ║
║  - GET  /api/prescriptions/doctor/:doctorId                ║
║  - POST /api/follow-ups                                    ║
║  - POST /api/follow-ups/:id/verify-otp                     ║
║  - GET  /api/follow-ups/:id/drafts                         ║
║  - POST /api/follow-ups/:id/submit                         ║
║  - GET  /api/follow-ups/:id/summary                        ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// ============================================================================
// MODULE EXPORT
// ============================================================================

/**
 * Export the Express app for testing purposes
 * WHY: Allows supertest or other testing tools to make requests without
 *      actually starting the server
 */
module.exports = app;
