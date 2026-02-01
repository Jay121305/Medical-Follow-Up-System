/**
 * ============================================================================
 * Groq API Configuration
 * LLM (Large Language Model) Integration Layer
 * ============================================================================
 * 
 * PURPOSE:
 * Provides a configured Groq client and safety constraints for AI operations.
 * All AI calls in NEST 2O go through this module.
 * 
 * WHY GROQ?
 * - Ultra-fast inference (sub-second responses)
 * - Cost-effective compared to other LLM providers
 * - Supports LLaMA 3.3 70B - excellent for medical text processing
 * - Simple REST API with good SDK support
 * 
 * AI USAGE IN NEST 2O:
 * 1. Generate personalized follow-up questions based on prescription
 * 2. Create draft statements for patient verification (EDITABLE)
 * 3. Parse OCR text from prescription images
 * 4. Generate doctor summaries from patient responses
 * 
 * ============================================================================
 * CRITICAL SAFETY PRINCIPLES
 * ============================================================================
 * 
 * 1. AI NEVER makes medical decisions
 * 2. AI outputs are DRAFTS that patients must verify
 * 3. AI only reformats/suggests - never diagnoses
 * 4. All AI calls happen AFTER patient consent (OTP verified)
 * 5. SAFETY_PREFIX is MANDATORY for all prompts
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const Groq = require('groq-sdk');  // Groq's official Node.js SDK
require('dotenv').config();       // Load GROQ_API_KEY from environment

// ============================================================================
// GROQ CLIENT INITIALIZATION
// ============================================================================

/**
 * Initialize Groq client with API key
 * 
 * WHY USE SDK INSTEAD OF FETCH?
 * - Automatic retry logic for rate limits
 * - Proper error handling and types
 * - Streaming support (not used here, but available)
 * - Handles authentication automatically
 */
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ============================================================================
// SAFETY CONSTRAINTS
// ============================================================================

/**
 * MANDATORY SAFETY PREFIX FOR ALL AI PROMPTS
 * 
 * WHY IS THIS NECESSARY?
 * Medical AI carries significant liability risks. Even as a "follow-up system",
 * any AI output could be misinterpreted as medical advice.
 * 
 * HOW TO USE:
 * const prompt = `${SAFETY_PREFIX}\n\nYour actual prompt here...`;
 * 
 * WHEN TO USE:
 * ALWAYS. Every single prompt sent to the LLM must include this prefix.
 * No exceptions.
 * 
 * WHAT IT DOES:
 * 1. Explicitly constrains the model's behavior
 * 2. Prevents the model from offering medical advice
 * 3. Reminds the model it's a formatting assistant only
 * 4. Establishes clear boundaries for output generation
 */
const SAFETY_PREFIX = `
CRITICAL CONSTRAINTS - YOU MUST FOLLOW THESE:
1. Do NOT provide medical advice under any circumstances.
2. Do NOT infer medical outcomes or diagnoses.
3. Only reformat the information that is explicitly provided.
4. If you are unsure about anything, output nothing or ask for clarification.
5. You are a formatting assistant, NOT a medical professional.
6. Never add information that was not explicitly provided.
7. Never suggest treatments, medications, or medical actions.
`;

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { 
  groq,          // Groq client instance for making API calls
  SAFETY_PREFIX  // Must be included in ALL AI prompts
};
