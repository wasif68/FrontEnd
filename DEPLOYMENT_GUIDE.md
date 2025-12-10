# Backend Deployment Guide

## Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Functions (if not already done):
```bash
cd functions
npm install
```

## Step 1: Deploy Backend to Firebase Functions

1. Navigate to functions directory:
```bash
cd functions
```

2. Install dependencies:
```bash
npm install
```

3. Deploy functions:
```bash
firebase deploy --only functions
```

4. After deployment, note the function URL. It will be:
```
https://us-central1-system-analysis-edd26.cloudfunctions.net/api
```

## Step 2: Migrate Data from SQLite to Firestore

Since Firebase Functions don't support SQLite, you need to migrate your data:

### Option A: Manual Migration Script

Create a migration script to copy data from SQLite to Firestore:

```javascript
// functions/migrate.js
const admin = require("firebase-admin");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

admin.initializeApp();

const dbPath = path.resolve(__dirname, "../backend/careeraidb.sqlite");
const sqliteDb = new sqlite3.Database(dbPath);
const firestore = admin.firestore();

async function migrateCareers() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT * FROM careers", [], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const batch = firestore.batch();
      rows.forEach((career) => {
        const ref = firestore.collection("careers").doc(career.id.toString());
        batch.set(ref, {
          title: career.title,
          company: career.company,
          location: career.location,
          description: career.description,
          skills: JSON.parse(career.skills || "[]"),
        });
      });

      await batch.commit();
      console.log(`Migrated ${rows.length} careers`);
      resolve();
    });
  });
}

async function migrateCourses() {
  return new Promise((resolve, reject) => {
    sqliteDb.all("SELECT * FROM courses", [], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const batch = firestore.batch();
      for (const course of rows) {
        const ref = firestore.collection("courses").doc(course.id.toString());
        
        // Get course skills
        sqliteDb.all(
          "SELECT skill FROM course_skills WHERE course_id = ?",
          [course.id],
          (err, skills) => {
            batch.set(ref, {
              title: course.title,
              provider: course.provider,
              location: course.location,
              description: course.description,
              skills: skills.map((s) => s.skill),
            });
          }
        );
      }

      await batch.commit();
      console.log(`Migrated ${rows.length} courses`);
      resolve();
    });
  });
}

async function migrate() {
  try {
    await migrateCareers();
    await migrateCourses();
    console.log("Migration complete!");
    sqliteDb.close();
  } catch (error) {
    console.error("Migration error:", error);
    sqliteDb.close();
  }
}

migrate();
```

Run migration:
```bash
node functions/migrate.js
```

### Option B: Use Firebase Console

Manually import data through Firebase Console:
1. Go to Firestore Database
2. Create collections: `careers`, `courses`, `users`, `user_profiles`, etc.
3. Import data from your SQLite database

## Step 3: Update Frontend Environment Variables

1. After deployment, get your function URL:
```
https://us-central1-system-analysis-edd26.cloudfunctions.net/api
```

2. Update `.env.production`:
```
VITE_API_URL=https://us-central1-system-analysis-edd26.cloudfunctions.net/api
```

## Step 4: Build and Deploy Frontend

1. Build the frontend:
```bash
npm run build
```

2. Deploy to Firebase Hosting:
```bash
firebase deploy --only hosting
```

## Step 5: Verify Deployment

1. Visit your site: https://system-analysis-edd26.web.app
2. Try logging in
3. Check browser console for any errors
4. Verify API calls are going to the Functions URL

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure:
- Your Firebase Hosting domain is in the CORS whitelist in `functions/index.js`
- The function URL is correct

### Function Not Found
- Check Firebase Console → Functions to see if deployment succeeded
- Verify the function name matches: `api`

### Database Errors
- Ensure data is migrated to Firestore
- Check Firestore security rules allow reads/writes

