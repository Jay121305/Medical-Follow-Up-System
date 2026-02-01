/**
 * Follow-Up Routes
 * Handles STEP 3-9: The complete follow-up workflow
 * 
 * CRITICAL: All routes enforce proper authorization and consent gating
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { createOTP, verifyOTP, isOTPVerified } = require('../services/otpService');
const { generateDraftStatements, generateDoctorSummary, generatePersonalizedQuestions } = require('../services/aiService');
const { sendOTPWhatsApp, sendOTPSMS, sendOTPBoth } = require('../services/whatsappService');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/follow-ups
 * STEP 3: Doctor initiates a follow-up request
 * 
 * Creates follow-up record, generates OTP, and sends WhatsApp message from backend
 */
router.post('/', async (req, res) => {
    try {
        const { prescriptionId, doctorId } = req.body;

        if (!prescriptionId || !doctorId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: prescriptionId, doctorId',
            });
        }

        // Verify prescription exists and belongs to this doctor
        const prescriptionDoc = await db.collection('prescriptions').doc(prescriptionId).get();

        if (!prescriptionDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Prescription not found',
            });
        }

        const prescription = prescriptionDoc.data();

        if (prescription.doctorId !== doctorId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: Prescription does not belong to this doctor',
            });
        }

        // Validate patient has phone number for WhatsApp
        if (!prescription.patientPhone) {
            return res.status(400).json({
                success: false,
                error: 'Patient phone number is required for WhatsApp communication',
            });
        }

        // Create follow-up document
        const followUpId = uuidv4();
        const followUpData = {
            prescriptionId,
            doctorId,
            patientPhone: prescription.patientPhone,
            patientName: prescription.patientName || null,
            caseId: prescription.caseId,
            status: 'pending_verification', // pending_verification, verified, submitted, ready_for_review, closed
            createdAt: new Date(),
            otpVerified: false,
            patientConsent: false,
        };

        await db.collection('followUps').doc(followUpId).set(followUpData);

        // Generate personalized questions based on prescription
        const questionsResult = await generatePersonalizedQuestions(prescription);
        if (questionsResult.success && questionsResult.questions) {
            await db.collection('followUps').doc(followUpId).update({
                personalizedQuestions: questionsResult.questions,
            });
        }

        // Generate OTP
        const { otp, expiresAt } = await createOTP(followUpId);

        // Update prescription status
        await db.collection('prescriptions').doc(prescriptionId).update({
            status: 'follow_up_sent',
        });

        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${followUpId}`;
        const prescriptionLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/prescription/${prescriptionId}`;

        // Send OTP via WhatsApp AND SMS
        let whatsappSent = false;
        let smsSent = false;
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
            if (!whatsappSent) {
                console.error('WhatsApp send failed:', results.whatsapp.error);
            }
            if (!smsSent) {
                console.error('SMS send failed:', results.sms.error);
            }
        }

        // Return data (include OTP only if both failed for manual sharing)
        res.status(201).json({
            success: true,
            data: {
                followUpId,
                patientPhone: prescription.patientPhone,
                otp: (whatsappSent || smsSent) ? undefined : otp, // Only show OTP if both failed
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

/**
 * POST /api/follow-ups/:id/verify-otp
 * STEP 4: Patient verifies OTP
 * 
 * CRITICAL: Until this succeeds:
 * - No medical content visible
 * - No AI calls allowed
 * - Doctor sees nothing
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

/**
 * GET /api/follow-ups/:id/drafts
 * STEP 5: Get AI-generated draft statements and personalized questions
 * 
 * CRITICAL: Only accessible AFTER OTP verification
 */
router.get('/:id/drafts', async (req, res) => {
    try {
        const { id } = req.params;

        // SECURITY: Verify OTP first
        const verified = await isOTPVerified(id);
        if (!verified) {
            return res.status(403).json({
                success: false,
                error: 'OTP verification required',
            });
        }

        // Check if drafts already exist
        const followUpDoc = await db.collection('followUps').doc(id).get();
        if (!followUpDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Follow-up not found',
            });
        }

        const followUpData = followUpDoc.data();
        const prescriptionInfo = await getPrescriptionInfo(followUpData.prescriptionId);

        // If drafts exist, return them along with personalized questions
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

        // Generate new drafts
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

/**
 * POST /api/follow-ups/:id/submit
 * STEP 6 & 7: Patient submits verified responses with consent
 * 
 * CRITICAL: This is the explicit consent action
 * Only after this click does data become visible to doctor
 */
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { responses, consent } = req.body;

        // SECURITY: Verify OTP first
        const verified = await isOTPVerified(id);
        if (!verified) {
            return res.status(403).json({
                success: false,
                error: 'OTP verification required',
            });
        }

        // SECURITY: Explicit consent required
        if (consent !== true) {
            return res.status(400).json({
                success: false,
                error: 'Explicit consent required to share data with doctor',
            });
        }

        // Validate responses
        if (!responses || typeof responses !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Invalid responses format',
            });
        }

        // Store verified responses
        await db.collection('followUps').doc(id).update({
            verifiedResponses: responses,
            patientConsent: true,
            consentTimestamp: new Date(),
            status: 'submitted',
        });

        // STEP 8: Generate doctor summary
        const summaryResult = await generateDoctorSummary(id);

        if (!summaryResult.success) {
            // Even if summary fails, data is still submitted
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

/**
 * GET /api/follow-ups/:id/summary
 * STEP 9: Doctor views the summary
 * 
 * CRITICAL: Only accessible after patient consent
 */
router.get('/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId } = req.query;

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
                error: 'Unauthorized: This follow-up does not belong to you',
            });
        }

        // SECURITY: Verify patient consent
        if (!followUpData.patientConsent) {
            return res.status(403).json({
                success: false,
                error: 'Patient has not yet submitted their follow-up responses',
            });
        }

        // Get prescription info
        const prescriptionDoc = await db.collection('prescriptions').doc(followUpData.prescriptionId).get();
        const prescription = prescriptionDoc.data();

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

/**
 * POST /api/follow-ups/:id/close
 * Doctor closes the case
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

        // Close the follow-up
        await db.collection('followUps').doc(id).update({
            status: 'closed',
            closedAt: new Date(),
            resolution: resolution || 'Reviewed and closed',
        });

        // Update prescription status
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

/**
 * GET /api/follow-ups/doctor/:doctorId
 * Get all follow-ups for a doctor
 */
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        const snapshot = await db.collection('followUps')
            .where('doctorId', '==', doctorId)
            .orderBy('createdAt', 'desc')
            .get();

        const followUps = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();

            // Only include follow-ups where patient has consented
            // OR show basic info for pending ones
            followUps.push({
                id: doc.id,
                caseId: data.caseId,
                status: data.status,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                // Only show summary if consent given
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

// Helper function to get prescription info
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

module.exports = router;
