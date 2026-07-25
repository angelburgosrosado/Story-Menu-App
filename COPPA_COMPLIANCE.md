# COPPA Compliance Audit — Task 6.1

## Current Status

| Requirement | Status | Evidence |
|---|---|---|
| Verifiable parental consent for children <13 | ⚠️ Partial | Age gate exists but no consent collection |
| Data minimization | ✅ | No unnecessary data collection observed |
| Parental access to child's data | ❌ | No parent data access endpoint |
| Parental deletion of child's data | ❌ | No parent deletion endpoint |
| No behavioral advertising to children | ✅ | No ad SDK integrated |
| Privacy policy disclosure | ✅ | Legal page exists (LegalPages.tsx) |
| Data retention limits | ⚠️ | No automatic data purging |

## Required Changes

### 1. Age Verification Gate (Priority: HIGH)

Add age verification before story creation:

```tsx
// In Setup.tsx or onboarding flow
const [ageVerified, setAgeVerified] = useState(false);
const [birthYear, setBirthYear] = useState('');

const verifyAge = () => {
    const year = parseInt(birthYear);
    const age = new Date().getFullYear() - year;
    if (age < 13) {
        // Require parental consent
        setShowParentalConsent(true);
    } else {
        setAgeVerified(true);
    }
};
```

### 2. Parental Consent Collection (Priority: HIGH)

```tsx
// New component: ParentalConsent.tsx
const ParentalConsent = ({ childEmail, onConsent }) => {
    const [parentEmail, setParentEmail] = useState('');
    const [consentGiven, setConsentGiven] = useState(false);
    
    const submitConsent = async () => {
        // Send consent request to parent email
        await fetch('/api/parental-consent/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childEmail, parentEmail })
        });
        // Show waiting message
    };
    
    return (
        <div>
            <h2>Parental Consent Required</h2>
            <p>A parent or guardian must approve this account.</p>
            <input placeholder="Parent's email" value={parentEmail} onChange={...} />
            <button onClick={submitConsent}>Send Consent Request</button>
        </div>
    );
};
```

### 3. Parental Data Access API (Priority: MEDIUM)

```typescript
// Add to server.ts
app.post('/api/parental/verify', async (req, res) => {
    const { parentEmail, childEmail, verificationCode } = req.body;
    // Verify the code sent to parent email
    // Return access token for parent to view/delete child's data
});

app.get('/api/parental/data/:childEmail', async (req, res) => {
    // Return all data associated with child's account
});

app.delete('/api/parental/data/:childEmail', async (req, res) => {
    // Delete all data associated with child's account
});
```

### 4. Automatic Data Retention (Priority: MEDIUM)

```typescript
// Add to server startup
const RETENTION_DAYS = 365; // 1 year for child accounts
const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400000);

// Monthly cleanup job
cron.schedule('0 0 1 * *', async () => {
    const db = getFirestore();
    const oldStories = await db.collectionGroup('projects')
        .where('created_at', '<', cutoff.toISOString())
        .where('isChildAccount', '==', true)
        .get();
    
    for (const doc of oldStories.docs) {
        await doc.ref.delete();
    }
});
```

### 5. Privacy Policy Update (Priority: HIGH)

Update `LegalPages.tsx` to include COPPA-specific disclosures:
- What data we collect from children
- How we use that data
- Parent's right to review and delete
- How to contact us about child's data

## Implementation Checklist

- [ ] Add age verification gate to onboarding
- [ ] Create parental consent flow (email verification)
- [ ] Add parental data access endpoint
- [ ] Add parental data deletion endpoint
- [ ] Implement automatic data retention policy
- [ ] Update privacy policy with COPPA disclosures
- [ ] Add "Parent" role to RBAC system
- [ ] Test with under-13 age group
- [ ] Document compliance in PRIVACY.md

## Testing

```bash
# Test age gate
curl -X POST http://localhost:3001/api/verify-age \
  -H "Content-Type: application/json" \
  -d '{"birthYear": "2015"}'  # Should require consent

# Test parental consent
curl -X POST http://localhost:3001/api/parental/consent \
  -H "Content-Type: application/json" \
  -d '{"childEmail": "child@example.com", "parentEmail": "parent@example.com"}'

# Test data deletion
curl -X DELETE http://localhost:3001/api/parental/data/child@example.com \
  -H "Authorization: Bearer PARENT_ACCESS_TOKEN"
```
