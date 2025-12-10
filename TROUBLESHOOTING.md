# Troubleshooting Login/Signup Issues

## 🔍 Most Common Issues

### 1. **Firestore Not Enabled**

**Symptom:** Errors like "permission-denied" or "unavailable"
**Fix:**

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `system-analysis-edd26`
3. Go to Firestore Database
4. Click "Create database" if not already created
5. Choose "Start in test mode" (or use your existing rules)

### 2. **Firestore Rules Not Deployed**

**Symptom:** "Permission denied" errors
**Fix:**

```bash
firebase deploy --only firestore:rules
```

### 3. **Missing Firestore Index**

**Symptom:** Error message about "index" or "failed-precondition"
**Fix:**

1. Go to Firebase Console → Firestore → Indexes
2. Click "Create Index"
3. Collection: `users`
4. Fields: `email` (Ascending)
5. Click "Create"

### 4. **Storage Bucket Mismatch**

**Symptom:** Storage errors (if using file uploads)
**Fix:** Check `src/config/firebase.js` - storageBucket should match Firebase Console

### 5. **Network/CORS Issues**

**Symptom:** "Cannot connect to database" errors
**Fix:**

- Check internet connection
- Check browser console for CORS errors
- Verify Firebase API key is correct

### 6. **Firebase Not Initialized**

**Symptom:** "Firebase app not initialized" errors
**Fix:**

- Check browser console for initialization errors
- Verify `src/config/firebase.js` is imported correctly
- Ensure Firebase package is installed: `npm install firebase`

## 🧪 Testing Steps

1. **Open Browser Console** (F12)
2. **Try to register a new user**
3. **Check console for errors:**

   - Look for error codes (permission-denied, unavailable, etc.)
   - Check network tab for failed requests
   - Look for Firestore connection errors

4. **Check Firebase Console:**
   - Go to Firestore Database
   - Verify `users` collection exists
   - Check if documents are being created

## 🔧 Quick Fixes

### If you see "permission-denied":

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### If you see "index required":

1. Go to Firebase Console
2. Click the link in the error message (it will create the index automatically)
3. OR manually create index on `users.email`

### If you see "unavailable":

1. Check internet connection
2. Verify Firestore is enabled in Firebase Console
3. Check if Firebase project is active (not suspended)

## 📝 Debug Information

When errors occur, check the browser console for:

- `Error code:` - Firestore error code
- `Error message:` - Detailed error message
- `Full error:` - Complete error object

This information will help identify the exact issue.
