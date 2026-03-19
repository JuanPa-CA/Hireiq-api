import { Schema, model } from 'mongoose';

const InterviewSessionSchema = new Schema({
  candidate_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position_id: {
    type: Schema.Types.ObjectId,
    ref: 'JobPosition',
    required: true
  },
  preguntas: [{
    type: Schema.Types.ObjectId,
    ref: 'Question'
  }],
  estado: {
    type: String,
    enum: ['pendiente','en_curso','completada','expirada'],
    default: 'pendiente'
  },
  puntaje_total: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  token_acceso: {
    type: String,
    unique: true
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
    required: true
  }
}, { timestamps: true });

export default model('InterviewSession', InterviewSessionSchema);