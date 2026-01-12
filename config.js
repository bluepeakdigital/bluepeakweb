// config.js (frontend root)
window.BP_API_BASE = "https://bluepeakweb.onrender.com";

// App always uses this cleaned API value (no trailing slash)
window.BP_API = window.BP_API_BASE.replace(/\/$/, "");

// Supabase public keys (safe to expose)
window.SUPABASE_URL = "https://wgpswmhjsgiiqrondoxv.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndncHN3bWhqc2dpaXFyb25kb3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMjY0OTUsImV4cCI6MjA4MTkwMjQ5NX0.mG3Vknc6IkUUuzEWFrPSwYLeSCwBPxPCAijWzKAxRww";
