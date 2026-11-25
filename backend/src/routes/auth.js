import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, role, baseId } = req.body;
    if (!username || !password || !role)
      return res
        .status(400)
        .json({ message: "Username, password and role are required." });
    if (!["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"].includes(role))
      return res.status(400).json({ message: "Invalid role." });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, role, base_id) VALUES ($1, $2, $3, $4) RETURNING id, username, role, base_id",
      [username, passwordHash, role, baseId || null],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res
      .status(400)
      .json({
        message:
          error.code === "23505"
            ? "Username already exists."
            : "Could not create user.",
      });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password || "", user.password_hash))) {
      return res.status(401).json({ message: "Invalid username or password." });
    }
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      baseId: user.base_id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({ token, user: payload });
  } catch {
    res.status(500).json({ message: "Login failed." });
  }
});

export default router;
