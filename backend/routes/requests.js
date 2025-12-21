const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// customer creates a service request
router.post("/", auth, async (req, res) => {
  const { service_type, title, details, budget_min, budget_max, deadline, phone } = req.body;

  if (!service_type || !title || !details) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    const created = await pool.query(
      `insert into service_requests
       (user_id,service_type,title,details,budget_min,budget_max,deadline,phone,status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'new')
       returning id`,
      [
        req.user.id,
        service_type,
        title,
        details,
        budget_min ?? null,
        budget_max ?? null,
        deadline || null,
        phone || null,
      ]
    );

    res.json({ ok: true, id: created.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// customer views their own requests
router.get("/mine", auth, async (req, res) => {
  try {
    const rows = await pool.query(
      "select * from service_requests where user_id=$1 order by created_at desc",
      [req.user.id]
    );
    res.json({ ok: true, requests: rows.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
