const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true  // FIX: Indice para queries frecuentes (PRD seccion 4.2)
  },
  position_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosition',
    required: true,
    index: true  // FIX: Indice para filtrar preguntas por cargo
  },
  pregunta: {
    type: String,
    required: [true, 'La pregunta es obligatoria']
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es obligatoria']
  },
  dificultad: {
    type: String,
    enum: ['facil', 'medio', 'dificil'],
    required: [true, 'La dificultad es obligatoria']
  },
  generada_por_ia: {
    type: Boolean,
    default: false
  },
  activa: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
