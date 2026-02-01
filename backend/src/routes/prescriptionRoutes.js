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
const { processPrescriptionImage } = require('../services/ocrService');

/**
 * POST /api/prescriptions/scan
 * Scan a prescription image using OCR and return extracted data
 */
router.post('/scan', async (req, res) => {
    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image data is required (base64 string)',
            });
        }

        const result = await processPrescriptionImage(image);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                rawText: result.rawText || null,
            });
        }

        res.json({
            success: true,
            data: result.data,
            rawText: result.rawText,
        });

    } catch (error) {
        console.error('Prescription Scan Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process prescription image',
        });
    }
});

/**
 * POST /api/prescriptions
 * Create a new prescription
 * 
 * Required fields:
 * - medicineName: Name of the prescribed medicine
 * - dosage: Dosage instructions (e.g., "500mg twice daily")
 * - duration: Treatment duration (e.g., "7 days")
 * - patientPhone: Patient's phone number for WhatsApp
 * - doctorId: ID of the prescribing doctor
 * 
 * Optional fields:
 * - patientName: Patient's name
 * - patientEmail: Patient's email address (optional now)
 * - condition: Medical condition being treated
 * - notes: Additional notes from doctor
 */
router.post('/', async (req, res) => {
    try {
        const {
            medicineName,
            dosage,
            duration,
            patientPhone,
            patientName,
            patientEmail,
            doctorId,
            condition,
            notes,
        } = req.body;

        // Validate required fields
        if (!medicineName || !dosage || !duration || !patientPhone || !doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: medicineName, dosage, duration, patientPhone, doctorId',
            });
        }

        // Validate phone format (basic validation - at least 10 digits)
        const phoneDigits = patientPhone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format (minimum 10 digits required)',
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
            patientPhone,
            patientName: patientName || null,
            patientEmail: patientEmail || null,
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
 * GET /api/prescriptions/all
 * Get all prescriptions (for staff dashboard)
 * Returns prescriptions from all doctors with doctor info
 */
router.get('/all', async (req, res) => {
    try {
        const snapshot = await db.collection('prescriptions')
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
        console.error('Get All Prescriptions Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prescriptions',
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

/**
 * PATCH /api/prescriptions/:id
 * Update patient details for a prescription
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { patientPhone, patientEmail, patientName } = req.body;

        const doc = await db.collection('prescriptions').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found',
            });
        }

        // Build update object with only provided fields
        const updates = {};
        if (patientPhone !== undefined) updates.patientPhone = patientPhone;
        if (patientEmail !== undefined) updates.patientEmail = patientEmail;
        if (patientName !== undefined) updates.patientName = patientName;
        updates.updatedAt = new Date();

        await db.collection('prescriptions').doc(id).update(updates);

        res.json({
            success: true,
            message: 'Patient details updated successfully',
            data: { id, ...updates },
        });

    } catch (error) {
        console.error('Update Prescription Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update prescription',
        });
    }
});

module.exports = router;
