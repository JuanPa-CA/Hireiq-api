const { Router } = require('express');
const router = Router();
const { uploadCV, getCV, deleteCV } = require('../controllers/fileController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../config/multer');

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: Gestión de CVs de candidatos
 */

/**
 * @swagger
 * /files/cv:
 *   post:
 *     summary: Subir CV (Candidato - PDF/Imagen máx 5MB)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cv: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Archivo subido y guardado
 *   delete:
 *     summary: Eliminar mi CV (Candidato)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Archivo eliminado físicamente de la DB
 */
router.post('/cv', authorize('candidato'), upload.single('cv'), uploadCV);
router.delete('/cv', authorize('candidato'), deleteCV);

/**
 * @swagger
 * /files/cv/{candidateId}:
 *   get:
 *     summary: Ver/Descargar CV de un candidato (Empresa | Candidato propio)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archivo binario (Stream)
 */
router.get('/cv/:candidateId', authorize('empresa', 'candidato'), getCV);

module.exports = router;
