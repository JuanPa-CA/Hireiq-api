const { Router } = require('express');
const router = Router();
const { 
  getPositions, 
  getPosition, 
  createPosition, 
  updatePosition, 
  deletePosition 
} = require('../controllers/positionController');
const { protect, authorize } = require('../middlewares/auth');
const { validatePosition } = require('../middlewares/validaciones');

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Positions
 *   description: Gestión de vacantes y cargos técnicos
 */

/**
 * @swagger
 * /positions:
 *   get:
 *     summary: Listar cargos de la empresa (Empresa)
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cargos
 *   post:
 *     summary: Crear nuevo cargo (Empresa)
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, nivel]
 *             properties:
 *               titulo: { type: string }
 *               nivel: { type: string, enum: [junior, mid, senior] }
 *               tecnologias: { type: array, items: { type: string } }
 *               descripcion: { type: string }
 *     responses:
 *       201:
 *         description: Cargo creado
 */
router.get('/', authorize('empresa'), getPositions);
router.post('/', authorize('empresa'), validatePosition, createPosition);

/**
 * @swagger
 * /positions/{id}:
 *   get:
 *     summary: Obtener detalle de un cargo (Empresa propia)
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del cargo
 *   put:
 *     summary: Actualizar cargo (Empresa propia)
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cargo actualizado
 *   delete:
 *     summary: Eliminar cargo (Empresa propia - Soft delete)
 *     tags: [Positions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Cargo eliminado
 */
router.get('/:id', authorize('empresa'), getPosition);
router.put('/:id', authorize('empresa'), updatePosition);
router.delete('/:id', authorize('empresa'), deletePosition);

module.exports = router;
