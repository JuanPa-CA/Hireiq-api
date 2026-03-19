import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  rol: {
    type: String,
    enum: ['admin', 'recruiter'],
    default: 'recruiter'
  },
  activo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// encriptar contraseña
UserSchema.methods.encryptPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

// comparar contraseña
UserSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default model('User', UserSchema);