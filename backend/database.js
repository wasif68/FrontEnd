const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'careeraidb.sqlite');

// Connect to the database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDb();
    // Seed courses after initialization
    setTimeout(() => {
      const seedCourses = require('./seedCourses');
      seedCourses();
    }, 1000);
  }
});

function initializeDb() {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        gender TEXT,
        birthYear INTEGER,
        country TEXT,
        avatarFile TEXT
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err.message);
      else console.log('Users table checked/created.');
    });

    // Create careers table (based on careers_bd.json structure)
    db.run(`
      CREATE TABLE IF NOT EXISTS careers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        skills TEXT, -- Stored as JSON string or comma-separated
        description TEXT
      )
    `, (err) => {
      if (err) console.error('Error creating careers table:', err.message);
      else console.log('Careers table checked/created.');
    });

    // Create user_profiles table (to store profile quiz data)
    db.run(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY,
        education TEXT,
        interests TEXT, -- Stored as JSON string or comma-separated
        skills_selected TEXT, -- Stored as JSON string or comma-separated
        completion_percentage INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating user_profiles table:', err.message);
      else console.log('User Profiles table checked/created.');
    });

    // Create saved_careers table (for users to save careers)
    db.run(`
      CREATE TABLE IF NOT EXISTS saved_careers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        career_id INTEGER NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(career_id) REFERENCES careers(id) ON DELETE CASCADE,
        UNIQUE(user_id, career_id) -- Prevent duplicate saves
      )
    `, (err) => {
      if (err) console.error('Error creating saved_careers table:', err.message);
      else console.log('Saved Careers table checked/created.');
    });

    // Create applied_jobs table
    db.run(`
      CREATE TABLE IF NOT EXISTS applied_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        career_id INTEGER NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('pending', 'reviewed', 'rejected', 'accepted')) DEFAULT 'pending',
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(career_id) REFERENCES careers(id) ON DELETE CASCADE,
        UNIQUE(user_id, career_id)
      )
    `, (err) => {
      if (err) console.error('Error creating applied_jobs table:', err.message);
      else console.log('Applied Jobs table checked/created.');
    });

    // Create indexes for applied_jobs
    db.run(`CREATE INDEX IF NOT EXISTS idx_applied_jobs_user_id ON applied_jobs(user_id)`, (err) => {
      if (err) console.error('Error creating index on applied_jobs.user_id:', err.message);
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_applied_jobs_career_id ON applied_jobs(career_id)`, (err) => {
      if (err) console.error('Error creating index on applied_jobs.career_id:', err.message);
    });

    // Create shared_items table (generic for jobs and courses)
    db.run(`
      CREATE TABLE IF NOT EXISTS shared_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_type TEXT CHECK(item_type IN ('job', 'course')) NOT NULL,
        item_id INTEGER NOT NULL,
        shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        share_token TEXT UNIQUE NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating shared_items table:', err.message);
      else console.log('Shared Items table checked/created.');
    });

    // Create indexes for shared_items
    db.run(`CREATE INDEX IF NOT EXISTS idx_shared_items_user_id ON shared_items(user_id)`, (err) => {
      if (err) console.error('Error creating index on shared_items.user_id:', err.message);
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_shared_items_item ON shared_items(item_type, item_id)`, (err) => {
      if (err) console.error('Error creating index on shared_items.item:', err.message);
    });

    // Create courses table
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        provider TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT
      )
    `, (err) => {
      if (err) console.error('Error creating courses table:', err.message);
      else console.log('Courses table checked/created.');
    });

    // Create indexes for courses
    db.run(`CREATE INDEX IF NOT EXISTS idx_courses_provider ON courses(provider)`, (err) => {
      if (err) console.error('Error creating index on courses.provider:', err.message);
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_courses_location ON courses(location)`, (err) => {
      if (err) console.error('Error creating index on courses.location:', err.message);
    });

    // Create course_skills table (normalized skills)
    db.run(`
      CREATE TABLE IF NOT EXISTS course_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        skill TEXT NOT NULL,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(course_id, skill)
      )
    `, (err) => {
      if (err) console.error('Error creating course_skills table:', err.message);
      else console.log('Course Skills table checked/created.');
    });

    // Create index for course_skills
    db.run(`CREATE INDEX IF NOT EXISTS idx_course_skills_course_id ON course_skills(course_id)`, (err) => {
      if (err) console.error('Error creating index on course_skills.course_id:', err.message);
    });

    // Create enrolled_courses table
    db.run(`
      CREATE TABLE IF NOT EXISTS enrolled_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK(status IN ('in-progress', 'completed')) DEFAULT 'in-progress',
        progress INTEGER DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(user_id, course_id)
      )
    `, (err) => {
      if (err) console.error('Error creating enrolled_courses table:', err.message);
      else console.log('Enrolled Courses table checked/created.');
    });

    // Create indexes for enrolled_courses
    db.run(`CREATE INDEX IF NOT EXISTS idx_enrolled_courses_user_id ON enrolled_courses(user_id)`, (err) => {
      if (err) console.error('Error creating index on enrolled_courses.user_id:', err.message);
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_enrolled_courses_course_id ON enrolled_courses(course_id)`, (err) => {
      if (err) console.error('Error creating index on enrolled_courses.course_id:', err.message);
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_enrolled_courses_status ON enrolled_courses(user_id, status)`, (err) => {
      if (err) console.error('Error creating index on enrolled_courses.status:', err.message);
    });

    // Create saved_courses table
    db.run(`
      CREATE TABLE IF NOT EXISTS saved_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(user_id, course_id)
      )
    `, (err) => {
      if (err) console.error('Error creating saved_courses table:', err.message);
      else console.log('Saved Courses table checked/created.');
    });

    // Create indexes for saved_courses
    db.run(`CREATE INDEX IF NOT EXISTS idx_saved_courses_user_id ON saved_courses(user_id)`, (err) => {
      if (err) console.error('Error creating index on saved_courses.user_id:', err.message);
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_saved_courses_course_id ON saved_courses(course_id)`, (err) => {
      if (err) console.error('Error creating index on saved_courses.course_id:', err.message);
    });
  });
}

module.exports = db;