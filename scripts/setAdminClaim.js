const admin = require('firebase-admin');

// To run this script:
// 1. Go to Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key.
// 2. Save the downloaded JSON file in this folder as `serviceAccountKey.json`.
// 3. Run: npm install firebase-admin
// 4. Run: node setAdminClaim.js

// Load the service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const userEmail = 'faycalassoul@gmail.com';

async function setAdminClaim() {
  try {
    console.log(`Looking up user by email: ${userEmail}`);
    const user = await admin.auth().getUserByEmail(userEmail);
    
    console.log(`Found user: ${user.uid}. Setting admin claim...`);
    // Set admin custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    console.log('\x1b[32m%s\x1b[0m', `✅ Successfully added 'admin' claim to ${userEmail} (uid: ${user.uid}).`);
    console.log('IMPORTANT: You must sign out and sign back into the app for the new claims to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  }
}

setAdminClaim();
