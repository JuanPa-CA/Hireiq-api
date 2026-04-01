const Answer = require('../models/Answer');
const InterviewSession = require('../models/InterviewSession');
const Question = require('../models/Question');
const { model } = require('../config/gemini');
const { buildEvaluateAnswerPrompt } = require('../utils/geminiPrompts');

const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS) || 10000;

/**
 * Llama a Gemini con timeout configurable.
 * FIX: Implementado timeout segun RNF05 del PRD (10 segundos).
 *      Si se excede, rechaza con error TIMEOUT para que la respuesta
 *      se guarde con puntaje_ia: null y sea re-evaluada posteriormente.
 */
const callGeminiWithTimeout = (prompt) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT_MS)
  );
  return Promise.race([model.generateContent(prompt), timeoutPromise]);
};

/**
 * Evalua una respuesta con Gemini y actualiza el documento Answer.
 * Funcion separada para reutilizarla en createAnswer y evaluateAnswer.
 */
const evaluateWithGemini = async (answer, session, question) => {
  const prompt = buildEvaluateAnswerPrompt({
    tituloCargo: session.position_id.titulo,
    nivel: session.position_id.nivel,
    tecnologias: session.position_id.tecnologias,
    dificultad: question.dificultad,
    pregunta: question.pregunta,
    respuesta: answer.respuesta_texto
  });

  const result = await callGeminiWithTimeout(prompt);
  const responseText = result.response.text();

  let evaluation;
  try {
    const jsonStr = responseText.substring(
      responseText.indexOf('{'),
      responseText.lastIndexOf('}') + 1
    );
    evaluation = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('[Gemini] Error parsing response JSON:', parseError, 'Raw response:', responseText);
    throw new Error('AI_JSON_PARSE_ERROR');
  }

  // FIX: Registrar tokens_usados segun exige el PRD (seccion 6.3)
  const tokensUsados = result.response.usageMetadata?.totalTokenCount || 0;

  // FIX: Clamp puntaje entre 0.0 y 10.0 segun PRD para evitar errores de validacion Mongoose
  let puntaje = parseFloat(evaluation.puntaje);
  if (isNaN(puntaje)) puntaje = 0;
  puntaje = Math.max(0, Math.min(10, puntaje));

  answer.puntaje_ia = Math.round(puntaje * 100) / 100;
  answer.feedback_ia = {
    fortalezas: Array.isArray(evaluation.fortalezas) ? evaluation.fortalezas : [],
    debilidades: Array.isArray(evaluation.debilidades) ? evaluation.debilidades : [],
    feedback: evaluation.feedback || ''
  };
  answer.tokens_usados = tokensUsados;
  await answer.save();

  return answer;
};

/**
 * @desc    Crear una respuesta y evaluarla con Gemini AI
 * @route   POST /api/v1/answers
 * @access  Privado (Candidato)
 */
exports.createAnswer = async (req, res, next) => {
  try {
    const { session_id, question_id, respuesta_texto } = req.body;

    // Validar sesion en curso
    const session = await InterviewSession.findOne({ _id: session_id, activo: true }).populate('position_id');
    if (!session || session.estado !== 'en_curso') {
      return res.status(422).json({
        success: false,
        message: 'La sesión no está en curso o no existe',
        code: 'INVALID_SESSION_STATE'
      });
    }

    // Verificar que la sesion pertenece al candidato autenticado
    if (session.candidate_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para responder en esta sesión',
        code: 'FORBIDDEN'
      });
    }

    // Validar que la pregunta pertenece a la sesion
    if (!session.preguntas.map(id => id.toString()).includes(question_id)) {
      return res.status(400).json({
        success: false,
        message: 'La pregunta no pertenece a esta sesión',
        code: 'INVALID_QUESTION'
      });
    }

    const question = await Question.findOne({ _id: question_id, activa: true });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Pregunta no encontrada',
        code: 'NOT_FOUND'
      });
    }

    // Crear la respuesta inicial
    const answer = await Answer.create({
      session_id,
      question_id,
      respuesta_texto
    });

    // Evaluacion con Gemini (con timeout)
    try {
      await evaluateWithGemini(answer, session, question);
    } catch (aiError) {
      if (aiError.message === 'GEMINI_TIMEOUT') {
        console.warn(`[Gemini] Timeout en evaluacion de answer ${answer._id} — se guardara con puntaje null para re-evaluacion.`);
      } else {
        console.error('[Gemini] Error evaluando respuesta:', aiError);
      }
      // La respuesta ya esta guardada con puntaje_ia: null — se re-evaluara
    }

    // FIX: No exponer feedback_ia ni puntaje_ia al candidato mientras la sesion
    //      este en curso (PRD seccion 6.3 y 6.1).
    //      Se devuelve el objeto sin los campos de evaluacion de IA.
    const answerPublico = {
      _id: answer._id,
      session_id: answer.session_id,
      question_id: answer.question_id,
      respuesta_texto: answer.respuesta_texto,
      tokens_usados: answer.tokens_usados,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Respuesta guardada correctamente',
      data: answerPublico
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar una respuesta (Candidato - Solo sesion en curso)
 * @route   PUT /api/v1/answers/:id
 * @access  Privado (Candidato propio)
 */
exports.updateAnswer = async (req, res, next) => {
  try {
    const { respuesta_texto } = req.body;
    const answer = await Answer.findOne({ _id: req.params.id, activo: true });

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Respuesta no encontrada',
        code: 'NOT_FOUND'
      });
    }

    const session = await InterviewSession.findOne({ _id: answer.session_id, activo: true }).populate('position_id');
    if (!session || session.estado !== 'en_curso') {
      return res.status(422).json({
        success: false,
        message: 'No se puede editar una respuesta si la sesión no está en curso o no existe',
        code: 'INVALID_SESSION_STATE'
      });
    }

    // Verificar que la respuesta pertenece al candidato autenticado
    if (session.candidate_id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para editar esta respuesta',
        code: 'FORBIDDEN'
      });
    }

    answer.respuesta_texto = respuesta_texto;
    // Resetear evaluacion anterior antes de re-evaluar
    answer.puntaje_ia = null;
    answer.feedback_ia = { fortalezas: [], debilidades: [], feedback: '' };
    await answer.save();

    // Re-evaluar con Gemini
    const question = await Question.findOne({ _id: answer.question_id, activa: true });
    try {
      await evaluateWithGemini(answer, session, question);
    } catch (aiError) {
      if (aiError.message === 'GEMINI_TIMEOUT') {
        console.warn(`[Gemini] Timeout en re-evaluacion de answer ${answer._id}`);
      } else {
        console.error('[Gemini] Error re-evaluando respuesta:', aiError);
      }
    }

    // FIX: Tampoco exponer feedback en actualizacion durante sesion activa
    const answerPublico = {
      _id: answer._id,
      session_id: answer.session_id,
      question_id: answer.question_id,
      respuesta_texto: answer.respuesta_texto,
      tokens_usados: answer.tokens_usados,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt
    };

    res.status(200).json({
      success: true,
      message: 'Respuesta actualizada correctamente',
      data: answerPublico
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener respuestas de una sesion
 * @route   GET /api/v1/answers/session/:sessionId
 * @access  Privado (Empresa | Candidato propio)
 */
exports.getAnswersBySession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.sessionId, activo: true });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
        code: 'NOT_FOUND'
      });
    }

    const answers = await Answer.find({ session_id: req.params.sessionId, activo: true })
      .populate('question_id', 'pregunta categoria dificultad');

    // FIX: Si la sesion NO esta completada, ocultar feedback de IA al candidato
    const esCandidato = req.user.rol === 'candidato';
    const sessionCompletada = session.estado === 'completada';

    const data = answers.map(a => {
      const obj = a.toObject();
      if (esCandidato && !sessionCompletada) {
        delete obj.puntaje_ia;
        delete obj.feedback_ia;
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      message: 'Respuestas obtenidas correctamente',
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Re-evaluar respuesta (Admin)
 * @route   POST /api/v1/answers/:id/evaluate
 * @access  Privado (Admin)
 */
exports.evaluateAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findOne({ _id: req.params.id, activo: true });
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Respuesta no encontrada',
        code: 'NOT_FOUND'
      });
    }

    const session = await InterviewSession.findOne({ _id: answer.session_id, activo: true }).populate('position_id');
    const question = await Question.findOne({ _id: answer.question_id, activa: true });

    if (!session || !question) {
      return res.status(404).json({
        success: false,
        message: 'Sesión o pregunta asociada no encontrada',
        code: 'NOT_FOUND'
      });
    }

    try {
      await evaluateWithGemini(answer, session, question);
    } catch (aiError) {
      console.error('[Gemini] Error en re-evaluacion forzada:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Error al re-evaluar con IA',
        code: 'AI_ERROR'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Re-evaluación completada exitosamente',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};