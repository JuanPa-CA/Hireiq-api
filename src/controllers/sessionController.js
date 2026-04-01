const InterviewSession = require('../models/InterviewSession');
const JobPosition = require('../models/JobPosition');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Question = require('../models/Question');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Maquina de estados permitida (PRD seccion 6.2)
 * FIX: Implementada tabla de transiciones completa.
 */
const TRANSICIONES_PERMITIDAS = {
  pendiente: ['en_curso', 'expirada'],
  en_curso: ['completada', 'expirada'],
  completada: [],
  expirada: []
};

/**
 * @desc    Obtener sesiones de la empresa
 * @route   GET /api/v1/sessions
 * @access  Privado (Empresa)
 *
 * FIX: Reemplazado InterviewSession.find() sin filtro (cargaba TODA la coleccion
 *      y filtraba en memoria) por una query directa usando los IDs de posiciones
 *      de la empresa. Paginacion aplicada en MongoDB, no en memoria.
 */
exports.getSessions = async (req, res, next) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { estado, position_id } = req.query;

    // Obtener IDs de posiciones de esta empresa para filtrar en la query
    const positionQuery = { company_id: req.user.company_id, activo: true };
    if (position_id) positionQuery._id = position_id;

    const companyPositionIds = await JobPosition.find(positionQuery).distinct('_id');

    const query = { position_id: { $in: companyPositionIds }, activo: true };
    if (estado) query.estado = estado;

    const total = await InterviewSession.countDocuments(query);
    const sessions = await InterviewSession.find(query)
      .populate('position_id', 'titulo nivel tecnologias')
      .populate('candidate_id', 'nombre email')
      .populate('preguntas', 'pregunta categoria dificultad')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      message: 'Sesiones obtenidas correctamente',
      data: sessions,
      meta: buildPaginationMeta(total, page, limit)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtener sesion por ID
 * @route   GET /api/v1/sessions/:id
 * @access  Privado (Empresa | Candidato propio)
 */
exports.getSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({ _id: req.params.id, activo: true })
      .populate('position_id')
      .populate('candidate_id', 'nombre email')
      .populate('preguntas');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
        code: 'NOT_FOUND'
      });
    }

    const isCompany = req.user.rol === 'empresa' &&
      session.position_id.company_id.toString() === req.user.company_id.toString();
    const isCandidate = req.user.rol === 'candidato' &&
      session.candidate_id._id.toString() === req.user._id.toString();

    if (!isCompany && !isCandidate && req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para ver esta sesión',
        code: 'FORBIDDEN'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sesión obtenida correctamente',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Crear una nueva sesion de entrevista
 * @route   POST /api/v1/sessions
 * @access  Privado (Empresa)
 *
 * FIX: Agregada validacion de que position_id pertenece a la empresa autenticada.
 */
exports.createSession = async (req, res, next) => {
  try {
    const { candidate_id, position_id, preguntas, fecha_expiracion } = req.body;

    // Validar que el candidato existe y tiene rol correcto
    const candidate = await User.findOne({ _id: candidate_id, activo: true });
    if (!candidate || candidate.rol !== 'candidato') {
      return res.status(404).json({
        success: false,
        message: 'Candidato no encontrado',
        code: 'NOT_FOUND'
      });
    }

    // FIX: Validar que la posicion pertenece a la empresa autenticada
    const position = await JobPosition.findOne({
      _id: position_id,
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

    // FIX: Validar que todas las preguntas existan y pertenezcan a la empresa/posicion
    if (preguntas && preguntas.length > 0) {
      const validQuestionsCount = await Question.countDocuments({
        _id: { $in: preguntas },
        company_id: req.user.company_id,
        activa: true
      });
      if (validQuestionsCount !== preguntas.length) {
        return res.status(400).json({
          success: false,
          message: 'Una o más preguntas son inválidas o no pertenecen a su empresa',
          code: 'INVALID_QUESTIONS'
        });
      }
    }

    const session = await InterviewSession.create({
      candidate_id,
      position_id,
      preguntas,
      fecha_expiracion: fecha_expiracion || new Date(+new Date() + 72 * 60 * 60 * 1000)
    });

    res.status(201).json({
      success: true,
      message: 'Sesión de entrevista creada exitosamente',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Actualizar estado de la sesion
 * @route   PUT /api/v1/sessions/:id/status
 * @access  Privado (Empresa)
 *
 * FIX: Implementada maquina de estados completa con tabla de transiciones
 *      validas segun PRD seccion 6.2.
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const session = await InterviewSession.findOne({ _id: req.params.id, activo: true })
      .populate('position_id', 'company_id');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
        code: 'NOT_FOUND'
      });
    }

    // Verificar que la sesion pertenece a la empresa
    if (session.position_id.company_id.toString() !== req.user.company_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permisos para modificar esta sesión',
        code: 'FORBIDDEN'
      });
    }

    // FIX: Validar transicion usando tabla de estados permitidos
    const permitidos = TRANSICIONES_PERMITIDAS[session.estado] || [];
    if (!permitidos.includes(estado)) {
      return res.status(422).json({
        success: false,
        message: `Transición no permitida: '${session.estado}' → '${estado}'`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    session.estado = estado;
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Estado de la sesión actualizado',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validar token de acceso de candidato
 * @route   GET /api/v1/sessions/token/:token
 * @access  Publico
 */
exports.validateToken = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({ token_acceso: req.params.token, activo: true })
      .populate('position_id', 'titulo nivel tecnologias')
      .populate('candidate_id', 'nombre');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Token de acceso inválido',
        code: 'INVALID_TOKEN'
      });
    }

    if (session.estado !== 'pendiente' && session.estado !== 'en_curso') {
      return res.status(422).json({
        success: false,
        message: `La sesión se encuentra en estado: ${session.estado}`,
        code: 'SESSION_NOT_AVAILABLE'
      });
    }

    if (new Date() > session.fecha_expiracion) {
      session.estado = 'expirada';
      await session.save();
      return res.status(422).json({
        success: false,
        message: 'La sesión ha expirado',
        code: 'SESSION_EXPIRED'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Iniciar sesion por el candidato
 * @route   POST /api/v1/sessions/:id/start
 * @access  Privado (Candidato propio)
 *
 * FIX: Agregada verificacion de expiracion antes de iniciar la sesion.
 */
exports.startSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      candidate_id: req.user.id,
      activo: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
        code: 'NOT_FOUND'
      });
    }

    if (session.estado !== 'pendiente') {
      return res.status(422).json({
        success: false,
        message: 'La sesión ya ha sido iniciada o finalizada',
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    // FIX: Validar que no se puede iniciar una sesión sin preguntas (PRD Validaciones Críticas)
    if (!session.preguntas || session.preguntas.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No se puede iniciar una sesión que no tiene preguntas asignadas',
        code: 'MISSING_QUESTIONS'
      });
    }

    // FIX: Verificar expiracion antes de permitir inicio (PRD seccion 6.2)
    if (new Date() > session.fecha_expiracion) {
      session.estado = 'expirada';
      await session.save();
      return res.status(422).json({
        success: false,
        message: 'La sesión ha expirado y no puede ser iniciada',
        code: 'SESSION_EXPIRED'
      });
    }

    session.estado = 'en_curso';
    session.fecha_inicio = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Sesión iniciada correctamente',
      data: session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Completar sesion por el candidato
 * @route   POST /api/v1/sessions/:id/complete
 * @access  Privado (Candidato propio)
 *
 * FIX: Implementado calculo de puntaje_total como promedio de puntajes_ia
 *      de todas las respuestas activas de la sesion (PRD seccion 4.1).
 */
exports.completeSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      candidate_id: req.user.id,
      activo: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sesión no encontrada',
        code: 'NOT_FOUND'
      });
    }

    if (session.estado !== 'en_curso') {
      return res.status(422).json({
        success: false,
        message: 'Solo se pueden completar sesiones en curso',
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    // FIX: Calcular puntaje_total como promedio de puntajes de IA (PRD 4.1)
    // Solo se consideran respuestas activas
    const answers = await Answer.find({ session_id: session._id, activo: true });
    const puntajesValidos = answers
      .map(a => a.puntaje_ia)
      .filter(p => p !== null && p !== undefined);

    if (puntajesValidos.length > 0) {
      const suma = puntajesValidos.reduce((acc, val) => acc + val, 0);
      session.puntaje_total = Math.round((suma / puntajesValidos.length) * 100) / 100;
    }

    session.estado = 'completada';
    session.fecha_fin = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Sesión completada exitosamente',
      data: session
    });
  } catch (error) {
    next(error);
  }
};