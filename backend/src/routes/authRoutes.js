/**
 * Authentication Routes
 * Handles Doctor and Staff login/registration
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nest2o-secret-key-2024';

/**
 * POST /api/auth/register
 * Register a new doctor or staff member
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role, specialization, hospitalId, phone } = req.body;

        if (!email || !password || !name || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: email, password, name, role',
            });
        }

        if (!['doctor', 'staff'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be "doctor" or "staff"',
            });
        }

        // Check if user already exists
        const existingUser = await db.collection('users').where('email', '==', email.toLowerCase()).get();
        if (!existingUser.empty) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user document
        const userData = {
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            role,
            specialization: role === 'doctor' ? specialization || null : null,
            hospitalId: hospitalId || 'default-hospital',
            phone: phone || null,
            createdAt: new Date(),
            isActive: true,
        };

        const userRef = await db.collection('users').add(userData);

        // Generate JWT token
        const token = jwt.sign(
            { userId: userRef.id, email: userData.email, role: userData.role, name: userData.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

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

/**
 * POST /api/auth/login
 * Login for doctors and staff
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required',
            });
        }

        // Find user by email
        const usersSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();
        
        if (usersSnapshot.empty) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        // Verify password
        const isValidPassword = await bcrypt.compare(password, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password',
            });
        }

        // Check if user is active
        if (!userData.isActive) {
            return res.status(403).json({
                success: false,
                error: 'Account is deactivated. Contact administrator.',
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: userDoc.id, email: userData.email, role: userData.role, name: userData.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await db.collection('users').doc(userDoc.id).update({
            lastLogin: new Date(),
        });

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

/**
 * GET /api/auth/me
 * Get current user info from token
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided',
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const userDoc = await db.collection('users').doc(decoded.userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }

        const userData = userDoc.data();

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

/**
 * GET /api/auth/doctors
 * Get all doctors (for staff to assign prescriptions)
 */
router.get('/doctors', async (req, res) => {
    try {
        const doctorsSnapshot = await db.collection('users')
            .where('role', '==', 'doctor')
            .where('isActive', '==', true)
            .get();

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

module.exports = router;
