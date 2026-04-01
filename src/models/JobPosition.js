const mongoose = require('mongoose');

const JobPositionSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true  // FIX: Indice para queries frecuentes por empresa (PRD seccion 4.2)
  },
  titulo: {
    type: String,
    required: [true, 'El título de la posición es obligatorio']
  },
  nivel: {
    type: String,
    enum: ['junior', 'mid', 'senior'],
    required: [true, 'El nivel es obligatorio']
  },
  tecnologias: {
    type: [String],
    default: []
  },
  descripcion: {
    type: String,
    default: null
  },
  activo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('JobPosition', JobPositionSchema);
