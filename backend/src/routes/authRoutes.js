/**
 * ============================================================================
 * Authentication Routes - Doctor & Staff Login/Registration
 * ============================================================================
 * 
 * PURPOSE:
 * Handles authentication for doctors and staff members.
 * This is NOT for patient authentication (patients use OTP verification).
 * 
 * USER ROLES:
 * 1. Doctor: Can create prescriptions, initiate follow-ups, view summaries
 * 2. Staff: Can view all prescriptions, help with data entry
 * 
 * AUTHENTICATION METHOD:
 * - JWT (JSON Web Token) based authentication
 * - Tokens expire after 24 hours
 * - Passwords hashed with bcrypt (salt rounds: 10)
 * 
 * ENDPOINTS:
 * - POST /register - Create new doctor/staff account
 * - POST /login - Authenticate and get JWT token
 * - GET /me - Get current user info from token
 * - GET /doctors - List all active doctors (for staff)
 * 
 * SECURITY NOTES:
 * - Passwords never stored in plain text
 * - JWT secret should be in environment variables
 * - Deactivated accounts cannot login
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

/**
 * Express Router for modular route handling
 */
const express = require('express');
const router = express.Router();

/**
 * Firebase Firestore database connection
 */
const { db } = require('../config/firebase');

/**
 * bcryptjs - Password hashing library
 * WHY bcrypt? Industry standard, includes salt, resistant to rainbow tables
 */
const bcrypt = require('bcryptjs');

/**
 * jsonwebtoken - JWT creation and verification
 * Used for stateless authentication
 */
const jwt = require('jsonwebtoken');

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * JWT Secret Key
 * IMPORTANT: In production, this should be a strong random string in .env
 * Used to sign and verify JWT tokens
 */
const JWT_SECRET = process.env.JWT_SECRET || 'nest2o-secret-key-2024';

// ============================================================================
// REGISTRATION ENDPOINT
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new doctor or staff member
 * 
 * WORKFLOW:
 * 1. Validate required fields
 * 2. Check if email already exists
 * 3. Hash password with bcrypt
 * 4. Create user document in Firestore
 * 5. Generate JWT token
 * 6. Return user data and token
 * 
 * REQUEST BODY:
 * - email: string (required) - User's email address
 * - password: string (required) - Password (min 6 chars recommended)
 * - name: string (required) - Full name
 * - role: 'doctor' | 'staff' (required) - User role
 * - specialization: string (optional) - Doctor's specialization
 * - hospitalId: string (optional) - Hospital identifier
 * - phone: string (optional) - Contact number
 * 
 * RESPONSE:
 * - 201: User created successfully with token
 * - 400: Validation error or user exists
 * - 500: Server error
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, specialization, hospitalId, phone } = req.body;

        // ========== VALIDATION ==========
        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: email, password, name, role',
            });
        }

        // Validate role is either 'doctor' or 'staff'
        if (!['doctor', 'staff'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be "doctor" or "staff"',
            });
        }

        // ========== CHECK EXISTING USER ==========
        // Convert email to lowercase for case-insensitive comparison
        const existingUser = await db.collection('users').where('email', '==', email.toLowerCase()).get();
        if (!existingUser.empty) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }

        // ========== PASSWORD HASHING ==========
        // Salt rounds: 10 (good balance of security and performance)
        const hashedPassword = await bcrypt.hash(password, 10);

        // ========== CREATE USER DOCUMENT ==========
        const userData = {
            email: email.toLowerCase(),     // Store lowercase for consistency
            password: hashedPassword,       // Never store plain text!
            name,
            role,
            specialization: role === 'doctor' ? specialization || null : null,  // Only for doctors
            hospitalId: hospitalId || 'default-hospital',
            phone: phone || null,
            createdAt: new Date(),
            isActive: true,                 // Can be deactivated by admin
        };

        const userRef = await db.collection('users').add(userData);

        // ========== GENERATE JWT TOKEN ==========
        // Include minimal info in token (avoid sensitive data)
        const token = jwt.sign(
            { userId: userRef.id, email: userData.email, role: userData.role, name: userData.name },
            JWT_SECRET,
            { expiresIn: '24h' }  // Token valid for 24 hours
        );

        // Return success (exclude password from response)
        res.status(201).json({
            success: true,
            data: {
                userId: userRef.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                specialization: userData.specialization,
                token,
            },
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register user',
        });
    }
});

// ============================================================================
// LOGIN ENDPOINT
// ============================================================================

/**
 * POST /api/auth/login
 * Authenticate doctor or staff member
 * 
 * WORKFLOW:
 * 1. Validate email and password provided
 * 2. Find user by email
 * 3. Verify password using bcrypt
 * 4. Check if account is active
 * 5. Generate new JWT token
 * 6. Update last login timestamp
 * 7. Return user data and token
 * 
 * REQUEST BODY:
 * - email: string (required)
 * - password: string (required)
 * 
 * RESPONSE:
 * - 200: Login successful with token
 * - 401: Invalid credentials
 * - 403: Account deactivated
 * - 500: Server error
 * 
 * SECURITY:
 * - Same error message for wrong email or password (prevents enumeration)
 * - Password compared using timing-safe bcrypt.compare()
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }

        // ========== FIND USER ==========
        const usersSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();
        
        if (usersSnapshot.empty) {
            // Generic error message prevents email enumeration
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        // ========== VERIFY PASSWORD ==========
        // bcrypt.compare is timing-safe (prevents timing attacks)
        const isValidPassword = await bcrypt.compare(password, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // ========== CHECK ACCOUNT STATUS ==========
        if (!userData.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Contact administrator.',
            });
        }

        // ========== GENERATE JWT TOKEN ==========
        const token = jwt.sign(
            { userId: userDoc.id, email: userData.email, role: userData.role, name: userData.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login timestamp (for audit purposes)
        await db.collection('users').doc(userDoc.id).update({
            lastLogin: new Date(),
        });

        // Return success with user data and token
        res.json({
            success: true,
            data: {
                userId: userDoc.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                specialization: userData.specialization,
                hospitalId: userData.hospitalId,
                token,
            },
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to login',
        });
    }
});

// ============================================================================
// CURRENT USER ENDPOINT
// ============================================================================

/**
 * GET /api/auth/me
 * Get current user information from JWT token
 * 
 * WORKFLOW:
 * 1. Extract token from Authorization header
 * 2. Verify and decode token
 * 3. Fetch fresh user data from database
 * 4. Return user information
 * 
 * HEADERS:
 * - Authorization: Bearer <token>
 * 
 * RESPONSE:
 * - 200: User data returned
 * - 401: No token or invalid token
 * - 404: User not found
 * 
 * USE CASES:
 * - Frontend checking if user is still logged in
 * - Getting fresh user data after page refresh
 * - Validating token before sensitive operations
 */
router.get('/me', async (req, res) => {
    try {
        // ========== EXTRACT TOKEN ==========
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
            });
        }

        // Remove 'Bearer ' prefix
        const token = authHeader.split(' ')[1];
        
        // ========== VERIFY TOKEN ==========
        // jwt.verify throws if token is invalid or expired
        const decoded = jwt.verify(token, JWT_SECRET);

        // ========== FETCH FRESH USER DATA ==========
        // Don't trust token data alone - fetch from database
        const userDoc = await db.collection('users').doc(decoded.userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const userData = userDoc.data();

        // Return user data (exclude password)
        res.json({
            success: true,
            data: {
                userId: userDoc.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                specialization: userData.specialization,
                hospitalId: userData.hospitalId,
            },
        });

    } catch (error) {
        // Handle JWT-specific errors
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
        }
        console.error('Get User Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user info',
        });
    }
});

// ============================================================================
// LIST DOCTORS ENDPOINT
// ============================================================================

/**
 * GET /api/auth/doctors
 * Get all active doctors
 * 
 * PURPOSE:
 * - Staff can see list of doctors when assigning prescriptions
 * - Dropdown selection for doctor assignment
 * 
 * RESPONSE:
 * - 200: Array of doctors with basic info
 * - 500: Server error
 * 
 * NOTES:
 * - Only returns active doctors
 * - Excludes sensitive info (password, etc.)
 * - Used by staff dashboard
 */
router.get('/doctors', async (req, res) => {
    try {
        // Query only active doctors
        const doctorsSnapshot = await db.collection('users')
            .where('role', '==', 'doctor')
            .where('isActive', '==', true)
            .get();

        // Build response array
        const doctors = [];
        doctorsSnapshot.forEach(doc => {
            const data = doc.data();
            doctors.push({
                id: doc.id,
                name: data.name,
                email: data.email,
                specialization: data.specialization,
            });
        });

        res.json({
            success: true,
            data: doctors,
        });

    } catch (error) {
        console.error('Get Doctors Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch doctors',
        });
    }
});

// ============================================================================
// EXPORT ROUTER
// ============================================================================

module.exports = router;
