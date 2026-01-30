/**
 * AI Service
 * Handles all AI-related operations with strict safety constraints
 * 
 * CRITICAL: AI is used ONLY to reduce effort, NEVER to decide truth
 * CRITICAL: All AI outputs are drafts/suggestions, not facts
 */

const { groq, SAFETY_PREFIX } = require('../config/groq');
const { isOTPVerified } = require('./otpService');
const { db } = require('../config/firebase');

/**
 * STEP 5: Generate draft statements for patient verification
 * 
 * ONLY called AFTER OTP verification
 * Generates EDITABLE drafts based on prescription metadata
 * These are NOT facts - they are UI defaults for the patient to confirm/edit
 * 
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<{success: boolean, drafts?: object, error?: string}>}
 */
async function generateDraftStatements(followUpId) {
    // SECURITY: Verify OTP before ANY AI call
    const verified = await isOTPVerified(followUpId);
    if (!verified) {
        return {
            success: false,
            error: 'OTP verification required before generating drafts'
        };
    }

    // Fetch follow-up and prescription data
    const followUpDoc = await db.collection('followUps').doc(followUpId).get();
    if (!followUpDoc.exists) {
        return { success: false, error: 'Follow-up not found' };
    }

    const followUpData = followUpDoc.data();
    const prescriptionDoc = await db.collection('prescriptions').doc(followUpData.prescriptionId).get();

    if (!prescriptionDoc.exists) {
        return { success: false, error: 'Prescription not found' };
    }

    const prescription = prescriptionDoc.data();

    // Build the prompt for draft generation
    const prompt = `${SAFETY_PREFIX}

TASK: Generate DRAFT statements for a patient follow-up form.
These statements will be presented as EDITABLE defaults. The patient will confirm or modify each one.
DO NOT treat these as facts - they are SUGGESTIONS only.

PRESCRIPTION METADATA:
- Medicine Name: ${prescription.medicineName}
- Dosage: ${prescription.dosage}
- Duration: ${prescription.duration}
- Condition (if provided): ${prescription.condition || 'Not specified'}

GENERATE the following draft statements (patient will verify/edit these):
1. A draft statement about medication adherence (e.g., "I took [medicine] [dosage] as prescribed")
2. A draft statement about symptom status (e.g., "My symptoms have [improved/stayed same/worsened]")
3. A draft statement about side effects (e.g., "I experienced [no side effects / the following side effects: ...]")
4. A draft statement about completion status (e.g., "I [completed/did not complete] the full course")

OUTPUT FORMAT (JSON only, no markdown):
{
  "medicationAdherence": "draft statement here",
  "symptomStatus": "draft statement here", 
  "sideEffects": "draft statement here",
  "completionStatus": "draft statement here"
}

Remember: These are DRAFTS. The patient is the final authority.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3, // Low temperature for consistency
            max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Failed to parse AI response' };
        }

        const drafts = JSON.parse(jsonMatch[0]);

        // Store drafts in the follow-up document
        await db.collection('followUps').doc(followUpId).update({
            aiDrafts: drafts,
            aiDraftsGeneratedAt: new Date(),
        });

        return { success: true, drafts };

    } catch (error) {
        console.error('AI Draft Generation Error:', error);
        return { success: false, error: 'Failed to generate drafts' };
    }
}

/**
 * STEP 8: Generate summary for doctor
 * 
 * ONLY called AFTER patient consent (explicit submission)
 * Summarizes ONLY verified data - no interpretation, no advice
 * 
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<{success: boolean, summary?: string, error?: string}>}
 */
async function generateDoctorSummary(followUpId) {
    // Fetch follow-up data
    const followUpDoc = await db.collection('followUps').doc(followUpId).get();
    if (!followUpDoc.exists) {
        return { success: false, error: 'Follow-up not found' };
    }

    const followUpData = followUpDoc.data();

    // SECURITY: Verify consent before generating summary
    if (!followUpData.patientConsent) {
        return {
            success: false,
            error: 'Patient consent required before generating summary'
        };
    }

    // Fetch prescription data
    const prescriptionDoc = await db.collection('prescriptions').doc(followUpData.prescriptionId).get();
    const prescription = prescriptionDoc.data();

    // Build the prompt for summary generation
    const prompt = `${SAFETY_PREFIX}

TASK: Format the following PATIENT-VERIFIED follow-up data into a clean summary for the doctor.
DO NOT add any interpretation, advice, or inferred information.
ONLY reformat what is explicitly provided.

PRESCRIPTION INFO:
- Medicine: ${prescription.medicineName}
- Dosage: ${prescription.dosage}
- Duration: ${prescription.duration}
- Condition: ${prescription.condition || 'Not specified'}

PATIENT-VERIFIED RESPONSES:
- Medication Adherence: ${followUpData.verifiedResponses?.medicationAdherence || 'Not provided'}
- Symptom Status: ${followUpData.verifiedResponses?.symptomStatus || 'Not provided'}
- Side Effects: ${followUpData.verifiedResponses?.sideEffects || 'Not provided'}
- Completion Status: ${followUpData.verifiedResponses?.completionStatus || 'Not provided'}
- Additional Notes: ${followUpData.verifiedResponses?.additionalNotes || 'None'}

OUTPUT: A clean, formatted summary. Do NOT add medical advice or interpretation.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2, // Very low temperature for consistency
            max_tokens: 600,
        });

        const summary = completion.choices[0]?.message?.content || '';

        // Store summary in the follow-up document
        await db.collection('followUps').doc(followUpId).update({
            doctorSummary: summary,
            summaryGeneratedAt: new Date(),
            status: 'ready_for_review',
        });

        return { success: true, summary };

    } catch (error) {
        console.error('AI Summary Generation Error:', error);
        return { success: false, error: 'Failed to generate summary' };
    }
}

module.exports = {
    generateDraftStatements,
    generateDoctorSummary,
};
