const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');
const jwt = require('../utils/jwt');

/**
 * @desc    Registrar un nuevo usuario (Candidato por defecto en /register)
 * @route   POST /api/v1/auth/register
 * @access  Publico
 */
exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    const user = await User.create({
      nombre,
      email,
      password,
      rol: 'candidato'
    });

    const accessToken = jwt.generateAccessToken({ id: user._id });
    const refreshToken = jwt.generateRefreshToken({ id: user._id });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Iniciar sesion
 * @route   POST /api/v1/auth/login
 * @access  Publico
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    console.log('User found, matching password...');
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if (!user.activo) {
      console.log('User inactive');
      return res.status(401).json({
        success: false,
        message: 'Su cuenta está inactiva',
        code: 'USER_INACTIVE'
      });
    }

    console.log('Generating tokens...');
    const accessToken = jwt.generateAccessToken({ id: user._id });
    const refreshToken = jwt.generateRefreshToken({ id: user._id });
    console.log('Tokens generated successfully');

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        company_id: user.company_id,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refrescar token de acceso
 * @route   POST /api/v1/auth/refresh
 * @access  Publico
 * FIX: Usa process.env.JWT_REFRESH_SECRET en lugar del secret hardcodeado.
 */
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'RefreshToken es requerido',
        code: 'TOKEN_REQUIRED'
      });
    }

    const revocado = await TokenBlacklist.findOne({ token: refreshToken });
    if (revocado) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o revocado',
        code: 'UNAUTHORIZED'
      });
    }

    // FIX: Usar variable de entorno en lugar de 'refresh_secret_key' hardcodeado
    const decoded = jwt.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo',
        code: 'UNAUTHORIZED'
      });
    }

    const accessToken = jwt.generateAccessToken({ id: user._id });

    res.status(200).json({
      success: true,
      message: 'Token refrescado correctamente',
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'RefreshToken inválido o expirado',
      code: 'UNAUTHORIZED'
    });
  }
};

/**
 * @desc    Cerrar sesion — invalida el refreshToken en servidor
 * @route   POST /api/v1/auth/logout
 * @access  Privado
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await TokenBlacklist.create({ token: refreshToken });
    }

    res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener perfil del usuario actual
 * @route   GET /api/v1/auth/me
 * @access  Privado
 */
exports.me = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Perfil obtenido correctamente',
    data: {
      id: req.user._id,
      nombre: req.user.nombre,
      email: req.user.email,
      rol: req.user.rol,
      company_id: req.user.company_id
    }
  });
};

/**
 * @desc    Cambiar contrasena
 * @route   PUT /api/v1/auth/change-password
 * @access  Privado
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(oldPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta',
        code: 'INVALID_CREDENTIALS'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};