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

// Orígenes permitidos para CORS. En producción el frontend vive en Vercel
// (dominio distinto al backend), así que ya no basta con "mismo origen".
// CORS_ORIGIN admite una lista separada por comas; por defecto se permite
// el frontend de Vercel y localhost para desarrollo.
const DEFAULT_ORIGINS = [
  "https://01-doulingo-math.vercel.app",
  "http://localhost:4320",
  "http://localhost:3000",
];
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || DEFAULT_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Permite requests sin header Origin (curl, health checks, mismo origen).
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);
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
