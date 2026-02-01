/**
 * OCR Service
 * Uses Google Cloud Vision API to extract text from prescription images
 * Parses extracted text to identify prescription fields
 */

const vision = require('@google-cloud/vision');
const { groq, SAFETY_PREFIX } = require('../config/groq');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Vision client with credentials
let visionClient;

function getVisionClient() {
    if (!visionClient) {
        // Check if a keyfile exists
        const keyfilePath = path.join(__dirname, '..', '..', 'google-credentials.json');
        
        if (fs.existsSync(keyfilePath)) {
            // Use keyfile if it exists
            console.log('Using Google Cloud credentials from keyfile');
            visionClient = new vision.ImageAnnotatorClient({
                keyFilename: keyfilePath
            });
        } else {
            // Fall back to environment variables
            let privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY || '';
            
            // If the key is wrapped in quotes, remove them
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }
            
            // Replace literal \n with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');
            
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

/**
 * Extract text from an image using Google Vision OCR
 * @param {Buffer|string} imageSource - Image buffer or base64 string
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
async function extractTextFromImage(imageSource) {
    try {
        const client = getVisionClient();

        let request;
        if (Buffer.isBuffer(imageSource)) {
            request = { image: { content: imageSource } };
        } else if (typeof imageSource === 'string') {
            // Check if it's a base64 string or URL
            if (imageSource.startsWith('http')) {
                request = { image: { source: { imageUri: imageSource } } };
            } else {
                // Assume base64
                const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '');
                request = { image: { content: base64Data } };
            }
        } else {
            return { success: false, error: 'Invalid image source format' };
        }

        const [result] = await client.textDetection(request);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            return { success: false, error: 'No text detected in the image' };
        }

        // First annotation contains the full text
        const fullText = detections[0].description;

        return { success: true, text: fullText };
    } catch (error) {
        console.error('Vision API Error:', error);
        return { success: false, error: error.message || 'Failed to process image' };
    }
}

/**
 * Parse extracted text to identify prescription fields using AI
 * @param {string} rawText - Raw OCR text from the image
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function parsePrescriptionText(rawText) {
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
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1, // Very low for accuracy
            max_tokens: 1500,
        });

        const responseText = completion.choices[0]?.message?.content || '';

        // Parse JSON response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'Failed to parse prescription data' };
        }

        const prescriptionData = JSON.parse(jsonMatch[0]);

        // Process frequency codes to human-readable format
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

        // Combine dosage, frequency code and text for backward compatibility
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

/**
 * Interpret frequency code (1-0-1 format) to human-readable text
 * @param {string} code - Frequency code like "1-0-1"
 * @returns {string} Human-readable description
 */
function interpretFrequencyCode(code) {
    if (!code) return null;
    
    // Normalize the code (handle spaces, commas, etc.)
    const normalized = code.replace(/[\s,]+/g, '-').replace(/-+/g, '-');
    const parts = normalized.split('-').map(p => parseInt(p.trim()));
    
    if (parts.length !== 3 || parts.some(isNaN)) {
        return code; // Return original if not valid format
    }

    const [morning, afternoon, evening] = parts;
    const times = [];
    
    if (morning === 1) times.push('Morning');
    if (afternoon === 1) times.push('Afternoon');
    if (evening === 1) times.push('Evening');
    
    if (times.length === 0) return 'As directed';
    if (times.length === 3) return 'Three times daily (Morning, Afternoon, Evening)';
    if (times.length === 2) return `Twice daily (${times.join(' & ')})`;
    if (times.length === 1) return `Once daily (${times[0]} only)`;
    
    return times.join(', ');
}

/**
 * Full OCR pipeline: Extract text and parse prescription data
 * @param {Buffer|string} imageSource - Image buffer or base64 string
 * @returns {Promise<{success: boolean, rawText?: string, data?: object, error?: string}>}
 */
async function processPrescriptionImage(imageSource) {
    // Step 1: Extract text from image
    const ocrResult = await extractTextFromImage(imageSource);
    
    if (!ocrResult.success) {
        return ocrResult;
    }

    // Step 2: Parse the extracted text
    const parseResult = await parsePrescriptionText(ocrResult.text);

    if (!parseResult.success) {
        return {
            success: false,
            rawText: ocrResult.text,
            error: parseResult.error,
        };
    }

    return {
        success: true,
        rawText: ocrResult.text,
        data: parseResult.data,
    };
}

module.exports = {
    extractTextFromImage,
    parsePrescriptionText,
    processPrescriptionImage,
};
