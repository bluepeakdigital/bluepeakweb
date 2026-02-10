// Public (unauthenticated) routes for things like contact form
const express = require("express");
const pool = require("../db");
const router = express.Router();

// POST /public/contact — store contact form submissions
router.post("/contact", async (req, res) => {
  const { name, contact, service, message } = req.body;
  if (!name || !contact || !service || !message) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }
  try {
    await pool.query(
      `INSERT INTO contact_submissions (name, contact, service, message, created_at) VALUES ($1, $2, $3, $4, NOW())`,
      [name, contact, service, message]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("CONTACT FORM ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
