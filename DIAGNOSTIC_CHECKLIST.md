# Diagnostic Checklist - What's Actually Wrong?

## ⚠️ Please Check These First:

### 1. **What Error Are You Seeing?**

- [ ] "Permission denied" error?
- [ ] "Cannot connect to database" error?
- [ ] "Invalid credentials" (but credentials are correct)?
- [ ] No error, but nothing happens?
- [ ] Something else? (Please describe)

### 2. **Browser Console Errors**

Open browser console (F12) and check:

- [ ] Any red error messages?
- [ ] What do they say? (Copy the exact error)
- [ ] Any network errors in the Network tab?

### 3. **Firebase Setup**

- [ ] Is Firestore enabled in Firebase Console?
- [ ] Are Firestore rules deployed? (`firebase deploy --only firestore:rules`)
- [ ] Does the `users` collection exist in Firestore?
- [ ] Is there a Firestore index on `users.email`?

### 4. **Code Issues**

- [ ] Is Firebase package installed? (`npm list firebase`)
- [ ] Are you importing from the correct path? (`@/config/firebase`)
- [ ] Is the Firebase config correct?

## 🔍 Most Likely Issues:

### Issue #1: Firestore Rules Not Deployed

**Fix:**

```bash
firebase login
firebase deploy --only firestore:rules
```

### Issue #2: Firestore Not Enabled

**Fix:**

1. Go to https://console.firebase.google.com
2. Select project: `system-analysis-edd26`
3. Click "Firestore Database" in left menu
4. Click "Create database" if needed
5. Choose "Start in test mode"

### Issue #3: Missing Index

**Fix:**

1. Try to register/login
2. Check browser console for index error
3. Click the link in the error (Firebase will create it automatically)
4. OR manually: Firebase Console → Firestore → Indexes → Create Index

### Issue #4: Network/CORS

**Fix:**

- Check internet connection
- Check if Firebase API is accessible
- Verify API key in `src/config/firebase.js`

## 🧪 Quick Test

Run this in browser console after page loads:

```javascript
import { db } from "./src/config/firebase.js";
import { collection, getDocs } from "firebase/firestore";

// Test connection
getDocs(collection(db, "users"))
  .then((snapshot) =>
    console.log("✅ Firestore connected! Users:", snapshot.size)
  )
  .catch((error) => console.error("❌ Firestore error:", error));
```
