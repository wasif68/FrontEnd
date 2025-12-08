const db = require('./database');

const courses = [
  {
    title: "Full Stack Web Development",
    provider: "Tech Academy",
    location: "Online",
    description: "Learn to build dynamic web applications using React, Node.js, and databases. Covers frontend, backend, and deployment for real-world projects.",
    skills: ["React", "Node.js", "JavaScript", "SQL", "MongoDB", "Express"]
  },
  {
    title: "Data Science and Machine Learning",
    provider: "DataLab Institute",
    location: "Online",
    description: "Explore data analysis, visualization, and machine learning algorithms using Python and popular libraries. Apply models to solve practical problems.",
    skills: ["Python", "Machine Learning", "Data Analysis", "Pandas", "NumPy", "Scikit-learn"]
  },
  {
    title: "Mobile App Development with React Native",
    provider: "AppBuilders Academy",
    location: "Online",
    description: "Create cross-platform mobile applications for iOS and Android using React Native. Learn UI design, state management, and deployment.",
    skills: ["React Native", "JavaScript", "Mobile Development", "iOS", "Android", "Redux"]
  },
  {
    title: "Python Programming for Beginners",
    provider: "CodeStart Academy",
    location: "Online",
    description: "Master Python fundamentals, including data structures, control flow, and basic scripting. Ideal for aspiring developers and data enthusiasts.",
    skills: ["Python", "Programming Fundamentals", "Data Structures", "Algorithms", "OOP"]
  },
  {
    title: "Cybersecurity Essentials",
    provider: "SecureTech Learning",
    location: "Online",
    description: "Gain a strong foundation in cybersecurity principles, network security, and threat mitigation. Learn to protect systems and data in real-world scenarios.",
    skills: ["Cybersecurity", "Network Security", "Ethical Hacking", "Cryptography", "Security Protocols"]
  }
];

function seedCourses() {
  db.serialize(() => {
    // Check if courses already exist
    db.get('SELECT COUNT(*) as count FROM courses', (err, row) => {
      if (err) {
        console.error('Error checking courses:', err.message);
        return;
      }

      if (row.count > 0) {
        console.log('Courses already seeded. Skipping...');
        return;
      }

      console.log('Seeding courses...');
      const stmt = db.prepare('INSERT INTO courses (title, provider, location, description) VALUES (?, ?, ?, ?)');
      const skillStmt = db.prepare('INSERT INTO course_skills (course_id, skill) VALUES (?, ?)');

      courses.forEach((course, index) => {
        stmt.run([course.title, course.provider, course.location, course.description], function(err) {
          if (err) {
            console.error(`Error inserting course ${course.title}:`, err.message);
            return;
          }

          const courseId = this.lastID;
          console.log(`Inserted course: ${course.title} (ID: ${courseId})`);

          // Insert skills for this course
          course.skills.forEach((skill) => {
            skillStmt.run([courseId, skill], (err) => {
              if (err) {
                console.error(`Error inserting skill ${skill} for course ${courseId}:`, err.message);
              }
            });
          });
        });
      });

      stmt.finalize();
      skillStmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing skill statement:', err.message);
        } else {
          console.log('Courses and skills seeded successfully!');
        }
      });
    });
  });
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCourses();
  setTimeout(() => {
    db.close();
  }, 2000);
}

module.exports = seedCourses;

