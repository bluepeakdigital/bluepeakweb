require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");

const app = express();

/**
 * ✅ CORS CONFIG (FIXED)
 */
const allowedOrigins = [
  "https://bluepeakweb.site",
  "https://www.bluepeakweb.site",
  "https://bluepeakweb.pages.dev",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow Postman, curl, server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked: " + origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));

// ✅ Always respond properly to preflight
app.options("*", cors());

/**
 * ✅ Body parser (REQUIRED)
 */
app.use(express.json());

/**
 * ✅ SAFETY FALLBACK
 * Ensures CORS headers are present even on errors
 */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

/**
 * ✅ Health check
 */
app.get("/", (req, res) => {
  res.send("BluePeak API running");
});

/**
 * ✅ Routes
 */
app.use("/auth", authRoutes);
app.use("/requests", requestRoutes);
app.use("/admin", adminRoutes);
app.use("/public", publicRoutes);

/**
 * ✅ Start server
 */
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`✅ API listening on port ${PORT}`);
});
