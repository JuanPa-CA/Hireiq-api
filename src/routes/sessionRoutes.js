const { Router } = require('express');
const router = Router();
const { 
  getSessions,
  getSession,
  createSession,
  validateToken,
  startSession,
  completeSession,
  updateStatus
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middlewares/auth');
const { validateSession } = require('../middlewares/validaciones');

/**
 * @swagger
 * /sessions/token/{token}:
 *   get:
 *     summary: Validar un token de acceso de candidato (Público)
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Token válido y datos de la sesión
 */
router.get('/token/:token', validateToken);

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Gestión de sesiones de entrevista y flujo de candidatos
 */

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Listar todas las sesiones de entrevista (Empresa | Admin)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema: { type: string, enum: [pendiente, en_curso, completada, expirada] }
 *       - in: query
 *         name: position_id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de sesiones
 *   post:
 *     summary: Crear una nueva sesión e invitar a un candidato (Empresa)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [candidate_id, position_id, preguntas]
 *             properties:
 *               candidate_id: { type: string }
 *               position_id: { type: string }
 *               preguntas: { type: array, items: { type: string } }
 *               fecha_expiracion: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Sesión creada con token de acceso único
 */
// FIX: Agregado 'admin' a la lista de roles autorizados para GET /sessions (PRD §3)
router.get('/', authorize('empresa', 'admin'), getSessions);
router.post('/', authorize('empresa'), validateSession, createSession);

/**
 * @swagger
 * /sessions/{id}/status:
 *   put:
 *     summary: Actualizar estado de una sesión (Empresa)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado: { type: string, enum: [pendiente, en_curso, completada, expirada] }
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/:id/status', authorize('empresa'), updateStatus);

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Obtener detalle de una sesión (Empresa | Candidato propio)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos de la sesión
 */
router.get('/:id', authorize('empresa', 'candidato', 'admin'), getSession);

/**
 * @swagger
 * /sessions/{id}/start:
 *   post:
 *     summary: Iniciar una sesión de entrevista (Candidato)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sesión iniciada (estado cambia a en_curso)
 */
router.post('/:id/start', authorize('candidato'), startSession);

/**
 * @swagger
 * /sessions/{id}/complete:
 *   post:
 *     summary: Finalizar una sesión de entrevista (Candidato)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sesión completada (estado cambia a completada)
 */
router.post('/:id/complete', authorize('candidato'), completeSession);

module.exports = router;