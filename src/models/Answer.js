const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  respuesta_texto: {
    type: String,
    required: [true, 'La respuesta es obligatoria']
  },
  puntaje_ia: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  feedback_ia: {
    fortalezas: { type: [String], default: [] },
    debilidades: { type: [String], default: [] },
    feedback: { type: String, default: '' }
  },
  tokens_usados: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Answer', AnswerSchema);
