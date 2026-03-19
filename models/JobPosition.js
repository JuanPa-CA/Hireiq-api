import { Schema, model } from 'mongoose';

const JobPositionSchema = new Schema({
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  nivel: {
    type: String,
    enum: ['junior','mid','senior'],
    required: true
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

export default model('JobPosition', JobPositionSchema);