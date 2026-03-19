import { Schema, model } from 'mongoose';

const CvFileSchema = new Schema({
  candidate_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  original_name: {
    type: String,
    required: true
  },
  mime_type: {
    type: String,
    enum: ['application/pdf','image/jpeg','image/png'],
    required: true
  },
  size_bytes: {
    type: Number,
    required: true,
    max: 5242880
  }
}, { timestamps: true });

export default model('CvFile', CvFileSchema);