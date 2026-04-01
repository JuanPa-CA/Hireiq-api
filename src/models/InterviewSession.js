const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const InterviewSessionSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosition',
    required: true,
    index: true  // FIX: Indice para queries de sesiones por cargo (PRD seccion 4.2)
  },
  preguntas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  estado: {
    type: String,
    enum: ['pendiente', 'en_curso', 'completada', 'expirada'],
    default: 'pendiente',
    index: true  // FIX: Indice para filtrar por estado (PRD seccion 4.2)
  },
  puntaje_total: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  token_acceso: {
    type: String,
    default: () => uuidv4()
  },
  fecha_inicio: {
    type: Date,
    default: null
  },
  fecha_fin: {
    type: Date,
    default: null
  },
  fecha_expiracion: {
    type: Date,
    required: true,
    default: () => new Date(+new Date() + 72 * 60 * 60 * 1000)
  },
  activo: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

InterviewSessionSchema.index({ token_acceso: 1 }, { unique: true });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
