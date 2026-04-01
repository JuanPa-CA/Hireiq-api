/**
 * Manejador centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  console.log('--- ERROR DETAIL (LOG) ---');
  console.log(err);
  console.log(err.stack);
  console.log('--------------------------');

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  const code = err.code || 'INTERNAL_SERVER_ERROR';

  res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || [],
    code: code
  });
};

module.exports = errorHandler;
