require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const requestRoutes = require("./routes/requests");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BluePeak API running");
});

app.use("/auth", authRoutes);
app.use("/requests", requestRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`✅ API listening on port ${PORT}`);
});
