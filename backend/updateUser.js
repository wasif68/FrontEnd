const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('careeraidb.sqlite');

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Enter user email: ', (email) => {
  readline.question('Enter new password: ', async (password) => {
    const hashed = await bcrypt.hash(password, 10);

    db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashed, email],
      function(err) {
        if (err) console.error(err.message);
        else console.log(`Password updated for ${email}`);
        
        // close everything to exit
        db.close();
        readline.close();
        process.exit(0);  // force exit if needed
      }
    );
  });
});
