const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la empresa es obligatorio']
  },
  email_contacto: {
    type: String,
    required: [true, 'El email de contacto es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  activa: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
