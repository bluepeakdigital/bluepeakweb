// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

/**
 * DEBUG ROUTES (temporary)
 * These help confirm you're hitting the Render backend.
 */
router.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "auth route is reachable" });
});

router.get("/signup", (req, res) => {
  // This is ONLY for debugging. Signup itself must remain POST.
  res.json({ ok: true, msg: "GET /auth/signup reachable (debug)" });
});

/**
 * SIGNUP (POST)
 */
router.post("/signup", async (req, res) => {
  const { full_name, email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [
      String(email).toLowerCase(),
    ]);

    if (exists.rows.length) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    const hash = await bcrypt.hash(String(password), 12);

    const created = await pool.query(
      "INSERT INTO users (full_name,email,password_hash,role) VALUES ($1,$2,$3,'customer') RETURNING id,email,role",
      [full_name || "", String(email).toLowerCase(), hash]
    );

    return res.json({ ok: true, user: created.rows[0] });
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * LOGIN (POST)
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {
    const userRes = await pool.query(
      "SELECT id,email,password_hash,role,full_name FROM users WHERE email=$1",
      [String(email).toLowerCase()]
    );

    if (!userRes.rows.length) {
      return res.status(401).json({ ok: false, error: "Invalid login" });
    }

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);

    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid login" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing in environment variables");
      return res.status(500).json({ ok: false, error: "Server misconfigured" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name || "" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({ ok: true, token, role: user.role, name: user.full_name || "" });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
