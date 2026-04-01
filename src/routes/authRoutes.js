const { Router } = require('express');
const router = Router();
const { 
  register, 
  login, 
  refresh, 
  logout, 
  me, 
  changePassword 
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');
const { validateRegister, validateLogin } = require('../middlewares/validaciones');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de cuenta
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario (Candidato)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, password]
 *             properties:
 *               nombre: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Usuario creado
 */
router.post('/register', validateRegister, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/login', loginLimiter, validateLogin, login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refrescar token de acceso
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Nuevo accessToken generado
 */
router.post('/refresh', refresh);

// --- Rutas Protegidas ---
router.use(protect);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil
 */
router.get('/me', me);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.put('/change-password', changePassword);

module.exports = router;
