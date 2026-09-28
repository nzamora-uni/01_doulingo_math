# 01_doulingo_math

Dou Matemático / Reto Matemático — juego educativo de matemáticas (HTML/CSS/JS
vanilla) con mapa de lecciones tipo Duolingo, más un backend (Node.js +
Express + MySQL) que agrega login y guarda el progreso por usuario. Ver
`PLAN.md` para el detalle del diseño (esquema de base de datos, flujo de
autenticación, endpoints).

## Cómo levantarlo en local

### 1. Base de datos MySQL (Docker Compose)

```bash
docker compose up -d
```

Levanta MySQL 8 en el puerto **3306** del host, crea las tablas (`users`,
`category_progress`) y siembra el usuario de prueba `Testor` / `7654321`
automáticamente (vía `server/db/init.sql`, montado en
`docker-entrypoint-initdb.d`). Si el volumen ya existía de una corrida
previa sin ese seed, corre el seed idempotente manualmente:

```bash
cd server && npm run seed
```

### 2. Backend (Express)

```bash
cd server
npm install
cp .env.example .env   # ajusta si cambiaste algo del docker-compose
npm start
```

Variables de entorno (`server/.env`, ver `server/.env.example`):

- `PORT` — puerto del backend (por defecto `4320`).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — conexión a
  MySQL (deben coincidir con `docker-compose.yml`).
- `JWT_SECRET` — secreto para firmar los tokens de sesión.

### 3. Frontend

El backend ya sirve el frontend estático (`index.html`, `css/`, `js/`)
desde la raíz del repo, en el mismo puerto. Con el backend corriendo,
abre:

```
http://localhost:4320
```

No hace falta un servidor estático aparte ni configurar CORS (mismo
origen para frontend y API).

### 4. Usar el juego

En la pantalla de login usa el usuario de prueba visible en pantalla:
**Testor / 7654321**. El progreso (categorías completadas) se guarda en
MySQL y persiste entre sesiones/logins.
