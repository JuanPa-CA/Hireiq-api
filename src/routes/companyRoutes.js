const { Router } = require('express');
const router = Router();
const { 
  getCompanies, 
  getCompany, 
  createCompany, 
  updateCompany, 
  deleteCompany 
} = require('../controllers/companyController');
const { protect, authorize } = require('../middlewares/auth');
const { validateCompany } = require('../middlewares/validaciones');

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Gestión de empresas (Admin / Empresa)
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Obtener todas las empresas (Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas
 *   post:
 *     summary: Crear una nueva empresa (Admin)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email_contacto]
 *             properties:
 *               nombre: { type: string }
 *               email_contacto: { type: string }
 *               plan: { type: string, enum: [free, pro, enterprise] }
 *     responses:
 *       201:
 *         description: Empresa creada
 */
router.get('/', authorize('admin'), getCompanies);
router.post('/', authorize('admin'), validateCompany, createCompany);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Obtener empresa por ID (Admin | Empresa propia)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos de la empresa
 *   put:
 *     summary: Actualizar datos de la empresa (Admin | Empresa propia)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Empresa actualizada
 *   delete:
 *     summary: Eliminar empresa (Admin - Soft delete)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Empresa desactivada
 */
router.get('/:id', authorize('admin', 'empresa'), getCompany);
router.put('/:id', authorize('admin', 'empresa'), updateCompany);
router.delete('/:id', authorize('admin'), deleteCompany);

module.exports = router;
