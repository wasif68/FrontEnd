const fs = require('fs');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');
const { parse } = require('csv-parse');

const csvFilePath = path.resolve(__dirname, '../a.csv');

async function importUsers() {
  const users = [];
  const parser = fs.createReadStream(csvFilePath).pipe(parse({
    columns: true,
    skip_empty_lines: true
  }));

  for await (const row of parser) {
    users.push(row);
  }

  if (users.length === 0) {
    console.log('No users found in a.csv. Nothing to import.');
    return;
  }

  console.log(`Found ${users.length} users in a.csv. Importing...`);

  let insertedCount = 0;
  for (const user of users) {
    const { name, email, password, gender, birthYear, country, avatarFile } = user;

    if (!name || !email || !password) {
      console.warn(`Skipping user with missing data: ${JSON.stringify(user)}`);
      continue;
    }

    try {
      let hashedPassword = password;
      // Simple check to see if password might already be hashed
      if (!password.startsWith('$2a$') && !password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      const sql = 'INSERT INTO users (name, email, password, gender, birthYear, country, avatarFile) VALUES (?, ?, ?, ?, ?, ?, ?)';
      // Using a promise-based wrapper for db.run to handle async properly
      await new Promise((resolve, reject) => {
        db.run(sql, [name, email, hashedPassword, gender, birthYear, country, avatarFile], function(err) {
          if (err) {
            // Ignore unique constraint errors for email, as user may already exist
            if (err.message.includes('UNIQUE constraint failed: users.email')) {
              console.warn(`User with email ${email} already exists. Skipping.`);
              resolve();
            } else {
              console.error(`Error inserting user ${email}:`, err.message);
              reject(err);
            }
          } else {
            insertedCount++;
            resolve();
          }
        });
      });
    } catch (error) {
      console.error(`Failed to process user ${email}:`, error.message);
    }
  }

  console.log(`Import complete. Successfully inserted ${insertedCount} new users.`);
  db.close();
}

// Check if csv-parse is installed, if not, provide instructions.
try {
  require.resolve('csv-parse');
  importUsers();
} catch (e) {
  console.error("The 'csv-parse' package is required. Please install it by running: npm install csv-parse");
  process.exit(1);
}
