"use strict";

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const authRoutes = require("./routes/auth");
const progressRoutes = require("./routes/progress");

const app = express();
const PORT = Number(process.env.PORT || 4320);
const REPO_ROOT = path.join(__dirname, "..", "..");

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, db: "up" });
  } catch (err) {
    return res.status(500).json({ ok: false, db: "down", error: String(err.message || err) });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);

// Sirve el frontend estático (index.html, css/, js/) desde la raíz del repo.
app.use(express.static(REPO_ROOT));

app.listen(PORT, () => {
  console.log(`Reto Matemático backend escuchando en http://localhost:${PORT}`);
});
