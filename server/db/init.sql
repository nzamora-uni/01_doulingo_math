-- Esquema de Reto Matemático (fase 2: login + progreso persistido).
-- Se ejecuta automáticamente al primer arranque del contenedor MySQL
-- (montado en /docker-entrypoint-initdb.d/) contra la base MYSQL_DATABASE.

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS category_progress (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  category_id   VARCHAR(30) NOT NULL,
  completed     TINYINT(1) NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_category (user_id, category_id),
  CONSTRAINT fk_category_progress_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Usuario de prueba: Testor / 7654321 (hash bcrypt, costo 10).
-- El hash de abajo corresponde exactamente a la contraseña "7654321";
-- se generó una sola vez con bcrypt y se deja fijo aquí para que el
-- seed sea reproducible en cualquier máquina.
INSERT INTO users (username, password_hash)
VALUES ('Testor', '$2b$10$J58fXWRpfEurD/23fhjQN.TLb.GRWS6QaFlCSSS/CAmz5.Ld8daUm')
ON DUPLICATE KEY UPDATE username = username;
