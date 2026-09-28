"use strict";

// Seed idempotente del usuario de prueba (Testor / 7654321). Útil si la
// base de datos ya existía sin el init.sql de Docker, o para reseeding
// manual: `npm run seed` dentro de server/.
require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("../src/db");

async function main() {
  const username = "Testor";
  const password = "7654321";
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [username, passwordHash]
  );

  console.log(`Usuario de prueba "${username}" sembrado/actualizado correctamente.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error al sembrar el usuario de prueba:", err);
  process.exit(1);
});
