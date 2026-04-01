const InterviewSession = require('../models/InterviewSession');
const Answer = require('../models/Answer');
const JobPosition = require('../models/JobPosition');
const { model } = require('../config/gemini');

const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS) || 10000;

const callGeminiWithTimeout = (prompt) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), GEMINI_TIMEOUT_MS)
  );
  return Promise.race([model.generateContent(prompt), timeoutPromise]);
};

/**
 * @desc    Obtener reporte detallado de una sesion
 * @route   GET /api/v1/reports/session/:id
 * @access  Privado (Empresa | Candidato propio)
 *
 * El PRD exige que los reportes con datos de IA solo se entreguen si estado === 'completada'.
 */
exports.getSessionReport = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, activo: true })
      .populate('candidate_id', 'nombre email')
      .populate('position_id')
      .populate('preguntas');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
        code: 'NOT_FOUND'
      });
    }

    if (session.estado !== 'completada') {
      return res.status(404).json({
        success: false,
        message: 'El reporte solo está disponible para sesiones completadas',
        code: 'SESSION_NOT_COMPLETED'
      });
    }

    // Verificar permisos
    const isCompany = req.user.rol === 'empresa' &&
      session.position_id.company_id.toString() === req.user.company_id.toString();
    const isCandidate = req.user.rol === 'candidato' &&
      session.candidate_id._id.toString() === req.user._id.toString();

    if (!isCompany && !isCandidate && req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver este reporte',
        code: 'FORBIDDEN'
      });
    }

    const answers = await Answer.find({ session_id: req.params.id, activo: true })
      .populate('question_id', 'pregunta categoria dificultad');

    res.status(200).json({
      success: true,
      message: 'Reporte de sesión generado con éxito',
      data: { session, answers }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resumen estadistico de la empresa
 * @route   GET /api/v1/reports/company/summary
 * @access  Privado (Empresa)
 *
 * FIX: Implementado con aggregate real de MongoDB.
 */
exports.getCompanySummary = async (req, res, next) => {
  try {
    // Obtener IDs de posiciones de la empresa
    const positionIds = await JobPosition.find({
      company_id: req.user.company_id,
      activo: true
    }).distinct('_id');

    const resumen = await InterviewSession.aggregate([
      { $match: { position_id: { $in: positionIds }, activo: true } },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 },
          promedio_puntaje: { $avg: '$puntaje_total' }
        }
      }
    ]);

    // Formatear resultado
    const stats = { pendiente: 0, en_curso: 0, completada: 0, expirada: 0 };
    let promedio_general = 0;

    resumen.forEach(r => {
      stats[r._id] = r.cantidad;
      if (r._id === 'completada' && r.promedio_puntaje !== null) {
        promedio_general = Math.round(r.promedio_puntaje * 100) / 100;
      }
    });

    const total_sesiones = Object.values(stats).reduce((a, b) => a + b, 0);

    res.status(200).json({
      success: true,
      message: 'Resumen de empresa obtenido correctamente',
      data: {
        total_sesiones,
        por_estado: stats,
        promedio_puntaje_completadas: promedio_general
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Historial de entrevistas de un candidato
 * @route   GET /api/v1/reports/candidate/:id
 * @access  Privado (Empresa | Admin)
 *
 * FIX: Implementado con datos reales.
 */
exports.getCandidateReport = async (req, res, next) => {
  try {
    const positionIds = await JobPosition.find({
      company_id: req.user.company_id,
      activo: true
    }).distinct('_id');

    const query = { candidate_id: req.params.id, activo: true };
    // Si es empresa (no admin), filtrar solo sesiones de sus cargos
    if (req.user.rol === 'empresa') {
      query.position_id = { $in: positionIds };
    }

    const sessions = await InterviewSession.find(query)
      .populate('position_id', 'titulo nivel tecnologias')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Historial de candidato obtenido correctamente',
      data: sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Insights de IA sobre una posicion
 * @route   GET /api/v1/reports/position/:id/insights
 * @access  Privado (Empresa)
 *
 * FIX: Implementado con llamada real a Gemini AI analizando patrones de respuestas.
 */
exports.getPositionInsights = async (req, res, next) => {
  try {
    const position = await JobPosition.findOne({
      _id: req.params.id,
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

    // Recopilar sesiones completadas del cargo
    const sessions = await InterviewSession.find({
      position_id: position._id,
      estado: 'completada',
      activo: true
    });

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Sin sesiones completadas para analizar',
        data: { insights: null, total_sesiones_analizadas: 0 }
      });
    }

    const sessionIds = sessions.map(s => s._id);
    const answers = await Answer.find({ session_id: { $in: sessionIds }, activo: true })
      .populate('question_id', 'pregunta categoria dificultad');

    // Construir resumen estadistico para el prompt
    const porCategoria = {};
    answers.forEach(a => {
      const cat = a.question_id?.categoria || 'General';
      if (!porCategoria[cat]) porCategoria[cat] = { puntajes: [], total: 0 };
      if (a.puntaje_ia !== null) {
        porCategoria[cat].puntajes.push(a.puntaje_ia);
      }
      porCategoria[cat].total++;
    });

    const resumenCategorias = Object.entries(porCategoria).map(([cat, data]) => {
      const promedio = data.puntajes.length > 0
        ? (data.puntajes.reduce((a, b) => a + b, 0) / data.puntajes.length).toFixed(2)
        : 'N/A';
      return `${cat}: promedio ${promedio}/10 en ${data.total} preguntas`;
    }).join(', ');

    const puntajesGenerales = sessions
      .map(s => s.puntaje_total)
      .filter(p => p !== null);
    const promedioGeneral = puntajesGenerales.length > 0
      ? (puntajesGenerales.reduce((a, b) => a + b, 0) / puntajesGenerales.length).toFixed(2)
      : 'N/A';

    const prompt = `Eres un analista de talento técnico senior.
Analiza los siguientes datos de entrevistas para el cargo "${position.titulo}" (nivel: ${position.nivel}, tecnologías: ${position.tecnologias.join(', ')}).
Datos: ${sessions.length} sesiones completadas. Puntaje promedio general: ${promedioGeneral}/10.
Rendimiento por categoría: ${resumenCategorias}.
Genera un análisis en JSON con esta estructura:
{ "fortalezas_generales": ["..."], "brechas_conocimiento": ["..."], "recomendaciones": ["..."], "resumen": "máx 200 palabras" }
Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    let insights = null;
    try {
      const result = await callGeminiWithTimeout(prompt);
      const responseText = result.response.text();
      const jsonStr = responseText.substring(
        responseText.indexOf('{'),
        responseText.lastIndexOf('}') + 1
      );
      insights = JSON.parse(jsonStr);
    } catch (aiError) {
      console.error('[Gemini] Error generando insights:', aiError);
    }

    res.status(200).json({
      success: true,
      message: 'Insights de posición generados correctamente',
      data: {
        position: { titulo: position.titulo, nivel: position.nivel },
        total_sesiones_analizadas: sessions.length,
        promedio_general: promedioGeneral,
        insights
      }
    });
  } catch (error) {
    next(error);
  }
};