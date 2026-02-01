/**
 * ============================================================================
 * AI Service - Groq LLM Integration with STRICT Safety Constraints
 * ============================================================================
 * 
 * PURPOSE:
 * Handles all AI-related operations for the NEST 2O system.
 * Uses Groq API with LLaMA 3.3 70B model for natural language processing.
 * 
 * ⚠️ CRITICAL SAFETY PHILOSOPHY:
 * AI is used ONLY to reduce effort, NEVER to decide medical truth.
 * All AI outputs are DRAFTS and SUGGESTIONS, never treated as facts.
 * The PATIENT is always the final authority on their own experience.
 * 
 * WHAT AI DOES:
 * 1. Generates personalized follow-up questions based on prescription
 * 2. Creates draft statements for patient verification
 * 3. Formats doctor summaries (reorganization only, no interpretation)
 * 
 * WHAT AI DOES NOT DO:
 * - Make medical diagnoses or recommendations
 * - Interpret patient symptoms
 * - Provide medical advice
 * - Override patient-provided information
 * 
 * SECURITY:
 * - OTP verification REQUIRED before any AI operation
 * - Patient consent REQUIRED before generating doctor summaries
 * - All prompts include safety prefix to prevent misuse
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

/**
 * Groq client and safety prefix from configuration
 * SAFETY_PREFIX is prepended to all prompts to enforce constraints
 */
const { groq, SAFETY_PREFIX } = require('../config/groq');

/**
 * OTP verification service - ensures patient identity is verified
 * AI operations are BLOCKED without valid OTP verification
 */
const { isOTPVerified } = require('./otpService');

/**
 * Firebase Firestore database for storing/retrieving data
 */
const { db } = require('../config/firebase');

// ============================================================================
// PERSONALIZED QUESTIONS GENERATION
// ============================================================================

/**
 * Generate personalized follow-up questions based on prescription
 * 
 * PURPOSE:
 * Creates clinically relevant questions tailored to the patient's
 * specific condition, medications, and treatment plan.
 * 
 * WHY PERSONALIZED QUESTIONS?
 * Generic questions like "How are you feeling?" don't help doctors.
 * Specific questions like "What is your current blood pressure?" give
 * actionable clinical data that helps identify treatment issues.
 * 
 * QUESTION CATEGORIES:
 * 1. Primary Symptom Assessment - Measurable condition indicators
 * 2. Red Flag Symptoms - Warning signs needing immediate attention
 * 3. Functional Impact - How condition affects daily life
 * 4. Medication Response - Expected/unexpected drug effects
 * 5. Recovery Indicators - Signs of improvement
 * 
 * @param {object} prescription - Prescription data from Firestore
 * @param {string} prescription.condition - Patient's diagnosed condition
 * @param {Array} prescription.medicines - Array of prescribed medications
 * @param {string} prescription.duration - Treatment duration
 * @param {string} prescription.patientAge - Patient's age
 * @param {string} prescription.notes - Doctor's notes
 * @returns {Promise<{success: boolean, questions?: array, error?: string}>}
 * 
 * @example
 * const result = await generatePersonalizedQuestions({
 *     condition: 'Hypertension',
 *     medicines: [{ name: 'Amlodipine', dosage: '5mg daily' }],
 *     duration: '30 days'
 * });
 */
async function generatePersonalizedQuestions(prescription) {
    // Build medication list string from medicines array
    // Handles both array format and legacy single-medicine format
    let medicationDetails = '';
    if (prescription.medicines && Array.isArray(prescription.medicines)) {
        // New format: array of medicine objects
        medicationDetails = prescription.medicines.map((m, i) => 
            `${i + 1}. ${m.name} - ${m.dosageInstructions || m.dosage || 'As directed'}`
        ).join('\n');
    } else if (prescription.medicineName) {
        // Legacy format: single medicine fields
        medicationDetails = `${prescription.medicineName} - ${prescription.dosage || 'As directed'}`;
    }

    /**
     * AI Prompt for Question Generation
     * 
     * STRUCTURE:
     * 1. SAFETY_PREFIX - Non-negotiable safety constraints
     * 2. TASK - Clear instruction for what to generate
     * 3. PRESCRIPTION DETAILS - Context for personalization
     * 4. REQUIREMENTS - Quality constraints for output
     * 5. QUESTION CATEGORIES - What types of questions to generate
     * 6. EXAMPLES - Good question examples for guidance
     * 7. OUTPUT FORMAT - JSON structure for parsing
     */
    const prompt = `${SAFETY_PREFIX}

TASK: Generate EXACTLY 5-6 highly specific, clinically actionable follow-up questions for a patient.
These questions must help the doctor identify potential problems, complications, or treatment failures.

PRESCRIPTION DETAILS:
- Condition/Diagnosis: ${prescription.condition || prescription.diagnosis || 'Not specified'}
- Medications:
${medicationDetails || 'Not specified'}
- Duration: ${prescription.duration || 'Not specified'}
- Patient Age: ${prescription.patientAge || 'Not specified'}
- Doctor Notes: ${prescription.notes || 'None'}

CRITICAL REQUIREMENTS:
1. Questions must be SPECIFIC to the diagnosed condition and prescribed medications
2. Each question should help detect: treatment failure, adverse reactions, complications, or worsening condition
3. EXACTLY 3-4 options per question - no more, no less
4. Options must be clinically meaningful and directly related to the diagnosis
5. Avoid generic questions like "Did you take your medicine?" - focus on CLINICAL OUTCOMES

QUESTION CATEGORIES (generate 1 question per category):
1. PRIMARY SYMPTOM ASSESSMENT - Ask about the SPECIFIC symptoms of the diagnosed condition (e.g., for fever: "What is your current body temperature?", for hypertension: "What were your blood pressure readings this week?")
2. RED FLAG SYMPTOMS - Ask about warning signs specific to this condition/medication that need immediate attention
3. FUNCTIONAL IMPACT - How has the condition affected specific daily activities relevant to the diagnosis
4. MEDICATION RESPONSE - Specific expected effects or side effects of the prescribed medications
5. RECOVERY INDICATORS - Measurable signs of improvement specific to this condition

EXAMPLES OF GOOD QUESTIONS:
- For Diabetes: "What were your fasting blood sugar levels this week?" (Options: Below 100, 100-126, 127-200, Above 200)
- For Hypertension: "Have you experienced any of these symptoms: severe headache, chest pain, vision changes, or difficulty breathing?"
- For Antibiotics: "Has the infected area shown: reduced swelling, same appearance, increased redness, or discharge?"
- For Pain medication: "How would you rate your pain now compared to before starting treatment?"

OUTPUT FORMAT (JSON only, no markdown):
{
  "personalizedQuestions": [
    {
      "id": "q1_primary_symptom",
      "question": "Specific, clinically relevant question about the diagnosed condition",
      "category": "primary_symptom|red_flags|functional|medication_response|recovery",
      "type": "single",
      "options": [
        { "value": "option1", "label": "Clinically meaningful option 1" },
        { "value": "option2", "label": "Clinically meaningful option 2" },
        { "value": "option3", "label": "Clinically meaningful option 3" },
        { "value": "option4", "label": "Clinically meaningful option 4 (optional)" }
      ],
      "clinicalRelevance": "Why this question matters for the doctor",
      "required": true
    }
  ],
  "estimatedCompletionTime": "2 minutes"
}

REMEMBER: Each question should give the doctor actionable clinical information, not just patient satisfaction data.`;

    try {
        // Call Groq API with the prompt
        // Temperature 0.3 = More deterministic, consistent outputs
        // max_tokens 2000 = Enough for 6-7 detailed questions
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON from response (AI sometimes adds markdown wrapper)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Failed to parse AI response' };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate question count (warn but don't fail)
        const questions = parsed.personalizedQuestions || [];
        if (questions.length < 5 || questions.length > 8) {
            console.warn(`AI generated ${questions.length} questions, expected 6-7`);
        }

        // Cap at 7 questions to keep form manageable
        return { success: true, questions: questions.slice(0, 7) };
    } catch (error) {
        console.error('Generate Personalized Questions Error:', error);
        return { success: false, error: 'Failed to generate personalized questions' };
    }
}

// ============================================================================
// DRAFT STATEMENT GENERATION (STEP 5)
// ============================================================================

/**
 * STEP 5: Generate draft statements for patient verification
 * 
 * PURPOSE:
 * Creates EDITABLE draft statements based on prescription metadata.
 * These are UI defaults that the patient will CONFIRM or MODIFY.
 * They are NOT facts - they are suggestions to reduce patient effort.
 * 
 * SECURITY:
 * - ONLY called AFTER OTP verification (checked first)
 * - No medical advice or interpretation
 * - Patient has full edit control
 * 
 * DRAFTS GENERATED:
 * 1. Medication Adherence - Did patient take medicine as prescribed?
 * 2. Symptom Status - Have symptoms improved/worsened?
 * 3. Side Effects - Any adverse reactions?
 * 4. Completion Status - Was full course completed?
 * 
 * WHY DRAFTS?
 * - Reduces typing effort for patients
 * - Ensures consistent format for doctor review
 * - Patient can edit 100% of content before submission
 * 
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<{success: boolean, drafts?: object, error?: string}>}
 * 
 * @example
 * // Returns drafts like:
 * {
 *   medicationAdherence: "I took Amoxicillin 500mg three times daily as prescribed",
 *   symptomStatus: "My symptoms have improved since starting treatment",
 *   sideEffects: "I experienced no side effects",
 *   completionStatus: "I completed the full 7-day course"
 * }
 */
async function generateDraftStatements(followUpId) {
    // ========== SECURITY CHECK ==========
    // CRITICAL: Verify OTP before ANY AI operation
    // This ensures the patient is who they claim to be
    const verified = await isOTPVerified(followUpId);
    if (!verified) {
        return {
            success: false,
            error: 'OTP verification required before generating drafts'
        };
    }

    // ========== FETCH DATA ==========
    // Get follow-up document to find associated prescription
    const followUpDoc = await db.collection('followUps').doc(followUpId).get();
    if (!followUpDoc.exists) {
        return { success: false, error: 'Follow-up not found' };
    }

    const followUpData = followUpDoc.data();
    
    // Get prescription data for personalization
    const prescriptionDoc = await db.collection('prescriptions').doc(followUpData.prescriptionId).get();
    if (!prescriptionDoc.exists) {
        return { success: false, error: 'Prescription not found' };
    }

    const prescription = prescriptionDoc.data();

    // ========== AI PROMPT ==========
    /**
     * Prompt Structure:
     * 1. SAFETY_PREFIX - Enforces safety constraints
     * 2. TASK - What to generate (drafts, not facts)
     * 3. PRESCRIPTION METADATA - Context for personalization
     * 4. DRAFT CATEGORIES - What statements to create
     * 5. OUTPUT FORMAT - JSON for easy parsing
     */
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
        // Call Groq API
        // Temperature 0.3 = Consistent, deterministic outputs
        // max_tokens 500 = Enough for 4 short statements
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Failed to parse AI response' };
        }

        const drafts = JSON.parse(jsonMatch[0]);

        // ========== STORE DRAFTS ==========
        // Save drafts to follow-up document for later retrieval
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

// ============================================================================
// DOCTOR SUMMARY GENERATION (STEP 8)
// ============================================================================

/**
 * STEP 8: Generate summary for doctor review
 * 
 * PURPOSE:
 * Formats PATIENT-VERIFIED data into a clean summary for the doctor.
 * This is REFORMATTING only - no interpretation, no advice, no inference.
 * 
 * SECURITY:
 * - ONLY called AFTER patient explicit consent
 * - Uses ONLY patient-verified data (not AI-generated content)
 * - No medical recommendations or interpretations
 * 
 * WHAT IT DOES:
 * - Reorganizes patient responses into readable format
 * - Includes prescription context
 * - Highlights key information
 * 
 * WHAT IT DOES NOT DO:
 * - Interpret symptoms
 * - Suggest diagnoses
 * - Provide medical advice
 * - Add information beyond what patient provided
 * 
 * @param {string} followUpId - The follow-up document ID
 * @returns {Promise<{success: boolean, summary?: string, error?: string}>}
 */
async function generateDoctorSummary(followUpId) {
    // ========== FETCH DATA ==========
    const followUpDoc = await db.collection('followUps').doc(followUpId).get();
    if (!followUpDoc.exists) {
        return { success: false, error: 'Follow-up not found' };
    }

    const followUpData = followUpDoc.data();

    // ========== SECURITY CHECK ==========
    // CRITICAL: Verify patient consent before generating summary
    // Summary contains personal medical information
    if (!followUpData.patientConsent) {
        return {
            success: false,
            error: 'Patient consent required before generating summary'
        };
    }

    // Get prescription data for context
    const prescriptionDoc = await db.collection('prescriptions').doc(followUpData.prescriptionId).get();
    const prescription = prescriptionDoc.data();

    // ========== AI PROMPT ==========
    /**
     * Prompt for Summary Generation
     * 
     * KEY CONSTRAINTS:
     * - ONLY reformat existing data
     * - NO interpretation or medical advice
     * - NO adding information beyond what's provided
     */
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
        // Call Groq API
        // Temperature 0.2 = Very deterministic (just formatting, no creativity needed)
        // max_tokens 600 = Enough for comprehensive summary
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 600,
        });

        const summary = completion.choices[0]?.message?.content || '';

        // ========== STORE SUMMARY ==========
        // Update follow-up with summary and mark as ready for doctor review
        await db.collection('followUps').doc(followUpId).update({
            doctorSummary: summary,
            summaryGeneratedAt: new Date(),
            status: 'ready_for_review',  // Status change triggers doctor notification
        });

        return { success: true, summary };

    } catch (error) {
        console.error('AI Summary Generation Error:', error);
        return { success: false, error: 'Failed to generate summary' };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    generateDraftStatements,       // Step 5: Create editable drafts for patient
    generateDoctorSummary,         // Step 8: Format verified data for doctor
    generatePersonalizedQuestions, // Generate condition-specific questions
};
