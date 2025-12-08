
-- Step 1: To prevent data loss, we start a transaction. 
-- If any command fails, all changes will be rolled back.
BEGIN TRANSACTION;

-- Step 2: Rename the existing 'data' table to 'data_old'. 
-- This preserves the original data while we create the new table structure.
ALTER TABLE data RENAME TO data_old;

-- Step 3: Create the new 'data' table with the desired schema.
-- We add the new columns: 'id' as a primary key, 'username', 'profile_completed', and 'is_active'.
CREATE TABLE data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    password TEXT,
    gender TEXT,
    year INTEGER,
    country TEXT,
    avatar TEXT,
    profile_completed BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1
);

-- Step 4: Copy all data from the old table into the new one.
-- We map the 'name' column from 'data_old' to the 'username' column in the new 'data' table.
-- Existing columns like 'email', 'password', etc., are copied directly.
INSERT INTO data (username, email, password, gender, year, country, avatar)
SELECT name, email, password, gender, year, country, avatar FROM data_old;

-- Step 5: Remove the old table, as the data has been successfully migrated.
DROP TABLE data_old;

-- Step 6: Commit all the changes to the database.
COMMIT;
