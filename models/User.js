import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new Schema({
  company_id: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  rol: {
    type: String,
    enum: ['admin','empresa','candidato'],
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

UserSchema.methods.encryptPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

UserSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

export default model('User', UserSchema);
