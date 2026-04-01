const mongoose = require('mongoose');

/**
 * Coleccion para invalidar refreshTokens en logout.
 * FIX: Nuevo modelo requerido por la correccion del logout (PRD: "Invalida el refresh token en servidor").
 *
 * El TTL index elimina automaticamente los documentos cuando el token expira,
 * evitando que la coleccion crezca indefinidamente.
 * El valor de expiresAt se calcula a partir de JWT_REFRESH_EXPIRES_IN (default 7d).
 */
const TokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    default: () => {
      // TTL igual al tiempo de vida del refresh token (default 7 dias)
      const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7;
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
  }
}, { timestamps: true });

// Indice TTL: MongoDB elimina automaticamente el documento cuando llega expiresAt
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', TokenBlacklistSchema);
