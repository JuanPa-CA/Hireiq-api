import { Schema, model } from 'mongoose';

const CandidateSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  telefono: String,
  skills: [String],
  experiencia: String,
  estado: {
    type: String,
    enum: ['aplicado', 'entrevista', 'contratado'],
    default: 'aplicado'
  }
}, { timestamps: true });

export default model('Candidate', CandidateSchema);