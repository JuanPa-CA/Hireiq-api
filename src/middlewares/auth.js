const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para proteger rutas.
 * Usa process.env.JWT_SECRET en lugar de un secret hardcodeado.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user || !req.user.activo) {
        return res.status(401).json({
          success: false,
          message: 'No autorizado, usuario no encontrado o inactivo',
          code: 'UNAUTHORIZED'
        });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        message: 'No autorizado, token fallido',
        code: 'UNAUTHORIZED'
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: 'No autorizado, sin token',
    code: 'UNAUTHORIZED'
  });
};

/**
 * Middleware para restringir por roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: `El rol '${req.user.rol}' no tiene permisos para esta acción`,
        code: 'FORBIDDEN'
      });
    }
    next();
  };
};

module.exports = { protect, authorize };