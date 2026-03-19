# HireIQ — Contexto del Proyecto para Gemini CLI
> Proyecto: PRJ-2025-HIREIQ-001 | TalentAI Corp | v1.0

---

## Descripción del sistema

API REST de entrevistas técnicas con IA. Permite a empresas crear bancos de preguntas, invitar candidatos a sesiones de entrevista y recibir evaluaciones automáticas generadas por Gemini AI. **Solo backend** — el frontend es responsabilidad de un equipo externo.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js (v20+) |
| Framework | Express |
| Base de datos | MongoDB + Mongoose (ODM) |
| Autenticación | JWT (access token + refresh token) |
| IA | Gemini AI (Google) |
| Archivos | Multer |
| Documentación | Swagger UI en `/api-docs` |
| Logs | Morgan |
| Validaciones | express-validator |

---

## Estructura de carpetas

```
hireiq-api/
├── src/
│   ├── config/         # db.js, multer.js, swagger.js, gemini.js
│   ├── controllers/    # authController, companyController, questionController...
│   ├── middlewares/    # auth.js, validaciones.js, rateLimiter.js, errorHandler.js
│   ├── models/         # Company.js, User.js, JobPosition.js, Question.js, Session.js...
│   ├── routes/         # authRoutes.js, companyRoutes.js, sessionRoutes.js...
│   ├── utils/          # jwt.js, geminiPrompts.js, pagination.js
│   └── index.js
├── uploads/            # CVs (en .gitignore)
├── scripts/            # seed.js
├── .env.example
└── package.json
```

---

## Colecciones MongoDB (Mongoose Schemas)

### companies
```
_id, nombre (req), email_contacto (req, unique), plan (enum: free|pro|enterprise, default: free),
activa (default: true), createdAt, updatedAt
```

### users
```
_id, company_id (ref: Company, null para admin), nombre (req), email (req, unique, lowercase),
password (req, min 8, select: false), rol (enum: admin|empresa|candidato, req),
activo (default: true), createdAt, updatedAt
```

### job_positions
```
_id, company_id (ref: Company, req), titulo (req), nivel (enum: junior|mid|senior, req),
tecnologias ([String], default: []), descripcion (null), activo (default: true), createdAt, updatedAt
```

### questions
```
_id, company_id (ref: Company, req), position_id (ref: JobPosition, req), pregunta (req),
categoria (req), dificultad (enum: facil|medio|dificil, req),
generada_por_ia (default: false), activa (default: true), createdAt, updatedAt
```

### interview_sessions
```
_id, candidate_id (ref: User, req), position_id (ref: JobPosition, req),
preguntas ([ref: Question], default: []),
estado (enum: pendiente|en_curso|completada|expirada),
puntaje_total (0-10, default: null), token_acceso (unique, uuid v4),
fecha_inicio (null), fecha_fin (null), fecha_expiracion (req, +72h), createdAt, updatedAt
```

### answers
```
_id, session_id (ref: InterviewSession, req), question_id (ref: Question, req),
respuesta_texto (req), puntaje_ia (0-10, null), 
feedback_ia: { fortalezas: [String], debilidades: [String], feedback: String },
tokens_usados (default: 0), createdAt, updatedAt
```

### cv_files
```
_id, candidate_id (ref: User, req, unique), filename (req), original_name (req),
mime_type (enum: application/pdf|image/jpeg|image/png, req),
size_bytes (req, max: 5242880), createdAt, updatedAt
```

---

## Reglas de Mongoose — siempre aplicar

- Todos los schemas con `{ timestamps: true }`.
- `password` siempre con `select: false`. Para buscarlo explícitamente: `.select('+password')`.
- Soft delete con campo `activo: Boolean`. **Todo query de listado filtra `{ activo: true }` por defecto**.
- Usar `populate()` solo cuando sea estrictamente necesario para no impactar performance.
- MongoDB NO garantiza integridad referencial — verificar existencia de documentos referenciados en el controlador antes de crear.
- Índices requeridos: `email` (unique), `company_id`, `position_id`, `token_acceso` (unique), `estado`.

---

## Roles y acceso

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total a todos los recursos |
| `empresa` | Solo recursos de su propio `company_id` |
| `candidato` | Solo sesiones donde `candidate_id === su id` |
| Público | Solo puede registrarse, sin acceso a recursos protegidos |

---

## Todos los endpoints (prefijo: `/api/v1/`)

### Auth — `/auth`
```
POST   /auth/register           Público
POST   /auth/login              Público
POST   /auth/refresh            Autenticado
POST   /auth/logout             Autenticado
GET    /auth/me                 Autenticado
PUT    /auth/change-password    Autenticado
```

### Companies — `/companies`
```
GET    /companies               Admin
GET    /companies/:id           Admin | Empresa propia
POST   /companies               Admin
PUT    /companies/:id           Admin | Empresa propia
DELETE /companies/:id           Admin  (soft delete)
```

### Positions — `/positions`
```
GET    /positions               Empresa
GET    /positions/:id           Empresa propia
POST   /positions               Empresa
PUT    /positions/:id           Empresa propia
DELETE /positions/:id           Empresa propia (soft delete)
```

### Questions — `/questions`
```
GET    /questions               Empresa (filtros: cargo, categoría, dificultad)
GET    /questions/:id           Empresa propia
POST   /questions               Empresa (manual)
PUT    /questions/:id           Empresa propia
DELETE /questions/:id           Empresa propia (soft delete)
POST   /questions/generate-ai   Empresa (Gemini genera N preguntas)
POST   /questions/suggest-category  Empresa (Gemini sugiere categoría)
```

### Sessions — `/sessions`
```
GET    /sessions                     Empresa (filtros: estado, cargo, fecha)
GET    /sessions/:id                 Empresa | Candidato propio
POST   /sessions                     Empresa
PUT    /sessions/:id/status          Empresa
GET    /sessions/token/:token        Público (valida token de candidato)
POST   /sessions/:id/start           Candidato propio
POST   /sessions/:id/complete        Candidato propio
```

### Answers — `/answers`
```
POST   /answers                      Candidato (dispara evaluación Gemini automáticamente)
PUT    /answers/:id                  Candidato propio (solo si sesión en_curso)
GET    /answers/session/:sessionId   Empresa | Candidato propio
POST   /answers/:id/evaluate         Sistema / Admin (re-evaluación forzada)
```

### Reports — `/reports`
```
GET    /reports/session/:id              Empresa | Candidato propio
GET    /reports/company/summary          Empresa
GET    /reports/candidate/:id            Empresa | Admin
GET    /reports/position/:id/insights    Empresa (Gemini analiza patrones)
```

### Files — `/files`
```
POST   /files/cv              Candidato (PDF o imagen, máx 5 MB)
GET    /files/cv/:candidateId Empresa | Candidato propio
DELETE /files/cv              Candidato
```

---

## Máquina de estados — InterviewSession

```
pendiente  ──(candidato accede con token)──► en_curso
pendiente  ──(empresa cancela)─────────────► expirada
pendiente  ──(pasa fecha_expiracion)────────► expirada  [cron/sistema]
en_curso   ──(candidato completa)───────────► completada
en_curso   ──(empresa cancela, caso excepcional)──► expirada
completada ── Estado final, no modificable
expirada   ── Estado final, no modificable
```

Cualquier transición no permitida → HTTP 422 con mensaje descriptivo.
Los reportes con datos de IA solo se entregan si `estado === 'completada'`.

---

## Integración Gemini AI

### Prompt: Generación de preguntas (`POST /questions/generate-ai`)
```
Eres un experto en evaluación técnica de desarrolladores de software.
Genera exactamente {cantidad} preguntas de entrevista técnica para el cargo de {titulo_cargo}.
Nivel requerido: {nivel}. Tecnologías principales: {tecnologias}.
Dificultad solicitada: {dificultad}. Categoría: {categoria}.
Responde ÚNICAMENTE con un JSON válido con esta estructura:
{ "preguntas": [{ "pregunta": "...", "categoria": "...", "dificultad": "..." }] }.
Sin texto adicional.
```

### Prompt: Evaluación de respuesta (`POST /answers` — automático)
```
Eres un evaluador técnico senior especializado en entrevistas de desarrollo de software.
Evalúa la siguiente respuesta de un candidato:
CARGO: {titulo_cargo} ({nivel}) | TECNOLOGÍAS: {tecnologias} | DIFICULTAD: {dificultad}
PREGUNTA: {pregunta}
RESPUESTA DEL CANDIDATO: {respuesta}
Responde ÚNICAMENTE con JSON:
{ "puntaje": 0-10, "fortalezas": ["..."], "debilidades": ["..."], "feedback": "máx 300 palabras" }
```

### Reglas de integración
- Timeout de Gemini: **10 segundos**. Si supera el límite → guardar con `puntaje_ia: null` y re-encolar.
- Siempre registrar `tokens_usados` para monitoreo de costos.
- **No exponer el feedback de Gemini al candidato mientras la sesión esté `en_curso`.**
- El campo `puntaje_ia` debe estar en el rango `[0.00, 10.00]`.

---

## Contrato de respuesta API — no romper este formato

### Éxito
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { },
  "meta": { "page": 1, "total": 50, "per_page": 10 }
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [{ "field": "email", "msg": "Email inválido" }],
  "code": "VALIDATION_ERROR"
}
```

### Códigos HTTP
| Código | Cuándo usarlo |
|--------|--------------|
| 200 | GET, PUT exitoso |
| 201 | POST — recurso creado |
| 204 | DELETE exitoso |
| 400 | Datos inválidos (express-validator) |
| 401 | Token ausente, malformado o expirado |
| 403 | Rol sin permiso |
| 404 | Recurso no encontrado |
| 409 | Email duplicado u otra violación de unicidad |
| 422 | Transición de estado inválida |
| 429 | Rate limiting activado |
| 500 | Error no controlado del servidor |

---

## Convenciones de código

- `async/await` en todos los controladores — no usar `.then()/.catch()`.
- Manejo de errores con `try/catch` y pasar al `errorHandler` con `next(error)`.
- Paginación en todos los listados con `.skip().limit()`. Default 10 items, máximo 100.
- Queries de listado **siempre** con `{ activo: true }`.
- Nombres de variables y funciones en **camelCase**.
- Nombres de archivos de rutas y controladores en **camelCase** (`authRoutes.js`, `sessionController.js`).
- Un controlador por recurso. La lógica de negocio va en el controlador, no en las rutas.
- Variables de entorno: nunca hardcodear, siempre desde `process.env`.

---

## Validaciones críticas

| Campo | Regla |
|-------|-------|
| Email | Único en el sistema, normalizar a minúsculas antes de guardar |
| Contraseña | Mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula y 1 número |
| Preguntas por sesión | Entre 3 y 15. No se puede iniciar una sesión sin preguntas |
| CV | Solo `application/pdf`, `image/jpeg`, `image/png`. Límite 5 MB |
| Token de sesión | UUID v4 generado en servidor. Válido 72 horas desde creación |
| puntaje_ia | Rango `[0.00, 10.00]`, rechazar valores fuera de rango |

---

## Seguridad (RNF)

- Contraseñas con **bcrypt mínimo 10 rounds**.
- Rate limiting en `/auth/login`: máx 5 intentos / 15 min por IP.
- Todos los inputs sanitizados con `express-validator` (100% de endpoints).
- Secrets en `.env` — cero secrets en repositorio.
- `.env.example` presente con todas las variables documentadas pero sin valores reales.

---

## Variables de entorno requeridas (`.env.example`)

```env
PORT=3000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/hireiq

JWT_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

GEMINI_KEY=
GEMINI_TIMEOUT_MS=10000

UPLOAD_DIR=uploads
MAX_FILE_SIZE_BYTES=5242880
```

---

## Lo que está fuera del alcance de este proyecto

- Interfaz de usuario (UI/UX) — equipo frontend externo
- Notificaciones push — microservicio existente
- Integración con plataformas de videoconferencia
- Panel de analítica avanzada (fase 2)
- Aplicación móvil