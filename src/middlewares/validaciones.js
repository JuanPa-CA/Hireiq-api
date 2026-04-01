const { body, validationResult } = require('express-validator');

/**
 * Maneja los errores de validación de express-validator
 */
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(err => ({ field: err.path, msg: err.msg })),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

/**
 * Reglas de validación para registro de usuario
 */
const validateRegister = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio').trim(),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Debe contener al menos una minúscula')
    .matches(/\d/).withMessage('Debe contener al menos un número'),
  validateResults
];

/**
 * Reglas de validación para login
 */
const validateLogin = [
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  validateResults
];

/**
 * Reglas de validación para empresa
 */
const validateCompany = [
  body('nombre').notEmpty().withMessage('El nombre es obligatorio').trim(),
  body('email_contacto').isEmail().withMessage('Email de contacto inválido').normalizeEmail(),
  body('plan').optional().isIn(['free', 'pro', 'enterprise']).withMessage('Plan inválido'),
  validateResults
];

/**
 * Reglas de validación para posición/cargo
 */
const validatePosition = [
  body('titulo').notEmpty().withMessage('El título es obligatorio').trim(),
  body('nivel').isIn(['junior', 'mid', 'senior']).withMessage('Nivel inválido'),
  body('tecnologias').isArray().withMessage('Tecnologías debe ser un array'),
  validateResults
];

/**
 * Reglas de validación para preguntas
 */
const validateQuestion = [
  body('position_id').isMongoId().withMessage('ID de posición inválido'),
  body('pregunta').notEmpty().withMessage('La pregunta es obligatoria'),
  body('categoria').notEmpty().withMessage('La categoría es obligatoria'),
  body('dificultad').isIn(['facil', 'medio', 'dificil']).withMessage('Dificultad inválida'),
  validateResults
];

/**
 * Reglas de validación para sesiones
 */
const validateSession = [
  body('candidate_id').isMongoId().withMessage('ID de candidato inválido'),
  body('position_id').isMongoId().withMessage('ID de posición inválido'),
  body('preguntas').isArray({ min: 3, max: 15 }).withMessage('Debe haber entre 3 y 15 preguntas'),
  validateResults
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCompany,
  validatePosition,
  validateQuestion,
  validateSession,
  validateResults
};
