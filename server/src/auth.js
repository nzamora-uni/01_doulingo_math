"use strict";

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "cambia-este-secreto-en-produccion";
const JWT_EXPIRES_IN = "7d";

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autenticado." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o vencido." });
  }
}

module.exports = { signToken, requireAuth };
