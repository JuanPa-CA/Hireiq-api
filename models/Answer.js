import { Schema, model } from 'mongoose';

const AnswerSchema = new Schema({
  session_id: {
    type: Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true
  },
  question_id: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  respuesta_texto: {
    type: String,
    required: true,
    trim: true
  },
  puntaje_ia: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  feedback_ia: {
    fortalezas: [String],
    debilidades: [String],
    feedback: String
  },
  tokens_usados: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default model('Answer', AnswerSchema);