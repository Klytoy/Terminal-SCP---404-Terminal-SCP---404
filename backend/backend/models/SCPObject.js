const mongoose = require('mongoose');

const scpObjectSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true }, // SCP-173
  name: { type: String, required: true },
  objectClass: { 
    type: String, 
    enum: ['Safe', 'Euclid', 'Keter', 'Thaumiel', 'Apollyon', 'Neutralized'],
    default: 'Euclid'
  },
  containmentProcedures: { type: String, default: '' },
  description: { type: String, default: '' },
  addendum: { type: String, default: '' },
  minClearanceLevel: { type: Number, default: 1 },
  section: { type: String, enum: ['combat', 'civilian', 'general'], default: 'general' },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SCPObject', scpObjectSchema);
