/**
 * ============================================================================
 * OCR Service - Prescription Image Processing
 * ============================================================================
 * 
 * PURPOSE:
 * Extracts text from prescription images using Google Cloud Vision API,
 * then uses AI (Groq LLaMA) to parse and structure the extracted text.
 * 
 * WORKFLOW:
 * 1. Receive prescription image (base64 or URL)
 * 2. Send to Google Cloud Vision for OCR text extraction
 * 3. Pass raw text to Groq AI for intelligent parsing
 * 4. Return structured prescription data (patient info, medicines, dosage)
 * 
 * WHY TWO-STEP PROCESS?
 * - Google Vision excels at text extraction (OCR)
 * - Groq AI excels at understanding context and structure
 * - Combined, they handle messy handwritten prescriptions
 * 
 * SUPPORTED INPUT FORMATS:
 * - Base64 encoded image string
 * - Image URL (http/https)
 * - Raw image buffer
 * 
 * OUTPUT STRUCTURE:
 * - Patient info: name, phone, email
 * - Prescription: medicines, dosages, frequency codes
 * - Metadata: doctor name, date, condition
 * 
 * FREQUENCY CODE NOTATION:
 * Indian prescriptions often use "1-0-1" format:
 * - First digit = Morning dose (1 = take, 0 = skip)
 * - Second digit = Afternoon dose
 * - Third digit = Evening dose
 * Example: "1-0-1" = Take morning and evening, skip afternoon
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

/**
 * Google Cloud Vision client library
 * Provides OCR (Optical Character Recognition) capabilities
 * Documentation: https://cloud.google.com/vision/docs
 */
const vision = require('@google-cloud/vision');

/**
 * Groq AI client for intelligent text parsing
 * Uses LLaMA 3.3 70B model to understand prescription context
 */
const { groq, SAFETY_PREFIX } = require('../config/groq');

/**
 * File system module for checking credentials file
 */
const fs = require('fs');

/**
 * Path module for building credential file path
 */
const path = require('path');

/**
 * Load environment variables
 */
require('dotenv').config();

// ============================================================================
// GOOGLE CLOUD VISION CLIENT INITIALIZATION
// ============================================================================

/**
 * Vision client instance (singleton pattern)
 * Initialized lazily on first use
 */
let visionClient;

/**
 * Get or create Google Cloud Vision client
 * 
 * AUTHENTICATION METHODS (in priority order):
 * 1. Keyfile: google-credentials.json in backend folder
 * 2. Environment Variables: Individual credential fields
 * 
 * WHY LAZY INITIALIZATION?
 * - Allows app to start even if Vision isn't configured
 * - Credentials checked only when OCR is actually needed
 * - Single instance reused for all requests
 * 
 * @returns {vision.ImageAnnotatorClient} Configured Vision client
 */
function getVisionClient() {
    if (!visionClient) {
        // Check for keyfile first (easier setup for development)
        const keyfilePath = path.join(__dirname, '..', '..', 'google-credentials.json');
        
        if (fs.existsSync(keyfilePath)) {
            // METHOD 1: Use JSON keyfile
            // Download from Google Cloud Console → IAM → Service Accounts
            console.log('Using Google Cloud credentials from keyfile');
            visionClient = new vision.ImageAnnotatorClient({
                keyFilename: keyfilePath
            });
        } else {
            // METHOD 2: Use environment variables
            // Useful for deployment (Heroku, Railway, etc.)
            let privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY || '';
            
            // Handle quoted private key (common in .env files)
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }
            
            // Replace literal \n with actual newlines
            // (Environment variables can't contain real newlines)
            privateKey = privateKey.replace(/\\n/g, '\n');
            
            // Build credentials object matching Google's format
            const credentials = {
                type: 'service_account',
                project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
                private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
                private_key: privateKey,
                client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token',
            };

            console.log('Using Google Cloud credentials from environment variables');
            console.log('Project:', process.env.GOOGLE_CLOUD_PROJECT_ID);
            console.log('Client email:', process.env.GOOGLE_CLOUD_CLIENT_EMAIL);
            
            visionClient = new vision.ImageAnnotatorClient({ credentials });
        }
    }
    return visionClient;
}

// ============================================================================
// TEXT EXTRACTION (OCR)
// ============================================================================

/**
 * Extract text from an image using Google Cloud Vision OCR
 * 
 * WHAT IT DOES:
 * - Sends image to Google Cloud Vision API
 * - Returns all text detected in the image
 * - Handles handwritten and printed text
 * 
 * SUPPORTED INPUTS:
 * - Buffer: Raw image bytes
 * - Base64 string: Data URL or raw base64
 * - URL: Direct link to image (must be publicly accessible)
 * 
 * @param {Buffer|string} imageSource - Image as buffer, base64, or URL
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 * 
 * @example
 * // Base64 input
 * const result = await extractTextFromImage('data:image/png;base64,iVBORw...');
 * 
 * // URL input
 * const result = await extractTextFromImage('https://example.com/prescription.jpg');
 */
async function extractTextFromImage(imageSource) {
    try {
        const client = getVisionClient();

        // Build request based on input type
        let request;
        if (Buffer.isBuffer(imageSource)) {
            // Raw image buffer
            request = { image: { content: imageSource } };
        } else if (typeof imageSource === 'string') {
            // Check if it's a URL or base64 string
            if (imageSource.startsWith('http')) {
                // URL - Vision API will fetch the image
                request = { image: { source: { imageUri: imageSource } } };
            } else {
                // Assume base64 - strip data URL prefix if present
                const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
                request = { image: { content: base64Data } };
            }
        } else {
            return { success: false, error: 'Invalid image source format' };
        }

        // Call Google Cloud Vision TEXT_DETECTION
        const [result] = await client.textDetection(request);
        const detections = result.textAnnotations;

        // Check if any text was found
        if (!detections || detections.length === 0) {
            return { success: false, error: 'No text detected in the image' };
        }

        // First annotation contains the complete text
        // Subsequent annotations are individual words/blocks
        const fullText = detections[0].description;

        return { success: true, text: fullText };
    } catch (error) {
        console.error('Vision API Error:', error);
        return { success: false, error: error.message || 'Failed to process image' };
    }
}

// ============================================================================
// PRESCRIPTION PARSING (AI)
// ============================================================================

/**
 * Parse extracted OCR text to identify prescription fields using AI
 * 
 * WHAT IT DOES:
 * - Takes raw OCR text (often messy and unstructured)
 * - Uses Groq AI to intelligently extract structured fields
 * - Handles multiple medicines, frequency codes, special instructions
 * 
 * FIELDS EXTRACTED:
 * - Patient: name, phone, email
 * - Prescription: medicine names, dosages, frequencies, duration
 * - Metadata: doctor name, date, condition, notes
 * 
 * SPECIAL HANDLING:
 * - Frequency codes (1-0-1 format) converted to human-readable text
 * - Multiple medicines extracted into array
 * - Missing fields set to null (not guessed)
 * 
 * @param {string} rawText - Raw OCR text from image
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function parsePrescriptionText(rawText) {
    /**
     * AI Prompt for Prescription Parsing
     * 
     * STRUCTURE:
     * 1. SAFETY_PREFIX - No medical advice
     * 2. TASK - Extract only explicit information
     * 3. FREQUENCY CODE EXPLANATION - Important for Indian prescriptions
     * 4. OCR TEXT - The raw text to parse
     * 5. FIELD DEFINITIONS - What to extract
     * 6. OUTPUT FORMAT - JSON structure
     */
    const prompt = `${SAFETY_PREFIX}

TASK: Extract structured prescription information from the following OCR text.
Only extract information that is EXPLICITLY present in the text.
If a field is not found, use null.

IMPORTANT: Many prescriptions use a frequency notation like "1-0-1" or "1-1-1" which means:
- First digit = Morning dose (1 = take, 0 = skip)
- Second digit = Afternoon dose (1 = take, 0 = skip)
- Third digit = Evening/Night dose (1 = take, 0 = skip)

Examples:
- "1-0-1" = Take in morning and evening, skip afternoon
- "1-1-1" = Take morning, afternoon, and evening
- "0-0-1" = Take only in evening
- "1-0-0" = Take only in morning

OCR TEXT:
"""
${rawText}
"""

EXTRACT the following fields:
1. patientName - Patient's full name
2. patientPhone - Patient's phone number (with country code if available)
3. patientEmail - Patient's email address (if present)
4. medicineName - Name of the medicine/drug prescribed (if multiple medicines, separate with semicolon)
5. dosage - Dosage strength (e.g., "500mg", "1 tablet") - if multiple, separate with semicolon matching medicine order
6. frequencyCode - The frequency code in format like "1-0-1", "1-1-1" etc. - if multiple, separate with semicolon matching medicine order
7. frequencyText - Human readable frequency (e.g., "twice daily", "morning and evening") - if multiple, separate with semicolon
8. duration - Treatment duration (e.g., "7 days", "2 weeks")
9. condition - Medical condition or diagnosis being treated
10. doctorName - Prescribing doctor's name
11. prescriptionDate - Date of prescription
12. additionalNotes - Any other relevant instructions (e.g., "take after food", "take with water")
13. medicines - Array of medicine objects if multiple medicines are present, each with: name, dosage, frequencyCode, frequencyText, instructions

OUTPUT FORMAT (JSON only, no markdown):
{
  "patientName": "value or null",
  "patientPhone": "value or null",
  "patientEmail": "value or null",
  "medicineName": "value or null",
  "dosage": "value or null",
  "frequencyCode": "value or null (e.g., 1-0-1)",
  "frequencyText": "value or null",
  "duration": "value or null",
  "condition": "value or null",
  "doctorName": "value or null",
  "prescriptionDate": "value or null",
  "additionalNotes": "value or null",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "dosage strength",
      "frequencyCode": "1-0-1 format or null",
      "frequencyText": "human readable or null",
      "instructions": "any specific instructions or null"
    }
  ]
}

IMPORTANT: 
- Only include information that is CLEARLY visible in the text. Do NOT guess or infer.
- Look carefully for patterns like "1-0-1", "1-1-1", "0-1-1", etc. These are very common in prescriptions.
- If you see numbers like "1  0  1" or "1, 0, 1" with spaces/commas, normalize to "1-0-1" format.`;

    try {
        // Call Groq AI for intelligent parsing
        // Temperature 0.1 = Very deterministic (accuracy over creativity)
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: 1500,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Extract JSON from response (AI sometimes adds markdown wrapper)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Failed to parse prescription data' };
        }

        const prescriptionData = JSON.parse(jsonMatch[0]);

        // ========== POST-PROCESSING ==========
        
        // Convert frequency codes to human-readable text
        if (prescriptionData.frequencyCode && !prescriptionData.frequencyText) {
            prescriptionData.frequencyText = interpretFrequencyCode(prescriptionData.frequencyCode);
        }

        // Process each medicine's frequency code
        if (prescriptionData.medicines && Array.isArray(prescriptionData.medicines)) {
            prescriptionData.medicines = prescriptionData.medicines.map(med => {
                if (med.frequencyCode && !med.frequencyText) {
                    med.frequencyText = interpretFrequencyCode(med.frequencyCode);
                }
                return med;
            });
        }

        // Combine dosage fields for backward compatibility
        // Creates string like "500mg (1-0-1) - Twice daily (Morning & Evening)"
        if (prescriptionData.dosage) {
            let dosageStr = prescriptionData.dosage;
            if (prescriptionData.frequencyCode) {
                dosageStr += ` (${prescriptionData.frequencyCode})`;
            }
            if (prescriptionData.frequencyText) {
                dosageStr += ` - ${prescriptionData.frequencyText}`;
            }
            prescriptionData.dosage = dosageStr;
        }

        return { success: true, data: prescriptionData };
    } catch (error) {
        console.error('Parse Prescription Error:', error);
        return { success: false, error: 'Failed to parse prescription text' };
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Interpret frequency code (1-0-1 format) to human-readable text
 * 
 * FREQUENCY CODE FORMAT:
 * Three digits representing Morning-Afternoon-Evening
 * 1 = take dose, 0 = skip dose
 * 
 * EXAMPLES:
 * - "1-0-1" → "Twice daily (Morning & Evening)"
 * - "1-1-1" → "Three times daily (Morning, Afternoon, Evening)"
 * - "0-0-1" → "Once daily (Evening only)"
 * 
 * @param {string} code - Frequency code like "1-0-1"
 * @returns {string} Human-readable description
 */
function interpretFrequencyCode(code) {
    if (!code) return null;
    
    // Normalize input: handle spaces, commas, multiple dashes
    // "1  0  1" or "1, 0, 1" → "1-0-1"
    const normalized = code.replace(/[\s,]+/g, '-').replace(/-+/g, '-');
    const parts = normalized.split('-').map(p => parseInt(p.trim()));
    
    // Validate format (must be exactly 3 numbers)
    if (parts.length !== 3 || parts.some(isNaN)) {
        return code; // Return original if not valid format
    }

    const [morning, afternoon, evening] = parts;
    const times = [];
    
    // Build list of times when dose should be taken
    if (morning === 1) times.push('Morning');
    if (afternoon === 1) times.push('Afternoon');
    if (evening === 1) times.push('Evening');
    
    // Generate human-readable description
    if (times.length === 0) return 'As directed';
    if (times.length === 3) return 'Three times daily (Morning, Afternoon, Evening)';
    if (times.length === 2) return `Twice daily (${times.join(' & ')})`;
    if (times.length === 1) return `Once daily (${times[0]} only)`;
    
    return times.join(', ');
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================

/**
 * Full OCR pipeline: Extract text and parse prescription data
 * 
 * This is the main entry point for prescription image processing.
 * Combines OCR extraction and AI parsing into a single operation.
 * 
 * WORKFLOW:
 * 1. Extract raw text from image (Google Vision)
 * 2. Parse text into structured data (Groq AI)
 * 3. Return both raw text and parsed data
 * 
 * WHY RETURN RAW TEXT?
 * - Debugging: See what OCR detected
 * - Fallback: Manual parsing if AI fails
 * - Audit: Original text for verification
 * 
 * @param {Buffer|string} imageSource - Image as buffer, base64, or URL
 * @returns {Promise<{success: boolean, rawText?: string, data?: object, error?: string}>}
 * 
 * @example
 * const result = await processPrescriptionImage(base64Image);
 * if (result.success) {
 *     console.log('Medicines:', result.data.medicines);
 *     console.log('Raw OCR:', result.rawText);
 * }
 */
async function processPrescriptionImage(imageSource) {
    // Step 1: Extract text from image using Google Vision
    const ocrResult = await extractTextFromImage(imageSource);
    
    if (!ocrResult.success) {
        return ocrResult;
    }

    // Step 2: Parse the extracted text using AI
    const parseResult = await parsePrescriptionText(ocrResult.text);

    if (!parseResult.success) {
        // Return raw text even if parsing fails (for debugging)
        return {
            success: false,
            rawText: ocrResult.text,
            error: parseResult.error,
        };
    }

    // Return complete result
    return {
        success: true,
        rawText: ocrResult.text,    // Original OCR text
        data: parseResult.data,     // Structured prescription data
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    extractTextFromImage,      // Low-level: OCR only
    parsePrescriptionText,     // Low-level: AI parsing only
    processPrescriptionImage,  // High-level: Complete pipeline
};
