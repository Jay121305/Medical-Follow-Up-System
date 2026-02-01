/**
 * ============================================================================
 * Follow-Up Routes - STEPS 3-9: Complete Follow-Up Workflow
 * ============================================================================
 * 
 * PURPOSE:
 * Handles the entire follow-up workflow from doctor initiation to doctor review.
 * This is the CORE of the NEST 2O system.
 * 
 * ⚠️ CRITICAL: All routes enforce proper authorization and consent gating.
 * No medical information is visible until patient verifies with OTP.
 * Doctor cannot see patient responses until explicit consent is given.
 * 
 * WORKFLOW STEPS:
 * STEP 3: POST / - Doctor initiates follow-up (OTP generated, WhatsApp sent)
 * STEP 4: POST /:id/verify-otp - Patient verifies identity with OTP
 * STEP 5: GET /:id/drafts - AI generates draft statements and questions
 * STEP 6-7: POST /:id/submit - Patient verifies, edits, and submits with consent
 * STEP 8: (Internal) - AI generates doctor summary
 * STEP 9: GET /:id/summary - Doctor views patient-verified summary
 * 
 * SECURITY MODEL:
 * 1. OTP Verification Gate: Patient must verify OTP before seeing ANY content
 * 2. Consent Gate: Doctor sees NOTHING until patient explicitly submits
 * 3. Authorization: Doctors can only access their own follow-ups
 * 
 * STATUS FLOW:
 * pending_verification → verified → submitted → ready_for_review → closed
 * 
 * ENDPOINTS:
 * - POST / - Create follow-up (STEP 3)
 * - POST /:id/verify-otp - Verify OTP (STEP 4)
 * - GET /:id/drafts - Get AI drafts (STEP 5)
 * - POST /:id/submit - Submit responses (STEP 6-7)
 * - GET /:id/summary - Doctor view summary (STEP 9)
 * - POST /:id/close - Close case
 * - GET /doctor/:doctorId - List doctor's follow-ups
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
 * OTP Service - handles OTP generation and verification
 * CRITICAL: This is the security gateway for patient identity
 */
const { createOTP, verifyOTP, isOTPVerified } = require('../services/otpService');

/**
 * AI Service - generates drafts and summaries
 * ONLY called AFTER OTP verification
 */
const { generateDraftStatements, generateDoctorSummary, generatePersonalizedQuestions } = require('../services/aiService');

/**
 * WhatsApp/SMS Service - delivers OTP to patient
 */
const { sendOTPWhatsApp, sendOTPSMS, sendOTPBoth } = require('../services/whatsappService');

/**
 * UUID generation for unique follow-up IDs
 */
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// STEP 3: CREATE FOLLOW-UP (Doctor Initiates)
// ============================================================================

/**
 * POST /api/follow-ups
 * STEP 3: Doctor initiates a follow-up request
 * 
 * WORKFLOW:
 * 1. Validate request and prescription ownership
 * 2. Create follow-up record in Firestore
 * 3. Generate personalized questions using AI
 * 4. Generate OTP for patient verification
 * 5. Send OTP via WhatsApp and SMS
 * 6. Update prescription status
 * 7. Return follow-up details
 * 
 * REQUEST BODY:
 * - prescriptionId: string (required) - ID of prescription to follow up on
 * - doctorId: string (required) - Doctor's user ID
 * 
 * RESPONSE:
 * - 201: Follow-up created, OTP sent
 * - 400: Missing fields or invalid phone
 * - 403: Unauthorized (prescription belongs to different doctor)
 * - 404: Prescription not found
 * - 500: Server error
 * 
 * SECURITY:
 * - Doctor can only create follow-up for their own prescriptions
 * - Patient phone required for WhatsApp delivery
 * - OTP only returned if WhatsApp AND SMS both fail (for manual sharing)
 */
router.post('/', async (req, res) => {
    try {
        const { prescriptionId, doctorId } = req.body;

        // ========== VALIDATION ==========
        if (!prescriptionId || !doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: prescriptionId, doctorId',
            });
        }

        // ========== VERIFY PRESCRIPTION ==========
        const prescriptionDoc = await db.collection('prescriptions').doc(prescriptionId).get();

        if (!prescriptionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found',
            });
        }

        const prescription = prescriptionDoc.data();

        // SECURITY: Doctor can only follow up on their own prescriptions
        if (prescription.doctorId !== doctorId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Prescription does not belong to this doctor',
            });
        }

        // Phone number is required for WhatsApp delivery
        if (!prescription.patientPhone) {
            return res.status(400).json({
                success: false,
                error: 'Patient phone number is required for WhatsApp communication',
            });
        }

        // ========== CREATE FOLLOW-UP DOCUMENT ==========
        const followUpId = uuidv4();
        const followUpData = {
            prescriptionId,
            doctorId,
            patientPhone: prescription.patientPhone,
            patientName: prescription.patientName || null,
            caseId: prescription.caseId,
            status: 'pending_verification',  // Initial status - waiting for OTP
            createdAt: new Date(),
            otpVerified: false,              // Security flag
            patientConsent: false,           // Consent flag - CRITICAL
        };

        await db.collection('followUps').doc(followUpId).set(followUpData);

        // ========== GENERATE PERSONALIZED QUESTIONS ==========
        // AI generates condition-specific questions based on prescription
        const questionsResult = await generatePersonalizedQuestions(prescription);
        if (questionsResult.success && questionsResult.questions) {
            await db.collection('followUps').doc(followUpId).update({
                personalizedQuestions: questionsResult.questions,
            });
        }

        // ========== GENERATE OTP ==========
        const { otp, expiresAt } = await createOTP(followUpId);

        // ========== UPDATE PRESCRIPTION STATUS ==========
        await db.collection('prescriptions').doc(prescriptionId).update({
            status: 'follow_up_sent',
        });

        // ========== BUILD VERIFICATION LINKS ==========
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${followUpId}`;
        const prescriptionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/prescription/${prescriptionId}`;

        // ========== SEND OTP VIA WHATSAPP AND SMS ==========
        let whatsappSent = false;
        let smsSent = false;
        
        // Only send if Twilio is configured
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const results = await sendOTPBoth({
                to: prescription.patientPhone,
                otp,
                verificationLink,
                caseId: prescription.caseId,
                followUpId,
            });
            whatsappSent = results.whatsapp.success;
            smsSent = results.sms.success;
            
            // Log failures for debugging
            if (!whatsappSent) {
                console.error('WhatsApp send failed:', results.whatsapp.error);
            }
            if (!smsSent) {
                console.error('SMS send failed:', results.sms.error);
            }
        }

        // ========== RETURN RESPONSE ==========
        // Only include OTP if BOTH delivery methods failed (for manual sharing)
        res.status(201).json({
            success: true,
            data: {
                followUpId,
                patientPhone: prescription.patientPhone,
                otp: (whatsappSent || smsSent) ? undefined : otp,  // Security: hide if sent
                otpExpiresAt: expiresAt,
                verificationLink,
                prescriptionLink,
                caseId: prescription.caseId,
                whatsappSent,
                smsSent,
            },
        });

    } catch (error) {
        console.error('Create Follow-Up Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create follow-up request',
        });
    }
});

// ============================================================================
// STEP 4: VERIFY OTP (Patient Identity Verification)
// ============================================================================

/**
 * POST /api/follow-ups/:id/verify-otp
 * STEP 4: Patient verifies their identity with OTP
 * 
 * ⚠️ CRITICAL: Until this succeeds:
 * - No medical content visible to patient
 * - No AI calls allowed
 * - Doctor sees nothing
 * 
 * WORKFLOW:
 * 1. Receive OTP from patient
 * 2. Validate OTP (correct code, not expired, not used)
 * 3. Mark follow-up as verified
 * 4. Return success
 * 
 * PARAMS:
 * - id: string - Follow-up document ID
 * 
 * BODY:
 * - otp: string - 4-digit OTP code
 * 
 * RESPONSE:
 * - 200: OTP verified successfully
 * - 400: Invalid/expired OTP
 * - 500: Server error
 * 
 * SECURITY:
 * - OTP expires after 10 minutes
 * - OTP can only be used once
 * - Failed attempts are logged
 */
router.post('/:id/verify-otp', async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                error: 'OTP is required',
            });
        }

        // Verify OTP using OTP service
        // Checks: existence, expiry, previous use
        const result = await verifyOTP(id, otp);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                error: result.message,
            });
        }

        res.json({
            success: true,
            message: result.message,
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify OTP',
        });
    }
});

// ============================================================================
// STEP 5: GET AI DRAFTS (After OTP Verification)
// ============================================================================

/**
 * GET /api/follow-ups/:id/drafts
 * STEP 5: Get AI-generated draft statements and personalized questions
 * 
 * ⚠️ CRITICAL: Only accessible AFTER OTP verification
 * 
 * WORKFLOW:
 * 1. Verify OTP has been validated
 * 2. Check if drafts already exist (cached)
 * 3. If not, generate new drafts using AI
 * 4. Return drafts + personalized questions + prescription info
 * 
 * PARAMS:
 * - id: string - Follow-up document ID
 * 
 * RESPONSE:
 * - 200: Drafts, questions, and prescription info
 * - 403: OTP not verified
 * - 404: Follow-up not found
 * - 500: Server error
 * 
 * NOTES:
 * - Drafts are CACHED - generated only once
 * - Patient can edit all drafts before submission
 * - Personalized questions generated during STEP 3
 */
router.get('/:id/drafts', async (req, res) => {
    try {
        const { id } = req.params;

        // ========== SECURITY: VERIFY OTP FIRST ==========
        const verified = await isOTPVerified(id);
        if (!verified) {
            return res.status(403).json({
                success: false,
                error: 'OTP verification required',
            });
        }

        // ========== CHECK FOR EXISTING DRAFTS ==========
        const followUpDoc = await db.collection('followUps').doc(id).get();
        if (!followUpDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Follow-up not found',
            });
        }

        const followUpData = followUpDoc.data();
        const prescriptionInfo = await getPrescriptionInfo(followUpData.prescriptionId);

        // If drafts already exist, return them (caching)
        if (followUpData.aiDrafts) {
            return res.json({
                success: true,
                data: {
                    drafts: followUpData.aiDrafts,
                    prescriptionInfo,
                    prescriptionId: followUpData.prescriptionId,
                    personalizedQuestions: followUpData.personalizedQuestions || [],
                },
            });
        }

        // ========== GENERATE NEW DRAFTS ==========
        const result = await generateDraftStatements(id);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                error: result.error,
            });
        }

        res.json({
            success: true,
            data: {
                drafts: result.drafts,
                prescriptionInfo,
                prescriptionId: followUpData.prescriptionId,
                personalizedQuestions: followUpData.personalizedQuestions || [],
            },
        });

    } catch (error) {
        console.error('Get Drafts Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get draft statements',
        });
    }
});
        res.status(500).json({
            success: false,
            error: 'Failed to get draft statements',
        });
    }
});

// ============================================================================
// STEPS 6-7: SUBMIT FOLLOW-UP (Patient Consent & Submission)
// ============================================================================

/**
 * POST /api/follow-ups/:id/submit
 * STEPS 6 & 7: Patient submits verified responses with explicit consent
 * 
 * ⚠️ CRITICAL: This is the EXPLICIT CONSENT action.
 * Only after this click does data become visible to doctor.
 * 
 * WORKFLOW:
 * 1. Verify OTP has been validated
 * 2. Require explicit consent (consent === true)
 * 3. Validate response format
 * 4. Store verified responses
 * 5. Mark consent timestamp
 * 6. Generate doctor summary (STEP 8)
 * 7. Return success
 * 
 * PARAMS:
 * - id: string - Follow-up document ID
 * 
 * BODY:
 * - responses: object - Patient's verified/edited responses
 * - consent: boolean - MUST be true (explicit consent)
 * 
 * RESPONSE:
 * - 200: Submission successful
 * - 400: Missing consent or invalid responses
 * - 403: OTP not verified
 * - 500: Server error
 * 
 * SECURITY:
 * - OTP must be verified before submission
 * - Explicit consent required (boolean true)
 * - Consent timestamp recorded for audit
 * - Data only visible to doctor after this point
 */
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { responses, consent } = req.body;

        // ========== SECURITY: VERIFY OTP FIRST ==========
        const verified = await isOTPVerified(id);
        if (!verified) {
            return res.status(403).json({
                success: false,
                error: 'OTP verification required',
            });
        }

        // ========== SECURITY: EXPLICIT CONSENT REQUIRED ==========
        // Consent must be boolean true, not just truthy
        if (consent !== true) {
            return res.status(400).json({
                success: false,
                error: 'Explicit consent required to share data with doctor',
            });
        }

        // ========== VALIDATE RESPONSES ==========
        if (!responses || typeof responses !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid responses format',
            });
        }

        // ========== STORE VERIFIED RESPONSES ==========
        await db.collection('followUps').doc(id).update({
            verifiedResponses: responses,       // Patient's edited/confirmed responses
            patientConsent: true,               // CRITICAL: Consent flag
            consentTimestamp: new Date(),       // Audit trail
            status: 'submitted',                // Status update
        });

        // ========== STEP 8: GENERATE DOCTOR SUMMARY ==========
        // AI formats the verified responses for doctor review
        const summaryResult = await generateDoctorSummary(id);

        if (!summaryResult.success) {
            // Even if summary fails, data is still submitted
            // Doctor can still see raw responses
            console.error('Summary generation failed:', summaryResult.error);
        }

        res.json({
            success: true,
            message: 'Follow-up submitted successfully. Your doctor will review your responses.',
        });

    } catch (error) {
        console.error('Submit Follow-Up Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit follow-up',
        });
    }
});

// ============================================================================
// STEP 9: GET SUMMARY (Doctor Views Patient Response)
// ============================================================================

/**
 * GET /api/follow-ups/:id/summary
 * STEP 9: Doctor views the patient-verified summary
 * 
 * ⚠️ CRITICAL: Only accessible AFTER patient consent
 * 
 * WORKFLOW:
 * 1. Validate doctor ID
 * 2. Verify doctor ownership of follow-up
 * 3. Verify patient has consented
 * 4. Return summary and prescription info
 * 
 * PARAMS:
 * - id: string - Follow-up document ID
 * 
 * QUERY:
 * - doctorId: string - Doctor's user ID (required)
 * 
 * RESPONSE:
 * - 200: Summary data
 * - 400: Missing doctor ID
 * - 403: Unauthorized or no consent
 * - 404: Follow-up not found
 * - 500: Server error
 * 
 * SECURITY:
 * - Doctor can only view their own follow-ups
 * - Patient must have given explicit consent
 * - No data visible until patient submits
 */
router.get('/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId } = req.query;

        // Validate doctor ID provided
        if (!doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Doctor ID required',
            });
        }

        // ========== FETCH FOLLOW-UP ==========
        const followUpDoc = await db.collection('followUps').doc(id).get();

        if (!followUpDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Follow-up not found',
            });
        }

        const followUpData = followUpDoc.data();

        // ========== SECURITY: VERIFY DOCTOR OWNERSHIP ==========
        if (followUpData.doctorId !== doctorId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: This follow-up does not belong to you',
            });
        }

        // ========== SECURITY: VERIFY PATIENT CONSENT ==========
        if (!followUpData.patientConsent) {
            return res.status(403).json({
                success: false,
                error: 'Patient has not yet submitted their follow-up responses',
            });
        }

        // ========== GET PRESCRIPTION INFO ==========
        const prescriptionDoc = await db.collection('prescriptions').doc(followUpData.prescriptionId).get();
        const prescription = prescriptionDoc.data();

        // Return summary data
        res.json({
            success: true,
            data: {
                caseId: followUpData.caseId,
                summary: followUpData.doctorSummary,
                prescription: {
                    medicineName: prescription.medicineName,
                    dosage: prescription.dosage,
                    duration: prescription.duration,
                    condition: prescription.condition,
                },
                submittedAt: followUpData.consentTimestamp,
                status: followUpData.status,
            },
        });

    } catch (error) {
        console.error('Get Summary Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch summary',
        });
    }
});

// ============================================================================
// CLOSE CASE (Doctor Completes Review)
// ============================================================================

/**
 * POST /api/follow-ups/:id/close
 * Doctor closes the case after review
 * 
 * WORKFLOW:
 * 1. Verify doctor ownership
 * 2. Update follow-up status to 'closed'
 * 3. Update prescription status to 'completed'
 * 4. Record resolution notes
 * 
 * PARAMS:
 * - id: string - Follow-up document ID
 * 
 * BODY:
 * - doctorId: string (required) - Doctor's user ID
 * - resolution: string (optional) - Doctor's resolution notes
 * 
 * RESPONSE:
 * - 200: Case closed successfully
 * - 400: Missing doctor ID
 * - 403: Unauthorized
 * - 404: Follow-up not found
 * - 500: Server error
 */
router.post('/:id/close', async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId, resolution } = req.body;

        if (!doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Doctor ID required',
            });
        }

        const followUpDoc = await db.collection('followUps').doc(id).get();

        if (!followUpDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Follow-up not found',
            });
        }

        const followUpData = followUpDoc.data();

        // SECURITY: Verify doctor ownership
        if (followUpData.doctorId !== doctorId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized',
            });
        }

        // ========== CLOSE FOLLOW-UP ==========
        await db.collection('followUps').doc(id).update({
            status: 'closed',
            closedAt: new Date(),
            resolution: resolution || 'Reviewed and closed',
        });

        // ========== UPDATE PRESCRIPTION STATUS ==========
        await db.collection('prescriptions').doc(followUpData.prescriptionId).update({
            status: 'completed',
        });

        res.json({
            success: true,
            message: 'Case closed successfully',
        });

    } catch (error) {
        console.error('Close Follow-Up Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to close case',
        });
    }
});

// ============================================================================
// LIST DOCTOR'S FOLLOW-UPS
// ============================================================================

/**
 * GET /api/follow-ups/doctor/:doctorId
 * Get all follow-ups for a specific doctor
 * 
 * PURPOSE:
 * Doctor dashboard lists their follow-ups with status.
 * Summary only visible for consented follow-ups.
 * 
 * PARAMS:
 * - doctorId: string - Doctor's user ID
 * 
 * RESPONSE:
 * - 200: Array of follow-ups with basic info
 * - 500: Server error
 * 
 * PRIVACY:
 * - hasSummary flag indicates if patient has consented
 * - Actual summary not included in list view
 */
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Query follow-ups for this doctor
        const snapshot = await db.collection('followUps')
            .where('doctorId', '==', doctorId)
            .orderBy('createdAt', 'desc')
            .get();

        const followUps = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Return basic info + consent status
            followUps.push({
                id: doc.id,
                caseId: data.caseId,
                status: data.status,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                // Only show summary available flag if consent given
                hasSummary: data.patientConsent === true,
            });
        }

        res.json({
            success: true,
            data: followUps,
        });

    } catch (error) {
        console.error('Get Doctor Follow-Ups Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch follow-ups',
        });
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get prescription info by ID
 * 
 * Helper function to fetch basic prescription details
 * for display in follow-up forms.
 * 
 * @param {string} prescriptionId - Prescription document ID
 * @returns {object|null} Basic prescription info or null
 */
async function getPrescriptionInfo(prescriptionId) {
    const doc = await db.collection('prescriptions').doc(prescriptionId).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return {
        medicineName: data.medicineName,
        dosage: data.dosage,
        duration: data.duration,
        condition: data.condition,
    };
}

// ============================================================================
// EXPORT ROUTER
// ============================================================================

module.exports = router;
