const CVFile = require('../models/CVFile');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Cargar CV del candidato
 * @route   POST /api/v1/files/cv
 * @access  Privado (Candidato)
 */
exports.uploadCV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se cargó ningún archivo',
        code: 'FILE_REQUIRED'
      });
    }

    // Eliminar CV previo si existe
    const existingFile = await CVFile.findOne({ candidate_id: req.user.id });
    if (existingFile) {
      const oldPath = path.join(process.env.UPLOAD_DIR || 'uploads', existingFile.filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      await CVFile.deleteOne({ _id: existingFile._id });
    }

    const cvFile = await CVFile.create({
      candidate_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size
    });

    res.status(201).json({
      success: true,
      message: 'CV cargado correctamente',
      data: cvFile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener CV por ID de candidato
 * @route   GET /api/v1/files/cv/:candidateId
 * @access  Privado (Empresa | Candidato propio)
 * FIX: Implementada verificación de permisos — candidato solo puede ver su propio CV.
 */
exports.getCV = async (req, res, next) => {
  try {
    // FIX: Verificar permisos — candidato solo puede ver su propio CV (PRD §6.1)
    if (
      req.user.rol === 'candidato' &&
      req.user.id !== req.params.candidateId
    ) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este CV',
        code: 'FORBIDDEN'
      });
    }

    const cv = await CVFile.findOne({ candidate_id: req.params.candidateId });
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado',
        code: 'NOT_FOUND'
      });
    }

    const filePath = path.join(process.env.UPLOAD_DIR || 'uploads', cv.filename);
    res.download(filePath, cv.original_name);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar CV propio
 * @route   DELETE /api/v1/files/cv
 * @access  Privado (Candidato)
 */
exports.deleteCV = async (req, res, next) => {
  try {
    const cv = await CVFile.findOne({ candidate_id: req.user.id });
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado',
        code: 'NOT_FOUND'
      });
    }

    const filePath = path.join(process.env.UPLOAD_DIR || 'uploads', cv.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await CVFile.deleteOne({ _id: cv._id });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};