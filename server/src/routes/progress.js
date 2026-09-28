"use strict";

const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();

const VALID_CATEGORY_IDS = [
  "sumas",
  "restas",
  "multiplicaciones",
  "divisiones",
  "problemas",
];

router.use(requireAuth);

// GET /api/progress -> progreso de las 5 categorías para el usuario logueado.
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT category_id, completed, correct_count FROM category_progress WHERE user_id = ?",
      [req.user.id]
    );

    const byCategory = new Map(rows.map((row) => [row.category_id, row]));

    const progress = VALID_CATEGORY_IDS.map((categoryId) => {
      const row = byCategory.get(categoryId);
      return {
        categoryId,
        completed: Boolean(row && row.completed),
        correctCount: row ? row.correct_count : 0,
      };
    });

    return res.json({ progress });
  } catch (err) {
    console.error("Error en GET /api/progress:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// PUT /api/progress/:categoryId -> upsert del progreso de una categoría.
router.put("/:categoryId", async (req, res) => {
  const { categoryId } = req.params;
  const { completed, correctCount } = req.body || {};

  if (!VALID_CATEGORY_IDS.includes(categoryId)) {
    return res.status(400).json({ error: "Categoría desconocida." });
  }

  if (typeof completed !== "boolean" || !Number.isInteger(correctCount)) {
    return res.status(400).json({ error: "completed (bool) y correctCount (entero) son obligatorios." });
  }

  try {
    await pool.query(
      `INSERT INTO category_progress (user_id, category_id, completed, correct_count)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE completed = VALUES(completed), correct_count = VALUES(correct_count)`,
      [req.user.id, categoryId, completed ? 1 : 0, correctCount]
    );

    return res.json({ categoryId, completed, correctCount });
  } catch (err) {
    console.error("Error en PUT /api/progress/:categoryId:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// POST /api/progress/reset -> borra todo el progreso del usuario logueado.
router.post("/reset", async (req, res) => {
  try {
    await pool.query("DELETE FROM category_progress WHERE user_id = ?", [req.user.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /api/progress/reset:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
