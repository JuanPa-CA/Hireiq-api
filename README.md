# HireIQ API

API REST de entrevistas técnicas asistida por Gemini AI.  
Proyecto: PRJ-2025-HIREIQ-001 | TalentAI Corp

---

## Stack

Node.js · Express · MongoDB + Mongoose · JWT · Gemini AI · Swagger · Multer

---

## Requisitos

- Node.js v20+
- MongoDB (local o Atlas)
- Clave API de Google Gemini

---

## Instalación

```bash
git clone <repo>
cd hireiq-api
npm install
cp .env.example .env
# Completar las variables en .env
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3000) |
| `MONGO_URI` | URI de conexión a MongoDB |
| `JWT_SECRET` | Secreto para access tokens |
| `JWT_EXPIRES_IN` | Expiración del access token (ej: `15m`) |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token (ej: `7d`) |
| `GEMINI_KEY` | API Key de Google Gemini |
| `GEMINI_TIMEOUT_MS` | Timeout para llamadas a Gemini (default: 10000) |
| `UPLOAD_DIR` | Directorio de CVs (default: `uploads`) |
| `MAX_FILE_SIZE_BYTES` | Tamaño máximo de archivo (default: 5242880 = 5MB) |

---

## Scripts

```bash
# Desarrollo con hot-reload
npm run dev

# Producción
npm start

# Poblar base de datos con datos de prueba
npm run seed
```

Usuarios creados por el seed:

| Email | Password | Rol |
|---|---|---|
| admin@hireiq.com | Password123! | admin |
| juan@talentai.com | Password123! | empresa |
| candidato@gmail.com | Password123! | candidato |

---

## Documentación

Swagger UI disponible en: `http://localhost:3000/api-docs`

Healthcheck: `GET /health`

---

## Estructura

```
hireiq-api/
├── src/
│   ├── config/         # db, gemini, multer, swagger
│   ├── controllers/    # lógica de negocio por recurso
│   ├── middlewares/    # auth, validaciones, rateLimiter, errorHandler
│   ├── models/         # schemas de Mongoose
│   ├── routes/         # definición de endpoints y Swagger JSDoc
│   ├── utils/          # jwt, pagination, geminiPrompts
│   └── index.js        # punto de entrada
├── scripts/
│   └── seed.js         # datos de prueba
├── uploads/            # CVs (en .gitignore)
├── .env.example
└── package.json
```

---

## Endpoints principales

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/v1/auth/register` | Público |
| POST | `/api/v1/auth/login` | Público |
| GET | `/api/v1/positions` | Empresa |
| POST | `/api/v1/questions/generate-ai` | Empresa |
| POST | `/api/v1/sessions` | Empresa |
| POST | `/api/v1/answers` | Candidato |
| GET | `/api/v1/reports/session/:id` | Empresa / Candidato |

Ver listado completo en `/api-docs`.
