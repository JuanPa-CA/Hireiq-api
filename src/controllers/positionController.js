const JobPosition = require('../models/JobPosition');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * @desc    Obtener todos los cargos de la empresa
 * @route   GET /api/v1/positions
 * @access  Privado (Empresa)
 */
exports.getPositions = async (req, res, next) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    
    const query = { 
      company_id: req.user.company_id,
      activo: true 
    };

    const total = await JobPosition.countDocuments(query);
    const positions = await JobPosition.find(query)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Cargos obtenidos correctamente',
      data: positions,
      meta: buildPaginationMeta(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener un cargo por ID
 * @route   GET /api/v1/positions/:id
 * @access  Privado (Empresa propia)
 */
exports.getPosition = async (req, res, next) => {
  try {
    const position = await JobPosition.findOne({ 
      _id: req.params.id, 
      company_id: req.user.company_id,
      activo: true 
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado o no pertenece a su empresa',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cargo obtenido correctamente',
      data: position
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear un nuevo cargo
 * @route   POST /api/v1/positions
 * @access  Privado (Empresa)
 */
exports.createPosition = async (req, res, next) => {
  try {
    const { titulo, nivel, tecnologias, descripcion } = req.body;

    const position = await JobPosition.create({
      company_id: req.user.company_id,
      titulo,
      nivel,
      tecnologias,
      descripcion
    });

    res.status(201).json({
      success: true,
      message: 'Cargo creado exitosamente',
      data: position
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar un cargo
 * @route   PUT /api/v1/positions/:id
 * @access  Privado (Empresa propia)
 */
exports.updatePosition = async (req, res, next) => {
  try {
    const position = await JobPosition.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, activo: true },
      req.body,
      { new: true, runValidators: true }
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cargo actualizado correctamente',
      data: position
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar un cargo (Soft Delete)
 * @route   DELETE /api/v1/positions/:id
 * @access  Privado (Empresa propia)
 */
exports.deletePosition = async (req, res, next) => {
  try {
    const position = await JobPosition.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { activo: false },
      { new: true }
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado',
        code: 'NOT_FOUND'
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};