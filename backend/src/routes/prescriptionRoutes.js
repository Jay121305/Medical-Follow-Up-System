/**
 * Prescription Routes
 * Handles STEP 2: Prescription storage
 * 
 * No AI involvement at this stage
 * Simply stores prescription metadata for later follow-up
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/prescriptions
 * Create a new prescription
 * 
 * Required fields:
 * - medicineName: Name of the prescribed medicine
 * - dosage: Dosage instructions (e.g., "500mg twice daily")
 * - duration: Treatment duration (e.g., "7 days")
 * - patientEmail: Patient's email address
 * - doctorId: ID of the prescribing doctor
 * 
 * Optional fields:
 * - condition: Medical condition being treated
 * - notes: Additional notes from doctor
 */
router.post('/', async (req, res) => {
    try {
        const {
            medicineName,
            dosage,
            duration,
            patientEmail,
            doctorId,
            condition,
            notes,
        } = req.body;

        // Validate required fields
        if (!medicineName || !dosage || !duration || !patientEmail || !doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: medicineName, dosage, duration, patientEmail, doctorId',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(patientEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
            });
        }

        // Generate case ID
        const caseId = `CASE-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Create prescription document
        const prescriptionData = {
            caseId,
            medicineName,
            dosage,
            duration,
            patientEmail,
            doctorId,
            condition: condition || null,
            notes: notes || null,
            createdAt: new Date(),
            status: 'active', // active, follow_up_sent, completed
        };

        const prescriptionRef = await db.collection('prescriptions').add(prescriptionData);

        res.status(201).json({
            success: true,
            data: {
                id: prescriptionRef.id,
                caseId,
                ...prescriptionData,
            },
        });

    } catch (error) {
        console.error('Create Prescription Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create prescription',
        });
    }
});

/**
 * GET /api/prescriptions/doctor/:doctorId
 * Get all prescriptions for a specific doctor
 */
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        const snapshot = await db.collection('prescriptions')
            .where('doctorId', '==', doctorId)
            .orderBy('createdAt', 'desc')
            .get();

        const prescriptions = [];
        snapshot.forEach(doc => {
            prescriptions.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            });
        });

        res.json({
            success: true,
            data: prescriptions,
        });

    } catch (error) {
        console.error('Get Prescriptions Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prescriptions',
        });
    }
});

/**
 * GET /api/prescriptions/:id
 * Get a specific prescription by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await db.collection('prescriptions').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found',
            });
        }

        res.json({
            success: true,
            data: {
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            },
        });

    } catch (error) {
        console.error('Get Prescription Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prescription',
        });
    }
});

module.exports = router;
