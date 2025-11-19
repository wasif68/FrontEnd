# Dual Storage System Guide

## Overview

This application implements a **dual storage system** where every piece of user information is saved in two synchronized locations:

1. **JSON files** in `/user/` folder (full detailed profile)
2. **CSV file** (`d.csv`) - master database (essential fields only)

## How It Works

### Storage Locations

#### 1. JSON Files (`/user/{name}.json`)
- **Location**: Stored in `localStorage` (simulated file system)
- **Format**: Complete user profile with all details
- **Example**: `/user/wasif_tajwar.json`
- **Contains**:
  - `full_name`
  - `email_address`
  - `password`
  - `gender`, `country`, `year`
  - `education`
  - `interests` (array)
  - `custom_interest`
  - `skills` (array)
  - `custom_skill`
  - `profile_picture` (path)
  - `recommendations_saved` (array)
  - `recommendations_rejected` (array)

#### 2. CSV File (`d.csv`)
- **Location**: `public/data/d.csv` and `src/data/d.csv`
- **Format**: Essential fields only
- **Headers**: `full_name,email_address,password,gender,country,year,profile_picture`
- **Purpose**: Master database for authentication and quick lookups

### Synchronization Rules

✅ **Both storage locations are updated together** whenever:
- User signs up (new account)
- User edits profile (name, education, interests, skills)
- User saves/rejects recommendations
- User uploads/changes profile picture

### Signup Rules

🔒 **During signup:**
- System checks if **name OR email** already exists in CSV
- If either exists → Shows error: "Account already exists. Please log in instead."
- If both are new → Creates JSON file + adds CSV row

### Data Flow

#### Signup Flow:
1. User fills signup form
2. System checks: `checkUserExists(name, email)`
3. If new user:
   - Creates JSON file: `/user/{sanitized_name}.json`
   - Adds row to CSV: `full_name,email_address,password,gender,country,year,profile_picture`
   - Both saved simultaneously via `saveUserDataDual()`

#### Profile Update Flow:
1. User edits profile on ProfileQuizPage
2. Changes saved to localStorage (for backward compatibility)
3. After 500ms debounce:
   - Loads existing JSON data
   - Merges with new changes
   - Saves to JSON file via `saveUserDataDual()`
   - Updates CSV row (if user exists) or adds new row

#### Login Flow:
1. User logs in with email/password
2. System validates against CSV
3. If valid:
   - Loads user JSON file (if exists)
   - Merges JSON data with CSV data
   - Saves complete user object to `currentUser` in localStorage

## Implementation Files

### Core Files:

1. **`src/utils/userStorage.js`**
   - `saveUserJson()` - Save JSON file
   - `loadUserJson()` - Load JSON file
   - `saveUserDataDual()` - Save to both JSON + CSV
   - `checkUserExists()` - Check if name/email exists
   - `updateCSVRow()` - Update existing CSV row

2. **`src/utils/csv.js`**
   - `readCSV()` - Read CSV file
   - `findUserByEmail()` - Find user by email
   - `findUserByName()` - Find user by name
   - `convertToCSV()` - Convert users array to CSV format

3. **`src/services/authService.js`**
   - `registerUser()` - Handles signup with dual storage
   - `loginUser()` - Loads JSON data on login

4. **`src/pages/ProfileQuizPage.jsx`**
   - Syncs profile changes to dual storage

5. **`src/pages/CareerFeed.jsx`**
   - Syncs saved recommendations to JSON

## Example JSON Structure

```json
{
  "full_name": "Wasif Tajwar",
  "email_address": "wasif@carrier.ai",
  "password": "fakepass123",
  "gender": "Male",
  "country": "Bangladesh",
  "year": 2001,
  "education": "BSc",
  "interests": ["Software Development", "Cybersecurity"],
  "custom_interest": "Game AI Research",
  "skills": ["Python", "React", "Networking"],
  "custom_skill": "Data Visualization",
  "profile_picture": "Faces/1_Female2001.jpg",
  "recommendations_saved": ["Software Engineer", "Machine Learning Engineer"],
  "recommendations_rejected": []
}
```

## Example CSV Row

```csv
full_name,email_address,password,gender,country,year,profile_picture
Wasif Tajwar,wasif@carrier.ai,fakepass123,Male,Bangladesh,2001,Faces/1_Female2001.jpg
```

## Important Notes

⚠️ **Browser Limitation**: Browsers cannot write files directly to the file system. Therefore:
- JSON files are stored in `localStorage` (simulated)
- CSV updates are stored in `localStorage` (merged with file on read)
- For production, you would need a backend API to handle file writes

✅ **Backward Compatibility**: 
- System supports both old CSV format (`name,email`) and new format (`full_name,email_address`)
- Old data is automatically converted when read

✅ **Data Persistence**:
- All data persists across browser sessions via `localStorage`
- CSV file is read on app start and merged with `localStorage` data

## Testing

To test the dual storage system:

1. **Signup a new user:**
   - Fill signup form
   - Check `localStorage` for `user_json_{name}` key
   - Check `localStorage` for `csv_users` array

2. **Edit profile:**
   - Update name, education, interests, skills
   - Wait 500ms
   - Check that both JSON and CSV are updated

3. **Save recommendations:**
   - Click "Save" on a career
   - Check that `recommendations_saved` is updated in JSON

4. **Login:**
   - Log in with existing user
   - Check that JSON data is loaded and merged with user object

