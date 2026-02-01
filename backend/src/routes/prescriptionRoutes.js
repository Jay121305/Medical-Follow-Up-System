/**
 * ============================================================================
 * Prescription Routes - STEP 2: Prescription Storage
 * ============================================================================
 * 
 * PURPOSE:
 * Handles prescription creation, retrieval, and OCR scanning.
 * This is STEP 2 in the NEST 2O workflow.
 * 
 * WORKFLOW POSITION:
 * STEP 1: Doctor/Staff enters prescription data
 * STEP 2: → THIS FILE - Prescription stored in database ←
 * STEP 3: Doctor initiates follow-up (followUpRoutes.js)
 * 
 * NO AI INVOLVEMENT:
 * - This step simply stores prescription metadata
 * - AI is only used later for follow-up (STEP 5+)
 * - Exception: OCR scan uses AI to parse prescription images
 * 
 * ENDPOINTS:
 * - POST /scan - OCR scan prescription image
 * - POST / - Create new prescription
 * - GET /all - Get all prescriptions (staff)
 * - GET /doctor/:doctorId - Get doctor's prescriptions
 * - GET /:id - Get single prescription
 * - PATCH /:id - Update patient details
 * 
 * DATA STORAGE:
 * - Collection: 'prescriptions' in Firestore
 * - Each prescription gets a unique caseId (CASE-XXXXXXXX)
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
 * UUID generation for unique case IDs
 */
const { v4: uuidv4 } = require('uuid');

/**
 * OCR service for prescription image scanning
 * Uses Google Cloud Vision + Groq AI
 */
const { processPrescriptionImage } = require('../services/ocrService');

// ============================================================================
// OCR SCAN ENDPOINT
// ============================================================================

/**
 * POST /api/prescriptions/scan
 * Scan a prescription image using OCR and return extracted data
 * 
 * WORKFLOW:
 * 1. Receive base64-encoded image
 * 2. Send to Google Cloud Vision for text extraction
 * 3. Parse extracted text using Groq AI
 * 4. Return structured prescription data
 * 
 * REQUEST BODY:
 * - image: string (required) - Base64-encoded image
 * 
 * RESPONSE:
 * - 200: Extracted prescription data with raw OCR text
 * - 400: Missing image or extraction failed
 * - 500: Server error
 * 
 * USE CASE:
 * Doctor uploads photo of handwritten prescription
 * System extracts patient info, medicines, dosages automatically
 */
router.post('/scan', async (req, res) => {
    try {
        const { image } = req.body;

        // Validate image data is provided
        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image data is required (base64 string)',
            });
        }

        // Process image through OCR pipeline
        // Step 1: Google Vision extracts text
        // Step 2: Groq AI parses text into structured data
        const result = await processPrescriptionImage(image);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.error,
                rawText: result.rawText || null,  // Include raw text for debugging
            });
        }

        // Return extracted data
        res.json({
            success: true,
            data: result.data,      // Structured prescription data
            rawText: result.rawText, // Raw OCR text for reference
        });

    } catch (error) {
        console.error('Prescription Scan Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process prescription image',
        });
    }
});

// ============================================================================
// CREATE PRESCRIPTION ENDPOINT
// ============================================================================

/**
 * POST /api/prescriptions
 * Create a new prescription record
 * 
 * WORKFLOW:
 * 1. Validate required fields
 * 2. Validate phone number format
 * 3. Generate unique case ID
 * 4. Store in Firestore
 * 5. Return created prescription
 * 
 * REQUIRED FIELDS:
 * - medicineName: string - Name of prescribed medicine
 * - dosage: string - Dosage instructions (e.g., "500mg twice daily")
 * - duration: string - Treatment duration (e.g., "7 days")
 * - patientPhone: string - Patient's phone (for WhatsApp)
 * - doctorId: string - ID of prescribing doctor
 * 
 * OPTIONAL FIELDS:
 * - patientName: string - Patient's name
 * - patientEmail: string - Patient's email
 * - condition: string - Medical condition being treated
 * - notes: string - Additional doctor notes
 * 
 * RESPONSE:
 * - 201: Prescription created successfully
 * - 400: Validation error
 * - 500: Server error
 * 
 * CASE ID FORMAT:
 * CASE-XXXXXXXX (8 random alphanumeric characters)
 * Used for patient reference and tracking
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

        // ========== VALIDATION ==========
        // Check all required fields are present
        if (!medicineName || !dosage || !duration || !patientPhone || !doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: medicineName, dosage, duration, patientPhone, doctorId',
            });
        }

        // Validate phone number (at least 10 digits)
        // Phone is critical for WhatsApp delivery
        const phoneDigits = patientPhone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format (minimum 10 digits required)',
            });
        }

        // ========== GENERATE CASE ID ==========
        // Format: CASE-XXXXXXXX (8 uppercase alphanumeric chars)
        // Used for patient reference and support inquiries
        const caseId = `CASE-${uuidv4().substring(0, 8).toUpperCase()}`;

        // ========== CREATE PRESCRIPTION DOCUMENT ==========
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
            status: 'active',  // Status: active → follow_up_sent → completed
        };

        // Save to Firestore
        const prescriptionRef = await db.collection('prescriptions').add(prescriptionData);

        // Return created prescription with ID
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

// ============================================================================
// GET ALL PRESCRIPTIONS ENDPOINT
// ============================================================================

/**
 * GET /api/prescriptions/all
 * Get all prescriptions (for staff dashboard)
 * 
 * PURPOSE:
 * Staff members need to see all prescriptions across all doctors
 * for administrative purposes and data entry assistance.
 * 
 * RESPONSE:
 * - 200: Array of all prescriptions (newest first)
 * - 500: Server error
 * 
 * NOTES:
 * - Returns prescriptions from ALL doctors
 * - Sorted by creation date (descending)
 * - Used by staff dashboard only
 */
router.get('/all', async (req, res) => {
    try {
        // Query all prescriptions, newest first
        const snapshot = await db.collection('prescriptions')
            .orderBy('createdAt', 'desc')
            .get();

        // Build response array
        const prescriptions = [];
        snapshot.forEach(doc => {
            prescriptions.push({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamp to Date
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

// ============================================================================
// GET DOCTOR'S PRESCRIPTIONS ENDPOINT
// ============================================================================

/**
 * GET /api/prescriptions/doctor/:doctorId
 * Get all prescriptions for a specific doctor
 * 
 * PURPOSE:
 * Doctors can only see their own prescriptions.
 * This endpoint filters by doctorId.
 * 
 * PARAMS:
 * - doctorId: string - Doctor's user ID
 * 
 * RESPONSE:
 * - 200: Array of doctor's prescriptions (newest first)
 * - 500: Server error
 * 
 * USED BY:
 * Doctor dashboard to list their prescriptions
 * and initiate follow-ups
 */
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Query prescriptions for this doctor only
        const snapshot = await db.collection('prescriptions')
            .where('doctorId', '==', doctorId)
            .orderBy('createdAt', 'desc')
            .get();

        // Build response array
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

// ============================================================================
// GET SINGLE PRESCRIPTION ENDPOINT
// ============================================================================

/**
 * GET /api/prescriptions/:id
 * Get a specific prescription by ID
 * 
 * PURPOSE:
 * - View prescription details
 * - Patient can view their own prescription (public endpoint)
 * 
 * PARAMS:
 * - id: string - Prescription document ID
 * 
 * RESPONSE:
 * - 200: Prescription data
 * - 404: Prescription not found
 * - 500: Server error
 * 
 * NOTE:
 * This is a PUBLIC endpoint - no authentication required.
 * Patients access this via the link in their WhatsApp message.
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch prescription document
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

// ============================================================================
// UPDATE PRESCRIPTION ENDPOINT
// ============================================================================

/**
 * PATCH /api/prescriptions/:id
 * Update patient details for a prescription
 * 
 * PURPOSE:
 * Allow updating patient contact information.
 * Useful when phone number was entered incorrectly.
 * 
 * PARAMS:
 * - id: string - Prescription document ID
 * 
 * BODY (all optional):
 * - patientPhone: string - Updated phone number
 * - patientEmail: string - Updated email
 * - patientName: string - Updated name
 * 
 * RESPONSE:
 * - 200: Update successful
 * - 404: Prescription not found
 * - 500: Server error
 * 
 * NOTES:
 * - Only updates fields that are provided
 * - Does not modify prescription/medicine data
 * - Records update timestamp
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { patientPhone, patientEmail, patientName } = req.body;

        // Check prescription exists
        const doc = await db.collection('prescriptions').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found',
            });
        }

        // Build update object with only provided fields
        // This allows partial updates
        const updates = {};
        if (patientPhone !== undefined) updates.patientPhone = patientPhone;
        if (patientEmail !== undefined) updates.patientEmail = patientEmail;
        if (patientName !== undefined) updates.patientName = patientName;
        updates.updatedAt = new Date();  // Record when update occurred

        // Apply updates
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

// ============================================================================
// EXPORT ROUTER
// ============================================================================

module.exports = router;
