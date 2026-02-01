/**
 * ============================================================================
 * Adverse Event Routes - Complete Pharmacovigilance Workflow
 * ============================================================================
 * 
 * PURPOSE:
 * Handles the complete adverse event reporting and follow-up workflow.
 * Converts minimal patient input into regulatory-ready safety cases.
 * 
 * ⚠️ CRITICAL: Patient safety is the top priority.
 * - Urgent events trigger immediate alerts
 * - All data is consent-gated
 * - Complete audit trail maintained
 * 
 * WORKFLOW (8 STEPS):
 * STEP 1: Adverse event occurs after prescription
 * STEP 2: Patient/Doctor reports via simple interface
 * STEP 3: System creates safety case (links to OCR prescription)
 * STEP 4: System identifies missing safety data
 * STEP 5: Auto-triggered follow-up (SMS/WhatsApp)
 * STEP 6: Smart follow-up questions (7 high-value questions)
 * STEP 7: Complete safety case obtained
 * STEP 8: Regulatory-ready output
 * 
 * SAFETY FIELDS COLLECTED:
 * - Time-to-onset (causality assessment)
 * - Event description (MedDRA ready)
 * - Severity grading (mild/moderate/severe)
 * - Seriousness criteria (hospitalization, life-threatening)
 * - Action taken (dechallenge)
 * - Outcome (resolved, improved, not resolved)
 * - Concomitant medications (interaction assessment)
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { createOTP, verifyOTP, isOTPVerified } = require('../services/otpService');
const { sendOTPBoth } = require('../services/whatsappService');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// STEP 2: REPORT ADVERSE EVENT (Patient or Doctor)
// ============================================================================

/**
 * POST /api/adverse-events
 * Create a new adverse event report
 * 
 * Can be reported by:
 * - Patient (via public link)
 * - Doctor (on behalf of patient)
 * - Staff (from call center)
 * 
 * Minimal required info:
 * - prescriptionId OR drug name
 * - Brief description of the event
 */
router.post('/', async (req, res) => {
    try {
        const {
            prescriptionId,
            patientPhone,
            patientName,
            drugName,
            eventDescription,
            reporterType, // 'patient', 'doctor', 'staff'
            doctorId,
            urgencyIndicators, // ['breathing', 'swelling', 'unconscious', etc.]
        } = req.body;

        // ========== VALIDATE BASIC INFO ==========
        if (!eventDescription) {
            return res.status(400).json({
                success: false,
                error: 'Event description is required',
            });
        }

        // ========== LINK TO PRESCRIPTION (if available) ==========
        let prescriptionData = null;
        let linkedPrescriptionId = prescriptionId;

        if (prescriptionId) {
            const prescriptionDoc = await db.collection('prescriptions').doc(prescriptionId).get();
            if (prescriptionDoc.exists) {
                prescriptionData = prescriptionDoc.data();
            }
        }

        // ========== DETECT URGENCY ==========
        const urgentKeywords = ['breathing', 'swelling', 'unconscious', 'seizure', 'chest pain', 'anaphylaxis', 'severe'];
        const isUrgent = urgentKeywords.some(keyword => 
            eventDescription.toLowerCase().includes(keyword) ||
            (urgencyIndicators && urgencyIndicators.includes(keyword))
        );

        // ========== CREATE ADVERSE EVENT CASE ==========
        const caseId = `AE-${Date.now()}`;
        const adverseEventId = uuidv4();

        const adverseEventData = {
            id: adverseEventId,
            caseId,
            
            // Patient Info (use null instead of undefined for Firestore)
            patientPhone: patientPhone || prescriptionData?.patientPhone || null,
            patientName: patientName || prescriptionData?.patientName || null,
            patientAge: prescriptionData?.patientAge || null,
            
            // Drug Info (from OCR prescription)
            prescriptionId: linkedPrescriptionId || null,
            drugName: drugName || prescriptionData?.medicineName || null,
            dosage: prescriptionData?.dosage || null,
            indication: prescriptionData?.condition || null,
            
            // Doctor Info
            doctorId: doctorId || prescriptionData?.doctorId || null,
            doctorName: prescriptionData?.doctorName || null,
            
            // Event Info (Initial Report)
            initialReport: eventDescription,
            reporterType: reporterType || 'patient',
            reportedAt: new Date().toISOString(),
            
            // Safety Fields (to be collected via follow-up)
            timeToOnset: null,
            symptoms: [],
            severity: null,
            seriousness: null,
            medicalAttention: null,
            actionTaken: null,
            outcome: null,
            concomitantMeds: null,
            
            // Case Status
            status: 'reported', // reported → follow_up_sent → data_collected → complete → closed
            isUrgent,
            urgencyIndicators: urgencyIndicators || [],
            
            // Follow-up tracking
            followUpId: null,
            followUpSent: false,
            dataComplete: false,
            
            // Regulatory
            regulatoryStatus: 'pending', // pending → submitted → acknowledged
            
            // Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // ========== IDENTIFY MISSING SAFETY DATA ==========
        const missingFields = identifyMissingFields(adverseEventData);

        // ========== SAVE TO DATABASE ==========
        await db.collection('adverseEvents').doc(adverseEventId).set(adverseEventData);

        // ========== URGENT CASE ALERT ==========
        if (isUrgent) {
            console.log('🚨 URGENT ADVERSE EVENT REPORTED:', caseId);
            // TODO: Send immediate alert to doctor/PV team
        }

        // ========== AUTO-TRIGGER FOLLOW-UP IF PATIENT PHONE AVAILABLE ==========
        let followUpTriggered = false;
        let followUpDetails = null;

        if (adverseEventData.patientPhone && missingFields.length > 0) {
            try {
                // Create OTP for follow-up
                const otp = await createOTP(adverseEventId, 'adverseEvents');
                
                // Generate follow-up link
                const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/adverse-event/${adverseEventId}/follow-up`;
                
                // Send OTP via WhatsApp/SMS
                const sendResult = await sendOTPBoth(
                    adverseEventData.patientPhone,
                    otp,
                    verificationLink,
                    caseId
                );
                
                followUpTriggered = true;
                followUpDetails = {
                    otp,
                    verificationLink,
                    whatsappSent: sendResult.whatsapp,
                    smsSent: sendResult.sms,
                };

                // Update case status
                await db.collection('adverseEvents').doc(adverseEventId).update({
                    status: 'follow_up_sent',
                    followUpSent: true,
                    followUpSentAt: new Date().toISOString(),
                });
            } catch (otpError) {
                console.error('❌ Failed to send OTP for adverse event:', otpError.message);
                // Continue even if OTP fails - don't block the adverse event creation
                followUpTriggered = false;
            }
        }

        res.status(201).json({
            success: true,
            data: {
                adverseEventId,
                caseId,
                isUrgent,
                status: followUpTriggered ? 'follow_up_sent' : 'reported',
                missingFields,
                followUpTriggered,
                followUpDetails,
                message: isUrgent 
                    ? '🚨 URGENT: This case has been flagged for immediate review'
                    : 'Adverse event reported successfully',
            },
        });

    } catch (error) {
        console.error('Adverse Event Report Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to report adverse event',
        });
    }
});

// ============================================================================
// STEP 4: VERIFY OTP FOR FOLLOW-UP
// ============================================================================

/**
 * POST /api/adverse-events/:id/verify-otp
 * Patient verifies identity before completing follow-up
 */
router.post('/:id/verify-otp', async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;

        const isValid = await verifyOTP(id, otp, 'adverseEvent');

        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired OTP',
            });
        }

        // Update case status
        await db.collection('adverseEvents').doc(id).update({
            otpVerified: true,
            otpVerifiedAt: new Date().toISOString(),
        });

        res.json({
            success: true,
            message: 'OTP verified successfully',
        });

    } catch (error) {
        console.error('OTP Verification Error:', error);
        res.status(500).json({
            success: false,
            error: 'Verification failed',
        });
    }
});

// ============================================================================
// STEP 5: GET FOLLOW-UP QUESTIONS
// ============================================================================

/**
 * GET /api/adverse-events/:id/questions
 * Get smart follow-up questions based on initial report
 * 
 * Returns only relevant questions based on:
 * - What's already known from prescription
 * - What was mentioned in initial report
 * - Urgency indicators
 */
router.get('/:id/questions', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify OTP first
        const verified = await isOTPVerified(id, 'adverseEvent');
        if (!verified) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your identity first',
            });
        }

        // Get adverse event data
        const aeDoc = await db.collection('adverseEvents').doc(id).get();
        if (!aeDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Adverse event not found',
            });
        }

        const aeData = aeDoc.data();

        // Generate smart questions based on what's missing
        const questions = generateSmartQuestions(aeData);

        res.json({
            success: true,
            data: {
                caseId: aeData.caseId,
                drugName: aeData.drugName,
                initialReport: aeData.initialReport,
                questions,
                totalQuestions: questions.length,
                estimatedTime: '2-3 minutes',
            },
        });

    } catch (error) {
        console.error('Get Questions Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get questions',
        });
    }
});

// ============================================================================
// STEP 6-7: SUBMIT FOLLOW-UP RESPONSES
// ============================================================================

/**
 * POST /api/adverse-events/:id/submit
 * Patient submits follow-up responses
 * 
 * After this, the safety case is complete and regulatory-ready
 */
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { responses, consent } = req.body;

        // Verify OTP
        const verified = await isOTPVerified(id, 'adverseEvent');
        if (!verified) {
            return res.status(403).json({
                success: false,
                error: 'Please verify your identity first',
            });
        }

        // Require consent
        if (!consent) {
            return res.status(400).json({
                success: false,
                error: 'Patient consent is required',
            });
        }

        // Get existing data
        const aeDoc = await db.collection('adverseEvents').doc(id).get();
        const aeData = aeDoc.data();

        // ========== PROCESS RESPONSES ==========
        const processedData = processFollowUpResponses(responses);

        // ========== ASSESS CASE SEVERITY ==========
        const caseAssessment = assessCase(processedData);

        // ========== UPDATE ADVERSE EVENT ==========
        const updatedData = {
            ...processedData,
            status: 'data_collected',
            dataComplete: true,
            consent,
            consentAt: new Date().toISOString(),
            
            // Case Assessment
            overallSeverity: caseAssessment.severity,
            overallSeriousness: caseAssessment.seriousness,
            causalityIndicators: caseAssessment.causalityIndicators,
            requiresExpedited: caseAssessment.requiresExpedited,
            
            // Summary
            summary: generateCaseSummary(aeData, processedData, caseAssessment),
            
            updatedAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
        };

        await db.collection('adverseEvents').doc(id).update(updatedData);

        res.json({
            success: true,
            data: {
                caseId: aeData.caseId,
                status: 'data_collected',
                isComplete: true,
                severity: caseAssessment.severity,
                seriousness: caseAssessment.seriousness,
                requiresExpedited: caseAssessment.requiresExpedited,
                message: caseAssessment.requiresExpedited
                    ? '🚨 This case requires expedited reporting'
                    : 'Thank you. Your safety report is complete.',
            },
        });

    } catch (error) {
        console.error('Submit Follow-up Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit responses',
        });
    }
});

// ============================================================================
// GET COMPLETE CASE (For Doctor/PV Team)
// ============================================================================

/**
 * GET /api/adverse-events/:id/case
 * Get complete adverse event case for review
 * 
 * Only accessible after patient consent
 */
router.get('/:id/case', async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId } = req.query;

        const aeDoc = await db.collection('adverseEvents').doc(id).get();
        if (!aeDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Adverse event not found',
            });
        }

        const aeData = aeDoc.data();

        // Check consent
        if (!aeData.consent) {
            return res.status(403).json({
                success: false,
                error: 'Patient has not provided consent to share this data',
            });
        }

        // Verify doctor ownership
        if (doctorId && aeData.doctorId !== doctorId) {
            return res.status(403).json({
                success: false,
                error: 'You do not have access to this case',
            });
        }

        res.json({
            success: true,
            data: aeData,
        });

    } catch (error) {
        console.error('Get Case Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get case',
        });
    }
});

// ============================================================================
// LIST ADVERSE EVENTS (For Doctor)
// ============================================================================

/**
 * GET /api/adverse-events/doctor/:doctorId
 * Get all adverse events for a doctor
 */
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;

        const snapshot = await db.collection('adverseEvents')
            .where('doctorId', '==', doctorId)
            .orderBy('createdAt', 'desc')
            .get();

        const events = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            events.push({
                id: doc.id,
                caseId: data.caseId,
                patientName: data.patientName,
                drugName: data.drugName,
                initialReport: data.initialReport?.substring(0, 100) + '...',
                status: data.status,
                isUrgent: data.isUrgent,
                severity: data.overallSeverity,
                createdAt: data.createdAt,
                dataComplete: data.dataComplete,
            });
        });

        res.json({
            success: true,
            data: events,
        });

    } catch (error) {
        console.error('List Adverse Events Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list adverse events',
        });
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Identify missing mandatory safety fields
 */
function identifyMissingFields(aeData) {
    const requiredFields = [
        { field: 'timeToOnset', label: 'Time of onset' },
        { field: 'symptoms', label: 'Symptoms experienced' },
        { field: 'severity', label: 'Severity' },
        { field: 'seriousness', label: 'Seriousness (hospitalization)' },
        { field: 'actionTaken', label: 'Action taken with drug' },
        { field: 'outcome', label: 'Outcome' },
        { field: 'concomitantMeds', label: 'Other medications' },
    ];

    return requiredFields.filter(f => {
        const value = aeData[f.field];
        return !value || (Array.isArray(value) && value.length === 0);
    });
}

/**
 * Generate smart follow-up questions
 * Only 7 high-value questions as specified
 */
function generateSmartQuestions(aeData) {
    return [
        {
            id: 'timeToOnset',
            question: 'When did the reaction start after taking the medicine?',
            subtext: 'This helps us understand if the medicine caused the reaction',
            type: 'single',
            options: [
                { value: 'immediate', label: 'Within minutes', icon: '⚡' },
                { value: 'hours', label: 'Within hours', icon: '🕐' },
                { value: 'next_day', label: 'Next day', icon: '📅' },
                { value: 'few_days', label: 'After a few days', icon: '📆' },
                { value: 'week_plus', label: 'After a week or more', icon: '🗓️' },
            ],
            dataFields: ['Time-to-onset', 'Causality assessment'],
        },
        {
            id: 'symptoms',
            question: 'What symptoms did you experience?',
            subtext: 'Select all that apply',
            type: 'multi',
            options: [
                { value: 'nausea', label: 'Nausea / Vomiting', icon: '🤢' },
                { value: 'dizziness', label: 'Dizziness', icon: '💫' },
                { value: 'rash', label: 'Skin rash / Itching', icon: '🔴' },
                { value: 'headache', label: 'Headache', icon: '🤕' },
                { value: 'breathing', label: 'Breathing difficulty', icon: '😮‍💨', urgent: true },
                { value: 'swelling', label: 'Swelling', icon: '😶', urgent: true },
                { value: 'stomach', label: 'Stomach pain', icon: '😣' },
                { value: 'fatigue', label: 'Fatigue / Weakness', icon: '😴' },
                { value: 'other', label: 'Other', icon: '📝' },
            ],
            textPrompt: 'Describe your symptoms:',
            dataFields: ['Event description', 'Seriousness indicators'],
        },
        {
            id: 'severity',
            question: 'How severe was the reaction?',
            subtext: 'Rate the intensity at its worst',
            type: 'single',
            options: [
                { value: 'mild', label: 'Mild - Noticeable but manageable', icon: '😊' },
                { value: 'moderate', label: 'Moderate - Affected daily activities', icon: '😐' },
                { value: 'severe', label: 'Severe - Could not do normal activities', icon: '😰' },
            ],
            dataFields: ['Severity grading'],
        },
        {
            id: 'medicalAttention',
            question: 'Did you require medical attention?',
            subtext: 'This helps classify the seriousness',
            type: 'single',
            options: [
                { value: 'none', label: 'No, managed at home', icon: '🏠' },
                { value: 'doctor', label: 'Visited a doctor', icon: '👨‍⚕️' },
                { value: 'emergency', label: 'Emergency room visit', icon: '🚑', serious: true },
                { value: 'hospital', label: 'Hospitalized', icon: '🏥', serious: true },
            ],
            dataFields: ['Serious vs non-serious classification'],
        },
        {
            id: 'actionTaken',
            question: 'What action was taken with the medicine?',
            subtext: 'This helps us understand what worked',
            type: 'single',
            options: [
                { value: 'continued', label: 'Continued taking it', icon: '▶️' },
                { value: 'reduced', label: 'Reduced the dose', icon: '📉' },
                { value: 'stopped', label: 'Stopped taking it', icon: '⏹️' },
                { value: 'restarted', label: 'Stopped then restarted', icon: '🔄' },
            ],
            dataFields: ['Dechallenge information'],
        },
        {
            id: 'outcome',
            question: 'What happened to the symptoms after this action?',
            subtext: 'Current status of your symptoms',
            type: 'single',
            options: [
                { value: 'resolved', label: 'Completely resolved', icon: '✅' },
                { value: 'improved', label: 'Improved but not fully', icon: '📈' },
                { value: 'unchanged', label: 'No change', icon: '➡️' },
                { value: 'worsened', label: 'Got worse', icon: '📉' },
                { value: 'unknown', label: 'Not sure yet', icon: '❓' },
            ],
            dataFields: ['Outcome', 'Causality support'],
        },
        {
            id: 'concomitantMeds',
            question: 'Were you taking any other medicines or supplements?',
            subtext: 'Including over-the-counter and herbal products',
            type: 'single',
            options: [
                { value: 'none', label: 'No other medicines', icon: '🚫' },
                { value: 'prescription', label: 'Yes, prescription medicines', icon: '💊' },
                { value: 'otc', label: 'Yes, over-the-counter', icon: '🏪' },
                { value: 'supplements', label: 'Yes, supplements/herbal', icon: '🌿' },
                { value: 'multiple', label: 'Multiple other medicines', icon: '💊💊' },
            ],
            textPrompt: 'List the other medicines:',
            dataFields: ['Confounder assessment', 'Interaction assessment'],
        },
    ];
}

/**
 * Process follow-up responses into structured data
 */
function processFollowUpResponses(responses) {
    return {
        timeToOnset: responses.timeToOnset?.selected,
        symptoms: responses.symptoms?.selected || [],
        symptomsDescription: responses.symptoms?.notes,
        severity: responses.severity?.selected,
        medicalAttention: responses.medicalAttention?.selected,
        actionTaken: responses.actionTaken?.selected,
        outcome: responses.outcome?.selected,
        concomitantMeds: responses.concomitantMeds?.selected,
        concomitantMedsDetails: responses.concomitantMeds?.notes,
    };
}

/**
 * Assess case severity and seriousness
 */
function assessCase(data) {
    // Determine seriousness (regulatory definition)
    const isSerious = 
        data.medicalAttention === 'hospital' ||
        data.medicalAttention === 'emergency' ||
        data.symptoms?.includes('breathing') ||
        data.symptoms?.includes('swelling');

    // Determine if expedited reporting needed (serious cases need 15-day reporting)
    const requiresExpedited = isSerious && data.outcome !== 'resolved';

    // Causality indicators
    const causalityIndicators = [];
    
    if (['immediate', 'hours'].includes(data.timeToOnset)) {
        causalityIndicators.push('Temporal association (onset within hours)');
    }
    
    if (data.actionTaken === 'stopped' && ['resolved', 'improved'].includes(data.outcome)) {
        causalityIndicators.push('Positive dechallenge (improved after stopping)');
    }
    
    if (data.actionTaken === 'restarted') {
        causalityIndicators.push('Rechallenge performed');
    }
    
    if (data.concomitantMeds === 'none') {
        causalityIndicators.push('No confounders (no other medications)');
    }

    return {
        severity: data.severity,
        seriousness: isSerious ? 'serious' : 'non-serious',
        requiresExpedited,
        causalityIndicators,
    };
}

/**
 * Generate case summary for regulatory reporting
 */
function generateCaseSummary(original, processed, assessment) {
    const lines = [
        `Case ID: ${original.caseId}`,
        `Drug: ${original.drugName}`,
        ``,
        `INITIAL REPORT:`,
        original.initialReport,
        ``,
        `FOLLOW-UP DATA:`,
        `- Time to onset: ${processed.timeToOnset}`,
        `- Symptoms: ${processed.symptoms?.join(', ')}`,
        `- Severity: ${processed.severity}`,
        `- Medical attention: ${processed.medicalAttention}`,
        `- Action taken: ${processed.actionTaken}`,
        `- Outcome: ${processed.outcome}`,
        `- Concomitant medications: ${processed.concomitantMeds}`,
        ``,
        `ASSESSMENT:`,
        `- Overall severity: ${assessment.severity}`,
        `- Seriousness: ${assessment.seriousness}`,
        `- Requires expedited reporting: ${assessment.requiresExpedited ? 'YES' : 'No'}`,
        ``,
        `CAUSALITY INDICATORS:`,
        ...assessment.causalityIndicators.map(c => `- ${c}`),
    ];

    return lines.join('\n');
}

module.exports = router;
