const fs = require('fs');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcryptjs');

const careersFilePath = path.join(__dirname, 'data', 'careers_bd.json');

function seedCareers() {
  fs.readFile(careersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading careers_bd.json:', err);
      return;
    }

    const careers = JSON.parse(data);
    let insertedCount = 0;

    db.serialize(() => {
      // Check if careers table is empty before seeding
      db.get('SELECT COUNT(*) as count FROM careers', (err, row) => {
        if (err) {
          console.error('Database error checking careers count:', err.message);
          return;
        }

        if (row.count > 0) {
          console.log('Careers table is not empty. Skipping seed.');
          return;
        }

        console.log('Seeding careers table...');
        const sql = `INSERT INTO careers (title, company, location, skills, description) VALUES (?, ?, ?, ?, ?)`;
        const stmt = db.prepare(sql);

        careers.forEach(career => {
          // Skills array stored as a JSON string in the database
          const skillsString = JSON.stringify(career.skills);
          stmt.run(career.title, career.company, career.location, skillsString, career.description, (err) => {
            if (err) {
              console.error('Error inserting career:', err.message);
            } else {
              insertedCount++;
            }
          });
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('Error finalizing statement:', err.message);
          } else {
            console.log(`Seeding complete. Inserted ${insertedCount} careers.`);
          }
        });
      });
    });
  });
}

// --- Seed Admin User ---
async function seedAdminUser() {
  const adminEmail = 'test@example.com';
  const adminPassword = 'password';

  db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
    if (err) {
      console.error('Database error checking users count:', err.message);
      return;
    }

    if (row.count > 0) {
      console.log('Users table is not empty. Skipping admin user seed.');
      return;
    }

    console.log('Seeding admin user...');
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      
      db.run(sql, ['Test User', adminEmail, hashedPassword], function(err) {
        if (err) {
          console.error('Error inserting admin user:', err.message);
        } else {
          console.log(`Admin user created with ID: ${this.lastID}`);
        }
      });
    } catch (error) {
      console.error('Error hashing password or inserting admin user:', error.message);
    }
  });
}

seedCareers();
seedAdminUser();
