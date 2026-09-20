const db = require("../db");
const { hashPassword, isScryptHash } = require("../utils/password");

async function migratePasswords() {
  const pool = db.promise();
  const connection = await pool.getConnection();
  let migrated = 0;

  try {
    const [users] = await connection.execute("SELECT id, password FROM users ORDER BY id");
    const legacyUsers = users.filter((user) => !isScryptHash(user.password));
    const replacements = [];
    for (const user of legacyUsers) {
      replacements.push({ id: user.id, oldValue: user.password, newValue: await hashPassword(user.password) });
    }

    await connection.beginTransaction();
    for (const replacement of replacements) {
      const [result] = await connection.execute(
        "UPDATE users SET password = ? WHERE id = ? AND password = ?",
        [replacement.newValue, replacement.id, replacement.oldValue],
      );
      migrated += result.affectedRows;
    }
    await connection.commit();
    console.log(`Password migration completed. Migrated: ${migrated}; already secure: ${users.length - legacyUsers.length}.`);
  } catch (error) {
    await connection.rollback();
    console.error("Password migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

migratePasswords();
