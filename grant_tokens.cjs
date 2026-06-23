const admin = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');

// Initialize Firebase
admin.initializeApp({
  projectId: config.projectId
});

const db = getFirestore();
if (config.firestoreDatabaseId) {
    db.settings({ databaseId: config.firestoreDatabaseId });
}

async function grantTokens() {
    try {
        const email = 'abglco@protonmail.com';
        const snapshot = await db.collection('users').where('email', '==', email).get();
        if (snapshot.empty) {
            console.log(`User not found: ${email}. Creating record.`);
            const id = email.replace(/[^a-zA-Z0-9]/g, '_');
            await db.collection('users').doc(id).set({
                id,
                email,
                tokens: 1000000,
                tier: 'free',
                created_at: new Date().toISOString()
            }, { merge: true });
            console.log(`Successfully created user and granted 1,000,000 tokens to ${email}`);
        } else {
            const docId = snapshot.docs[0].id;
            await db.collection('users').doc(docId).update({ tokens: 1000000 });
            console.log(`Successfully updated token balance to 1,000,000 for ${email}`);
        }
    } catch (error) {
        console.error("Error granting tokens:", error);
    }
}

grantTokens();
