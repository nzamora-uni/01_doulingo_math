# Plan de implementación

## Fase 1 (hackatón original) — juego sin backend

Objetivo: juego educativo de 20 preguntas con puntuación, vidas y resultado final.

1. Preparar un arreglo con 20 preguntas y cuatro opciones cada una.
2. Mostrar una pregunta, sus opciones y el contador de avance.
3. Validar la respuesta y dar retroalimentación visual.
4. Actualizar puntuación y vidas.
5. Pasar a la siguiente pregunta sin repetir preguntas.
6. Mostrar resultado al terminar o perder todas las vidas.
7. Implementar reinicio completo del juego.

Extras agregados después: mapa de lecciones tipo Duolingo con 5 categorías
(Sumas, Restas, Multiplicaciones, Divisiones, Problemas), vidas por ronda
(por categoría) y resultado consolidado sobre las 20 preguntas.

Definición de terminado de esta fase: las 20 preguntas son diferentes,
tienen una sola respuesta correcta y el porcentaje final se calcula bien.
**Cumplida.**

> Nota histórica: `AGENTS.md`/`README.md` originales del hackatón indicaban
> "no backend, no base de datos, no cuentas de usuario" como restricción del
> reto inicial. Esa restricción quedó superada por la Fase 2, pedida
> explícitamente por el dueño del proyecto: login real + persistencia en
> base de datos. `AGENTS.md` fue actualizado para reflejar este cambio de
> alcance.

## Fase 2 (esta iteración) — login + persistencia en MySQL

### Objetivo

Agregar autenticación de usuarios y guardar su progreso (categorías
completadas y aciertos acumulados) en una base de datos MySQL real, para
que persista entre sesiones. Se incluye un usuario de prueba (`Testor` /
`7654321`) visible como hint en la pantalla de login.

### Mapeo de "opciones del proyecto" → datos concretos

Este juego no tiene "opciones de configuración" tipo ajustes; lo que se
interpreta como "las opciones del proyecto a guardar por usuario" es el
**progreso de juego por categoría**, que es el único estado relevante y
persistente del reto:

- Qué categorías (de las 5) están completadas.
- Cuántos aciertos logró el usuario en el intento con el que completó cada
  categoría (para reconstruir el acumulado global sobre 20 preguntas).

No se guarda el detalle pregunta-por-pregunta (no es necesario para la
mecánica del juego: cada ronda se juega completa de nuevo si se reintenta),
solo el resultado consolidado por categoría, que es exactamente lo que ya
vivía en `categoryProgress` en memoria y ahora se persiste en MySQL.

### Esquema de base de datos (MySQL 8)

Base de datos: `retomatematico`.

```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE category_progress (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  category_id   VARCHAR(30) NOT NULL,   -- 'sumas' | 'restas' | 'multiplicaciones' | 'divisiones' | 'problemas'
  completed     TINYINT(1) NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0, -- aciertos del intento con el que se completó (0-4)
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_category (user_id, category_id),
  CONSTRAINT fk_category_progress_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`password_hash` guarda un hash `bcrypt` (nunca texto plano). El usuario de
prueba `Testor` / `7654321` se siembra en el arranque de la base (script
`server/db/init.sql`, montado en `docker-entrypoint-initdb.d`) con su hash
ya calculado, y de forma idempotente también vía `server/scripts/seed.js`.

### Flujo de autenticación

- `POST /api/auth/login` recibe `{ username, password }`, busca el usuario,
  compara la contraseña con `bcrypt.compare` contra `password_hash`, y si
  es válida firma un **JWT** (`jsonwebtoken`, secreto `JWT_SECRET` desde
  variable de entorno, expiración 7 días) con `{ sub: userId, username }`.
- El frontend guarda el token en `localStorage` (`retomatematico_token`) y
  lo manda en cada llamada a la API como header `Authorization: Bearer <token>`.
  No se usan cookies de sesión: el backend es *stateless*, no guarda
  sesiones en memoria ni en base de datos, solo verifica la firma del JWT
  en cada request.
- Middleware `requireAuth` en el backend valida el JWT en todas las rutas
  de `/api/progress/*`; si falta o es inválido responde `401`.
- Protección de la ruta del juego (frontend): al cargar `index.html`, el JS
  revisa si hay un token guardado. Si no hay, muestra la pantalla de login
  y oculta mapa/juego/resultado. Si hay token, intenta `GET /api/progress`;
  si el backend responde `401` (token vencido/inválido), borra el token y
  vuelve a mostrar login. Solo con un `GET /api/progress` exitoso se
  renderiza el mapa de lecciones con el progreso ya cargado.
- No hay registro público de usuarios en esta fase (solo se pidió login +
  usuario de prueba); se puede agregar `POST /api/auth/register` después
  si se necesita, pero no es parte de este alcance.

### Endpoints del backend

Todos bajo `server/` (Express), sirviendo también el frontend estático
(mismo origen, sin problemas de CORS):

| Método | Ruta                        | Auth | Descripción |
|--------|-----------------------------|------|-------------|
| POST   | `/api/auth/login`           | No   | Verifica usuario/contraseña, devuelve `{ token, username }`. |
| GET    | `/api/progress`             | Sí   | Devuelve el progreso del usuario logueado: `[{ categoryId, completed, correctCount }]` para las 5 categorías (las no jugadas vienen con `completed:false, correctCount:0`). |
| PUT    | `/api/progress/:categoryId` | Sí   | Upsert del progreso de una categoría: `{ completed, correctCount }`. Se llama justo cuando el jugador termina una ronda completa (gane o pierda). |
| POST   | `/api/progress/reset`       | Sí   | Reinicia (borra) el progreso del usuario logueado; usado por el botón "Reiniciar todo". |
| GET    | `/api/health`               | No   | Chequeo simple de vida del backend + conexión a MySQL (usado también como referencia de diagnóstico manual). |

### Arquitectura

- `server/` — Node.js + Express, `package.json` propio.
  - `mysql2` como driver de MySQL (pool de conexiones).
  - `bcrypt` para hash/verify de contraseñas.
  - `jsonwebtoken` para el token de sesión.
  - `dotenv` para variables de entorno.
  - Sirve el frontend estático (`express.static` apuntando a la raíz del
    repo) además de la API, todo en un solo puerto (`PORT`, por defecto
    `4320`) — evita configurar CORS.
- MySQL vía Docker Compose, `docker-compose.yml` en la raíz del repo:
  imagen `mysql:8`, puerto **3306** del host (exclusivo de este proyecto;
  el proyecto `01_reproductor_musical` usa 3307 en paralelo), variables
  `MYSQL_ROOT_PASSWORD` / `MYSQL_DATABASE` / `MYSQL_USER` /
  `MYSQL_PASSWORD`, volumen nombrado para persistir datos entre reinicios,
  y `healthcheck` con `mysqladmin ping`. Sigue el mismo patrón que el
  `docker-compose.yml` de Postgres usado en otros proyectos de este
  entorno (un solo servicio, variables de entorno explícitas, healthcheck),
  adaptado a MySQL.
- `server/db/init.sql` se monta en `/docker-entrypoint-initdb.d/` para
  crear el esquema y sembrar `Testor` en el primer arranque del contenedor.
- `server/scripts/seed.js` reproduce el mismo seed de forma idempotente
  (por si la base ya existía sin el usuario, o para reseeding manual).

### Frontend

- Nueva pantalla `#login-screen` en `index.html`, antes del mapa, con
  formulario usuario/contraseña, mensaje de error y el hint fijo
  "Usuario de prueba: `Testor` / `7654321`".
- `js/app.js` agrega: `API_BASE`, manejo de token en `localStorage`,
  `login()`, `logout()`, `loadProgressFromServer()`, y llamadas a
  `PUT /api/progress/:categoryId` al completar una ronda y a
  `POST /api/progress/reset` al pulsar "Reiniciar todo". El mapa se sigue
  renderizando igual que antes (`renderMap()`), solo que `categoryProgress`
  ahora se llena desde la respuesta del backend en vez de arrancar siempre
  en ceros.
- Botón "Cerrar sesión" visible junto al mapa para volver a la pantalla de
  login sin perder el progreso (que ya vive en MySQL).

### Commits (orden obligatorio)

1. Este `PLAN.md` actualizado (commit propio, antes de tocar código).
2. Backend + Docker Compose (esquema, endpoints, seed).
3. Frontend (login + integración con la API).
4. Fixes posteriores a la verificación con Playwright, si aplica.
