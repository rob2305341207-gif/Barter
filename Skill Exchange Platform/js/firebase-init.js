// Firebase initializer - add your Firebase config to the firebaseConfig object below
// Replace values with your project's config from Firebase console
window.firebaseConfig = window.firebaseConfig || {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

function initFirebase() {
  if (window.firebase && !window._firebaseInit) {
    firebase.initializeApp(window.firebaseConfig);
    window.firebaseAuth = firebase.auth();
    window.db = firebase.firestore();
    window._firebaseInit = true;
    console.log('Firebase initialized');
  }
}

// auto init if firebase script already loaded
if (window.firebase) initFirebase();
