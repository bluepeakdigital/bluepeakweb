const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // ✅ force IPv4 first

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
