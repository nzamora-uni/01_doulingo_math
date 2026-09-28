"use strict";

const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { signToken } = require("../auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    const user = rows[0];
    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    const token = signToken(user);
    return res.json({ token, username: user.username });
  } catch (err) {
    console.error("Error en /api/auth/login:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
