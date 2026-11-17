const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    customerCode: { type: String, trim: true, default: '' },
    fullname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin', 'technician'], default: 'customer' },
    address: { type: String, trim: true, default: '' },
    tier: { type: String, default: 'Standard' },
    loyaltyPoints: { type: Number, default: 100 },
    staffCode: { type: String, trim: true, default: '' },
    level: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    teamName: { type: String, trim: true, default: '' },
    ext: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true, bufferCommands: false }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
