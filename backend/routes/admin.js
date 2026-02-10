/**
 * Admin: view contact form submissions
 */
router.get("/contacts", auth, adminOnly, async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT * FROM contact_submissions ORDER BY created_at DESC`
    );
    res.json({ ok: true, contacts: rows.rows });
  } catch (e) {
    console.error("ADMIN CONTACTS ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});
const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");

const router = express.Router();

/**
 * ✅ Admin: see all requests
 */
router.get("/requests", auth, adminOnly, async (req, res) => {
  try {
    const rows = await pool.query(
      `select r.*, u.email, u.full_name
       from service_requests r
       join users u on u.id = r.user_id
       order by r.created_at desc`
    );
    res.json({ ok: true, requests: rows.rows });
  } catch (e) {
    console.error("ADMIN REQUESTS ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * ✅ Admin: update request status
 */
router.patch("/requests/:id", auth, adminOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ["new", "in_progress", "done", "rejected"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ ok: false, error: "Invalid status" });
  }

  try {
    await pool.query("update service_requests set status=$1 where id=$2", [
      status,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN UPDATE STATUS ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * ✅ Admin: view users (SAFE fields only)
 * Passwords are NEVER shown. password_hash is not selected.
 */
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const rows = await pool.query(
      `select id, full_name, email, phone, company, role, created_at, created_via
       from users
       order by created_at desc`
    );
    res.json({ ok: true, users: rows.rows });
  } catch (e) {
    console.error("ADMIN USERS ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * ✅ Admin: read editable site content
 */
router.get("/content", auth, adminOnly, async (req, res) => {
  try {
    const rows = await pool.query("select key,value from site_content");
    res.json({ ok: true, content: rows.rows });
  } catch (e) {
    console.error("ADMIN CONTENT GET ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/**
 * ✅ Admin: update editable site content
 */
router.put("/content", auth, adminOnly, async (req, res) => {
  const { key, value } = req.body;

  if (!key || value == null) {
    return res.status(400).json({ ok: false, error: "Missing fields" });
  }

  try {
    await pool.query(
      `insert into site_content(key,value,updated_at)
       values($1,$2,now())
       on conflict (key) do update
       set value=excluded.value, updated_at=now()`,
      [key, String(value)]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN CONTENT PUT ERROR:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
