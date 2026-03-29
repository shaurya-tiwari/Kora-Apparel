const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String },
  password: { type: String },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  type: { type: String, enum: ['signup', 'login', 'reset'], default: 'signup' }
}, { timestamps: true });

// Auto-delete after 15 minutes
verificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model('Verification', verificationSchema);
