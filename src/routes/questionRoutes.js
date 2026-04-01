const { Router } = require('express');
const router = Router();
const {
  getQuestions,
  getQuestion,
  createQuestion,
  generateAI,
  suggestCategory,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const { protect, authorize } = require('../middlewares/auth');
const { validateQuestion } = require('../middlewares/validaciones');

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Gestión de banco de preguntas técnicas (Empresa)
 */

/**
 * @swagger
 * /questions:
 *   get:
 *     summary: Listar todas las preguntas de la empresa (Empresa)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: position_id
 *         schema: { type: string }
 *         description: Filtrar por cargo
 *       - in: query
 *         name: categoria
 *         schema: { type: string }
 *         description: Filtrar por categoría
 *       - in: query
 *         name: dificultad
 *         schema: { type: string, enum: [facil, medio, dificil] }
 *     responses:
 *       200:
 *         description: Lista de preguntas
 *   post:
 *     summary: Crear una pregunta manualmente (Empresa)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [position_id, pregunta, categoria, dificultad]
 *             properties:
 *               position_id: { type: string }
 *               pregunta: { type: string }
 *               categoria: { type: string }
 *               dificultad: { type: string, enum: [facil, medio, dificil] }
 *     responses:
 *       201:
 *         description: Pregunta creada
 */
router.get('/', authorize('empresa'), getQuestions);
router.post('/', authorize('empresa'), validateQuestion, createQuestion);

/**
 * @swagger
 * /questions/generate-ai:
 *   post:
 *     summary: Generar N preguntas usando Gemini AI (Empresa)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [position_id, cantidad, categoria, dificultad]
 *             properties:
 *               position_id: { type: string }
 *               cantidad: { type: integer, minimum: 1, maximum: 10 }
 *               categoria: { type: string }
 *               dificultad: { type: string, enum: [facil, medio, dificil] }
 *     responses:
 *       201:
 *         description: Preguntas generadas y guardadas
 */
router.post('/generate-ai', authorize('empresa'), generateAI);

/**
 * @swagger
 * /questions/suggest-category:
 *   post:
 *     summary: Sugerir una categoría para una pregunta usando Gemini AI (Empresa)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pregunta]
 *             properties:
 *               pregunta: { type: string }
 *     responses:
 *       200:
 *         description: Sugerencia de categoría
 */
router.post('/suggest-category', authorize('empresa'), suggestCategory);

/**
 * @swagger
 * /questions/{id}:
 *   get:
 *     summary: Obtener detalle de una pregunta (Empresa propia)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos de la pregunta
 *   put:
 *     summary: Actualizar una pregunta (Empresa propia)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Pregunta actualizada
 *   delete:
 *     summary: Eliminar pregunta (Empresa propia - Soft delete)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Pregunta desactivada
 */
router.get('/:id', authorize('empresa'), getQuestion);
router.put('/:id', authorize('empresa'), updateQuestion);
router.delete('/:id', authorize('empresa'), deleteQuestion);

module.exports = router;
