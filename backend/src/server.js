/**
 * NEST 2O - Medical Follow-Up System
 * Main Server Entry Point
 * 
 * Doctor-initiated, patient-verified, AI-assisted follow-up system
 * Ethical by design, consent-first, AI-minimal
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import routes
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Body parsing middleware - increased limit for image uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'NEST 2O Backend',
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/follow-ups', followUpRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
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

module.exports = app;
