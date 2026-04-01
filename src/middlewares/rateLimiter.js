const rateLimit = require('express-rate-limit');

/**
 * Limitador para intentos de login
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter
};
