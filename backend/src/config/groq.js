/**
 * Groq API Configuration
 * LLM abstraction layer for AI-assisted features
 * 
 * SAFETY: All AI calls are backend-triggered only
 * SAFETY: All prompts include mandatory safety constraints
 */

const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Mandatory safety prefix for ALL AI prompts
 * This MUST be prepended to every prompt sent to the LLM
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

module.exports = { groq, SAFETY_PREFIX };
