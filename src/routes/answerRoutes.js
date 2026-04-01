const { Router } = require('express');
const router = Router();
const {
  createAnswer,
  updateAnswer,
  getAnswersBySession,
  evaluateAnswer
} = require('../controllers/answerController');
const { protect, authorize } = require('../middlewares/auth');

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Answers
 *   description: Gestión de respuestas y evaluación por IA
 */

/**
 * @swagger
 * /answers:
 *   post:
 *     summary: Enviar una respuesta a una pregunta (Candidato)
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [session_id, question_id, respuesta_texto]
 *             properties:
 *               session_id: { type: string }
 *               question_id: { type: string }
 *               respuesta_texto: { type: string }
 *     responses:
 *       201:
 *         description: Respuesta guardada y evaluada por Gemini (feedback oculto hasta completar sesion)
 */
router.post('/', authorize('candidato'), createAnswer);

/**
 * FIX: Rutas especificas declaradas ANTES que rutas dinamicas /:id
 *      para evitar conflictos de captura en Express.
 */

/**
 * @swagger
 * /answers/session/{sessionId}:
 *   get:
 *     summary: Obtener todas las respuestas de una sesión (Empresa | Candidato propio)
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de respuestas (feedback de IA solo visible si sesion completada)
 */
router.get('/session/:sessionId', authorize('empresa', 'candidato'), getAnswersBySession);

/**
 * @swagger
 * /answers/{id}:
 *   put:
 *     summary: Actualizar una respuesta (Candidato - Solo si la sesión está en curso)
 *     tags: [Answers]
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
 *             required: [respuesta_texto]
 *             properties:
 *               respuesta_texto: { type: string }
 *     responses:
 *       200:
 *         description: Respuesta actualizada y re-evaluada
 */
router.put('/:id', authorize('candidato'), updateAnswer);

/**
 * @swagger
 * /answers/{id}/evaluate:
 *   post:
 *     summary: Forzar re-evaluación de una respuesta por IA (Admin)
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Evaluación actualizada
 */
router.post('/:id/evaluate', authorize('admin'), evaluateAnswer);

module.exports = router;
