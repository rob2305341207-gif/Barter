/**
 * Firebase Initialization
 * Initialize Firebase for authentication and data storage
 */

// Firebase configuration
// NOTE: Replace with your actual Firebase credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase only if Firebase is loaded
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization error:', error.message);
    console.log('Using localStorage fallback for data persistence');
  }
}

// Fallback: Use localStorage if Firebase is not available
const firebaseAvailable = typeof firebase !== 'undefined';

/**
 * Get Firebase Auth instance
 */
function getAuth() {
  if (firebaseAvailable) {
    return firebase.auth();
  }
  return null;
}

/**
 * Get Firestore instance
 */
function getFirestore() {
  if (firebaseAvailable) {
    return firebase.firestore();
  }
  return null;
}

// Log Firebase status
console.log('Firebase status:', firebaseAvailable ? 'Available' : 'Using localStorage fallback');
