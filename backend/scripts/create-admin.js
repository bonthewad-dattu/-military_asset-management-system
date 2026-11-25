import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

const username = process.env.ADMIN_USERNAME?.trim();
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD to create an admin.");
  process.exitCode = 1;
} else if (password.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exitCode = 1;
} else {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'ADMIN') RETURNING id, username",
      [username, passwordHash],
    );
    console.log(`Created admin account "${result.rows[0].username}".`);
  } catch (error) {
    console.error("Could not create admin account:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
