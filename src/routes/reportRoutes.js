const { Router } = require('express');
const router = Router();
const { 
  getSessionReport, 
  getCompanySummary,
  getCandidateReport,
  getPositionInsights 
} = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Análisis de entrevistas e Insights de IA
 */

/**
 * @swagger
 * /reports/session/{id}:
 *   get:
 *     summary: Reporte detallado de una sesión (Empresa | Candidato propio)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reporte final con puntajes y feedback
 */
router.get('/session/:id', authorize('empresa', 'candidato'), getSessionReport);

/**
 * @swagger
 * /reports/company/summary:
 *   get:
 *     summary: Resumen estadístico de la empresa (Empresa)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tasas de éxito y actividad
 */
router.get('/company/summary', authorize('empresa'), getCompanySummary);

/**
 * @swagger
 * /reports/candidate/{id}:
 *   get:
 *     summary: Historial de entrevistas de un candidato (Empresa | Admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista histórica de sesiones
 */
router.get('/candidate/:id', authorize('empresa', 'admin'), getCandidateReport);

/**
 * @swagger
 * /reports/position/{id}/insights:
 *   get:
 *     summary: Insights generados por IA sobre un cargo (Empresa)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Patrones y brechas de conocimiento detectadas por Gemini AI
 */
router.get('/position/:id/insights', authorize('empresa'), getPositionInsights);

module.exports = router;
