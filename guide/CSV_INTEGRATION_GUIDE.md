# CSV Database Integration Guide

## Overview

The CareerAI application now uses a CSV file (`d.csv`) as the user database instead of localStorage for user accounts. This guide explains how the CSV integration works.

## File Structure

### CSV File Location

- **Public folder**: `public/data/d.csv` - This is the main CSV file served to the browser
- **Source folder**: `src/data/d.csv` - Backup/reference copy

### CSV Format

The CSV file contains the following columns:

```
name,email,password,gender,year,country,avatar
```

Example row:

```
Ayesha Rahman,ayesha.rahman@carrier.ai,Ayesha@123,female,1980,Bangladesh,01_female_2001.jpg.jpg
```

## Implementation Details

### 1. CSV Utility Functions (`src/utils/csv.js`)

#### `readCSV()`

- Reads the CSV file from `/data/d.csv`
- Parses CSV text into array of user objects
- Falls back to localStorage cache if CSV file cannot be loaded
- Returns: `Promise<Array>` - Array of all users

#### `findUserByEmail(email)`

- Searches for a user by email address (case-insensitive)
- Returns: `Promise<Object|null>` - User object or null if not found

#### `addUser(userObject)`

- Checks if user already exists
- Adds new user to the database
- Since browsers can't write files directly, stores in localStorage
- Assigns a gender-appropriate avatar automatically
- Returns: `Promise<Object|null>` - Newly created user (with avatar metadata) or null

#### `validateLogin(email, password)`

- Validates login credentials against CSV database
- Returns: `Promise<Object>` - `{ success: boolean, user: Object|null, error: string|null }`

### 2. Updated Authentication Service (`src/services/authService.js`)

The authentication service now:

- Uses CSV functions for all user operations
- Validates email format
- Checks if email already exists before signup
- Shows specific error: "Account already exists. Please log in instead."

### 3. Signup Page Updates (`src/pages/SignupPage.jsx`)

**New Fields Added:**

- Full Name (text input)
- Email Address (email input with validation)
- Password (password input)
- Confirm Password (password input)
- Gender (dropdown: Male, Female, Other)
- Birth Year (dropdown: 1950 to current year)
- Country (dropdown: Bangladesh, India, Pakistan, etc.)
- Avatar (auto-assigned based on selected gender)

**Validation:**

- ✅ Checks all fields are filled
- ✅ Validates email format
- ✅ Checks if passwords match
- ✅ Checks password length (minimum 6 characters)
- ✅ Checks if email already exists in CSV
- ✅ Shows error: "Account already exists. Please log in instead." if email exists

### 4. Login Page Updates (`src/pages/LoginPage.jsx`)

**Functionality:**

- Uses `findUserByEmail()` to check if user exists
- Uses `validateLogin()` to verify credentials
- Shows error message if credentials don't match
- Redirects to dashboard (recommendations page) on success
- Loads the correct avatar so it appears in the navbar and sidebar

## How It Works

### Signup Flow

1. User fills out signup form with all required fields
2. Form validates empty fields, email format, password match
3. System calls `findUserByEmail()` to check if email exists
4. If email exists → Show error: "Account already exists. Please log in instead."
5. If email doesn't exist → Call `addUser()` to add new user
6. User is auto-logged in and redirected to home page

### Login Flow

1. User enters email and password
2. System calls `validateLogin(email, password)`
3. System checks CSV using `findUserByEmail()`
4. If email exists AND password matches → Login success → Redirect to dashboard
5. If email doesn't exist OR password doesn't match → Show error message

## Browser Limitations

**Important Note:** Browsers cannot directly write to CSV files for security reasons. The implementation:

1. **Reads** from CSV file: ✅ Works (fetches from `/data/d.csv`)
2. **Writes** to CSV: ⚠️ Uses localStorage as cache, provides CSV export function

**Solution:**

- New users are stored in localStorage (`csv_users` key)
- CSV file is read and merged with localStorage data
- For production, you would need a backend API to write to CSV file
- Alternatively, use the `downloadCSV()` function to export updated CSV

## CSV Export Function

To export the updated user database as CSV:

```javascript
import { readCSV, downloadCSV } from "./utils/csv.js";

const users = await readCSV();
downloadCSV(users); // Downloads d.csv file
```

## Testing

### Test Signup

1. Go to `/signup`
2. Fill all fields:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123
   - Confirm Password: Test123
   - Gender: Male
   - Year: 1990
   - Country: Bangladesh
3. Submit form
4. Should create account and redirect to home

### Test Login

1. Use existing user from CSV:
   - Email: `ayesha.rahman@carrier.ai`
   - Password: `Ayesha@123`
2. Should login successfully

### Test Duplicate Email

1. Try to signup with existing email from CSV
2. Should show: "Account already exists. Please log in instead."

## File Locations Summary

```
frontend/
├── public/
│   └── data/
│       └── d.csv                    # Main CSV database (served to browser)
├── src/
│   ├── utils/
│   │   └── csv.js                   # CSV utility functions
│   ├── services/
│   │   └── authService.js           # Updated to use CSV
│   └── pages/
│       ├── LoginPage.jsx            # Updated to use CSV validation
│       └── SignupPage.jsx          # Updated with new fields + CSV
```

## Next Steps (Optional)

For production deployment with full CSV write capability:

1. Create a backend API endpoint to handle CSV writes
2. Update `addUser()` to call the API instead of localStorage
3. Implement server-side CSV file management

For now, the current implementation works perfectly for:

- ✅ Reading from CSV
- ✅ Validating against CSV
- ✅ Adding new users (stored in localStorage, can be exported)
