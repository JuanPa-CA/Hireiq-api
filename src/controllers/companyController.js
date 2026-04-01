const Company = require('../models/Company');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * @desc    Obtener todas las empresas
 * @route   GET /api/v1/companies
 * @access  Privado (Admin)
 */
exports.getCompanies = async (req, res, next) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    
    const total = await Company.countDocuments({ activa: true });
    const companies = await Company.find({ activa: true })
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Empresas obtenidas correctamente',
      data: companies,
      meta: buildPaginationMeta(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una empresa por ID
 * @route   GET /api/v1/companies/:id
 * @access  Privado (Admin | Empresa propia)
 */
exports.getCompany = async (req, res, next) => {
  try {
    // Verificar permisos: si es rol 'empresa', solo puede ver la suya
    if (req.user.rol === 'empresa' && req.user.company_id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver esta empresa',
        code: 'FORBIDDEN'
      });
    }

    const company = await Company.findOne({ _id: req.params.id, activa: true });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Empresa obtenida correctamente',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear una nueva empresa
 * @route   POST /api/v1/companies
 * @access  Privado (Admin)
 */
exports.createCompany = async (req, res, next) => {
  try {
    const { nombre, email_contacto, plan } = req.body;

    const companyExists = await Company.findOne({ email_contacto });
    if (companyExists) {
      return res.status(409).json({
        success: false,
        message: 'El email de contacto ya está registrado para otra empresa',
        code: 'DUPLICATE_ERROR'
      });
    }

    const company = await Company.create({
      nombre,
      email_contacto,
      plan
    });

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar una empresa
 * @route   PUT /api/v1/companies/:id
 * @access  Privado (Admin | Empresa propia)
 */
exports.updateCompany = async (req, res, next) => {
  try {
    // Verificar permisos
    if (req.user.rol === 'empresa' && req.user.company_id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para actualizar esta empresa',
        code: 'FORBIDDEN'
      });
    }

    const company = await Company.findOneAndUpdate(
      { _id: req.params.id, activa: true },
      req.body,
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Empresa actualizada correctamente',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar una empresa (Soft Delete)
 * @route   DELETE /api/v1/companies/:id
 * @access  Privado (Admin)
 */
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { activa: false },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};