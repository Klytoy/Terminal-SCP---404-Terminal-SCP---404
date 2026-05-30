const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['clearance_upgrade', 'document_access', 'twin_account', 'registration'],
    required: true
  },
  
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // For clearance upgrade
  requestedLevel: { type: Number, min: 0, max: 6 },
  requestedExtensions: [{ type: String }],
  
  // For document access
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  
  // For twin account
  twinUsername: { type: String },
  twinFio: { type: String },
  twinCallsign: { type: String },
  twinFraction: { type: String },
  twinPosition: { type: String },
  twinDiscordNick: { type: String },
  twinPassword: { type: String }, // will be hashed when approved
  
  // For registration (before user is created)
  registrationData: { type: Object },
  
  reason: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote: { type: String, default: '' },
  reviewedAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
