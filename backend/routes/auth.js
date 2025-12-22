const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { createClient } = require("@supabase/supabase-js");
const pool = require("../db");

const router = express.Router();

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Full name too short").max(80, "Full name too long"),
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().min(7, "Phone too short").max(20, "Phone too long"),
  company: z.string().trim().max(80, "Company too long").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password too long"),
  agree: z.boolean().refine(v => v === true, "You must agree to terms")
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password required")
});

// Stronger password rule (letters + numbers)
function passwordStrongEnough(pw) {
  return /[A-Za-z]/.test(pw) && /\d/.test(pw);
}

function signAppJwt(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing");
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.full_name || "" },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

// Debug route
router.get("/ping", (req, res) => res.json({ ok: true, msg: "auth route reachable" }));

// EMAIL/PASSWORD SIGNUP
router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message || "Invalid signup data",
      issues: parsed.error.issues
    });
  }

  const { full_name, email, phone, company, password } = parsed.data;

  if (!passwordStrongEnough(password)) {
    return res.status(400).json({ ok: false, error: "Password must contain letters and numbers" });
  }

  try {
    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [email.toLowerCase()]);
    if (exists.rows.length) {
      return res.status(409).json({ ok: false, error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 12);

    const created = await pool.query(
      `INSERT INTO users (full_name,email,password_hash,role,phone,company,created_via)
       VALUES ($1,$2,$3,'customer',$4,$5,'email')
       RETURNING id,email,role,full_name,phone,company`,
      [full_name, email.toLowerCase(), hash, phone, company || null]
    );

    return res.json({ ok: true, user: created.rows[0] });
  } catch (e) {
    console.error("SIGNUP ERROR:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// EMAIL/PASSWORD LOGIN
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid login data" });
  }

  const { email, password } = parsed.data;

  try {
    const userRes = await pool.query(
      "SELECT id,email,password_hash,role,full_name FROM users WHERE email=$1",
      [email.toLowerCase()]
    );
    if (!userRes.rows.length) return res.status(401).json({ ok: false, error: "Invalid login" });

    const user = userRes.rows[0];

    // Google-only accounts have no password_hash
    if (!user.password_hash) {
      return res.status(401).json({ ok: false, error: "Use Google sign-in for this account" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid login" });

    const token = signAppJwt(user);
    return res.json({ ok: true, token, role: user.role, name: user.full_name || "" });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// GOOGLE SIGN-IN (Supabase OAuth token -> upsert user -> issue your JWT)
router.post("/google", async (req, res) => {
  const schema = z.object({ access_token: z.string().min(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "Missing access_token" });

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ ok: false, error: "Server misconfigured (Supabase keys missing)" });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Validate token and fetch Google user
    const { data, error } = await supabaseAdmin.auth.getUser(parsed.data.access_token);
    if (error || !data?.user) {
      return res.status(401).json({ ok: false, error: "Invalid Google session" });
    }

    const u = data.user;
    const email = (u.email || "").toLowerCase();
    const googleSub = u.id; // Supabase Auth user id
    const name = (u.user_metadata?.full_name || u.user_metadata?.name || "").trim() || "Google User";

    // Upsert into your users table
    const existing = await pool.query("SELECT id,email,role,full_name FROM users WHERE email=$1", [email]);

    let appUser;
    if (existing.rows.length) {
      // Link google_sub if missing
      const updated = await pool.query(
        `UPDATE users
         SET google_sub = COALESCE(google_sub, $1),
             created_via = CASE WHEN created_via IS NULL THEN 'google' ELSE created_via END
         WHERE email=$2
         RETURNING id,email,role,full_name`,
        [googleSub, email]
      );
      appUser = updated.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO users (full_name,email,password_hash,role,phone,company,google_sub,created_via)
         VALUES ($1,$2,NULL,'customer',NULL,NULL,$3,'google')
         RETURNING id,email,role,full_name`,
        [name, email, googleSub]
      );
      appUser = inserted.rows[0];
    }

    const token = signAppJwt(appUser);
    return res.json({ ok: true, token, role: appUser.role, name: appUser.full_name || "" });
  } catch (e) {
    console.error("GOOGLE AUTH ERROR:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
