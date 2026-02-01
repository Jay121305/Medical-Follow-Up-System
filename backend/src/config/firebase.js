/**
 * ============================================================================
 * Firebase Admin SDK Configuration
 * ============================================================================
 * 
 * PURPOSE:
 * Initializes Firebase Admin SDK to interact with Cloud Firestore database.
 * Admin SDK has elevated privileges and bypasses security rules - use carefully!
 * 
 * WHY FIREBASE FIRESTORE?
 * - NoSQL document database - flexible schema for evolving requirements
 * - Real-time listeners (not used here, but available)
 * - Scalable without infrastructure management
 * - Built-in security rules for client-side access (we use Admin SDK)
 * 
 * COLLECTIONS USED:
 * - 'prescriptions': Stores prescription data (medicine, dosage, patient info)
 * - 'followUps': Stores follow-up requests and patient responses
 * - 'users': Stores doctor and staff accounts
 * 
 * SECURITY NOTE:
 * Service account credentials have full database access. Never expose them
 * to the frontend or commit them to version control.
 * 
 * @author NEST 2O Team
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const admin = require('firebase-admin');  // Firebase Admin SDK for server-side operations
require('dotenv').config();               // Load environment variables

// ============================================================================
// SERVICE ACCOUNT CONFIGURATION
// ============================================================================

/**
 * Build service account credentials from environment variables
 * 
 * WHY NOT USE A JSON FILE?
 * - Environment variables are more secure in cloud deployments
 * - No risk of accidentally committing credentials to git
 * - Easier to rotate credentials without code changes
 * 
 * IMPORTANT: FIREBASE_PRIVATE_KEY contains \n as literal characters
 *            We must convert them to actual newline characters
 */
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  // Replace literal \n with actual newlines (private keys have line breaks)
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

/**
 * Initialize Firebase Admin SDK
 * 
 * WHY CHECK admin.apps.length?
 * - Firebase throws an error if you initialize more than once
 * - This check prevents errors during hot-reloading in development
 * - Also prevents issues if this file is imported multiple times
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),  // Authenticate with service account
    projectId: process.env.FIREBASE_PROJECT_ID,         // Specify which Firebase project
  });
}

/**
 * Get Firestore database instance
 * This is the main object we'll use for all database operations
 * 
 * USAGE EXAMPLE:
 * const { db } = require('./config/firebase');
 * const doc = await db.collection('prescriptions').doc(id).get();
 */
const db = admin.firestore();

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = { 
  admin,  // Exported in case we need other Firebase services (Auth, Storage, etc.)
  db      // Main Firestore database instance
};
