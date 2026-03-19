import { Schema, model } from 'mongoose';

const InterviewSchema = new Schema({
  fecha: {
    type: Date,
    required: true
  },
  candidato: {
    type: Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  reclutador: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedback: String,
  resultado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  }
}, { timestamps: true });

export default model('Interview', InterviewSchema);