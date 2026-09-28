"use strict";

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "retomatematico",
  password: process.env.DB_PASSWORD || "retomatematico",
  database: process.env.DB_NAME || "retomatematico",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
