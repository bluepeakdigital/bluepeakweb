const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { full_name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {
    const exists = await pool.query("select id from users where email=$1", [
      email.toLowerCase(),
    ]);
    if (exists.rows.length) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 12);

    const created = await pool.query(
      "insert into users (full_name,email,password_hash,role) values ($1,$2,$3,'customer') returning id,email,role",
      [full_name || "", email.toLowerCase(), hash]
    );

    res.json({ ok: true, user: created.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {
    const userRes = await pool.query(
      "select id,email,password_hash,role,full_name from users where email=$1",
      [email.toLowerCase()]
    );
    if (!userRes.rows.length) {
      return res.status(401).json({ ok: false, error: "Invalid login" });
    }

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "Invalid login" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name || "" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ ok: true, token, role: user.role, name: user.full_name || "" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
