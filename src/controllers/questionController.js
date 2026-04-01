const Question = require('../models/Question');
const JobPosition = require('../models/JobPosition');
const { model } = require('../config/gemini');
const { buildGenerateQuestionsPrompt } = require('../utils/geminiPrompts');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS) || 10000;

const callGeminiWithTimeout = (prompt) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT_MS)
  );
  return Promise.race([model.generateContent(prompt), timeoutPromise]);
};

/**
 * @desc    Obtener todas las preguntas de la empresa
 * @route   GET /api/v1/questions
 * @access  Privado (Empresa)
 */
exports.getQuestions = async (req, res, next) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { position_id, categoria, dificultad } = req.query;

    const query = {
      company_id: req.user.company_id,
      activa: true
    };

    if (position_id) query.position_id = position_id;
    if (categoria) query.categoria = categoria;
    if (dificultad) query.dificultad = dificultad;

    const total = await Question.countDocuments(query);
    const questions = await Question.find(query)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Preguntas obtenidas correctamente',
      data: questions,
      meta: buildPaginationMeta(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener una pregunta por ID
 * @route   GET /api/v1/questions/:id
 * @access  Privado (Empresa propia)
 */
exports.getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      company_id: req.user.company_id,
      activa: true
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pregunta obtenida correctamente',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generar preguntas usando Gemini AI
 * @route   POST /api/v1/questions/generate-ai
 * @access  Privado (Empresa)
 * FIX: Timeout de Gemini aplicado.
 */
exports.generateAI = async (req, res, next) => {
  try {
    const { position_id, cantidad, dificultad, categoria } = req.body;

    const position = await JobPosition.findOne({
      _id: position_id,
      company_id: req.user.company_id,
      activo: true
    });
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado',
        code: 'NOT_FOUND'
      });
    }

    const prompt = buildGenerateQuestionsPrompt({
      tituloCargo: position.titulo,
      nivel: position.nivel,
      tecnologias: position.tecnologias,
      cantidad: cantidad || 5,
      dificultad: dificultad || 'medio',
      categoria: categoria || 'General'
    });

    let result;
    try {
      result = await callGeminiWithTimeout(prompt);
    } catch (aiError) {
      console.error('[Gemini] Error generando preguntas:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Error al generar preguntas con IA. Intente nuevamente.',
        code: 'AI_ERROR'
      });
    }

    const responseText = result.response.text();
    let preguntasRaw;
    try {
      const jsonStr = responseText.substring(
        responseText.indexOf('{'),
        responseText.lastIndexOf('}') + 1
      );
      const parsed = JSON.parse(jsonStr);
      preguntasRaw = parsed.preguntas;
      if (!Array.isArray(preguntasRaw)) throw new Error('FORMAT_ERROR');
    } catch (parseError) {
      console.error('[Gemini] Error parsing generated questions:', parseError, 'Raw:', responseText);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar las preguntas generadas por IA.',
        code: 'AI_FORMAT_ERROR'
      });
    }

    const questionsToCreate = preguntasRaw.map(q => ({
      company_id: req.user.company_id,
      position_id,
      pregunta: q.pregunta,
      categoria: q.categoria || categoria || 'General',
      dificultad: q.dificultad || dificultad || 'medio',
      generada_por_ia: true
    }));

    const createdQuestions = await Question.insertMany(questionsToCreate);

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} preguntas generadas con éxito`,
      data: createdQuestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Sugerir categoria usando Gemini AI
 * @route   POST /api/v1/questions/suggest-category
 * @access  Privado (Empresa)
 * FIX: Implementado con llamada real a Gemini y parsing robusto.
 */
exports.suggestCategory = async (req, res, next) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({
        success: false,
        message: 'El campo pregunta es obligatorio',
        code: 'VALIDATION_ERROR'
      });
    }

    const prompt = `Eres un experto en entrevistas técnicas de desarrollo de software.
Dada la siguiente pregunta de entrevista, sugiere la categoría más apropiada.
Categorías posibles: JavaScript, Node.js, React, Python, Bases de Datos, Arquitectura, Algoritmos, DevOps, Seguridad, General.
PREGUNTA: ${pregunta}
Responde ÚNICAMENTE con JSON: { "categoria": "..." }. Sin texto adicional.`;

    let categoria = 'General';
    try {
      const result = await callGeminiWithTimeout(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.substring(
        responseText.indexOf('{'),
        responseText.lastIndexOf('}') + 1
      );
      const parsed = JSON.parse(jsonStr);
      categoria = parsed.categoria || 'General';
    } catch (aiError) {
      console.error('[Gemini] Error sugiriendo categoría:', aiError);
    }

    res.status(200).json({
      success: true,
      message: 'Sugerencia obtenida',
      data: { categoria }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear pregunta manualmente
 * @route   POST /api/v1/questions
 * @access  Privado (Empresa)
 */
exports.createQuestion = async (req, res, next) => {
  try {
    const { position_id, pregunta, categoria, dificultad } = req.body;

    const position = await JobPosition.findOne({
      _id: position_id,
      company_id: req.user.company_id,
      activo: true
    });
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Cargo no encontrado',
        code: 'NOT_FOUND'
      });
    }

    const question = await Question.create({
      company_id: req.user.company_id,
      position_id,
      pregunta,
      categoria,
      dificultad,
      generada_por_ia: false
    });

    res.status(201).json({
      success: true,
      message: 'Pregunta creada correctamente',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar pregunta
 * @route   PUT /api/v1/questions/:id
 * @access  Privado (Empresa propia)
 */
exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, activa: true },
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pregunta actualizada correctamente',
      data: question
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Eliminar pregunta (Soft Delete)
 * @route   DELETE /api/v1/questions/:id
 * @access  Privado (Empresa propia)
 */
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { activa: false },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
        code: 'NOT_FOUND'
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};