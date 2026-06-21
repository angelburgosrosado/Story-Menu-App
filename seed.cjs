const admin = require('firebase-admin');
const fs = require('fs');

admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-service-account.json'))
});

const db = admin.firestore();

async function seedPlans() {
  const plansRef = db.collection('subscription_plans');
  const snapshot = await plansRef.get();
  
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
  
  const plans = [
    {
      name: 'Free',
      priceSubscription: 0,
      priceOneTime: 0,
      features: [
        'Basic Art Styles',
        'Standard Generation Queue'
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Starter',
      priceSubscription: 5,
      priceOneTime: 7,
      features: [
        'Basic Art Styles',
        'Standard Generation Queue',
        'Priority GPU Queue (Faster generation)'
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      name: 'Pro',
      priceSubscription: 20,
      priceOneTime: 25,
      features: [
        'Basic Art Styles',
        'Advanced Art Styles (e.g. Noir, Pixar, Anime)',
        'Standard Generation Queue',
        'Priority GPU Queue (Faster generation)',
        'Watermark Removal',
        'Commercial Usage Rights',
        'Premium LLMs (e.g. Gemini Pro, Claude 3 Opus)'
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const plan of plans) {
    await plansRef.add(plan);
    console.log(`Added plan: ${plan.name}`);
  }
  
  console.log('Done seeding plans.');
}

seedPlans().catch(console.error).finally(() => process.exit(0));
