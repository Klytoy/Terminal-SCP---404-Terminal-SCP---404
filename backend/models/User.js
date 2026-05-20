const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic auth
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  discordNick: { type: String, required: true }, // @nick format

  // Personal info
  fio: { type: String, required: true },       // ФИО
  callsign: { type: String, required: true },  // Позывной
  
  // Org info
  fraction: { type: String, required: true },
  fractionType: { type: String, enum: ['civilian', 'combat'], default: 'civilian' },
  position: { type: String, required: true },
  
  // Clearance
  clearanceLevel: { type: Number, default: 0, min: 0, max: 6 },
  clearanceExtensions: [{
    type: String,
    enum: ['A', 'M', 'SI', 'I', 'T', 'O', 'H', 'P', 'ET', 'S', 'R4', 'T4', 'O5']
  }],

  // Employee ID
  employeeId: { type: String, unique: true, sparse: true },

  // Status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'banned'], 
    default: 'pending' 
  },
  
  // Role
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'user'], 
    default: 'user' 
  },

  // Twin account info
  parentAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isTwin: { type: Boolean, default: false },

  // Registration extras
  suggestion: { type: String, default: '' }, // Предложения по улучшению сайта

  // Service ID cards for external services (like АПАИБ)
  serviceIds: [{
    service: String,
    idNumber: String,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now }
  }],

  // Notifications mute list (conversation IDs)
  mutedConversations: [{ type: mongoose.Schema.Types.ObjectId }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
