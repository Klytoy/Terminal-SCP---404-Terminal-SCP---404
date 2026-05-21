const mongoose = require('mongoose');

const linkedOrgSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  description: { type: String, default: '' },
  relation: { type: String, enum: ['allied', 'neutral', 'hostile'], default: 'neutral' },
  minClearanceLevel: { type: Number, default: 0 },
  documentLink: { type: String, default: '' }, // only УД-5+
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LinkedOrg', linkedOrgSchema);
