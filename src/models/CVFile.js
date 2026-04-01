const mongoose = require('mongoose');

const CVFileSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ['application/pdf', 'image/jpeg', 'image/png'],
    required: true
  },
  size_bytes: {
    type: Number,
    required: true,
    max: 5242880
  },
  activo: {
    type: Boolean,
    default: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model('CVFile', CVFileSchema);
